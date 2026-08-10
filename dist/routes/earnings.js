"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = require("../middleware/auth");
const Earning_1 = require("../models/Earning");
const Contractor_1 = require("../models/Contractor");
const router = express_1.default.Router();
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
router.get('/', auth_1.protect, (0, auth_1.restrictTo)('contractor', 'admin'), [
    (0, express_validator_1.query)('status').optional().isIn(['Paid', 'Pending']),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('startDate').optional().isISO8601(),
    (0, express_validator_1.query)('endDate').optional().isISO8601(),
    (0, express_validator_1.query)('sortBy').optional().isIn(['date', 'amount', 'createdAt']),
    (0, express_validator_1.query)('sortOrder').optional().isIn(['asc', 'desc']),
    handleValidationErrors,
], async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated',
            });
        }
        const contractor = await Contractor_1.Contractor.findOne({
            userId: new mongoose_1.default.Types.ObjectId(req.user.userId),
        });
        if (!contractor) {
            return res.status(404).json({
                success: false,
                error: 'Contractor profile not found.',
            });
        }
        const queryObj = {
            contractorId: contractor._id,
        };
        if (req.query.status) {
            queryObj.status = req.query.status;
        }
        if (req.query.startDate || req.query.endDate) {
            queryObj.date = {};
            if (req.query.startDate) {
                queryObj.date.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                queryObj.date.$lte = new Date(req.query.endDate);
            }
        }
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 10);
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'date';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const sort = {};
        sort[sortBy] = sortOrder;
        const earnings = await Earning_1.Earning.find(queryObj)
            .sort(sort)
            .skip(skip)
            .limit(limit);
        const total = await Earning_1.Earning.countDocuments(queryObj);
        const totals = await Earning_1.Earning.aggregate([
            { $match: queryObj },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    paidAmount: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Paid'] }, '$amount', 0],
                        },
                    },
                    pendingAmount: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Pending'] }, '$amount', 0],
                        },
                    },
                },
            },
        ]);
        res.status(200).json({
            success: true,
            data: {
                earnings,
                totals: totals.length > 0
                    ? totals[0]
                    : { totalAmount: 0, paidAmount: 0, pendingAmount: 0 },
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
        console.error('Get earnings error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching earnings.',
        });
    }
});
router.get('/stats', auth_1.protect, (0, auth_1.restrictTo)('contractor', 'admin'), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated',
            });
        }
        const contractor = await Contractor_1.Contractor.findOne({
            userId: new mongoose_1.default.Types.ObjectId(req.user.userId),
        });
        if (!contractor) {
            return res.status(404).json({
                success: false,
                error: 'Contractor profile not found.',
            });
        }
        const statusBreakdown = await Earning_1.Earning.aggregate([
            { $match: { contractorId: contractor._id } },
            {
                $group: {
                    _id: '$status',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]);
        const serviceBreakdown = await Earning_1.Earning.aggregate([
            { $match: { contractorId: contractor._id } },
            {
                $group: {
                    _id: '$service',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { total: -1 } },
        ]);
        const currentYear = new Date().getFullYear();
        const monthlyEarnings = await Earning_1.Earning.aggregate([
            {
                $match: {
                    contractorId: contractor._id,
                    date: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lte: new Date(`${currentYear}-12-31`),
                    },
                },
            },
            {
                $group: {
                    _id: { month: { $month: '$date' } },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.month': 1 } },
        ]);
        const monthNames = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
        ];
        const formattedMonthly = monthNames.map((name, index) => {
            const found = monthlyEarnings.find((m) => m._id.month === index + 1);
            return {
                month: name,
                amount: found ? found.total : 0,
                count: found ? found.count : 0,
            };
        });
        res.status(200).json({
            success: true,
            data: {
                statusBreakdown,
                serviceBreakdown,
                monthlyEarnings: formattedMonthly,
                summary: {
                    totalEarnings: contractor.totalEarnings,
                    ytdEarnings: contractor.ytdEarnings,
                    pendingPayout: contractor.pendingPayout,
                },
            },
        });
    }
    catch (error) {
        console.error('Get earnings stats error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching earnings stats.',
        });
    }
});
router.post('/payout', auth_1.protect, (0, auth_1.restrictTo)('contractor'), [
    (0, express_validator_1.body)('amount')
        .isFloat({ min: 1 })
        .withMessage('Payout amount must be at least $1'),
    handleValidationErrors,
], async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated',
            });
        }
        const { amount } = req.body;
        const payoutAmount = Number(amount);
        const contractor = await Contractor_1.Contractor.findOne({
            userId: new mongoose_1.default.Types.ObjectId(req.user.userId),
        });
        if (!contractor) {
            return res.status(404).json({
                success: false,
                error: 'Contractor profile not found.',
            });
        }
        if (contractor.pendingPayout < payoutAmount) {
            return res.status(400).json({
                success: false,
                error: `Insufficient balance. Available: $${contractor.pendingPayout.toFixed(2)}`,
            });
        }
        if (!contractor.stripeOnboardingComplete) {
            return res.status(400).json({
                success: false,
                error: 'Please complete Stripe onboarding before requesting a payout.',
            });
        }
        contractor.pendingPayout -= payoutAmount;
        await contractor.save();
        const pendingEarnings = await Earning_1.Earning.find({
            contractorId: contractor._id,
            status: 'Pending',
        }).sort({ date: 1 });
        let remaining = payoutAmount;
        for (const earning of pendingEarnings) {
            if (remaining <= 0)
                break;
            if (earning.amount <= remaining) {
                earning.status = 'Paid';
                remaining -= earning.amount;
                await earning.save();
            }
        }
        res.status(200).json({
            success: true,
            message: `Payout request of $${payoutAmount.toFixed(2)} has been processed successfully.`,
            data: {
                payoutAmount,
                remainingBalance: contractor.pendingPayout,
            },
        });
    }
    catch (error) {
        console.error('Payout request error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while processing your payout request.',
        });
    }
});
exports.default = router;
//# sourceMappingURL=earnings.js.map