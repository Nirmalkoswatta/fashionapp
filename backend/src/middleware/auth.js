const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ message: "Authorization token is required." });
    }

    try {
        const jwtSecret = process.env.JWT_SECRET || "change-this-in-production";
        const payload = jwt.verify(token, jwtSecret);
        req.auth = payload;
        return next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
}

module.exports = {
    requireAuth,
};
