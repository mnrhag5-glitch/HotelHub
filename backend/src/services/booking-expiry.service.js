const cron = require("node-cron");
const bookingModel = require("../model/booking.model");

function startBookingExpiryJob() {
  // Runs every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();

      const result = await bookingModel.updateMany(
        {
          status: "pending",
          paymentStatus: "pending",
          paymentExpiresAt: {
            $lte: now,
            $ne: null,
          },
        },
        {
          $set: {
            status: "expired",
          },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(
          `Booking expiry job: ${result.modifiedCount} booking(s) expired`
        );
      }
    } catch (error) {
      console.error("Booking expiry job error:", error);
    }
  });

  console.log("Booking expiry job started");
}

module.exports = {
  startBookingExpiryJob,
};