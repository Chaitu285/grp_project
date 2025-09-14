// backend/routes/spinWheelRoutes.js

const express = require("express");
const { spinWheel } = require("../controllers/spinWheelController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /spin-wheel/spin
// Protected route, customer must be authenticated
router.post("/spin", protect, spinWheel);

module.exports = router;
