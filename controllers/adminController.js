const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { successResponse, errorResponse } = require("../helpers/responseHelper");

exports.getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();

        const revenueResult = await Order.aggregate([
            { $match: { status: "completed" } },
            { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
        ]);
        const totalRevenue = revenueResult[0]?.totalRevenue || 0;

        // Format totalRevenue in Indian currency format
        const formattedRevenue = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(totalRevenue);

        return successResponse(res, "Dashboard stats fetched successfully", {
            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenue: formattedRevenue,
        });
    } catch (err) {
        console.error("Dashboard error:", err);
        return errorResponse(res, "Failed to fetch dashboard stats", 500);
    }
};
