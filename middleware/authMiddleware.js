const jwt = require("jsonwebtoken");

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ status: false, message: "No token, authorization denied" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      // If roles are passed, check if user role is allowed
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ status: false, message: "Access denied" });
      }

      next();
    } catch (err) {
      return res.status(401).json({ status: false, message: "Token is not valid" });
    }
  };
};

module.exports = authMiddleware;
