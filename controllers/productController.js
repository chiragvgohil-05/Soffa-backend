const Product = require("../models/Product");
const { successResponse, errorResponse } = require("../helpers/responseHelper");

// CREATE Product
exports.createProduct = async (req, res) => {
    try {
        let { originalPrice, discount, ...rest } = req.body;

        // Ensure originalPrice exists
        if (!originalPrice) {
            return errorResponse(res, "Original price is required", 400);
        }

        // Convert discount to number (just in case)
        discount = Number(discount) || 0;

        // Calculate price
        const price = originalPrice - (originalPrice * discount) / 100;

        const product = new Product({
            ...rest,
            originalPrice,
            discount,
            price // ✅ auto calculated
        });

        await product.save();
        return successResponse(res, "Product created successfully", product);
    } catch (err) {
        return errorResponse(res, err.message);
    }
};

// GET all Products
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        return successResponse(res, "Products fetched successfully", products);
    } catch (err) {
        return errorResponse(res, err.message);
    }
};

// GET single Product
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return errorResponse(res, "Product not found", 404);
        return successResponse(res, "Product fetched successfully", product);
    } catch (err) {
        return errorResponse(res, err.message);
    }
};

// UPDATE Product
exports.updateProduct = async (req, res) => {
    try {
        let { originalPrice, discount, ...rest } = req.body;

        const existingProduct = await Product.findById(req.params.id);
        if (!existingProduct) return errorResponse(res, "Product not found", 404);

        // If discount or originalPrice provided → recalc price
        if (originalPrice !== undefined || discount !== undefined) {
            originalPrice = originalPrice !== undefined ? originalPrice : existingProduct.originalPrice;
            discount = discount !== undefined ? discount : existingProduct.discount;
            rest.price = originalPrice - (originalPrice * discount) / 100;
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { ...rest, originalPrice, discount },
            { new: true }
        );

        return successResponse(res, "Product updated successfully", product);
    } catch (err) {
        return errorResponse(res, err.message);
    }
};

// DELETE Product
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return errorResponse(res, "Product not found", 404);
        return successResponse(res, "Product deleted successfully", product);
    } catch (err) {
        return errorResponse(res, err.message);
    }
};
