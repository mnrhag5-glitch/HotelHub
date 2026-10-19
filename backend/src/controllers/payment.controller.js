const crypto = require("crypto");
const mongoose = require("mongoose");
const bookingModel = require("../model/booking.model");
const { createPaymentOrder,fetchPayment } = require("../services/payment.service");

const PDFDocument = require("pdfkit");
const hotelModel = require("../model/hotel.model");
const roomModel = require("../model/room.model");





async function createBookingPaymentOrder(req, res) {
  try {
    const { bookingId } = req.body;

    // 1. Validate booking ID
    if (!bookingId) {
      return res.status(400).json({
        message: "Booking ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        message: "Invalid booking ID",
      });
    }

    // 2. Find booking belonging to logged-in user
    const booking = await bookingModel.findOne({
      _id: bookingId,
      user: req.user.user_id,
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    // 3. Booking must be pending
    if (booking.status !== "pending") {
      return res.status(400).json({
        message: "Payment is not allowed for this booking",
      });
    }

    // 4. Don't create another order if already paid
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        message: "Booking is already paid",
      });
    }

    // 5. Don't create duplicate Razorpay order

    // Check payment session expiry
    if (booking.paymentExpiresAt && booking.paymentExpiresAt <= new Date()) {
      return res.status(400).json({
        message: "Booking payment session has expired.",
      });
    }

    if (booking.paymentOrderId) {
      return res.status(200).json({
        message: "Payment order already exists",
        orderId: booking.paymentOrderId,
        amount: booking.totalAmount,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    }

    // 6. Amount comes ONLY from database
    const order = await createPaymentOrder({
      amount: booking.totalAmount,
      currency: "INR",
      receipt: `booking_${booking._id}`,
    });

    booking.paymentProvider = "razorpay";
    booking.paymentOrderId = order.id;
    await booking.save();

    // 8. Send only required data to frontend
    return res.status(201).json({
      message: "Payment order created successfully",
      orderId: order.id,
      amount: booking.totalAmount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create payment order error:", error);

    return res.status(500).json({
      message: "Unable to create payment order",
    });
  }
}

async function verifyBookingPayment(req, res) {
  try {
    const {
      bookingId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    // 1. Required fields
    if (
      !bookingId ||
      !razorpay_payment_id ||
      !razorpay_order_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message: "Payment verification data is incomplete",
      });
    }

    // 2. Validate booking ID
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        message: "Invalid booking ID",
      });
    }

    // 3. Find user's booking
    const booking = await bookingModel.findOne({
      _id: bookingId,
      user: req.user.user_id,
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    // 4. Verify Razorpay order belongs to this booking
    if (booking.paymentOrderId !== razorpay_order_id) {
      return res.status(400).json({
        message: "Invalid payment order",
      });
    }

    // 5. Don't process an already paid booking

    if (booking.paymentStatus === "paid") {
      return res.status(200).json({
        message: "Payment already verified",
        bookingId: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
      });
    }



    // 6. Generate expected signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${booking.paymentOrderId}|${razorpay_payment_id}`)
      .digest("hex");

    // 7. Timing-safe comparison
const generatedSignatureBuffer = Buffer.from(generatedSignature);
const receivedSignatureBuffer = Buffer.from(razorpay_signature);

if (
  generatedSignatureBuffer.length !== receivedSignatureBuffer.length ||
  !crypto.timingSafeEqual(
    generatedSignatureBuffer,
    receivedSignatureBuffer
  )
) {
  return res.status(400).json({
    message: "Payment verification failed",
  });
}

// Fetch actual payment from Razorpay
const payment = await fetchPayment(razorpay_payment_id);

// Verify payment belongs to our Razorpay order
if (payment.order_id !== booking.paymentOrderId) {
    return res.status(400).json({
        message: "Payment does not belong to this booking"
    });
}

// Verify amount
const expectedAmount = Math.round(
    booking.totalAmount * 100
);

if (payment.amount !== expectedAmount) {
    return res.status(400).json({
        message: "Payment amount mismatch"
    });
}

// Verify currency
if (payment.currency !== "INR") {
    return res.status(400).json({
        message: "Invalid payment currency"
    });
}

// Payment must be captured
if (payment.status !== "captured") {
    return res.status(400).json({
        message: "Payment has not been captured"
    });
}

// 8. Payment verified
// 8. Atomically confirm the booking after payment verification
const updatedBooking = await bookingModel.findOneAndUpdate(
  {
    _id: booking._id,
    user: req.user.user_id,
    paymentOrderId: booking.paymentOrderId,
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
      paymentId: razorpay_payment_id,
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
  const latestBooking = await bookingModel.findOne({
    _id: booking._id,
    user: req.user.user_id,
  });

  // Webhook may have processed the same payment first.
  if (
    latestBooking?.paymentStatus === "paid" &&
    latestBooking.paymentId === razorpay_payment_id
  ) {
    return res.status(200).json({
      message: "Payment already verified",
      bookingId: latestBooking._id,
      status: latestBooking.status,
      paymentStatus: latestBooking.paymentStatus,
    });
  }

  // Payment was captured, but booking could not be confirmed.
  console.error("Payment reconciliation required", {
    bookingId: String(booking._id),
    paymentId: razorpay_payment_id,
    bookingStatus: latestBooking?.status,
  });

  return res.status(409).json({
    message:
      "Payment received but booking confirmation requires reconciliation. Please contact support.",
  });
}

return res.status(200).json({
  message: "Payment verified successfully",
  bookingId: updatedBooking._id,
  status: updatedBooking.status,
  paymentStatus: updatedBooking.paymentStatus,
});


  } catch (error) {
    console.error("Payment verification error:", error);

    return res.status(500).json({
      message: "Unable to verify payment",
    });
  }
}


async function getBookingPaymentReceipt(req, res) {
  try {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        message: "Invalid booking ID",
      });
    }

    // Only the owner of the booking can access its receipt.
    const booking = await bookingModel
      .findOne({
        _id: bookingId,
        user: req.user.user_id,
      })
      .populate("user", "name fullName email")
      .lean();

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (!["paid", "refunded"].includes(booking.paymentStatus)) {
      return res.status(400).json({
        message: "A receipt is available only for a verified payment",
      });
    }

    if (
      booking.paymentProvider !== "razorpay" ||
      !booking.paymentOrderId ||
      !booking.paymentId
    ) {
      return res.status(409).json({
        message: "Payment details are incomplete",
      });
    }

    // Verify against Razorpay, not values supplied by the frontend.
    const payment = await fetchPayment(booking.paymentId);

    if (
      payment.id !== booking.paymentId ||
      payment.order_id !== booking.paymentOrderId ||
      payment.amount !== Math.round(booking.totalAmount * 100) ||
      payment.currency !== "INR" ||
      payment.status !== "captured"
    ) {
      return res.status(409).json({
        message: "Payment verification failed. Receipt cannot be generated.",
      });
    }

    const [hotel, room] = await Promise.all([
      hotelModel.findById(booking.hotel).select("name location contact").lean(),
      roomModel.findById(booking.room).select("name roomType").lean(),
    ]);

    if (!hotel || !room) {
      return res.status(409).json({
        message: "Hotel or room details are unavailable",
      });
    }

    const guestName =
      booking.user?.name ||
      booking.user?.fullName ||
      booking.user?.email ||
      "Guest";

    const address = [
      hotel.location?.address,
      hotel.location?.city,
      hotel.location?.state,
      hotel.location?.country,
    ]
      .filter(Boolean)
      .join(", ");

    const formatDate = (value) =>
      new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      });

    const formatMoney = (value) =>
      `INR ${Number(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const receiptNumber = `HH-${String(booking._id).toUpperCase()}`;
    const paymentDate = payment.created_at
      ? new Date(payment.created_at * 1000)
      : null;

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `HotelHub Receipt ${receiptNumber}`,
        Author: "HotelHub",
        Subject: "Hotel booking payment receipt",
      },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="HotelHub-Receipt-${String(booking._id)}.pdf"`
    );
    res.setHeader("Cache-Control", "private, no-store");

    doc.on("error", (error) => {
      console.error("Receipt PDF generation error:", error);
      if (!res.headersSent) {
        res.status(500).end();
      } else {
        res.destroy(error);
      }
    });

    doc.pipe(res);

    const left = 50;
    const right = 545;

    doc.fontSize(25).fillColor("#163b35").text("HOTELHUB", left, 50);
    doc
      .fontSize(19)
      .fillColor("#222222")
      .text("PAYMENT RECEIPT", left, 95);

    doc
      .fontSize(10)
      .fillColor("#555555")
      .text(`Receipt No: ${receiptNumber}`, left, 130)
      .text(`Booking ID: ${booking._id}`, left, 146);

    doc
      .fontSize(11)
      .fillColor("#163b35")
      .text(
        booking.paymentStatus === "refunded"
          ? "PAYMENT REFUNDED"
          : "PAYMENT VERIFIED",
        left,
        177
      );

    doc
      .moveTo(left, 200)
      .lineTo(right, 200)
      .strokeColor("#d8e2df")
      .stroke();

    let y = 220;

    function section(title) {
      doc.fontSize(13).fillColor("#163b35").text(title, left, y);
      y += 25;
    }

    function row(label, value) {
      doc.fontSize(10).fillColor("#666666").text(label, left, y, {
        width: 170,
      });
      doc.fontSize(10).fillColor("#222222").text(String(value || "—"), 225, y, {
        width: 320,
      });
      y += 22;
    }

    section("HOTEL DETAILS");
    row("Hotel", hotel.name);
    row("Address", address || "Not available");
    if (hotel.contact?.email) row("Hotel email", hotel.contact.email);
    if (hotel.contact?.phone) row("Hotel phone", hotel.contact.phone);

    y += 8;
    section("GUEST & BOOKING DETAILS");
    row("Guest", guestName);
    row("Room", room.name);
    row("Room type", room.roomType);
    row("Check-in", formatDate(booking.checkIn));
    row("Check-out", formatDate(booking.checkOut));
    row("Guests", `Adults: ${booking.guests.adults}, Children: ${booking.guests.children || 0}`);
    row("Rooms booked", booking.roomsBooked);
    row("Total nights", booking.totalNights);

    y += 8;
    section("PAYMENT DETAILS");
    row("Price per room / night", formatMoney(booking.pricePerNight));
    row("Total booking amount", formatMoney(booking.totalAmount));
    row("Payment provider", "Razorpay");
    row("Payment ID", booking.paymentId);
    row(
      "Payment date",
      paymentDate ? formatDate(paymentDate) : "Not provided by payment provider"
    );
    row(
      "Payment status",
      booking.paymentStatus === "refunded" ? "REFUNDED" : "PAID"
    );

    y += 12;
    doc
      .moveTo(left, y)
      .lineTo(right, y)
      .strokeColor("#d8e2df")
      .stroke();

    y += 18;
    doc
      .fontSize(15)
      .fillColor("#163b35")
      .text(`Booking total: ${formatMoney(booking.totalAmount)}`, left, y);

    y += 35;
    doc
      .fontSize(9)
      .fillColor("#666666")
      .text(
        "This receipt records the booking amount and payment reference verified with Razorpay. No separate tax breakdown is represented.",
        left,
        y,
        { width: 495 }
      );

    doc.end();
  } catch (error) {
    console.error("Get booking receipt error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        message: "Unable to generate payment receipt",
      });
    }

    res.destroy(error);
  }
}

const getMyPayments = async (req, res) => {
  try {
    const bookings = await bookingModel
      .find({ user: req.user.user_id })
      .sort({ createdAt: -1 })
      .populate("hotel", "name location")
      .populate("room", "name roomType")
  .select(
  "_id hotel room status totalAmount paymentStatus paymentProvider paymentId paymentOrderId createdAt checkIn checkOut"
);

    return res.status(200).json({
      success: true,
      payments: bookings,
    });
  } catch (error) {
    console.error("Get my payments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment history",
    });
  }
};

module.exports = {
  createBookingPaymentOrder,
  verifyBookingPayment,
  getBookingPaymentReceipt,
  getMyPayments,
};

