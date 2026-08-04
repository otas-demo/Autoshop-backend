import CustomError from "../utils/customError.js";

const devErrors = (res, error) => {
  res.status(error.statusCode).json({
    success: error.success,
    code: error.code || "SERVER_ERROR",
    message: error.message,
    stackTrace: error.stack,
    error: error,
  });
};

const castErrorHandler = (err) => {
  const message = `Invalid value for ${err.path}: ${err.value}!`;
  return new CustomError(400, message, "VALIDATION_ERROR");
};

const duplicateKeyErrorHandler = (err) => {
  const key = Object.keys(err.keyValue)[0];
  const value = err.keyValue[key];

  const message = `The ${key} "${value}" is already in use. Please choose another one.`;

  return new CustomError(400, message, "DUPLICATE_KEY_ERROR");
};

const validationErrorHandler = (err) => {
  const errors = Object.values(err.errors).map((val) => val.message);
  const errorMessages = errors.join(". ");
  const msg = `Invalid input data: ${errorMessages}`;

  return new CustomError(400, msg, "VALIDATION_ERROR");
};

const handleExpiredJWT = (err) => {
  return new CustomError(401, "JWT has expired.Please Login again", "TOKEN_EXPIRED");
};

const handleJWTError = (err) => {
  return new CustomError(401, "Invalid token.Please login again", "INVALID_TOKEN");
};

const prodErrors = (res, error) => {
  // Ensure error has required properties
  const statusCode = error.statusCode || 500;
  const success = error.success !== undefined ? error.success : false;
  const message = error.message || "Something went wrong. Please try again later!!!";
  const code = error.code || "SERVER_ERROR";

  if (error.isOperational) {
    res.status(statusCode).json({
      success: success,
      code: code,
      message: message,
    });
  } else {
    // Log the error for debugging (but don't expose it to the user)
    console.error("Production Error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Something went wrong. Please try again later!!!",
    });
  }
};

export const globalErrorHandler = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.success = error.success !== undefined ? error.success : false;

  // Infer error code if not already set
  if (!error.code) {
    if (error.statusCode === 400) {
      error.code = "VALIDATION_ERROR";
    } else if (error.statusCode === 401) {
      error.code = "UNAUTHORIZED";
    } else if (error.statusCode === 403) {
      error.code = "FORBIDDEN";
    } else if (error.statusCode === 404) {
      error.code = "NOT_FOUND";
    } else {
      error.code = "SERVER_ERROR";
    }
  }

  if (process.env.NODE_ENV === "development") {
    // In development, we want all the juicy details
    devErrors(res, error);
  } else if (process.env.NODE_ENV === "production") {
    // In production, transform specific technical errors into CustomErrors
    // for a user-friendly response, after they've been logged in their original form.
    let transformedError = error; // Work with the original error object

    // Transform known error types into CustomErrors
    if (error.name === "CastError") {
      transformedError = castErrorHandler(error);
    } else if (error.code === 11000) {
      transformedError = duplicateKeyErrorHandler(error);
    } else if (error.name === "ValidationError") {
      transformedError = validationErrorHandler(error);
    } else if (error.name === "TokenExpiredError") {
      transformedError = handleExpiredJWT(error);
    } else if (error.name === "JsonWebTokenError") {
      transformedError = handleJWTError(error);
    } else if (!error.isOperational) {
      // If it's not a known error type and not operational, create a generic CustomError
      // This ensures we always have an operational error with proper structure
      transformedError = new CustomError(
        error.statusCode || 500,
        error.message || "Something went wrong. Please try again later!!!",
        "SERVER_ERROR"
      );
    }

    // Ensure the transformed error also gets code set if not present
    if (!transformedError.code) {
      if (transformedError.statusCode === 400) {
        transformedError.code = "VALIDATION_ERROR";
      } else if (transformedError.statusCode === 401) {
        transformedError.code = "UNAUTHORIZED";
      } else if (transformedError.statusCode === 403) {
        transformedError.code = "FORBIDDEN";
      } else if (transformedError.statusCode === 404) {
        transformedError.code = "NOT_FOUND";
      } else {
        transformedError.code = "SERVER_ERROR";
      }
    }

    prodErrors(res, transformedError);
  } else {
    // Fallback for other environments
    prodErrors(res, error);
  }
};

export default globalErrorHandler;
