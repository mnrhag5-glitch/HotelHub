
const mongoose = require("mongoose");

async function connectDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected Successfully 😁");
    // console.log("Connected database:", mongoose.connection.name);
    // console.log("Connected host:", mongoose.connection.host);
  } catch (error) {
    console.log("MongoDB connection Failed ❌", error);
    throw error;
  }
}

module.exports = connectDb;
