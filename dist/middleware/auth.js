"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_SECRET = exports.optionalAuth = exports.requireAdmin = exports.requireContractor = exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'getonlypros-dev-secret';
exports.JWT_SECRET = JWT_SECRET;
const requireAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.id || decoded.sub,
            email: decoded.email,
            role: decoded.role || 'user',
        };
        if (decoded.contractorId) {
            req.contractorId = decoded.contractorId;
        }
        next();
    }
    catch (error) {
        console.error('[Auth] Token verification failed:', error);
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};
exports.requireAuth = requireAuth;
const requireContractor = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (!decoded.contractorId) {
            res.status(403).json({ success: false, message: 'Contractor access required' });
            return;
        }
        req.user = {
            id: decoded.id || decoded.sub,
            email: decoded.email,
            role: decoded.role || 'contractor',
        };
        req.contractorId = decoded.contractorId;
        next();
    }
    catch (error) {
        console.error('[Auth] Contractor verification failed:', error);
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};
exports.requireContractor = requireContractor;
const requireAdmin = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
            res.status(403).json({ success: false, message: 'Admin access required' });
            return;
        }
        req.user = {
            id: decoded.id || decoded.sub,
            email: decoded.email,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        console.error('[Auth] Admin verification failed:', error);
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};
exports.requireAdmin = requireAdmin;
const optionalAuth = (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            req.user = {
                id: decoded.id || decoded.sub,
                email: decoded.email,
                role: decoded.role || 'user',
            };
            if (decoded.contractorId) {
                req.contractorId = decoded.contractorId;
            }
        }
    }
    catch {
    }
    next();
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map