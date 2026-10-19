const express = require("express");

const {
  createBookingPaymentOrder,
  verifyBookingPayment,
  getBookingPaymentReceipt,
  getMyPayments,
} = require("../controllers/payment.controller");

const {
  handleRazorpayWebhook,
} = require("../controllers/razorpay-webhook.controller");

const { authMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/create-order", authMiddleware, createBookingPaymentOrder);
router.post("/verify-payment", authMiddleware, verifyBookingPayment);

// Secure PDF receipt for the authenticated booking owner
router.get("/receipt/:bookingId", authMiddleware, getBookingPaymentReceipt);

// Razorpay webhook
router.post("/webhook", handleRazorpayWebhook);

router.get("/my-payments", authMiddleware, getMyPayments);

module.exports = router;