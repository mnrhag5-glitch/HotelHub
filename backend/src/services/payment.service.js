const Razorpay = require("razorpay");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createPaymentOrder({
    amount,
    currency = "INR",
    receipt,
}) {
    const order = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency,
        receipt,
    });

    return order;
}

async function fetchPayment(paymentId) {
    const payment = await razorpay.payments.fetch(paymentId);

    return payment;
}


module.exports = {
    createPaymentOrder,
    fetchPayment,
};