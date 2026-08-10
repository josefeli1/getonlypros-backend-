"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
const Contractor_1 = require("../models/Contractor");
const Lead_1 = require("../models/Lead");
const Earning_1 = require("../models/Earning");
const Review_1 = require("../models/Review");
const Activity_1 = require("../models/Activity");
const router = express_1.default.Router();
router.use(auth_1.protect);
router.use((0, auth_1.restrictTo)('admin'));
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map((e) => ({
                field: e.path || e.param,
                message: e.msg,
            })),
        });
    }
    next();
};
router.get('/dashboard', async (_req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const [totalUsers, totalHomeowners, totalContractors, pendingContractors, totalLeads, newLeads30d, totalEarnings, totalReviews, recentActivities,] = await Promise.all([
            User_1.User.countDocuments(),
            User_1.User.countDocuments({ type: 'homeowner' }),
            User_1.User.countDocuments({ type: 'contractor' }),
            Contractor_1.Contractor.countDocuments({ status: 'pending' }),
            Lead_1.Lead.countDocuments(),
            Lead_1.Lead.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            Earning_1.Earning.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' },
                    },
                },
            ]),
            Review_1.Review.countDocuments(),
            Activity_1.Activity.find().sort({ timestamp: -1 }).limit(10),
        ]);
        const userGrowth = await User_1.User.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                    },
                    homeowners: {
                        $sum: { $cond: [{ $eq: ['$type', 'homeowner'] }, 1, 0] },
                    },
                    contractors: {
                        $sum: { $cond: [{ $eq: ['$type', 'contractor'] }, 1, 0] },
                    },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            { $limit: 6 },
        ]);
        const leadsByStatus = await Lead_1.Lead.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);
        const topContractors = await Contractor_1.Contractor.find()
            .sort({ totalEarnings: -1 })
            .limit(5)
            .populate('userId', 'firstName lastName email');
        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    totalHomeowners,
                    totalContractors,
                    pendingContractors,
                    totalLeads,
                    newLeads30d,
                    totalEarnings: totalEarnings.length > 0 ? totalEarnings[0].total : 0,
                    totalReviews,
                },
                userGrowth,
                leadsByStatus,
                topContractors,
                recentActivities,
            },
        });
    }
    catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching admin dashboard data.',
        });
    }
});
router.get('/users', [
    (0, express_validator_1.query)('type').optional().isIn(['homeowner', 'contractor', 'admin']),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    handleValidationErrors,
], async (_req, res) => {
    try {
        const filters = {};
        if (_req.query.type)
            filters.type = _req.query.type;
        const page = Math.max(1, Number(_req.query.page) || 1);
        const limit = Math.min(100, Number(_req.query.limit) || 20);
        const skip = (page - 1) * limit;
        const users = await User_1.User.find(filters)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await User_1.User.countDocuments(filters);
        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching users.',
        });
    }
});
router.get('/contractors', [
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['active', 'pending', 'suspended']),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    handleValidationErrors,
], async (_req, res) => {
    try {
        const filters = {};
        if (_req.query.status)
            filters.status = _req.query.status;
        const page = Math.max(1, Number(_req.query.page) || 1);
        const limit = Math.min(100, Number(_req.query.limit) || 20);
        const skip = (page - 1) * limit;
        const contractors = await Contractor_1.Contractor.find(filters)
            .populate('userId', 'firstName lastName email phone zipCode')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Contractor_1.Contractor.countDocuments(filters);
        res.status(200).json({
            success: true,
            data: {
                contractors,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    }
    catch (error) {
        console.error('Get admin contractors error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching contractors.',
        });
    }
});
router.put('/contractors/:id/status', [
    (0, express_validator_1.body)('status')
        .isIn(['active', 'pending', 'suspended'])
        .withMessage('Status must be active, pending, or suspended'),
    handleValidationErrors,
], async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid contractor ID format.',
            });
        }
        const contractor = await Contractor_1.Contractor.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
        if (!contractor) {
            return res.status(404).json({
                success: false,
                error: 'Contractor not found.',
            });
        }
        res.status(200).json({
            success: true,
            message: `Contractor status updated to ${status}.`,
            data: { contractor },
        });
    }
    catch (error) {
        console.error('Update contractor status error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while updating contractor status.',
        });
    }
});
router.get('/leads', [
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['New', 'Viewed', 'Accepted', 'Declined', 'Completed']),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    handleValidationErrors,
], async (_req, res) => {
    try {
        const filters = {};
        if (_req.query.status)
            filters.status = _req.query.status;
        const page = Math.max(1, Number(_req.query.page) || 1);
        const limit = Math.min(100, Number(_req.query.limit) || 20);
        const skip = (page - 1) * limit;
        const leads = await Lead_1.Lead.find(filters)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Lead_1.Lead.countDocuments(filters);
        res.status(200).json({
            success: true,
            data: {
                leads,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    }
    catch (error) {
        console.error('Get admin leads error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching leads.',
        });
    }
});
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid user ID format.',
            });
        }
        if (id === req.user?.userId) {
            return res.status(400).json({
                success: false,
                error: 'You cannot delete your own account.',
            });
        }
        const user = await User_1.User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found.',
            });
        }
        if (user.type === 'contractor') {
            await Contractor_1.Contractor.findOneAndDelete({ userId: id });
        }
        res.status(200).json({
            success: true,
            message: 'User deleted successfully.',
        });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while deleting the user.',
        });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map