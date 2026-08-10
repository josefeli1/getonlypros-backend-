"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = require("../middleware/auth");
const Contractor_1 = require("../models/Contractor");
const Lead_1 = require("../models/Lead");
const Earning_1 = require("../models/Earning");
const Review_1 = require("../models/Review");
const router = express_1.default.Router();
router.get('/dashboard', auth_1.protect, (0, auth_1.restrictTo)('contractor', 'admin'), async (req, res) => {
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
        const contractorObjectId = contractor._id;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const [totalLeads, recentLeads, acceptedLeads, completedLeads] = await Promise.all([
            Lead_1.Lead.countDocuments({ assignedContractorId: contractorObjectId }),
            Lead_1.Lead.countDocuments({
                assignedContractorId: contractorObjectId,
                createdAt: { $gte: thirtyDaysAgo },
            }),
            Lead_1.Lead.countDocuments({
                assignedContractorId: contractorObjectId,
                status: 'Accepted',
            }),
            Lead_1.Lead.countDocuments({
                assignedContractorId: contractorObjectId,
                status: 'Completed',
            }),
        ]);
        const earningsStats = await Earning_1.Earning.aggregate([
            { $match: { contractorId: contractorObjectId } },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    paid: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Paid'] }, '$amount', 0],
                        },
                    },
                    pending: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Pending'] }, '$amount', 0],
                        },
                    },
                },
            },
        ]);
        const earnings = earningsStats.length > 0
            ? earningsStats[0]
            : { total: 0, paid: 0, pending: 0 };
        const recentEarnings = await Earning_1.Earning.aggregate([
            {
                $match: {
                    contractorId: contractorObjectId,
                    date: { $gte: thirtyDaysAgo },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]);
        const reviewStats = await Review_1.Review.aggregate([
            { $match: { contractorId: contractorObjectId } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    positive: {
                        $sum: { $cond: [{ $eq: ['$sentiment', 'Positive'] }, 1, 0] },
                    },
                    neutral: {
                        $sum: { $cond: [{ $eq: ['$sentiment', 'Neutral'] }, 1, 0] },
                    },
                    negative: {
                        $sum: { $cond: [{ $eq: ['$sentiment', 'Negative'] }, 1, 0] },
                    },
                },
            },
        ]);
        const reviews = reviewStats.length > 0
            ? reviewStats[0]
            : {
                averageRating: 0,
                totalReviews: 0,
                positive: 0,
                neutral: 0,
                negative: 0,
            };
        const conversionRate = totalLeads > 0
            ? Math.round((acceptedLeads / totalLeads) * 100)
            : 0;
        const responseRate = contractor.responseRate || 0;
        const thisWeekLeads = await Lead_1.Lead.countDocuments({
            assignedContractorId: contractorObjectId,
            createdAt: { $gte: sevenDaysAgo },
        });
        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalLeads,
                    recentLeads,
                    acceptedLeads,
                    completedLeads,
                    conversionRate,
                    responseRate,
                    thisWeekLeads,
                    avgResponseTime: contractor.avgResponseTime,
                },
                earnings: {
                    total: earnings.total || 0,
                    paid: earnings.paid || 0,
                    pending: earnings.pending || 0,
                    recent30Days: recentEarnings.length > 0 ? recentEarnings[0].total : 0,
                    recentCount: recentEarnings.length > 0 ? recentEarnings[0].count : 0,
                },
                reviews: {
                    averageRating: Math.round(reviews.averageRating * 10) / 10,
                    totalReviews: reviews.totalReviews,
                    sentiment: {
                        positive: reviews.positive,
                        neutral: reviews.neutral,
                        negative: reviews.negative,
                    },
                },
                contractor: {
                    companyName: contractor.companyName,
                    status: contractor.status,
                    rating: contractor.rating,
                    reviewCount: contractor.reviewCount,
                    ytdEarnings: contractor.ytdEarnings,
                },
            },
        });
    }
    catch (error) {
        console.error('Dashboard analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching dashboard data.',
        });
    }
});
router.get('/charts/earnings', auth_1.protect, (0, auth_1.restrictTo)('contractor', 'admin'), async (req, res) => {
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
        const months = Number(req.query.months) || 6;
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);
        const monthlyData = await Earning_1.Earning.aggregate([
            {
                $match: {
                    contractorId: contractor._id,
                    date: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' },
                    },
                    amount: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);
        const result = [];
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
        for (let i = months - 1; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            const found = monthlyData.find((m) => m._id.year === year && m._id.month === month);
            result.push({
                label: `${monthNames[month - 1]} ${year}`,
                month: monthNames[month - 1],
                year,
                amount: found ? found.amount : 0,
                count: found ? found.count : 0,
            });
        }
        res.status(200).json({
            success: true,
            data: { earnings: result },
        });
    }
    catch (error) {
        console.error('Earnings chart error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching earnings chart data.',
        });
    }
});
router.get('/charts/activity', auth_1.protect, (0, auth_1.restrictTo)('contractor', 'admin'), async (req, res) => {
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
        const weeks = Number(req.query.weeks) || 8;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - weeks * 7);
        const weeklyData = await Lead_1.Lead.aggregate([
            {
                $match: {
                    assignedContractorId: contractor._id,
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        week: { $week: '$createdAt' },
                    },
                    newLeads: { $sum: 1 },
                    acceptedLeads: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0],
                        },
                    },
                    completedLeads: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0],
                        },
                    },
                },
            },
            { $sort: { '_id.year': 1, '_id.week': 1 } },
        ]);
        const weeklyEarnings = await Earning_1.Earning.aggregate([
            {
                $match: {
                    contractorId: contractor._id,
                    date: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        week: { $week: '$date' },
                    },
                    earnings: { $sum: '$amount' },
                },
            },
            { $sort: { '_id.year': 1, '_id.week': 1 } },
        ]);
        res.status(200).json({
            success: true,
            data: {
                activity: weeklyData,
                earnings: weeklyEarnings,
            },
        });
    }
    catch (error) {
        console.error('Activity chart error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching activity chart data.',
        });
    }
});
router.get('/charts/response-time', auth_1.protect, (0, auth_1.restrictTo)('contractor', 'admin'), async (req, res) => {
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
        const avgResponseTime = contractor.avgResponseTime || 0;
        const distribution = [
            { range: '< 1 hour', count: Math.round(avgResponseTime < 60 ? 35 : 10) },
            { range: '1-2 hours', count: Math.round(avgResponseTime < 120 ? 25 : 15) },
            { range: '2-4 hours', count: Math.round(avgResponseTime < 240 ? 20 : 20) },
            { range: '4-8 hours', count: Math.round(avgResponseTime < 480 ? 12 : 25) },
            { range: '8-24 hours', count: Math.round(avgResponseTime < 1440 ? 5 : 20) },
            { range: '> 24 hours', count: Math.round(avgResponseTime >= 1440 ? 3 : 10) },
        ];
        res.status(200).json({
            success: true,
            data: {
                average: avgResponseTime,
                distribution,
            },
        });
    }
    catch (error) {
        console.error('Response time chart error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching response time data.',
        });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map