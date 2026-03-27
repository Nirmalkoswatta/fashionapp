const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Role = require("../models/Role");
const User = require("../models/User");
const { validateRegisterInput, validateLoginInput } = require("../utils/validators");

function buildToken(user) {
    const payload = {
        sub: user._id.toString(),
        email: user.email,
        role: user.role?.name || "customer",
    };

    const jwtSecret = process.env.JWT_SECRET || "change-this-in-production";
    const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

    return jwt.sign(payload, jwtSecret, { expiresIn });
}

async function register(req, res) {
    const { username, email, password, confirmPassword } = req.body;
    const errors = validateRegisterInput({ username, email, password, confirmPassword });

    if (errors.length > 0) {
        return res.status(400).json({ message: "Validation failed", errors });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
        return res.status(409).json({ message: "Email already registered." });
    }

    const customerRole = await Role.findOne({ name: "customer" });
    if (!customerRole) {
        return res.status(500).json({ message: "Customer role not found." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
        name: username.trim(),
        email: normalizedEmail,
        passwordHash,
        role: customerRole._id,
    });

    const populatedUser = await User.findById(user._id).populate("role", "name description");
    const token = buildToken(populatedUser);

    return res.status(201).json({
        message: "Registration successful.",
        token,
        user: {
            id: populatedUser._id,
            name: populatedUser.name,
            email: populatedUser.email,
            role: populatedUser.role.name,
        },
    });
}

async function login(req, res) {
    const { email, password } = req.body;
    const errors = validateLoginInput({ email, password });

    if (errors.length > 0) {
        return res.status(400).json({ message: "Validation failed", errors });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).populate("role", "name description");

    if (!user) {
        return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = buildToken(user);

    return res.status(200).json({
        message: "Login successful.",
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role.name,
        },
    });
}

async function me(req, res) {
    const user = await User.findById(req.auth.sub).populate("role", "name description");

    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role.name,
        },
    });
}

module.exports = {
    register,
    login,
    me,
};
