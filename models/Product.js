const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        originalPrice: { type: Number },
        imageUrl: { type: String },
        isNew: { type: Boolean, default: false },
        discount: { type: Number, default: 0 },
        inStock: { type: Boolean, default: true },
        brand: { type: String },
        category: { type: String },
        description: { type: String }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
