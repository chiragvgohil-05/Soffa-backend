const User = require("../models/User");
const Product = require("../models/Product");
const { successResponse, errorResponse } = require("../helpers/responseHelper");

// Dashboard Stats API
exports.getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();

        // You can extend here for orders, revenue, etc.

        return successResponse(res, "Dashboard stats fetched successfully", {
            totalUsers,
            totalProducts,
        });
    } catch (err) {
        console.error("Dashboard error:", err);
        return errorResponse(res, "Failed to fetch dashboard stats", 500);
    }
};
