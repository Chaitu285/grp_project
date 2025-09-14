const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const RewardPolicy = require("../models/RewardPolicy");

const router = express.Router();

router.get("/reward-policy", protect, async (req, res) => {
  try {
    const adminId = req.user.adminId;
    const policy = await RewardPolicy.findOne({ adminId });
    if (!policy) {
      return res.status(404).json({ message: "Reward policy not found" });
    }
    res.json(policy);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching reward policy" });
  }
});

module.exports = router;
