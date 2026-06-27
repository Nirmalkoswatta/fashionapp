const mongoose = require("mongoose");

function buildMongoUri() {
    const rawMongoUri = process.env.MONGO_URI?.trim();
    const hasPlaceholderCreds =
        rawMongoUri && (rawMongoUri.includes("<username>") || rawMongoUri.includes("<password>"));

    // Prefer explicit URI when provided and not a template.
    if (rawMongoUri && !hasPlaceholderCreds) {
        return rawMongoUri;
    }

    const user = process.env.MONGO_USER?.trim();
    const password = process.env.MONGO_PASSWORD?.trim();
    const cluster = process.env.MONGO_CLUSTER?.trim();
    const dbName = process.env.MONGO_DB_NAME?.trim() || "fashiongirl";

    if (user && password && cluster) {
        return `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${cluster}/${dbName}?retryWrites=true&w=majority`;
    }

    if (hasPlaceholderCreds) {
        throw new Error(
            "MONGO_URI still contains <username>/<password>. Set real credentials in MONGO_URI, or use MONGO_USER, MONGO_PASSWORD, MONGO_CLUSTER, and MONGO_DB_NAME."
        );
    }

    return "mongodb://localhost:27017/fashiongirl";
}

async function connectMongoDB() {
    try {
        const mongoUri = buildMongoUri();
        const conn = await mongoose.connect(mongoUri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("Database connection error:", error.message);
        if (error.message.toLowerCase().includes("bad auth")) {
            console.error(
                "MongoDB auth failed. Verify DB user/password and ensure the DB user has access to the target database."
            );
        }
        process.exit(1);
    }
}

module.exports = {
    connectMongoDB,
};
