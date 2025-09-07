const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");

// Only admin can access
router.get("/dashboard", authMiddleware(["Admin"]), getDashboardStats);

module.exports = router;
