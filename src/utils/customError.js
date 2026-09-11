class CustomError extends Error {
  constructor(statusCode, message, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.success = statusCode >= 400 && statusCode < 500 ? false : true;

    if (code) {
      this.code = code;
    } else if (statusCode === 400) {
      this.code = "VALIDATION_ERROR";
    } else if (statusCode === 401) {
      this.code = "UNAUTHORIZED";
    } else if (statusCode === 403) {
      this.code = "FORBIDDEN";
    } else if (statusCode === 404) {
      this.code = "NOT_FOUND";
    } else {
      this.code = "SERVER_ERROR";
    }

    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default CustomError;
