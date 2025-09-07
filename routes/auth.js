const express = require("express");
const { registerUser, loginUser, getProfile, forgotPassword, editProfile, getAllUsers } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });
const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.get("/users", authMiddleware(["Admin"]), getAllUsers);

// User route (only logged-in users)
router.get("/profile", authMiddleware(["User", "Admin"]), getProfile);
router.put("/profile", authMiddleware(["User", "Admin"]), upload.single("image"), editProfile);

// Admin-only routes
router.get("/admin/dashboard", authMiddleware(["Admin"]), (req, res) => {
  res.json({ status: true, message: "Welcome Admin! This is dashboard." });
});


module.exports = router;
