import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const POINTS_EXPIRY_WARNING_DAYS = 30;

const Customer = () => {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [redeemPoints, setRedeemPoints] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState(0);
  const [pointsBreakdown, setPointsBreakdown] = useState(null);
  const [paymentBreakdown, setPaymentBreakdown] = useState(null);
  const [tier, setTier] = useState("No tier assigned");
  const [expiringPoints, setExpiringPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validCategories, setValidCategories] = useState([]);
  const [thresholdRules, setThresholdRules] = useState([]);
  const [previewPoints, setPreviewPoints] = useState(0);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const adminId = user?.adminId;

  // Calculate expiring points
  const calculateExpiringPoints = (pointsHistory) => {
    if (!pointsHistory) return 0;
    const now = new Date();
    return pointsHistory
      .filter(
        (p) =>
          !p.redeemed &&
          new Date(p.expiresAt) > now &&
          (new Date(p.expiresAt) - now) / (1000 * 60 * 60 * 24) <= POINTS_EXPIRY_WARNING_DAYS
      )
      .reduce((sum, p) => sum + p.points, 0);
  };

  // Fetch profile & recent transactions
  const fetchProfileAndRecentTransactions = async () => {
    try {
      setLoading(true);

      // Get customer profile
      const profileRes = await api.get("/customer/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = profileRes.data;

      // Update balance based on pointsHistory to reflect latest points
      const now = new Date();
      const activePoints = profile.pointsHistory
        ? profile.pointsHistory.filter((p) => !p.redeemed && new Date(p.expiresAt) > now).reduce((sum, p) => sum + p.points, 0)
        : 0;

      setBalance(activePoints);
      setTier(profile.tier || "No tier assigned");
      setExpiringPoints(calculateExpiringPoints(profile.pointsHistory));

      // Get recent transactions
      const historyRes = await api.get("/transactions/history?limit=5", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const recentTransactions = Array.isArray(historyRes.data.transactions) ? historyRes.data.transactions : [];
      setTransactions(recentTransactions);

      setError("");
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Could not fetch profile or recent transactions.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch rules
  const fetchRules = async () => {
    try {
      if (!adminId) return;
      const res = await api.get(`/admin/policy/customer-rules/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setValidCategories(res.data.validCategories || []);
      setThresholdRules(res.data.thresholds || []);
    } catch (err) {
      console.error("Error fetching rules:", err);
    }
  };

  useEffect(() => {
    fetchProfileAndRecentTransactions();
    fetchRules();
  }, [adminId]);

  // Calculate points preview
  const calculatePoints = (amountVal, categoryVal) => {
    const amt = Number(amountVal) || 0;
    let basePoints = Math.floor(amt / 100); // simple basePoints calculation
    let categoryPoints = 0;

    const catRule = validCategories.find((c) => c.name === categoryVal);
    if (catRule && amt >= catRule.minAmount) {
      categoryPoints = Math.floor((amt / 100) * catRule.pointsPer100) + (catRule.bonusPoints || 0);
    }

    let thresholdBonus = 0;
    thresholdRules.forEach((rule) => {
      if (amt >= rule.minAmount) thresholdBonus += rule.bonusPoints;
    });

    const tierMultiplier = 1; // optional: can be dynamic if tier-based multiplier is applied
    const totalEarnedPoints = Math.floor((basePoints + categoryPoints) * tierMultiplier + thresholdBonus);

    return { basePoints, categoryPoints, thresholdBonus, tierMultiplier, totalEarnedPoints };
  };

  useEffect(() => {
    setPreviewPoints(calculatePoints(amount, category).totalEarnedPoints);
  }, [amount, category, validCategories, thresholdRules]);

  // Handle adding a transaction
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setError("");

    const redeemVal = redeemPoints ? Number(redeemPoints) : 0;
    if (redeemVal > balance) {
      setError("Redeem points cannot exceed current balance.");
      return;
    }

    if (!adminId) {
      setError("Admin ID not found. Please re-login.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(
        "/transactions",
        {
          amount: Number(amount),
          category: category || "Not entered",
          redeemPoints: redeemVal,
          adminId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAmount("");
      setCategory("");
      setRedeemPoints("");

      setPointsBreakdown(res.data.pointsBreakdown || null);
      setPaymentBreakdown(res.data.paymentBreakdown || null);

      // Refresh profile to update balance
      await fetchProfileAndRecentTransactions();
    } catch (err) {
      console.error("Error adding transaction:", err.response?.data || err);
      setError(err.response?.data?.message || "Transaction failed");
    } finally {
      setSubmitting(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex flex-col">
      {/* Header */}
      <header className="bg-indigo-700 text-white px-6 py-4 flex justify-between items-center shadow sticky top-0 z-50">
        <h1 className="text-xl font-bold cursor-pointer" onClick={() => navigate("/customer")}>
          Loyalty Program
        </h1>
        <nav className="flex items-center space-x-4 md:space-x-6">
          <button
            onClick={() => navigate("/customer/points")}
            className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded text-white font-semibold"
          >
            Points
          </button>
          <button
            onClick={() => navigate("/customer/transactions")}
            className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded text-white font-semibold"
          >
            Transactions
          </button>
          <button
            onClick={() => navigate("/customer/profile")}
            className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded text-white font-semibold"
          >
            Profile
          </button>
          {/* Spin Wheel Button added here */}
          <button
            onClick={() => navigate("/customer/spin-wheel")}
            className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded text-white font-semibold"
          >
            Spin Wheel
          </button>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white font-semibold"
          >
            Logout
          </button>
        </nav>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 flex justify-center items-start">
        <div className="w-full max-w-4xl bg-white rounded-2xl p-6 md:p-8 shadow-lg">
          {/* Tier + Expiring Points */}
          <section className="mb-6 p-5 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
            <p className="text-xl font-semibold text-indigo-700 mb-2">
              Current Tier: <span className="uppercase">{tier}</span>
            </p>
            {expiringPoints > 0 && (
              <p className="text-red-600 font-semibold">
                You have <strong>{expiringPoints}</strong> points expiring soon!
              </p>
            )}
          </section>

          {/* Balance + Preview */}
          <section className="mb-6 p-5 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
            <p className="text-2xl font-bold text-indigo-700">Current Points Balance</p>
            <p className="text-4xl font-extrabold text-indigo-900 mt-2">{balance}</p>
            <p className="mt-2 text-indigo-700 font-semibold">Points You Will Earn: {previewPoints}</p>

            {pointsBreakdown && (
              <div className="mt-4 text-left text-indigo-800 max-w-md mx-auto bg-indigo-100 p-3 rounded">
                <h4 className="font-semibold mb-2">Points Breakdown (Latest Transaction):</h4>
                <p>Base Points: {pointsBreakdown.basePoints}</p>
                <p>Category Points: {pointsBreakdown.categoryPoints}</p>
                <p>Tier Multiplier: {pointsBreakdown.tierMultiplier}</p>
                <p>Threshold Bonus: {pointsBreakdown.thresholdBonus}</p>
                <p>
                  <strong>Total Earned Points: {pointsBreakdown.totalEarnedPoints}</strong>
                </p>
              </div>
            )}

            {paymentBreakdown && (
              <div className="mt-4 text-left text-indigo-800 max-w-md mx-auto bg-green-100 p-3 rounded">
                <h4 className="font-semibold mb-2">Payment Breakdown:</h4>
                <p>Original Amount: ₹{paymentBreakdown.originalAmount}</p>
                <p className="text-red-600">Redeemed Amount: -₹{paymentBreakdown.redeemedAmount}</p>
                <p className="font-bold text-green-700">Final Payable Amount: ₹{paymentBreakdown.finalAmount}</p>
              </div>
            )}
          </section>

          {/* Transaction Form */}
          <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400"
              required
              min="0"
              step="0.01"
            />
            <input
              type="text"
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400"
            />
            <input
              type="number"
              placeholder="Redeem Points (optional)"
              value={redeemPoints}
              onChange={(e) => setRedeemPoints(e.target.value)}
              className="border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400"
              min="0"
            />
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold shadow-md ${
                  submitting ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {submitting ? "Processing..." : "Add Transaction"}
              </button>
            </div>
          </form>

          {error && <p className="text-red-600 mb-6 text-center font-semibold">{error}</p>}

          {/* Recent Transactions */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">Recent Transactions</h2>
            {loading ? (
              <p className="text-center text-gray-600">Loading transactions...</p>
            ) : transactions.length === 0 ? (
              <p className="text-gray-600 text-center">No recent transactions.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {transactions.slice(0, 5).map((t) => (
                  <div
                    key={t._id}
                    className="border rounded-xl p-5 shadow-md bg-gradient-to-r from-indigo-50 to-blue-50 hover:shadow-xl transition"
                  >
                    <p className="text-lg font-semibold text-gray-800">
                      Original Amount: <span className="text-indigo-600">₹{t.amount}</span>
                    </p>
                    <p className="text-gray-700">
                      <strong>Category:</strong> {t.category || "Not entered"}
                    </p>
                    <p className="text-green-600 font-semibold">+ Earned: {t.earnedPoints || 0}</p>
                    <p className="text-red-600 font-semibold">
                      - Redeemed: {t.redeemedPoints || 0} (₹{t.redeemedAmount || 0})
                    </p>
                    <p className="text-green-700 font-bold">Final Amount Paid: ₹{t.finalAmount || t.amount}</p>
                    <p className="text-blue-700 font-bold">Final Balance: {t.finalPoints || balance}</p>
                    <p className="text-sm text-gray-500 mt-2">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Customer;
