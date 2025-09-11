// router.js
const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage });

// CRUD Routes
router.post("/", upload.array("images", 8), productController.createProduct);
router.get("/", productController.getProducts);

// ✅ Search route first
router.get("/search", productController.searchProducts);

// ✅ Then ID route
router.get("/:id", productController.getProductById);

router.put("/:id", upload.array("images", 8), productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

module.exports = router;
