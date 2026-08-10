"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Referral_1 = require("../models/Referral");
const Lead_1 = require("../models/Lead");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const { status, referringLeadId, sort = 'createdAt', order = 'desc', limit = '20', offset = '0', } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        if (referringLeadId)
            filter.referringLeadId = referringLeadId;
        const [referrals, total] = await Promise.all([
            Referral_1.Referral.find(filter)
                .sort({ [sort]: order === 'asc' ? 1 : -1 })
                .skip(parseInt(offset))
                .limit(parseInt(limit))
                .populate('referringLeadId', 'name email serviceType')
                .populate('referredLeadId', 'name email serviceType status'),
            Referral_1.Referral.countDocuments(filter),
        ]);
        res.json({
            success: true,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
            },
            referrals,
        });
    }
    catch (error) {
        console.error('[Referrals] Failed to list referrals:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve referrals' });
    }
});
router.post('/', auth_1.requireAuth, async (req, res) => {
    try {
        const { referringLeadId, referringCustomerName, referringCustomerEmail, refereeName, refereeEmail, refereePhone, serviceType, zipCode, notes, } = req.body;
        if (!referringCustomerName || !refereeName || !refereeEmail) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: referringCustomerName, refereeName, refereeEmail',
            });
        }
        const referralCode = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
        let referringLead = null;
        if (referringLeadId) {
            referringLead = await Lead_1.Lead.findById(referringLeadId);
        }
        const referredLead = await Lead_1.Lead.create({
            name: refereeName,
            email: refereeEmail,
            phone: refereePhone || '',
            serviceType: serviceType || 'general',
            zipCode: zipCode || '',
            source: 'referral',
            agentSlug: 'referral',
            urgency: 'medium',
            score: 75,
            status: 'new',
            referredBy: referringLeadId || null,
            referralCode,
            notes: notes || `Referred by ${referringCustomerName}`,
            createdAt: new Date(),
        });
        const referral = await Referral_1.Referral.create({
            referringLeadId: referringLeadId || null,
            referredLeadId: referredLead._id,
            referralCode,
            referringCustomerName,
            referringCustomerEmail: referringCustomerEmail || (referringLead ? referringLead.email : ''),
            refereeName,
            refereeEmail,
            refereePhone,
            serviceType: serviceType || 'general',
            status: 'pending',
            createdAt: new Date(),
        });
        if (referringLead) {
            referringLead.referralSent = true;
            referringLead.referralCode = referralCode;
            await referringLead.save();
        }
        res.status(201).json({
            success: true,
            message: 'Referral created successfully',
            referral: {
                ...referral.toObject(),
                referralLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/referral/${referralCode}`,
            },
            referredLead,
        });
    }
    catch (error) {
        console.error('[Referrals] Failed to create referral:', error);
        res.status(500).json({ success: false, message: 'Failed to create referral' });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const [totalReferrals, statusBreakdown, conversionRate, topReferrers, viralMetrics, monthlyTrend,] = await Promise.all([
            Referral_1.Referral.countDocuments(),
            Referral_1.Referral.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Referral_1.Referral.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        converted: {
                            $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] },
                        },
                    },
                },
                {
                    $project: {
                        total: 1,
                        converted: 1,
                        rate: { $cond: [{ $eq: ['$total', 0] }, 0, { $multiply: [{ $divide: ['$converted', '$total'] }, 100] }] },
                    },
                },
            ]),
            Referral_1.Referral.aggregate([
                {
                    $group: {
                        _id: '$referringCustomerEmail',
                        name: { $first: '$referringCustomerName' },
                        count: { $sum: 1 },
                        successful: {
                            $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] },
                        },
                    },
                },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),
            Referral_1.Referral.aggregate([
                {
                    $group: {
                        _id: null,
                        totalReferrals: { $sum: 1 },
                        uniqueReferrers: { $addToSet: '$referringCustomerEmail' },
                    },
                },
                {
                    $project: {
                        totalReferrals: 1,
                        uniqueReferrerCount: { $size: '$uniqueReferrers' },
                        viralCoefficient: {
                            $cond: [
                                { $eq: [{ $size: '$uniqueReferrers' }, 0] },
                                0,
                                { $divide: ['$totalReferrals', { $size: '$uniqueReferrers' }] },
                            ],
                        },
                    },
                },
            ]),
            Referral_1.Referral.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                        },
                        count: { $sum: 1 },
                        converted: {
                            $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] },
                        },
                    },
                },
                { $sort: { '_id.year': -1, '_id.month': -1 } },
                { $limit: 12 },
            ]),
        ]);
        res.json({
            success: true,
            overview: {
                totalReferrals,
                conversionRate: conversionRate[0]?.rate || 0,
                viralCoefficient: viralMetrics[0]?.viralCoefficient || 0,
                uniqueReferrers: viralMetrics[0]?.uniqueReferrerCount || 0,
            },
            statusBreakdown,
            topReferrers,
            monthlyTrend,
        });
    }
    catch (error) {
        console.error('[Referrals] Failed to get stats:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve referral statistics' });
    }
});
exports.default = router;
//# sourceMappingURL=referrals.js.map