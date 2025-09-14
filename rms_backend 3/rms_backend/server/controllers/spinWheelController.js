const RewardPolicy = require("../models/RewardPolicy");
const User = require("../models/User");

// POST /spin-wheel/spin
const spinWheel = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { adminId } = req.body; // Admin ID required to get policy

    if (!adminId) {
      return res.status(400).json({ message: "Admin ID is required" });
    }

    // Fetch reward policy for admin
    const policy = await RewardPolicy.findOne({ adminId });
    if (!policy || !policy.spinWheelSegments || policy.spinWheelSegments.length === 0) {
      return res.status(404).json({ message: "No spin wheel configured for this business" });
    }

    // Fetch customer
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Verify minimum points required to spin
    if ((customer.pointsBalance || 0) < policy.spinWheelMinPoints) {
      return res.status(400).json({ message: `Minimum ${policy.spinWheelMinPoints} points required to spin the wheel` });
    }

    // Select random reward from spin wheel segments (simple uniform random)
    const segments = policy.spinWheelSegments;
    const randomIndex = Math.floor(Math.random() * segments.length);
    const wonPoints = segments[randomIndex]; // segments assumed to be array of numbers

    // Add won points to customer's pointsHistory with expiry
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (policy.pointsExpiryDays || 365) * 24 * 60 * 60 * 1000);

    customer.pointsHistory.push({
      points: wonPoints,
      redeemed: false,
      earnedAt: now,
      expiresAt,
    });

    customer.pointsBalance += wonPoints;

    // Save updated customer
    await customer.save();

    return res.json({
      message: `Congratulations! You won ${wonPoints} points.`,
      wonPoints,
      pointsBalance: customer.pointsBalance,
    });
  } catch (error) {
    console.error("Spin Wheel Error:", error);
    return res.status(500).json({ message: "Server error during spin wheel processing" });
  }
};

module.exports = {
  spinWheel,
};
