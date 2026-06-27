const express = require("express");

const { login, me, register, googleLogin, getVendorStock, updateVendorStock, getVendors } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google-login", googleLogin);
router.get("/me", requireAuth, me);
router.get("/vendor-stock", requireAuth, getVendorStock);
router.put("/vendor-stock", requireAuth, updateVendorStock);
router.get("/vendors", requireAuth, getVendors);

module.exports = router;
