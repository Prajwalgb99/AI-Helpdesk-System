const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { ApiError } = require("./errorHandler");
const asyncHandler = require("./asyncHandler");

// Verifies the Bearer token, loads the user, attaches it to req.user.
// Every protected route runs this first.
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Not authorized, no token provided");
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET); // throws if invalid/expired

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, "User attached to this token no longer exists");
  }

  req.user = user;
  next();
});

// Usage: router.patch("/:id", protect, authorize("agent", "admin"), ...)
// Call protect first so req.user exists, then restrict by role.
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Role '${req.user.role}' is not permitted to perform this action`
      );
    }
    next();
  };
};

// Allows API Key validation OR falls back to standard JWT authentication.
const protectOrApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey && apiKey === process.env.N8N_API_KEY) {
    req.user = {
      role: "admin",
      name: "n8n Automation Service",
      email: "n8n@deskline.com",
    };
    return next();
  }
  protect(req, res, next);
};

// Strict check for API key (only n8n or authorized external services allowed).
const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.N8N_API_KEY) {
    throw new ApiError(401, "Unauthorized: Invalid or missing API key");
  }
  next();
};

module.exports = { protect, authorize, protectOrApiKey, verifyApiKey };
