const mongoose = require("mongoose");

// Schema for individual spin wheel segment
const spinWheelSegmentSchema = new mongoose.Schema({
  label: { type: String, required: true },        // e.g. "10 points"
  points: { type: Number, required: true },       // numeric points rewarded
});

const rewardPolicySchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  policyName: { type: String, required: true },
  description: { type: String },

  // Base earning (default fallback if no tier/category rule applies)
  basePointsPer100: { type: Number, required: true },

  // Tier-specific rules with minPoints for automatic assignment
  tierRules: [
    {
      tierName: { type: String, enum: ["Silver", "Gold", "Platinum"], required: true },
      minPoints: { type: Number, required: true }, // minimum points required for this tier
      multiplier: { type: Number, required: true, default: 1 },
      benefits: { type: String }
    }
  ],

  // Category-specific rules
  categoryRules: [
    {
      category: { type: String, required: true },
      pointsPer100: { type: Number, required: true },
      minAmount: { type: Number, default: 0 },
      bonusPoints: { type: Number, default: 0 }
    }
  ],

  // Threshold bonuses
  spendThresholds: [
    {
      minAmount: { type: Number, required: true },
      bonusPoints: { type: Number, required: true }
    }
  ],

  // Redemption rules
  redemptionRate: { type: Number, required: true }, // e.g., 1 point = ₹1
  minRedeemPoints: { type: Number, default: 100 },

  // Points expiry (in days)
  pointsExpiryDays: { type: Number, default: 365 }, // points expire after 1 year by default

  // --- Spin wheel config ---
  spinWheelMinPoints: { type: Number, default: 0 },
  spinWheelSegments: { type: [Number], default: [] },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("RewardPolicy", rewardPolicySchema);
