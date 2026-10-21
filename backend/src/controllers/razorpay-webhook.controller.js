
const crypto = require("crypto");
const bookingModel = require("../model/booking.model");
const paymentEventModel = require("../model/payment-event.model");
const {
  queueBookingConfirmationNotification,
} = require("../services/booking-notification.service");

const STALE_AFTER_MS = 5 * 60 * 1000;

async function markEventProcessed(event) {
  event.status = "processed";
  event.processedAt = new Date();
  event.processingStartedAt = null;
  await event.save();
}

async function handleRazorpayWebhook(req, res) {
  let paymentEvent;

  try {
    const signature = req.headers["x-razorpay-signature"];
    const eventId = req.headers["x-razorpay-event-id"];
    const rawBody = req.body;

    if (!signature || !eventId || !Buffer.isBuffer(rawBody)) {
      return res.status(400).json({
        message: "Invalid webhook request",
      });
    }

    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.error("Razorpay webhook secret is missing");
      return res.status(500).json({
        message: "Webhook configuration error",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(signature, "hex");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer) ||
      receivedBuffer.toString("hex") !== signature.toLowerCase()
    ) {
      return res.status(400).json({
        message: "Invalid webhook signature",
      });
    }

    const payload = JSON.parse(rawBody.toString("utf8"));

    if (!payload.event) {
      return res.status(400).json({
        message: "Webhook event type is missing",
      });
    }

    const now = new Date();

    // Claim a new webhook event or recover an abandoned one.
    try {
      paymentEvent = await paymentEventModel.create({
        eventId,
        eventType: payload.event,
        status: "processing",
        processingStartedAt: now,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;

      const existing = await paymentEventModel.findOne({ eventId });

      if (!existing) {
        return res.status(500).json({
          message: "Unable to check webhook event",
        });
      }

      if (existing.status === "processed") {
        return res.status(200).json({
          message: "Webhook event already processed",
        });
      }

      const staleBefore = new Date(Date.now() - STALE_AFTER_MS);

      paymentEvent = await paymentEventModel.findOneAndUpdate(
        {
          eventId,
          status: "processing",
          $or: [
            { processingStartedAt: { $lt: staleBefore } },
            { processingStartedAt: null },
          ],
        },
        {
          $set: {
            eventType: payload.event,
            processingStartedAt: now,
          },
        },
        { new: true }
      );

      if (!paymentEvent) {
        return res.status(500).json({
          message: "Webhook is already processing; retry later",
        });
      }
    }

    // Acknowledge other valid event types without changing bookings.
    if (
      payload.event !== "payment.captured" &&
      payload.event !== "payment.failed"
    ) {
      await markEventProcessed(paymentEvent);

      return res.status(200).json({
        message: "Webhook event acknowledged",
      });
    }

    const payment = payload.payload?.payment?.entity;

    if (!payment?.id || !payment?.order_id) {
      throw new Error("Payment entity or identifiers are missing");
    }

    const booking = await bookingModel.findOne({
      paymentOrderId: payment.order_id,
    });

    if (!booking) {
      throw new Error(`Booking not found for order ${payment.order_id}`);
    }

    if (payment.currency !== "INR") {
      throw new Error("Payment currency mismatch");
    }

    const expectedAmount = Math.round(booking.totalAmount * 100);

    if (payment.amount !== expectedAmount) {
      throw new Error("Payment amount mismatch; reconciliation required");
    }

    if (payload.event === "payment.failed") {
      // Never overwrite an already successful payment.
      if (
        booking.paymentStatus !== "paid" &&
        booking.status === "pending"
      ) {
        booking.paymentStatus = "failed";
        await booking.save();
      }

      await markEventProcessed(paymentEvent);

      return res.status(200).json({
        message: "Payment failure event processed",
      });
    }

    if (payment.status !== "captured") {
      throw new Error("Captured event does not contain a captured payment");
    }

    // Idempotent handling of a previously confirmed payment.
    if (booking.paymentStatus === "paid") {
      if (
        booking.paymentId !== payment.id ||
        booking.status !== "confirmed"
      ) {
        throw new Error(
          "Payment or booking state mismatch; reconciliation required"
        );
      }

      // Queue errors must leave the event retryable.
      await queueBookingConfirmationNotification(booking._id);
      await markEventProcessed(paymentEvent);

      return res.status(200).json({
        message: "Payment already recorded",
      });
    }

    // Atomically confirm the booking only if it is still eligible.
    const updatedBooking = await bookingModel.findOneAndUpdate(
      {
        _id: booking._id,
        paymentOrderId: payment.order_id,
        status: "pending",
        paymentStatus: { $in: ["pending", "failed"] },
        $or: [
          { paymentExpiresAt: null },
          { paymentExpiresAt: { $exists: false } },
          { paymentExpiresAt: { $gt: new Date() } },
        ],
      },
      {
        $set: {
          paymentStatus: "paid",
          paymentId: payment.id,
          paymentProvider: "razorpay",
          status: "confirmed",
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedBooking) {
      const latestBooking = await bookingModel.findById(booking._id);

      // Another request may already have confirmed this same payment.
      if (
        latestBooking?.paymentStatus === "paid" &&
        latestBooking.paymentId === payment.id &&
        latestBooking.status === "confirmed"
      ) {
        await queueBookingConfirmationNotification(latestBooking._id);
        await markEventProcessed(paymentEvent);

        return res.status(200).json({
          message: "Payment already recorded",
        });
      }

      console.error("ACTION REQUIRED: Payment reconciliation", {
        bookingId: String(booking._id),
        paymentId: payment.id,
        bookingStatus: latestBooking?.status,
        paymentStatus: latestBooking?.paymentStatus,
      });

      throw new Error("Booking could not be safely confirmed");
    }

    // Payment is confirmed. Queueing failure must not reverse payment.
    // Throwing leaves this webhook event retryable for recovery.
    await queueBookingConfirmationNotification(updatedBooking._id);

    await markEventProcessed(paymentEvent);

    console.log("Razorpay payment event processed", {
      eventId,
      bookingId: String(updatedBooking._id),
      bookingStatus: updatedBooking.status,
      paymentStatus: updatedBooking.paymentStatus,
    });

    return res.status(200).json({
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("Razorpay webhook error:", error.message);

    // Leave the event in processing so stale-event recovery can retry.
    return res.status(500).json({
      message: "Webhook processing failed; retry required",
    });
  }
}

module.exports = {
  handleRazorpayWebhook,
};
