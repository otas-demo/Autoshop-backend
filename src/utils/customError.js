class CustomError extends Error {
  constructor(statusCode, message, code = "SERVER_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.success = statusCode >= 400 && statusCode < 500 ? false : true;
    this.code = code;

    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default CustomError;
