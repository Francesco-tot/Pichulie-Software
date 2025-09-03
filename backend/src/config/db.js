const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://admin:4dm1n@pichulie.1h8z0ow.mongodb.net/?retryWrites=true&w=majority&appName=Pichulie';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }

};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error disconnecting from MongoDB:", error.message);
  }
};

module.exports = { connectDB, disconnectDB };