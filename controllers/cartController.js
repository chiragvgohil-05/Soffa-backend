const User = require("../models/User");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Order = require("../models/Order"); // You'll need to create an Order model
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { successResponse, errorResponse } = require("../helpers/responseHelper");

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Add to Cart
exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;

        if (!productId) return errorResponse(res, "Product ID is required", 400);
        if (quantity === 0) return errorResponse(res, "Quantity must not be zero", 400);

        const product = await Product.findById(productId);
        if (!product) return errorResponse(res, "Product not found", 404);

        let cart = await Cart.findOne({ user: userId });

        if (!cart && quantity < 0) {
            return errorResponse(res, "Cannot decrease quantity of item not in cart", 400);
        }

        if (!cart) {
            if (quantity < 1) {
                return errorResponse(res, "Cannot add negative quantity to empty cart", 400);
            }

            cart = new Cart({
                user: userId,
                items: [{ product: product._id, quantity, price: product.price }],
                totalPrice: product.price * quantity,
            });
        } else {
            const itemIndex = cart.items.findIndex(
                (item) => item.product.toString() === productId
            );

            if (itemIndex > -1) {
                const newQuantity = cart.items[itemIndex].quantity + quantity;

                if (newQuantity < 0) {
                    return errorResponse(res, "Quantity cannot be negative", 400);
                }

                if (newQuantity === 0) {
                    cart.items.splice(itemIndex, 1);
                } else {
                    cart.items[itemIndex].quantity = newQuantity;
                    cart.items[itemIndex].price = product.price;
                }
            } else {
                if (quantity < 1) {
                    return errorResponse(res, "Cannot add negative quantity for new item", 400);
                }

                cart.items.push({
                    product: product._id,
                    quantity,
                    price: product.price,
                });
            }

            cart.totalPrice = cart.items.reduce(
                (acc, item) => acc + item.quantity * item.price,
                0
            );
        }

        await cart.save();
        return successResponse(res, "Cart updated successfully", cart);
    } catch (err) {
        console.error("Add to cart error:", err);
        return errorResponse(res, err.message, 500);
    }
};

// Get Cart
exports.getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id }).populate("items.product");
        if (!cart) return successResponse(res, "Cart is empty", { items: [], totalPrice: 0 });

        return successResponse(res, "Cart fetched successfully", cart);
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

// Remove Item from Cart
exports.removeFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) return errorResponse(res, "Cart not found", 404);

        cart.items = cart.items.filter((item) => item.product.toString() !== productId);

        cart.totalPrice = cart.items.reduce(
            (acc, item) => acc + item.quantity * item.price,
            0
        );

        await cart.save();
        return successResponse(res, "Item removed from cart successfully", cart);
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

// Clear Cart
exports.clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) return errorResponse(res, "Cart not found", 404);

        cart.items = [];
        cart.totalPrice = 0;

        await cart.save();
        return successResponse(res, "Cart cleared successfully", cart);
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

// Create Razorpay Order
// Create Razorpay Order
// Create Razorpay Order
exports.createRazorpayOrder = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch user profile
        const user = await require("../models/User").findById(userId);
        if (!user) return errorResponse(res, "User not found", 404);

        // Check if mobile and address are present
        if (!user.mobile || !user.address) {
            return errorResponse(
                res,
                "Please add your mobile number and address in your profile before placing an order",
                400
            );
        }

        const cart = await Cart.findOne({ user: userId }).populate("items.product");
        if (!cart || cart.items.length === 0) {
            return errorResponse(res, "Cart is empty", 400);
        }

        // Calculate shipping
        const shipping = cart.totalPrice > 1000 ? 0 : 99;
        const amount = Math.round((cart.totalPrice + shipping) * 100); // Convert to paise

        const options = {
            amount: amount,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1, // Auto capture payment
        };

        const order = await razorpay.orders.create(options);

        // Create order in database with pending status
        const dbOrder = new Order({
            user: userId,
            items: cart.items,
            totalAmount: amount / 100, // Convert back to rupees
            razorpayOrderId: order.id,
            status: "pending",
            shippingAddress: {
                name: user.name,
                address: user.address,
                phone: user.mobile,
            },
        });

        await dbOrder.save();

        return successResponse(res, "Razorpay order created", {
            order: order,
            orderId: dbOrder._id,
        });
    } catch (err) {
        console.error("Razorpay order error:", err);
        return errorResponse(res, err.message, 500);
    }
};

// Verify Payment
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

        // Verify signature
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return errorResponse(res, "Payment verification failed", 400);
        }

        // Update order status in database
        const order = await Order.findById(orderId);
        if (!order) {
            return errorResponse(res, "Order not found", 404);
        }

        order.status = "completed";
        order.razorpayPaymentId = razorpay_payment_id;
        order.paidAt = new Date();
        await order.save();

        // Clear the user's cart
        await Cart.findOneAndUpdate(
            { user: req.user.id },
            { items: [], totalPrice: 0 }
        );

        return successResponse(res, "Payment verified successfully", { order });
    } catch (err) {
        console.error("Payment verification error:", err);
        return errorResponse(res, err.message, 500);
    }
};

// Get Payment Details
exports.getPaymentDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId).populate("items.product");

        if (!order) {
            return errorResponse(res, "Order not found", 404);
        }

        return successResponse(res, "Order details fetched", { order });
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        // Optional: add query filters like status, date range, user
        const { status, userId, fromDate, toDate } = req.query;

        let filter = {};
        if (status) filter.status = status;
        if (userId) filter.user = userId;
        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) filter.createdAt.$gte = new Date(fromDate);
            if (toDate) filter.createdAt.$lte = new Date(toDate);
        }

        const orders = await Order.find(filter)
            .populate("user", "name email") // fetch user info
            .populate("items.product", "name price"); // fetch product info

        return successResponse(res, "Orders fetched successfully", { orders });
    } catch (err) {
        console.error("Get all orders error:", err);
        return errorResponse(res, err.message, 500);
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!orderId) {
            return errorResponse(res, "Order ID is required", 400);
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return errorResponse(res, "Order not found", 404);
        }

        await Order.findByIdAndDelete(orderId);

        return successResponse(res, "Order deleted successfully", { deletedOrderId: orderId });
    } catch (err) {
        console.error("Delete order error:", err);
        return errorResponse(res, err.message, 500);
    }
};