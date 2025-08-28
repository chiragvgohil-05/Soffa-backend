const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { successResponse, errorResponse } = require("../helpers/responseHelper");
const cloudinary = require("../config/cloudinary");

// REGISTER (only normal users)
exports.registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) return errorResponse(res, "User already exists", 400);

        // No need to hash manually → schema will handle it
        let assignedRole = "User";
        if (role === "Admin" && process.env.ALLOW_ADMIN_SIGNUP === "true") {
            assignedRole = "Admin";
        }

        user = new User({ name, email, password, role: assignedRole });
        await user.save();

        return successResponse(res, "User registered successfully.", {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } catch (err) {
        console.error(err);
        return errorResponse(res, "Server Error", 500);
    }
};

// LOGIN (Admin + User both from DB)
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) return errorResponse(res, "User not found with this email.", 404);

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return errorResponse(res, "Invalid credentials", 400);

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return successResponse(res, "Login successful.", {
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image || null,
            },
        });
    } catch (err) {
        console.error(err);
        return errorResponse(res, "Server Error", 500);
    }
};

// PROFILE
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return errorResponse(res, "User not found", 404);

        return successResponse(res, "Profile retrieved successfully.", user);
    } catch (err) {
        console.error(err);
        return errorResponse(res, "Server Error", 500);
    }
};

// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return errorResponse(res, "User not found", 404);

        const resetToken = jwt.sign(
            { id: user._id, role: user.role, type: "reset" },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        // Normally send by email
        return successResponse(res, "Reset link generated.", {
            resetToken,
            email: user.email,
        });
    } catch (err) {
        console.error(err);
        return errorResponse(res, "Server Error", 500);
    }
};

// EDIT PROFILE
exports.editProfile = async (req, res) => {
    try {
        const { name, email, password, image } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) return errorResponse(res, "User not found", 404);

        if (name) user.name = name;
        if (email) user.email = email;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        // Cloudinary upload (base64 or file)
        if (image) {
            const uploaded = await cloudinary.uploader.upload(image, {
                folder: "user_profiles",
            });
            user.image = uploaded.secure_url;
        }
        if (req.file) {
            const uploaded = await cloudinary.uploader.upload(req.file.path, {
                folder: "user_profiles",
            });
            user.image = uploaded.secure_url;
        }

        await user.save();

        return successResponse(res, "Profile updated successfully.", {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image || null,
        });
    } catch (err) {
        console.error("Edit Profile Error:", err);
        return errorResponse(res, "Server Error", 500);
    }
};