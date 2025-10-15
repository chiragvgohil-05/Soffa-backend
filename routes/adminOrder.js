const express = require("express");
const router = express.Router();
const adminOrderController = require("../controllers/adminOrderController");
const authMiddleware = require("../middleware/authMiddleware");

// Admin-only order management
router.get("/", authMiddleware(), adminOrderController.getAllOrders);
router.get("/:orderId", authMiddleware(), adminOrderController.getOrderById);
router.post("/create", authMiddleware(), adminOrderController.createOrderByAdmin);
router.put("/:orderId", authMiddleware(), adminOrderController.updateOrder);
router.delete("/:orderId", authMiddleware(), adminOrderController.deleteOrder);

module.exports = router;
