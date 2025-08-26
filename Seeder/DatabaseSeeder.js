const adminSeeder = require("./AdminSeeder");
const { connectDatabase, disconnectDatabase } = require("../helpers/Helper");

const callSeeder = async () => {
    try {
        await connectDatabase();
        await adminSeeder();
    } catch (error) {
        console.error("❌ Seeder error:", error);
    } finally {
        await disconnectDatabase();
    }
};

module.exports = callSeeder();
