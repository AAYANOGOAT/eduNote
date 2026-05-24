const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not defined");

  try {
    await mongoose.connect(uri);
    console.log(`[user-service] MongoDB connected: ${uri}`);
  } catch (err) {
    console.error("[user-service] MongoDB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
