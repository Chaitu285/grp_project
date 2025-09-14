import React, { useState } from "react";
import { Wheel } from "react-custom-roulette";
import API from "../api";

const SpinWheelComponent = ({ minPointsRequired, pointsBalance, wheelSegments, adminId, onSpinComplete }) => {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(null);
  const [message, setMessage] = useState("");
  const [spinning, setSpinning] = useState(false);

  const data = wheelSegments.map((seg) => ({ option: `${seg} Points` }));

  const handleSpinClick = async () => {
    console.log("Spin button clicked");

    const balance = Number(pointsBalance);
    const minPoints = Number(minPointsRequired);

    console.log("pointsBalance:", balance, typeof balance);
    console.log("minPointsRequired:", minPoints, typeof minPoints);

    if (balance < minPoints) {
      setMessage(`You need at least ${minPoints} points to spin.`);
      console.log("Insufficient points");
      return;
    }
    setMessage("");
    setSpinning(true);

    try {
      console.log("Calling backend spin API with adminId:", adminId);
      const res = await API.post("/spin-wheel/spin", { adminId });
      
      const result = res.data;
      console.log("Spin API result:", result);
      const wonPoints = result.wonPoints;

      const index = wheelSegments.findIndex((points) => points === wonPoints);
      console.log("Prize index found:", index);
      setPrizeNumber(index >= 0 ? index : 0);

      setMustSpin(true);
      onSpinComplete && onSpinComplete(wonPoints);
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Error during spin");
      setSpinning(false);
      console.error("Spin API error:", error);
    }
  };

  const handleStopSpin = () => {
    setMustSpin(false);
    setSpinning(false);
    const wonPoints = wheelSegments[prizeNumber] || 0;
    setMessage(`Congrats! You won ${wonPoints} points.`);
  };

  return (
    <div className="text-center">
      <Wheel
        mustStartSpinning={mustSpin}
        prizeNumber={prizeNumber}
        data={data}
        backgroundColors={["#3b82f6", "#2563eb"]}
        textColors={["#ffffff"]}
        onStopSpinning={handleStopSpin}
      />
      <button
        onClick={handleSpinClick}
        disabled={spinning}
        className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {spinning ? "Spinning..." : "Spin the Wheel"}
      </button>
      {message && <p className="mt-4 font-semibold">{message}</p>}
    </div>
  );
};

export default SpinWheelComponent;
