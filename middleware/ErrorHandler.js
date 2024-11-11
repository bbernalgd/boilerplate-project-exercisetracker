const ErrorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || "Something went wrong";

  console.error(err.stack);

  res.status(status).json({
    success: false,
    status: status,
    message: message,
  });
};

module.exports =  ErrorHandler;