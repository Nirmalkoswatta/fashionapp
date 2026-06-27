const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");

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
    const { username, email, password, confirmPassword, role } = req.body;
    const errors = validateRegisterInput({ username, email, password, confirmPassword });

    if (errors.length > 0) {
        return res.status(400).json({ message: "Validation failed", errors });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
        return res.status(409).json({ message: "Email already registered." });
    }

    const requestedRoleName = role?.trim().toLowerCase() === "vendor" ? "vendor" : "customer";
    const targetRole = await Role.findOne({ name: requestedRoleName });
    if (!targetRole) {
        return res.status(500).json({ message: `Role '${requestedRoleName}' not found.` });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
        name: username.trim(),
        email: normalizedEmail,
        passwordHash,
        role: targetRole._id,
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

async function googleLogin(req, res, next) {
    try {
        const { idToken, email: mockEmail, name: mockName } = req.body;

        let email;
        let name;

        if (idToken) {
            try {
                // Verify Google ID Token
                const googleResponse = await axios.get(
                    `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
                );

                const payload = googleResponse.data;

                // Validate token audience match
                const expectedClientId = process.env.GOOGLE_CLIENT_ID || "948585514340-lmehdmnk9drbjqnk3vl7uf0jcd97n5c5.apps.googleusercontent.com";
                if (payload.aud !== expectedClientId) {
                    return res.status(400).json({ message: "Invalid Google token audience." });
                }

                email = payload.email;
                name = payload.name;
            } catch (verifErr) {
                console.error("Google token verification failed:", verifErr.message);
                return res.status(400).json({ message: "Google verification token is invalid or expired." });
            }
        } else if (mockEmail && mockName) {
            email = mockEmail;
            name = mockName;
        } else {
            return res.status(400).json({ message: "Google verification token or mock credentials required." });
        }

        const normalizedEmail = email.trim().toLowerCase();
        let user = await User.findOne({ email: normalizedEmail }).populate("role", "name description");

        if (!user) {
            // Auto-register user as customer
            const customerRole = await Role.findOne({ name: "customer" });
            if (!customerRole) {
                return res.status(500).json({ message: "Customer role not found." });
            }

            const passwordHash = await bcrypt.hash(Math.random().toString(36), 10);

            user = await User.create({
                name: name.trim(),
                email: normalizedEmail,
                passwordHash,
                role: customerRole._id,
            });

            user = await User.findById(user._id).populate("role", "name description");
        }

        const token = buildToken(user);

        return res.status(200).json({
            message: "Google Login successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role.name,
            },
        });
    } catch (error) {
        return next(error);
    }
}

async function getVendorStock(req, res, next) {
    try {
        const userId = req.auth.sub;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        return res.status(200).json({
            stockMaterials: user.stockMaterials || [],
        });
    } catch (error) {
        return next(error);
    }
}

async function updateVendorStock(req, res, next) {
    try {
        const userId = req.auth.sub;
        const { stockMaterials } = req.body;

        if (!Array.isArray(stockMaterials)) {
            return res.status(400).json({ message: "Field 'stockMaterials' must be an array of strings." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        user.stockMaterials = stockMaterials;
        await user.save();

        return res.status(200).json({
            message: "Stock materials updated successfully.",
            stockMaterials: user.stockMaterials,
        });
    } catch (error) {
        return next(error);
    }
}

async function getVendors(req, res, next) {
    try {
        const vendorRole = await Role.findOne({ name: "vendor" });
        if (!vendorRole) {
            return res.status(404).json({ message: "Vendor role not found in database." });
        }

        const vendors = await User.find({ role: vendorRole._id }, { name: 1, email: 1 }).sort({ name: 1 });
        return res.status(200).json(vendors);
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    register,
    login,
    me,
    googleLogin,
    getVendorStock,
    updateVendorStock,
    getVendors,
};

