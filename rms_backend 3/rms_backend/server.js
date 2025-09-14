const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const Razorpay = require("razorpay");
const crypto = require("crypto");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.get("/", (_, res) => res.send("✅ Razorpay Backend OK"));

app.post("/api/create-order", async (req, res) => {
  try {
    const { amountInRupees } = req.body;
    const amount = amountInRupees * 100; // convert INR → paise

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: "rcpt_" + Date.now(),
      notes: { purpose: "Admin Subscription" },
    });

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Verify payment
app.post("/api/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected === razorpay_signature) {
      return res.json({ ok: true });
    }
    return res.status(400).json({ ok: false, error: "Invalid signature" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Verification error" });
  }
});

// Admin auth routes
const adminAuthRoutes = require("./server/routes/adminAuthRoutes");
app.use("/auth", adminAuthRoutes);

const customerAuthRoutes = require("./server/routes/customerAuthRoutes");
app.use("/auth", customerAuthRoutes);

const rewardPolicyRoutes = require("./server/routes/rewardPolicyRoutes");
app.use("/admin/policy", rewardPolicyRoutes);

const transactionRoutes = require("./server/routes/transactionRoutes");
app.use("/transactions", transactionRoutes);

const customerRoutes = require("./server/routes/customerRoutes");
app.use("/customer", customerRoutes);
const spinWheelRoutes = require("./server/routes/spinWheelRoutes");
app.use("/spin-wheel", spinWheelRoutes);

const customerPolicyRoutes = require("./server/routes/customerPolicyRoutes");
app.use("/customer", customerPolicyRoutes);
// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error(err));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
