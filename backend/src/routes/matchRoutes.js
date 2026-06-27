const express = require("express");

const { upload, matchVendors, uploadItem } = require("../controllers/matchController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/match", upload.single("image"), matchVendors);
router.post("/vendor/upload-item", requireAuth, upload.single("image"), uploadItem);

module.exports = router;
