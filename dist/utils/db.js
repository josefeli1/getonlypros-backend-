"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const MONGO_USER = process.env.MONGO_USER;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;
const MONGO_CLUSTER = process.env.MONGO_CLUSTER;
const MONGO_DB = process.env.MONGO_DB || 'getonlypros';

const MONGODB_URI = process.env.MONGODB_URI || (MONGO_USER && MONGO_PASSWORD && MONGO_CLUSTER
    ? `mongodb+srv://${encodeURIComponent(MONGO_USER)}:${encodeURIComponent(MONGO_PASSWORD)}@${MONGO_CLUSTER}/${MONGO_DB}?retryWrites=true&w=majority&appName=getonlypros`
    : 'mongodb://localhost:27017/getonlypros');

const connectDB = async () => {
    try {
        const conn = await mongoose_1.default.connect(MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log(`[DB] MongoDB connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
        mongoose_1.default.connection.on('error', (err) => {
            console.error('[DB] MongoDB connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.warn('[DB] MongoDB disconnected. Attempting to reconnect...');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            console.log('[DB] MongoDB reconnected');
        });
        process.on('SIGINT', async () => {
            await mongoose_1.default.connection.close();
            console.log('[DB] MongoDB connection closed through app termination');
            process.exit(0);
        });
    }
    catch (error) {
        console.error('[DB] Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
//# sourceMappingURL=db.js.map
