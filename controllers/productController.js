const Product = require("../models/Product");
const { successResponse, errorResponse } = require("../helpers/responseHelper");
const cloudinary = require("../config/cloudinary");

// ✅ Helper: upload buffer to Cloudinary with async/await
const uploadToCloudinary = (fileBuffer, folder = "products") => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.end(fileBuffer);
    });
};

// CREATE Product
exports.createProduct = async (req, res) => {
    try {
        let { originalPrice, discount, ...rest } = req.body;

        if (!originalPrice) {
            return errorResponse(res, "Original price is required", 400);
        }

        discount = Number(discount) || 0;
        originalPrice = Number(originalPrice);
        const price = originalPrice - (originalPrice * discount) / 100;

        // ✅ Upload all files to Cloudinary
        let images = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const result = await uploadToCloudinary(file.buffer);
                    images.push(result.secure_url);
                } catch (uploadErr) {
                    console.error("Cloudinary Upload Error:", uploadErr);
                    return errorResponse(res, "Image upload failed", 500);
                }
            }
        }

        const product = new Product({
            ...rest,
            originalPrice,
            discount,
            price,
            images,
        });

        await product.save();
        return successResponse(res, "Product created successfully", product);
    } catch (err) {
        console.error("Product creation error:", err);
        return errorResponse(res, err.message, 500);
    }
};

// GET all Products
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        return successResponse(res, "Products fetched successfully", products);
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

// GET single Product
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return errorResponse(res, "Product not found", 404);
        return successResponse(res, "Product fetched successfully", product);
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

// UPDATE Product
exports.updateProduct = async (req, res) => {
    try {
        let { originalPrice, discount, ...rest } = req.body;

        const existingProduct = await Product.findById(req.params.id);
        if (!existingProduct) return errorResponse(res, "Product not found", 404);

        let images = existingProduct.images || [];

        // ✅ Handle removed images (sent as array or multiple fields)
        let removedImages = [];
        if (req.body.removedImages) {
            if (Array.isArray(req.body.removedImages)) {
                removedImages = req.body.removedImages;
            } else {
                removedImages = [req.body.removedImages]; // single field case
            }
        }

        if (removedImages.length > 0) {
            for (const imgUrl of removedImages) {
                try {
                    // safer if you store public_id, but for now parse from URL
                    const publicId = imgUrl.split("/").pop().split(".")[0];
                    await cloudinary.uploader.destroy(`products/${publicId}`);
                } catch (err) {
                    console.error("Cloudinary delete error:", err);
                }
            }

            images = images.filter(img => !removedImages.includes(img));
        }

        // ✅ Handle new uploads
        if (req.files && req.files.length > 0) {
            let newImages = [];
            for (const file of req.files) {
                const result = await uploadToCloudinary(file.buffer);
                newImages.push(result.secure_url);
            }
            images = [...images, ...newImages];
        }

        // ✅ Recalculate price if needed
        originalPrice = originalPrice !== undefined ? Number(originalPrice) : existingProduct.originalPrice;
        discount = discount !== undefined ? Number(discount) : existingProduct.discount;
        rest.price = originalPrice - (originalPrice * discount) / 100;

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { ...rest, originalPrice, discount, images },
            { new: true }
        );

        return successResponse(res, "Product updated successfully", product);
    } catch (err) {
        console.error("Product update error:", err);
        return errorResponse(res, err.message, 500);
    }
};
// DELETE Product
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return errorResponse(res, "Product not found", 404);
        return successResponse(res, "Product deleted successfully", product);
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

exports.searchProducts = async (req, res) => {
    console.log("Incoming query:", req.query);
    try {
        const { query } = req.query;
        if (!query || query.trim() === "") {
            return errorResponse(res, "Search query is required", 400);
        }

        const products = await Product.find({
            $or: [
                { name: { $regex: query, $options: "i" } },
                { brand: { $regex: query, $options: "i" } },
                { category: { $regex: query, $options: "i" } }
            ]
        });

        if (products.length === 0) {
            return successResponse(res, "No products found", []);
        }

        return successResponse(res, "Products fetched successfully", products);
    } catch (err) {
        console.error("Product search error:", err);
        return errorResponse(res, err.message, 500);
    }
};