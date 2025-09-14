import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { FileText, Tag, Gift } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const PolicyManagement = () => {
  const [policy, setPolicy] = useState(null);
  const [form, setForm] = useState({
    policyName: "",
    description: "",
    basePointsPer100: "",
    redemptionRate: "",
    minRedeemPoints: "",
    pointsExpiryDays: "",
    spinWheelMinPoints: "", // New field
    spinWheelSegments: [],  // New field (array of numbers)
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [categoryRules, setCategoryRules] = useState([]);
  const [categoryForm, setCategoryForm] = useState({
    category: "",
    pointsPer100: "",
    minAmount: "",
    bonusPoints: "",
  });
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [categoryCollapsed, setCategoryCollapsed] = useState(false);

  const [thresholds, setThresholds] = useState([]);
  const [thresholdForm, setThresholdForm] = useState({
    minAmount: "",
    bonusPoints: "",
  });
  const [thresholdLoading, setThresholdLoading] = useState(false);
  const [thresholdError, setThresholdError] = useState("");
  const [thresholdCollapsed, setThresholdCollapsed] = useState(false);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    fetchPolicy();
    fetchCategoryRules();
    fetchThresholds();
  }, []);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/policy", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPolicy(res.data);
      setForm({
        policyName: res.data.policyName || "",
        description: res.data.description || "",
        basePointsPer100: res.data.basePointsPer100 || "",
        redemptionRate: res.data.redemptionRate || "",
        minRedeemPoints: res.data.minRedeemPoints || "",
        pointsExpiryDays: res.data.pointsExpiryDays || "",
        spinWheelMinPoints: res.data.spinWheelMinPoints || "", // populate if exists
        spinWheelSegments: res.data.spinWheelSegments || [],   // populate if exists
      });
      setError("");
    } catch (err) {
      setPolicy(null);
      setError("No existing policy. Create one below.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Special handler for spinWheelSegments as array of numbers
  const handleSpinWheelSegmentsChange = (e) => {
    const values = e.target.value
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((v) => !isNaN(v));
    setForm({ ...form, spinWheelSegments: values });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await API.post("/admin/policy", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPolicy(res.data.policy);
      alert(res.data.message || "Policy saved successfully");
    } catch (err) {
      alert("Error saving policy");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete the policy?")) return;
    try {
      await API.delete("/admin/policy", {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Policy deleted");
      setPolicy(null);
      setForm({
        policyName: "",
        description: "",
        basePointsPer100: "",
        redemptionRate: "",
        minRedeemPoints: "",
        pointsExpiryDays: "",
        spinWheelMinPoints: "",
        spinWheelSegments: [],
      });
      setCategoryRules([]);
      setThresholds([]);
    } catch (err) {
      alert("Error deleting policy");
    }
  };

  const fetchCategoryRules = async () => {
    try {
      const res = await API.get("/admin/policy", { headers: { Authorization: `Bearer ${token}` } });
      setCategoryRules(res.data.categoryRules || []);
      setCategoryError("");
    } catch (err) {
      setCategoryError("Failed to fetch category rules");
    }
  };

  const handleCategoryChange = (e) => setCategoryForm({ ...categoryForm, [e.target.name]: e.target.value });

  const handleCategorySave = async () => {
    if (!categoryForm.category) {
      alert("Category name is required");
      return;
    }
    try {
      setCategoryLoading(true);
      const payload = {
        category: categoryForm.category,
        pointsPer100: Number(categoryForm.pointsPer100),
        minAmount: Number(categoryForm.minAmount),
        bonusPoints: Number(categoryForm.bonusPoints),
      };
      const res = await API.post("/admin/policy/policy/category", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(res.data.message || "Category rule saved");
      fetchCategoryRules();
      setCategoryForm({ category: "", pointsPer100: "", minAmount: "", bonusPoints: "" });
    } catch (err) {
      alert("Error saving category rule");
    } finally {
      setCategoryLoading(false);
    }
  };

  const fetchThresholds = async () => {
    try {
      const res = await API.get("/admin/policy", { headers: { Authorization: `Bearer ${token}` } });
      setThresholds(res.data.spendThresholds || []);
      setThresholdError("");
    } catch (err) {
      setThresholdError("Failed to fetch spend thresholds");
    }
  };

  const handleThresholdChange = (e) => setThresholdForm({ ...thresholdForm, [e.target.name]: e.target.value });

  const handleThresholdSave = async () => {
    if (!thresholdForm.minAmount) {
      alert("Minimum amount is required");
      return;
    }
    try {
      setThresholdLoading(true);
      const payload = {
        minAmount: Number(thresholdForm.minAmount),
        bonusPoints: Number(thresholdForm.bonusPoints),
      };
      const res = await API.post("/admin/policy/threshold", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(res.data.message || "Threshold rule saved");
      fetchThresholds();
      setThresholdForm({ minAmount: "", bonusPoints: "" });
    } catch (err) {
      alert("Error saving threshold rule");
    } finally {
      setThresholdLoading(false);
    }
  };

  const COLORS = ["#6366f1", "#22c55e", "#ef4444", "#fbbf24"]; // TierManagement colors

  return (
    <div className="w-screen h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navbar */}
      <header className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-2xl font-bold">Reward Management System</h1>
        <div className="space-x-3">
          <button
            onClick={() => navigate("/business")}
            className="bg-indigo-500 hover:bg-indigo-700 px-4 py-2 rounded-lg transition"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 p-6 space-y-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <h1 className="text-4xl font-bold text-indigo-700 text-center mb-6">
            <FileText className="inline w-10 h-10 mr-2 text-indigo-600" />
            Reward Policy Management
          </h1>

          {/* Policy Card */}
          <section className="bg-white shadow rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <FileText className="w-6 h-6 text-indigo-500 mr-2" />
              <h2 className="text-2xl font-semibold text-indigo-600">Policy Details</h2>
            </div>
            {loading && <p className="text-gray-500">Loading...</p>}
            {error && <p className="text-red-600 mb-3">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label htmlFor="policyName" className="mb-1 font-semibold text-gray-700">
                  Policy Name
                </label>
                <input
                  type="text"
                  id="policyName"
                  name="policyName"
                  placeholder="Policy Name"
                  value={form.policyName}
                  onChange={handleChange}
                  className="border p-2 rounded"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="basePointsPer100" className="mb-1 font-semibold text-gray-700">
                  Base Points per 100
                </label>
                <input
                  type="number"
                  id="basePointsPer100"
                  name="basePointsPer100"
                  placeholder="Base Points per 100"
                  value={form.basePointsPer100}
                  onChange={handleChange}
                  className="border p-2 rounded"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="redemptionRate" className="mb-1 font-semibold text-gray-700">
                  Redemption Rate
                </label>
                <input
                  type="number"
                  id="redemptionRate"
                  name="redemptionRate"
                  placeholder="Redemption Rate"
                  value={form.redemptionRate}
                  onChange={handleChange}
                  className="border p-2 rounded"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="minRedeemPoints" className="mb-1 font-semibold text-gray-700">
                  Minimum Redeem Points
                </label>
                <input
                  type="number"
                  id="minRedeemPoints"
                  name="minRedeemPoints"
                  placeholder="Minimum Redeem Points"
                  value={form.minRedeemPoints}
                  onChange={handleChange}
                  className="border p-2 rounded"
                />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label htmlFor="pointsExpiryDays" className="mb-1 font-semibold text-gray-700">
                  Points Expiry Days
                </label>
                <input
                  type="number"
                  id="pointsExpiryDays"
                  name="pointsExpiryDays"
                  placeholder="Points Expiry Days"
                  value={form.pointsExpiryDays}
                  onChange={handleChange}
                  className="border p-2 rounded"
                />
              </div>

              {/* New Spin Wheel Fields */}
              <div className="flex flex-col">
                <label htmlFor="spinWheelMinPoints" className="mb-1 font-semibold text-gray-700">
                  Minimum Points to Spin Wheel
                </label>
                <input
                  type="number"
                  id="spinWheelMinPoints"
                  name="spinWheelMinPoints"
                  placeholder="Minimum points required to spin"
                  value={form.spinWheelMinPoints}
                  onChange={handleChange}
                  className="border p-2 rounded"
                />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label htmlFor="spinWheelSegments" className="mb-1 font-semibold text-gray-700">
                  Spin Wheel Segments (Points, comma separated)
                </label>
                <input
                  type="text"
                  id="spinWheelSegments"
                  name="spinWheelSegments"
                  placeholder="e.g., 5,10,20,50,100"
                  value={form.spinWheelSegments ? form.spinWheelSegments.join(",") : ""}
                  onChange={handleSpinWheelSegmentsChange}
                  className="border p-2 rounded"
                />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label htmlFor="description" className="mb-1 font-semibold text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Description"
                  value={form.description}
                  onChange={handleChange}
                  className="border p-2 rounded resize-y"
                  rows="4"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-indigo-600 text-white px-5 py-2 rounded hover:bg-indigo-700 transition-colors"
              >
                {loading ? "Saving..." : "Save Policy"}
              </button>
              {policy && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Delete Policy
                </button>
              )}
            </div>
          </section>

          {/* Category Rules Card */}
          <section className="bg-white shadow rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Tag className="w-6 h-6 text-green-500 mr-2" />
                <h2 className="text-2xl font-semibold text-green-600">Category Rules</h2>
              </div>
              <button
                onClick={() => setCategoryCollapsed(!categoryCollapsed)}
                className="text-sm text-indigo-600 hover:underline flex items-center"
              >
                {categoryCollapsed ? "Expand" : "Collapse"}
              </button>
            </div>

            {!categoryCollapsed && (
              <>
                {categoryError && <p className="text-red-600 mb-3">{categoryError}</p>}
                <ul className="mb-4 space-y-2 max-h-48 overflow-auto border p-3 rounded">
                  {categoryRules.map((rule) => (
                    <li key={rule.category} className="border rounded p-2 bg-green-50 flex justify-between items-center">
                      <div>
                        <strong>{rule.category}</strong> — Points/100: {rule.pointsPer100}, Min: ${rule.minAmount}
                      </div>
                      {rule.bonusPoints > 0 && (
                        <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                          +{rule.bonusPoints} ⭐
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
                  <input
                    type="text"
                    name="category"
                    placeholder="Category Name"
                    value={categoryForm.category}
                    onChange={handleCategoryChange}
                    className="border p-2 w-full rounded"
                  />
                  <input
                    type="number"
                    name="pointsPer100"
                    placeholder="Points per 100 Spent"
                    value={categoryForm.pointsPer100}
                    onChange={handleCategoryChange}
                    className="border p-2 w-full rounded"
                  />
                  <input
                    type="number"
                    name="minAmount"
                    placeholder="Minimum Purchase Amount"
                    value={categoryForm.minAmount}
                    onChange={handleCategoryChange}
                    className="border p-2 w-full rounded"
                  />
                  <input
                    type="number"
                    name="bonusPoints"
                    placeholder="Bonus Points"
                    value={categoryForm.bonusPoints}
                    onChange={handleCategoryChange}
                    className="border p-2 w-full rounded"
                  />
                  <button
                    onClick={handleCategorySave}
                    disabled={categoryLoading}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors md:col-span-2"
                  >
                    {categoryLoading ? "Saving..." : "Save Category Rule"}
                  </button>
                </div>
              </>
            )}
          </section>

          {/* Threshold Bonuses Card */}
          <section className="bg-white shadow rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Gift className="w-6 h-6 text-purple-500 mr-2" />
                <h2 className="text-2xl font-semibold text-purple-600">Spend Threshold Bonuses</h2>
              </div>
              <button
                onClick={() => setThresholdCollapsed(!thresholdCollapsed)}
                className="text-sm text-indigo-600 hover:underline flex items-center"
              >
                {thresholdCollapsed ? "Expand" : "Collapse"}
              </button>
            </div>

            {!thresholdCollapsed && (
              <>
                {thresholdError && <p className="text-red-600 mb-3">{thresholdError}</p>}
                <ul className="mb-4 space-y-2 max-h-48 overflow-auto border p-3 rounded">
                  {thresholds.map((rule, idx) => (
                    <li key={idx} className="border rounded p-2 bg-purple-50 flex justify-between items-center">
                      Minimum Spend: ${rule.minAmount}
                      <span className="bg-purple-200 text-purple-800 px-2 py-1 rounded-full text-sm font-medium">
                        +{rule.bonusPoints} ⭐
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
                  <input
                    type="number"
                    name="minAmount"
                    placeholder="Minimum Spend Amount"
                    value={thresholdForm.minAmount}
                    onChange={handleThresholdChange}
                    className="border p-2 w-full rounded"
                  />
                  <input
                    type="number"
                    name="bonusPoints"
                    placeholder="Bonus Points"
                    value={thresholdForm.bonusPoints}
                    onChange={handleThresholdChange}
                    className="border p-2 w-full rounded"
                  />
                  <button
                    onClick={handleThresholdSave}
                    disabled={thresholdLoading}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors md:col-span-2"
                  >
                    {thresholdLoading ? "Saving..." : "Save Threshold Bonus"}
                  </button>
                  <button
                    onClick={() => navigate("/business/points-expiry")}
                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors md:col-span-2"
                  >
                    View Expiring Points
                  </button>
                </div>
              </>
            )}

            {thresholds.length > 0 && (
              <div className="mt-6 h-40 w-40 mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={thresholds.map((t, i) => ({
                        name: `Tier ${i + 1}`,
                        value: t.bonusPoints,
                      }))}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={70}
                      label={({ name, value, percent }) =>
                        `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                      }
                      labelLine={false}
                    >
                      {thresholds.map((t, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} pts`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-indigo-600 text-white text-center py-4 mt-auto">
        <p>© {new Date().getFullYear()} Reward Management System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default PolicyManagement;
