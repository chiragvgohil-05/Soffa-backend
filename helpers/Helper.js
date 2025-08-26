const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const connectDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected...");
    } catch (err) {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1);
    }
}
const disconnectDatabase = async () => {
    try {
        await mongoose.connection.close();
        console.log("🔌 MongoDB Disconnected...");
    } catch (err) {
        console.error("❌ MongoDB disconnection error:", err.message);
    }
}

module.exports = {
    connectDatabase,
    disconnectDatabase
}