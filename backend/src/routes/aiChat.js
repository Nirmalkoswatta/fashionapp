const express = require("express");
const { handleAiChat } = require("../controllers/aiChatController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);
router.post("/chat", handleAiChat);

module.exports = router;
