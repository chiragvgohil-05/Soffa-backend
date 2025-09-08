const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const authMiddleware = require("../middleware/authMiddleware");

// User must be logged in
router.post("/add", authMiddleware(), cartController.addToCart);
router.get("/", authMiddleware(), cartController.getCart);
router.post("/remove", authMiddleware(), cartController.removeFromCart);
router.post("/clear", authMiddleware(), cartController.clearCart);

module.exports = router;
