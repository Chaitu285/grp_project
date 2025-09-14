const RewardPolicy = require("../models/RewardPolicy");
const Transaction = require("../models/Transaction");

// ✅ Create or update a reward policy
exports.createOrUpdatePolicy = async (req, res) => {
  try {
    const adminId = req.user.id; // from JWT
    const data = req.body;

    let policy = await RewardPolicy.findOne({ adminId });

    if (policy) {
      policy = await RewardPolicy.findOneAndUpdate(
        { adminId },
        { ...data, pointsExpiryDays: data.pointsExpiryDays || policy.pointsExpiryDays },
        { new: true }
      );
      return res.json({ message: "Policy updated", policy });
    } else {
      policy = await RewardPolicy.create({ ...data, adminId });
      return res.status(201).json({ message: "Policy created", policy });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// POST /spin-wheel/spin
exports.spinWheel = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ message: "Admin ID is required" });
    }

    // Fetch reward policy for admin
    const policy = await RewardPolicy.findOne({ adminId });
    if (!policy) {
      return res.status(404).json({ message: "Reward policy not found for this business" });
    }

    if (!policy.spinWheelSegments || policy.spinWheelSegments.length === 0) {
      return res.status(400).json({ message: "Spin wheel is not configured with any segments" });
    }

    // Fetch customer
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Check minimum points to spin
    if ((customer.pointsBalance || 0) < (policy.spinWheelMinPoints || 0)) {
      return res.status(400).json({
        message: `Minimum ${policy.spinWheelMinPoints} points required to spin the wheel`
      });
    }

    // Select random reward segment
    const segments = policy.spinWheelSegments;
    const randomIndex = Math.floor(Math.random() * segments.length);
    const wonSegment = segments[randomIndex];

    // Add won points to customer's pointsHistory with expiry
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (policy.pointsExpiryDays || 365) * 24 * 60 * 60 * 1000);

    customer.pointsHistory.push({
      points: wonSegment.points,
      redeemed: false,
      earnedAt: now,
      expiresAt,
    });

    customer.pointsBalance += wonSegment.points;

    await customer.save();

    // Return spin result
    return res.json({
      message: `Congratulations! You won ${wonSegment.points} points.`,
      wonPoints: wonSegment.points,
      pointsBalance: customer.pointsBalance,
    });

  } catch (error) {
    console.error("Spin Wheel Error:", error);
    return res.status(500).json({ message: "Server error during spin wheel processing" });
  }
};

// ✅ Update points expiry separately
exports.updatePointsExpiry = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { pointsExpiryDays } = req.body;

    const policy = await RewardPolicy.findOne({ adminId });
    if (!policy) return res.status(404).json({ message: "No policy found" });

    policy.pointsExpiryDays = pointsExpiryDays;
    await policy.save();

    res.json({ message: "Points expiry updated", policy });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add or update threshold rule
exports.addOrUpdateThreshold = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { minAmount, bonusPoints } = req.body;//aa

    let policy = await RewardPolicy.findOne({ adminId });
    if (!policy) return res.status(404).json({ message: "No policy found. Create one first." });

    const thresholdIndex = policy.spendThresholds.findIndex(t => t.minAmount === minAmount);
    if (thresholdIndex !== -1) {
      policy.spendThresholds[thresholdIndex].bonusPoints = bonusPoints;
    } else {
      policy.spendThresholds.push({ minAmount, bonusPoints });
    }

    await policy.save();
    res.json({ message: "Threshold added/updated", policy });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add or update category rule
exports.addOrUpdateCategoryRule = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { category, pointsPer100, minAmount, bonusPoints } = req.body;

    let policy = await RewardPolicy.findOne({ adminId });
    if (!policy) return res.status(404).json({ message: "No policy found. Please create one first." });

    const categoryIndex = policy.categoryRules.findIndex(rule => rule.category === category);
    if (categoryIndex !== -1) {
      policy.categoryRules[categoryIndex] = { category, pointsPer100, minAmount, bonusPoints };
    } else {
      policy.categoryRules.push({ category, pointsPer100, minAmount, bonusPoints });
    }

    await policy.save();
    res.json({ message: "Category rule added/updated", policy });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add or update tier rule
exports.addOrUpdateTierRule = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { tierName, minPoints, multiplier, benefits } = req.body;

    let policy = await RewardPolicy.findOne({ adminId });
    if (!policy) return res.status(404).json({ message: "No policy found. Please create one first." });

    const tierIndex = policy.tierRules.findIndex(t => t.tierName === tierName);
    if (tierIndex !== -1) {
      policy.tierRules[tierIndex] = { tierName, minPoints, multiplier, benefits };
    } else {
      policy.tierRules.push({ tierName, minPoints, multiplier, benefits });
    }

    await policy.save();
    res.json({ message: "Tier rule added/updated", policy });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all tier rules
exports.getTierRules = async (req, res) => {
  try {
    const policy = await RewardPolicy.findOne({ adminId: req.user.id });
    if (!policy) return res.status(404).json({ message: "No policy found" });

    res.json(policy.tierRules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get policy summary
exports.getPolicySummary = async (req, res) => {
  try {
    const adminId = req.user.id;
    const transactions = await Transaction.find({ adminId });

    if (transactions.length === 0) {
      return res.json({
        totalTransactions: 0,
        totalPointsIssued: 0,
        totalPointsRedeemed: 0,
        outstandingPoints: 0,
      });
    }

    const totalTransactions = transactions.length;
    const totalPointsIssued = transactions.reduce((sum, t) => sum + (t.earnedPoints || 0), 0);
    const totalPointsRedeemed = transactions.reduce((sum, t) => sum + (t.redeemedPoints || 0), 0);
    const outstandingPoints = totalPointsIssued - totalPointsRedeemed;

    res.json({ totalTransactions, totalPointsIssued, totalPointsRedeemed, outstandingPoints });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get current admin's policy
exports.getPolicy = async (req, res) => {
  try {
    const policy = await RewardPolicy.findOne({ adminId: req.user.id });
    if (!policy) return res.status(404).json({ message: "No policy found" });
    res.json(policy);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete policy
exports.deletePolicy = async (req, res) => {
  try {
    const policy = await RewardPolicy.findOneAndDelete({ adminId: req.user.id });
    if (!policy) return res.status(404).json({ message: "No policy found" });
    res.json({ message: "Policy deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
