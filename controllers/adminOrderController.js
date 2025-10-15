const Order = require("../models/Order");

// 🧾 Get all orders
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "name email mobile address") // ✅ added mobile & address
            .populate("items.product", "name price");

        res.status(200).json({
            success: true,
            count: orders.length,
            orders,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🔍 Get a single order by ID
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate("user", "name email mobile address") // ✅ added mobile & address
            .populate("items.product", "name price");

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🆕 Create new order manually (Admin Side)
exports.createOrderByAdmin = async (req, res) => {
    try {
        const { user, items, totalAmount, shippingAddress, status } = req.body;

        if (!user || !items || items.length === 0 || !totalAmount) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields (user, items, totalAmount)",
            });
        }

        // Fetch user profile
        const User = require("../models/User");
        const userProfile = await User.findById(user);

        const finalShippingAddress = shippingAddress || {
            name: userProfile?.name || "",
            address: userProfile?.address || "",
            phone: userProfile?.mobile || "",
            city: "",
            state: "",
            pincode: "",
        };

        const razorpayOrderId = `ADMIN-${Date.now()}`;

        const newOrder = new Order({
            user,
            items,
            totalAmount,
            razorpayOrderId,
            razorpayPaymentId: null,
            status: status || "pending",
            shippingAddress: finalShippingAddress,
            paidAt: null,
        });

        await newOrder.save();

        res.status(201).json({
            success: true,
            message: "Order created successfully by admin",
            order: newOrder,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✏️ Update order details
exports.updateOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const updatedOrder = await Order.findByIdAndUpdate(orderId, req.body, {
            new: true,
        })
            .populate("user", "name email")
            .populate("items.product", "name price");

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({
            success: true,
            message: "Order updated successfully",
            order: updatedOrder,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🗑️ Delete order
exports.deleteOrder = async (req, res) => {
    try {
        const deletedOrder = await Order.findByIdAndDelete(req.params.orderId);

        if (!deletedOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({ success: true, message: "Order deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
