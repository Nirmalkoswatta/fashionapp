const dotenv = require("dotenv");
const app = require("./app");
const { connectMongoDB } = require("./config/db");
const { runSeed } = require("./seed/seedData");

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await connectMongoDB();
        await runSeed();

        app.listen(PORT, () => {
            console.log(`Backend server listening on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start backend server:", error.message);
        process.exit(1);
    }
}

startServer();
