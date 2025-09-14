// src/pages/CustomerSpinWheel.jsx
import React, { useEffect, useState } from "react";
import SpinWheelComponent from "../components/SpinWheel";
import API from "../api";

const CustomerSpinWheel = () => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pointsBalance, setPointsBalance] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch customer-accessible reward policy (includes spin wheel config)
        const policyRes = await API.get("/customer/reward-policy");
        setPolicy(policyRes.data);

        // Fetch customer profile for points balance
        const profileRes = await API.get("/customer/me");
        console.log("Customer profile pointsBalance:", profileRes.data.pointsBalance);

        setPointsBalance(profileRes.data.pointsBalance || 0);
      } catch (err) {
        setError(err.message || "Failed to load spin wheel data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSpinComplete = (wonPoints) => {
    setPointsBalance((prev) => prev + wonPoints);
    alert(`You won ${wonPoints} points!`);
  };

  if (loading) return <p className="text-center mt-10">Loading spin wheel...</p>;
  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;
  if (!policy || !policy.spinWheelSegments?.length)
    return <p className="text-center mt-10">Spin wheel not configured for this business.</p>;

  return (
    <div className="max-w-md mx-auto mt-10 p-4 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4 text-center">Spin the Wheel</h1>
      <SpinWheelComponent
        minPointsRequired={policy.spinWheelMinPoints || 0}
        pointsBalance={pointsBalance}
        wheelSegments={policy.spinWheelSegments}
        adminId={policy.adminId}  // Pass adminId prop here for spin API
        onSpinComplete={handleSpinComplete}
      />
    </div>
  );
};

export default CustomerSpinWheel;
