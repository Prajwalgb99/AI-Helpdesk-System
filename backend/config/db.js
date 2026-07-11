const mongoose = require("mongoose");

// One job: open the Mongo connection and fail loudly if it can't.
// Kept separate from server.js so server.js stays readable top-to-bottom.
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1); // no point running the server without a DB
  }
};

module.exports = connectDB;
