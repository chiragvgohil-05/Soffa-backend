const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");

// ✅ Use memory storage so we can send file buffers to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

// CRUD Routes
router.post("/", upload.array("images", 8), productController.createProduct);
router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);
router.put("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

module.exports = router;
