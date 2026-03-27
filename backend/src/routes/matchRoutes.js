const express = require("express");

const { upload, matchVendors } = require("../controllers/matchController");

const router = express.Router();

router.post("/match", upload.single("image"), matchVendors);

module.exports = router;
