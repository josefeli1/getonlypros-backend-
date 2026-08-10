"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const GiftCard_1 = require("../models/GiftCard");
const Lead_1 = require("../models/Lead");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const { status, leadId, contractorId, from, to, sort = 'createdAt', order = 'desc', limit = '20', offset = '0', } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        if (leadId)
            filter.leadId = leadId;
        if (contractorId)
            filter.contractorId = contractorId;
        if (from || to) {
            filter.createdAt = {};
            if (from)
                filter.createdAt.$gte = new Date(from);
            if (to)
                filter.createdAt.$lte = new Date(to);
        }
        const [giftCards, total] = await Promise.all([
            GiftCard_1.GiftCard.find(filter)
                .sort({ [sort]: order === 'asc' ? 1 : -1 })
                .skip(parseInt(offset))
                .limit(parseInt(limit))
                .populate('leadId', 'name email serviceType status')
                .populate('contractorId', 'name companyName'),
            GiftCard_1.GiftCard.countDocuments(filter),
        ]);
        res.json({
            success: true,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
            },
            giftCards,
        });
    }
    catch (error) {
        console.error('[Gift Cards] Failed to list gift cards:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve gift cards' });
    }
});
router.get('/pending', async (req, res) => {
    try {
        const { limit = '50' } = req.query;
        const pendingCards = await GiftCard_1.GiftCard.find({ status: 'pending' })
            .sort({ createdAt: 1 })
            .limit(parseInt(limit))
            .populate('leadId', 'name email serviceType status completedAt')
            .populate('contractorId', 'name companyName email');
        res.json({
            success: true,
            count: pendingCards.length,
            giftCards: pendingCards,
        });
    }
    catch (error) {
        console.error('[Gift Cards] Failed to get pending cards:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve pending gift cards' });
    }
});
router.post('/:leadId/issue', auth_1.requireAuth, async (req, res) => {
    try {
        const { leadId } = req.params;
        const { amount, type = 'amazon', message, expiryDays = 90 } = req.body;
        const lead = await Lead_1.Lead.findById(leadId);
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        if (lead.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: `Lead must be completed before issuing gift card. Current status: ${lead.status}`,
            });
        }
        const existing = await GiftCard_1.GiftCard.findOne({ leadId });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Gift card already issued for this lead',
                giftCard: existing,
            });
        }
        let cardAmount = amount;
        if (!cardAmount) {
            if (lead.jobValue && lead.jobValue > 5000)
                cardAmount = 100;
            else if (lead.jobValue && lead.jobValue > 2000)
                cardAmount = 50;
            else if (lead.jobValue && lead.jobValue > 1000)
                cardAmount = 25;
            else
                cardAmount = 15;
        }
        const code = `GC-${type.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));
        const giftCard = await GiftCard_1.GiftCard.create({
            leadId,
            contractorId: lead.claimedBy,
            customerName: lead.name,
            customerEmail: lead.email,
            amount: cardAmount,
            type,
            code,
            status: 'issued',
            message: message || `Thank you for choosing us for your ${lead.serviceType} needs!`,
            issuedAt: new Date(),
            expiresAt: expiryDate,
            metadata: {
                jobValue: lead.jobValue,
                serviceType: lead.serviceType,
            },
        });
        lead.giftCardIssued = true;
        lead.giftCardId = giftCard._id;
        await lead.save();
        res.status(201).json({
            success: true,
            message: 'Gift card issued successfully',
            giftCard,
        });
    }
    catch (error) {
        console.error(`[Gift Cards] Failed to issue gift card for lead ${req.params.leadId}:`, error);
        res.status(500).json({ success: false, message: 'Failed to issue gift card' });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const [statusBreakdown, totalAmount, monthlyStats, recentActivity] = await Promise.all([
            GiftCard_1.GiftCard.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
            ]),
            GiftCard_1.GiftCard.aggregate([
                { $match: { status: { $in: ['issued', 'redeemed'] } } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            GiftCard_1.GiftCard.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                        },
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$amount' },
                    },
                },
                { $sort: { '_id.year': -1, '_id.month': -1 } },
                { $limit: 12 },
            ]),
            GiftCard_1.GiftCard.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('leadId', 'name serviceType')
                .select('status amount type createdAt'),
        ]);
        const totalIssued = statusBreakdown.reduce((sum, s) => sum + s.count, 0);
        res.json({
            success: true,
            overview: {
                totalIssued,
                totalValue: totalAmount[0]?.total || 0,
                byStatus: statusBreakdown,
            },
            monthlyStats,
            recentActivity,
        });
    }
    catch (error) {
        console.error('[Gift Cards] Failed to get stats:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve gift card statistics' });
    }
});
exports.default = router;
//# sourceMappingURL=gift-cards.js.map