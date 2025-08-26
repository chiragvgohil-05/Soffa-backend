const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");

dotenv.config();
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Connect Database
connectDB();

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/product")); // ✅ Added product routes

// Default route (optional)
app.get("/", (req, res) => {
    res.send("API is running...");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
