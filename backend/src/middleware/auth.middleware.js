
const jwt = require("jsonwebtoken");
const userModel = require("../model/user.model");

async function authMiddleware(req, res, next) {
  try {
const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Always read the latest role from the database
    const user = await userModel
      .findById(decoded.user_id)
      .select("_id role isVerified");

    if (!user) {
      return res.status(401).json({
        message: "User account not found",
      });
    }

    req.user = {
      user_id: user._id.toString(),
      role: user.role,
      isVerified: user.isVerified,
    };

    next();
  } catch (error) {
    console.log("Auth middleware error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired authentication token",
    });
  }
}

module.exports = {
  authMiddleware,
};
