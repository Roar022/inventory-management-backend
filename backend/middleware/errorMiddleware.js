



const errorMiddleware = (err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    message: err.message,
    // Origin of error
    stack: process.env.NODE_URI === "development" ? err.stack : null,
  });
};
module.exports = errorMiddleware;

