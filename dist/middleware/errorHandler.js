"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.asyncHandler = exports.globalErrorHandler = exports.AppError = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map((el) => ({
        field: el.path,
        message: el.message,
    }));
    const message = `Invalid input data. ${errors.map((e) => `${e.field}: ${e.message}`).join('. ')}`;
    return new AppError(message, 400);
};
const handleDuplicateFieldsError = (err) => {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value: ${value}. Please use another ${field}.`;
    return new AppError(message, 409);
};
const handleCastError = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};
const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired. Please log in again.', 401);
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        success: false,
        error: err.message,
        status: err.status,
        statusCode: err.statusCode,
        stack: err.stack,
        ...(err.code && { code: err.code }),
    });
};
const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            error: err.message,
            status: err.status,
            statusCode: err.statusCode,
        });
    }
    else {
        console.error('ERROR:', err);
        res.status(500).json({
            success: false,
            error: 'Something went wrong. Please try again later.',
            status: 'error',
            statusCode: 500,
        });
    }
};
const globalErrorHandler = (err, _req, res, _next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    const nodeEnv = process.env.NODE_ENV || 'development';
    if (nodeEnv === 'development') {
        sendErrorDev(err, res);
    }
    else {
        let error = { ...err, message: err.message, name: err.name };
        if (err instanceof mongoose_1.default.Error.ValidationError) {
            error = handleValidationError(err);
        }
        else if (err.code === 11000) {
            error = handleDuplicateFieldsError(err);
        }
        else if (err instanceof mongoose_1.default.Error.CastError) {
            error = handleCastError(err);
        }
        else if (err instanceof mongoose_1.default.Error.StrictPopulateError) {
            error = new AppError('Invalid populate field.', 400);
        }
        else if (err instanceof mongoose_1.default.Error.DocumentNotFoundError) {
            error = new AppError('Document not found.', 404);
        }
        else if (err.name === 'JsonWebTokenError') {
            error = handleJWTError();
        }
        else if (err.name === 'TokenExpiredError') {
            error = handleJWTExpiredError();
        }
        else if (err instanceof SyntaxError && 'body' in err) {
            error = new AppError('Invalid JSON payload.', 400);
        }
        sendErrorProd(error, res);
    }
};
exports.globalErrorHandler = globalErrorHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const notFoundHandler = (req, _res, next) => {
    const err = new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server.`, 404);
    next(err);
};
exports.notFoundHandler = notFoundHandler;
exports.default = exports.globalErrorHandler;
//# sourceMappingURL=errorHandler.js.map