"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wsServer = exports.scheduler = exports.agentRegistry = exports.httpServer = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
dotenv_1.default.config();
const db_1 = require("./utils/db");
const AgentRegistry_1 = require("./agents/AgentRegistry");
const Scheduler_1 = require("./cron/Scheduler");
const LeadWebSocket_1 = require("./websocket/LeadWebSocket");
const leads_v2_1 = __importDefault(require("./routes/leads-v2"));
const agents_1 = __importDefault(require("./routes/agents"));
const gift_cards_1 = __importDefault(require("./routes/gift-cards"));
const referrals_1 = __importDefault(require("./routes/referrals"));
const weather_1 = __importDefault(require("./routes/weather"));
const auth_1 = __importDefault(require("./routes/auth"));
const contractors_1 = __importDefault(require("./routes/contractors"));
const earnings_1 = __importDefault(require("./routes/earnings"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const seed_1 = __importDefault(require("./routes/seed"));
const territories_1 = __importDefault(require("./routes/territories"));
const hoa_1 = __importDefault(require("./routes/hoa"));
const social_proof_1 = __importDefault(require("./routes/social-proof"));
const groups_1 = __importDefault(require("./routes/groups"));
const predict_1 = __importDefault(require("./routes/predict"));
const storm_1 = __importDefault(require("./routes/storm"));
const social_1 = __importDefault(require("./routes/social"));
const outreach_1 = __importDefault(require("./routes/outreach"));
const video_studio_1 = __importDefault(require("./routes/video-studio"));
const video_pipeline_1 = __importDefault(require("./routes/video-pipeline"));
const toolbox_1 = __importDefault(require("./routes/toolbox"));
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 5000;
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)(process.env.LOG_FORMAT || 'combined'));
}
app.use((req, res, next) => {
    req.id = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Request-ID', req.id);
    next();
});
const agentRegistry = new AgentRegistry_1.AgentRegistry();
exports.agentRegistry = agentRegistry;
const scheduler = new Scheduler_1.Scheduler(agentRegistry);
exports.scheduler = scheduler;
const wsServer = new LeadWebSocket_1.LeadWebSocket();
exports.wsServer = wsServer;
app.locals.agentRegistry = agentRegistry;
app.locals.scheduler = scheduler;
app.locals.wsServer = wsServer;
app.get('/health', async (_req, res) => {
    const dbState = require('mongoose').connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
            database: dbStatus,
            scheduler: scheduler['isRunning'] ? 'running' : 'stopped',
            websocket: wsServer['wss'] ? 'active' : 'inactive',
        },
        uptime: process.uptime(),
    });
});
app.use('/api/v2/leads', leads_v2_1.default);
app.use('/api/agents', agents_1.default);
app.use('/api/gift-cards', gift_cards_1.default);
app.use('/api/referrals', referrals_1.default);
app.use('/api/weather', weather_1.default);
app.use('/api/auth', auth_1.default);
app.use('/api/contractors', contractors_1.default);
app.use('/api/earnings', earnings_1.default);
app.use('/api/reviews', reviews_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/api/seed', seed_1.default);
app.use('/api/territories', territories_1.default);
app.use('/api/hoa', hoa_1.default);
app.use('/api/social-proof', social_proof_1.default);
app.use('/api/groups', groups_1.default);
app.use('/api/predict', predict_1.default);
app.use('/api/storm', storm_1.default);
app.use('/api/social', social_1.default);
app.use('/api/outreach', outreach_1.default);
app.use('/api/video-studio', video_studio_1.default);
app.use('/api/video-pipeline', video_pipeline_1.default);
app.use('/api/toolbox', toolbox_1.default);
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});
app.use((err, _req, res, _next) => {
    console.error('[Server] Unhandled error:', err);
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal server error';
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});
const httpServer = (0, http_1.createServer)(app);
exports.httpServer = httpServer;
const startServer = async () => {
    try {
        await (0, db_1.connectDB)();
        wsServer.start(httpServer);
        await agentRegistry.initializeAgents();
        await scheduler.start();
        httpServer.listen(PORT, () => {
            console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚀  GetOnlyPros Backend v2 - LAS VEGAS EDITION             ║
║                                                              ║
║   Port:        ${PORT.toString().padEnd(51, ' ')}║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(51, ' ')}║
║   Scheduler:   Active with 25 agents                         ║
║   WebSocket:   /ws/leads                                     ║
║   Moats:       Territories, HOA, Social Proof,               ║
║                Group Buying, Predictive AI, Storm            ║
║   Video:       7-Agent Production Pipeline                   ║
║                (Director, Writer, Visual, Producer,          ║
║                 Editor, Social, Analytics)                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
      `);
        });
    }
    catch (error) {
        console.error('[Server] Failed to start:', error);
        process.exit(1);
    }
};
process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received. Shutting down gracefully...');
    scheduler.stopAll();
    wsServer.stop();
    httpServer.close(() => {
        console.log('[Server] HTTP server closed');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    console.log('[Server] SIGINT received. Shutting down gracefully...');
    scheduler.stopAll();
    wsServer.stop();
    httpServer.close(() => {
        console.log('[Server] HTTP server closed');
        process.exit(0);
    });
});
startServer();
//# sourceMappingURL=server-v2.js.map