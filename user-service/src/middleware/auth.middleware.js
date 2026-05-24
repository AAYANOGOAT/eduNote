const jwt = require("jsonwebtoken");

const verifyToken = (...roles) => {
  return (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      if (roles.length > 0 && !roles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role(s): ${roles.join(", ")}. Your role: ${decoded.role}`,
        });
      }

      next();
    } catch (err) {
      const message =
        err.name === "TokenExpiredError" ? "Token expired." : "Invalid token.";
      return res.status(401).json({ success: false, message });
    }
  };
};

module.exports = { verifyToken };
