const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const authMiddleware = require("../middleware/authMiddleware");

// Add these routes
router.post("/create-order", authMiddleware(), cartController.createRazorpayOrder);
router.post("/verify-payment", authMiddleware(), cartController.verifyPayment);
router.get("/payment/:orderId", authMiddleware(), cartController.getPaymentDetails);
router.get("/orders", authMiddleware(), cartController.getAllOrders);

// Your existing routes
router.post("/add", authMiddleware(), cartController.addToCart);
router.get("/", authMiddleware(), cartController.getCart);
router.post("/remove", authMiddleware(), cartController.removeFromCart);
router.post("/clear", authMiddleware(), cartController.clearCart);

module.exports = router;