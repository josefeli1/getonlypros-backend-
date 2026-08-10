"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = require("./utils/db");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = __importDefault(require("./routes/auth"));
const leads_1 = __importDefault(require("./routes/leads"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const earnings_1 = __importDefault(require("./routes/earnings"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const contractors_1 = __importDefault(require("./routes/contractors"));
const admin_1 = __importDefault(require("./routes/admin"));
dotenv_1.default.config();
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
}
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
(0, db_1.connectDB)();
app.use((0, helmet_1.default)({
    contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
}));
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
    ],
};
app.use((0, cors_1.default)(corsOptions));
app.use((0, morgan_1.default)(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
app.get('/health', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'GetOnlyPros API is running',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
    });
});
app.use('/api/auth', auth_1.default);
app.use('/api/leads', leads_1.default);
app.use('/api/reviews', reviews_1.default);
app.use('/api/earnings', earnings_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/api/contractors', contractors_1.default);
app.use('/api/admin', admin_1.default);
app.get('/', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to the GetOnlyPros API',
        documentation: '/health',
        version: '1.0.0',
    });
});
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.globalErrorHandler);
const server = app.listen(PORT, () => {
    console.log(`
========================================
  GetOnlyPros API Server
========================================
  Environment: ${NODE_ENV}
  Port:        ${PORT}
  MongoDB:     ${process.env.MONGODB_URI?.split('@')[1] || 'local'}
  Health:      http://localhost:${PORT}/health
========================================
  `);
});
const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    server.close(() => {
        console.log('HTTP server closed');
        mongoose_1.default.connection.close().then(() => {
            console.log('MongoDB connection closed');
            process.exit(0);
        }).catch(() => process.exit(1));
    });
    setTimeout(() => {
        console.error('Forced shutdown due to timeout');
        process.exit(1);
    }, 10000);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err.message);
    console.error(err.stack);
    server.close(() => process.exit(1));
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
    console.error(err.stack);
    server.close(() => process.exit(1));
});
exports.default = app;
//# sourceMappingURL=server-v1.js.map