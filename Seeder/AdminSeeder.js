const User = require("../models/User");
const bcrypt = require("bcryptjs");

const adminSeeder = async () => {
    try {
        const alreadyExist = await User.findOne({ email: "admin@gmail.com" }); // 👈 added await
        if (alreadyExist) {
            console.log("✅ Admin user already exists. Skipping seeding.");
            return;
        }

        const admin = new User({
            name: "Super Admin",
            email: "admin@gmail.com",
            password: "admin@123",
            role: "Admin"
        });

        await admin.save();
        console.log("🎉 Admin user seeded successfully.");
    } catch (error) {
        console.error("❌ Error seeding admin user:", error);
    }
};

module.exports = adminSeeder;
