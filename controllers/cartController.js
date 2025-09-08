const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { successResponse, errorResponse } = require("../helpers/responseHelper");

// Add to Cart
// Add to Cart
exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.id; // from authMiddleware
        const { productId, quantity } = req.body;

        if (!productId) return errorResponse(res, "Product ID is required", 400);

        // Allow negative quantities for decreasing items
        if (quantity === 0) return errorResponse(res, "Quantity must not be zero", 400);

        const product = await Product.findById(productId);
        if (!product) return errorResponse(res, "Product not found", 404);

        let cart = await Cart.findOne({ user: userId });

        // If user has no cart yet and trying to add negative quantity
        if (!cart && quantity < 0) {
            return errorResponse(res, "Cannot decrease quantity of item not in cart", 400);
        }

        if (!cart) {
            // If user has no cart yet → create new (only if quantity is positive)
            if (quantity < 1) {
                return errorResponse(res, "Cannot add negative quantity to empty cart", 400);
            }

            cart = new Cart({
                user: userId,
                items: [{ product: product._id, quantity, price: product.price }],
                totalPrice: product.price * quantity,
            });
        } else {
            // Check if product already in cart
            const itemIndex = cart.items.findIndex(
                (item) => item.product.toString() === productId
            );

            if (itemIndex > -1) {
                // Update quantity if product exists
                const newQuantity = cart.items[itemIndex].quantity + quantity;

                // Prevent negative quantity
                if (newQuantity < 0) {
                    return errorResponse(res, "Quantity cannot be negative", 400);
                }

                // Remove item if quantity becomes zero
                if (newQuantity === 0) {
                    cart.items.splice(itemIndex, 1);
                } else {
                    cart.items[itemIndex].quantity = newQuantity;
                    cart.items[itemIndex].price = product.price; // update price if product price changed
                }
            } else {
                // Cannot add negative quantity for new item
                if (quantity < 1) {
                    return errorResponse(res, "Cannot add negative quantity for new item", 400);
                }

                // Push new item
                cart.items.push({
                    product: product._id,
                    quantity,
                    price: product.price,
                });
            }

            // Recalculate total price
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

const updateQuantity = async (productId, delta) => {
    const item = cart.find((it) => it.product._id === productId);
    if (!item) return;

    const newQty = item.quantity + delta;

    // Validate on frontend first
    if (newQty <= 0) {
        await removeFromCart(productId);
    } else {
        try {
            await addToCart(productId, delta);
        } catch (err) {
            // Handle API error (e.g., show toast message)
            console.error("Failed to update quantity:", err);
            toast.error("Failed to update quantity");
        }
    }
};