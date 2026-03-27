const mongoose = require("mongoose");

async function connectMongoDB() {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/fashiongirl";
        const conn = await mongoose.connect(mongoUri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("Database connection error:", error.message);
        process.exit(1);
    }
}

module.exports = {
    connectMongoDB,
};
