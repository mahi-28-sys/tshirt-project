const express = require("express");
const router = express.Router();
const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const auth = require("../middleware/auth");

const { 
  placeOrder, 
  getOrders, 
  getOrderById,
  cancelOrder,
  trackOrder,
  updateOrderStatus,
  requestReturn
} = require("../controllers/orderController");


// 🧾 1. CREATE RAZORPAY ORDER
router.post("/create-order", auth, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    const options = {
      amount: amount * 100, // ₹ → paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json(order);

  } catch (error) {
    console.error("RAZORPAY ORDER ERROR:", error);
    res.status(500).json({ message: "Error creating Razorpay order" });
  }
});


// 🔐 2. VERIFY PAYMENT
router.post("/verify-payment", auth, (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSign === razorpay_signature) {
      return res.json({
        success: true,
        message: "Payment verified successfully",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

  } catch (error) {
    console.error("VERIFY ERROR:", error);
    res.status(500).json({ message: "Payment verification failed" });
  }
});


// 🛒 3. PLACE ORDER (AFTER PAYMENT)
router.post("/", auth, placeOrder);


// 📦 4. GET USER ORDERS
router.get("/", auth, getOrders);


// 🆕 5. GET SINGLE ORDER BY ID
router.get("/:id", auth, getOrderById);


// ❌ 6. CANCEL ORDER
router.post("/:orderId/cancel", auth, cancelOrder);


// 📍 7. TRACK ORDER
router.get("/:orderId/track", auth, trackOrder);


// ↩️ 8. REQUEST RETURN
router.post("/:orderId/return", auth, requestReturn);


// 🔧 9. UPDATE ORDER STATUS (Admin only - optional)
router.put("/:orderId/status", auth, updateOrderStatus);


module.exports = router;