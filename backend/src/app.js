const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");
const matchRoutes = require("./routes/matchRoutes");
const orderRoutes = require("./routes/order");
const chatRoutes = require("./routes/chat");
const aiChatRoutes = require("./routes/aiChat");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", matchRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/ai", aiChatRoutes);

app.use((error, req, res, next) => {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
