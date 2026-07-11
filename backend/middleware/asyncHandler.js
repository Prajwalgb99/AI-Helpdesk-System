// Wraps an async controller function. If it throws or rejects,
// the error is forwarded to next(), which hands it to errorHandler.js.
// This is the whole reason we don't need try/catch in every controller.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
