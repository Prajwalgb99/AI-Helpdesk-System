const mongoose = require("mongoose");

// Ensure environment variables for testing are set
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-123456789";
process.env.JWT_EXPIRES_IN = "1h";
process.env.N8N_API_KEY = process.env.N8N_API_KEY || "test-n8n-api-key-999";
process.env.MONGO_URI = process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/helpdesk_test";

const connectTestDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
};

const clearTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
};

const closeTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await clearTestDB();
    await mongoose.connection.close();
  }
};

module.exports = {
  connectTestDB,
  clearTestDB,
  closeTestDB,
};
