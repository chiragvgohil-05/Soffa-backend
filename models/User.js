const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        image: { type: String, default: null },
        role: {
            type: String,
            enum: ["User", "Admin"],
            default: "User",
        },
        lastLogin: { type: Date },
    },
    {
        timestamps: true,
    }
);

// ✅ Hash password + normalize email on create/save
UserSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    if (this.isModified("email")) {
        this.email = this.email.toLowerCase();
    }

    next();
});

// ✅ Middleware for update operations
async function hashPasswordMiddleware(next) {
    const update = this.getUpdate();

    if (!update) return next();

    // Handle nested $set
    const data = update.$set ? update.$set : update;

    if (data.password) {
        const salt = await bcrypt.genSalt(10);
        data.password = await bcrypt.hash(data.password, salt);
    }

    if (data.email) {
        data.email = data.email.toLowerCase();
    }

    next();
}

UserSchema.pre("findOneAndUpdate", hashPasswordMiddleware);
UserSchema.pre("updateOne", hashPasswordMiddleware);
UserSchema.pre("updateMany", hashPasswordMiddleware);

module.exports = mongoose.model("User", UserSchema);
