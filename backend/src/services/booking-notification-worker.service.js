
const cron = require("node-cron");
const bookingNotificationModel = require("../model/booking-notification.model");
const bookingModel = require("../model/booking.model");
const { sendBookingAdminEmail } = require("./email.services");

const MAX_ATTEMPTS = 8;
const STALE_PROCESSING_MS = 5 * 60 * 1000;

function getRetryDelayMs(attempts) {
  // Exponential backoff, capped at 6 hours.
  return Math.min(60_000 * 2 ** Math.max(0, attempts - 1), 6 * 60 * 60 * 1000);
}

async function processNotification(notificationId) {
  const now = new Date();

  // Atomically claim the notification so concurrent workers don't
  // intentionally process the same record at the same time.
  const notification = await bookingNotificationModel.findOneAndUpdate(
    {
      _id: notificationId,
      status: "pending",
      nextRetryAt: { $lte: now },
      attempts: { $lt: MAX_ATTEMPTS },
    },
    {
      $set: {
        status: "processing",
        processingStartedAt: now,
      },
      $inc: { attempts: 1 },
    },
    { new: true }
  );

  if (!notification) return;

  try {
    const booking = await bookingModel
      .findById(notification.booking)
      .populate("user", "name email")
      .populate({
        path: "hotel",
        select: "name owner",
        populate: { path: "owner", select: "name email" },
      })
      .populate("room", "name roomType")
      .lean();

    if (
      !booking ||
      booking.paymentStatus !== "paid" ||
      booking.status !== "confirmed"
    ) {
      throw new Error("Booking is not in a confirmed paid state");
    }

    const ownerEmail = booking.hotel?.owner?.email?.trim().toLowerCase();

    if (!ownerEmail || ownerEmail !== notification.recipientEmail) {
      throw new Error("Hotel owner email is missing or has changed");
    }

    await sendBookingAdminEmail({
      adminEmail: ownerEmail,
      hotelName: booking.hotel?.name || "Hotel",
      bookingId: String(booking._id),
      guestName: booking.user?.name || "Guest",
      guestEmail: booking.user?.email,
      roomName:
        booking.room?.name ||
        booking.room?.roomType ||
        "Room",
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      totalAmount: booking.totalAmount,
    });

    await bookingNotificationModel.updateOne(
      {
        _id: notification._id,
        status: "processing",
      },
      {
        $set: {
          status: "sent",
          sentAt: new Date(),
          processingStartedAt: null,
          lastError: null,
        },
      }
    );
  } catch (error) {
    const attempts = notification.attempts;
    const exhausted = attempts >= MAX_ATTEMPTS;

    await bookingNotificationModel.updateOne(
      {
        _id: notification._id,
        status: "processing",
      },
      {
        $set: {
          status: exhausted ? "failed" : "pending",
          processingStartedAt: null,
          nextRetryAt: new Date(Date.now() + getRetryDelayMs(attempts)),
          lastError: String(error.message || "Email delivery failed").slice(
            0,
            2000
          ),
        },
      }
    );

    console.error("Booking notification attempt failed", {
      notificationId: String(notification._id),
      bookingId: String(notification.booking),
      attempts,
      exhausted,
      error: error.message,
    });
  }
}

async function processPendingNotifications() {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_PROCESSING_MS);

  // Recover interrupted work after a server crash or restart.
  await bookingNotificationModel.updateMany(
    {
      status: "processing",
      processingStartedAt: { $lte: staleBefore },
      attempts: { $lt: MAX_ATTEMPTS },
    },
    {
      $set: {
        status: "pending",
        processingStartedAt: null,
        nextRetryAt: now,
      },
    }
  );

  // Permanently stop retrying exhausted stale records.
  await bookingNotificationModel.updateMany(
    {
      status: "processing",
      processingStartedAt: { $lte: staleBefore },
      attempts: { $gte: MAX_ATTEMPTS },
    },
    {
      $set: {
        status: "failed",
        processingStartedAt: null,
        lastError: "Worker interrupted after maximum retry attempts",
      },
    }
  );

  const pending = await bookingNotificationModel
    .find({
      status: "pending",
      nextRetryAt: { $lte: now },
      attempts: { $lt: MAX_ATTEMPTS },
    })
    .select("_id")
    .sort({ createdAt: 1 })
    .limit(25)
    .lean();

  for (const item of pending) {
    await processNotification(item._id);
  }
}

function startBookingNotificationWorker() {
  let running = false;

  cron.schedule("*/1 * * * *", async () => {
    if (running) return;

    running = true;

    try {
      await processPendingNotifications();
    } catch (error) {
      console.error("Booking notification worker error:", error.message);
    } finally {
      running = false;
    }
  });

  console.log("Booking notification worker started");
}

module.exports = {
  startBookingNotificationWorker,
  processPendingNotifications,
};
