"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Lead_1 = require("../models/Lead");
const Contractor_1 = require("../models/Contractor");
const GiftCard_1 = require("../models/GiftCard");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const { source, status, urgency, minScore, maxScore, zipCode, serviceType, agentSlug, from, to, claimed, contractorId, sort = 'createdAt', order = 'desc', limit = '20', offset = '0', } = req.query;
        const filter = {};
        if (source)
            filter.source = source;
        if (status)
            filter.status = status;
        if (urgency)
            filter.urgency = urgency;
        if (zipCode)
            filter.zipCode = zipCode;
        if (serviceType)
            filter.serviceType = serviceType;
        if (agentSlug)
            filter.agentSlug = agentSlug;
        if (contractorId)
            filter.claimedBy = contractorId;
        if (claimed === 'true')
            filter.claimedBy = { $exists: true, $ne: null };
        if (claimed === 'false')
            filter.claimedBy = { $exists: false };
        if (minScore || maxScore) {
            filter.score = {};
            if (minScore)
                filter.score.$gte = parseInt(minScore);
            if (maxScore)
                filter.score.$lte = parseInt(maxScore);
        }
        if (from || to) {
            filter.createdAt = {};
            if (from)
                filter.createdAt.$gte = new Date(from);
            if (to)
                filter.createdAt.$lte = new Date(to);
        }
        const sortOrder = order === 'asc' ? 1 : -1;
        const [leads, total] = await Promise.all([
            Lead_1.Lead.find(filter)
                .sort({ [sort]: sortOrder })
                .skip(parseInt(offset))
                .limit(parseInt(limit))
                .populate('claimedBy', 'name email companyName'),
            Lead_1.Lead.countDocuments(filter),
        ]);
        const scoreDistribution = await Lead_1.Lead.aggregate([
            { $match: filter },
            {
                $bucket: {
                    groupBy: '$score',
                    boundaries: [0, 25, 50, 75, 90, 101],
                    default: 'unknown',
                    output: { count: { $sum: 1 } },
                },
            },
        ]);
        res.json({
            success: true,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: total > parseInt(offset) + leads.length,
            },
            scoreDistribution,
            leads,
        });
    }
    catch (error) {
        console.error('[Leads V2] Failed to list leads:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve leads' });
    }
});
router.get('/sources', async (req, res) => {
    try {
        const sourceStats = await Lead_1.Lead.aggregate([
            {
                $group: {
                    _id: '$source',
                    count: { $sum: 1 },
                    avgScore: { $avg: '$score' },
                    totalValue: { $sum: '$estimatedValue' },
                    lastLeadAt: { $max: '$createdAt' },
                },
            },
            { $sort: { count: -1 } },
        ]);
        const statusStats = await Lead_1.Lead.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = await Lead_1.Lead.countDocuments({ createdAt: { $gte: today } });
        res.json({
            success: true,
            sources: sourceStats,
            statusBreakdown: statusStats,
            todayCount,
        });
    }
    catch (error) {
        console.error('[Leads V2] Failed to get source stats:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve source statistics' });
    }
});
router.get('/realtime', async (req, res) => {
    try {
        const { limit = '50' } = req.query;
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const leads = await Lead_1.Lead.find({ createdAt: { $gte: twentyFourHoursAgo } })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('claimedBy', 'name email companyName');
        const hourlyBreakdown = await Lead_1.Lead.aggregate([
            { $match: { createdAt: { $gte: twentyFourHoursAgo } } },
            {
                $group: {
                    _id: {
                        hour: { $hour: '$createdAt' },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.hour': -1 } },
        ]);
        res.json({
            success: true,
            count: leads.length,
            period: '24h',
            hourlyBreakdown,
            leads,
        });
    }
    catch (error) {
        console.error('[Leads V2] Failed to get realtime leads:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve realtime leads' });
    }
});
router.get('/by-agent/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const { limit = '20', offset = '0' } = req.query;
        const filter = { agentSlug: slug };
        const [leads, total] = await Promise.all([
            Lead_1.Lead.find(filter)
                .sort({ createdAt: -1 })
                .skip(parseInt(offset))
                .limit(parseInt(limit))
                .populate('claimedBy', 'name email companyName'),
            Lead_1.Lead.countDocuments(filter),
        ]);
        const metrics = await Lead_1.Lead.aggregate([
            { $match: { agentSlug: slug } },
            {
                $group: {
                    _id: null,
                    totalLeads: { $sum: 1 },
                    avgScore: { $avg: '$score' },
                    totalClaims: {
                        $sum: { $cond: [{ $ne: ['$claimedBy', null] }, 1, 0] },
                    },
                    totalValue: { $sum: '$estimatedValue' },
                },
            },
        ]);
        res.json({
            success: true,
            agentSlug: slug,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
            },
            metrics: metrics[0] || { totalLeads: 0, avgScore: 0, totalClaims: 0, totalValue: 0 },
            leads,
        });
    }
    catch (error) {
        console.error(`[Leads V2] Failed to get leads by agent ${req.params.slug}:`, error);
        res.status(500).json({ success: false, message: 'Failed to retrieve agent leads' });
    }
});
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, address, city, state, zipCode, serviceType, urgency = 'medium', score = 50, source, agentSlug, estimatedValue = 0, notes, metadata, } = req.body;
        if (!name || !email || !phone || !serviceType || !zipCode) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, email, phone, serviceType, zipCode',
            });
        }
        const lead = await Lead_1.Lead.create({
            name,
            email,
            phone,
            address,
            city,
            state,
            zipCode,
            serviceType,
            urgency,
            score,
            source: source || 'manual',
            agentSlug: agentSlug || null,
            estimatedValue,
            notes,
            metadata,
            status: 'new',
            createdAt: new Date(),
        });
        const wsServer = req.app.wsServer;
        if (wsServer) {
            wsServer.broadcastNewLead(lead);
        }
        if (agentSlug) {
            const { Agent } = await Promise.resolve().then(() => __importStar(require('../models/Agent')));
            await Agent.updateOne({ slug: agentSlug }, { $inc: { 'stats.leadsGenerated': 1 } });
        }
        res.status(201).json({
            success: true,
            message: 'Lead created successfully',
            lead,
        });
    }
    catch (error) {
        console.error('[Leads V2] Failed to create lead:', error);
        res.status(500).json({ success: false, message: 'Failed to create lead' });
    }
});
router.put('/:id/claim', auth_1.requireContractor, async (req, res) => {
    try {
        const { id } = req.params;
        const contractorId = req.contractorId || req.body.contractorId;
        const lead = await Lead_1.Lead.findById(id);
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        if (lead.claimedBy) {
            return res.status(409).json({
                success: false,
                message: 'Lead already claimed',
                claimedBy: lead.claimedBy,
            });
        }
        const claimCost = lead.score >= 80 ? 15 : lead.score >= 50 ? 10 : 5;
        lead.claimedBy = contractorId;
        lead.claimedAt = new Date();
        lead.status = 'claimed';
        lead.claimCost = claimCost;
        await lead.save();
        await Contractor_1.Contractor.updateOne({ _id: contractorId }, {
            $inc: {
                'stats.leadsClaimed': 1,
                'stats.totalSpent': claimCost,
            },
        });
        const populatedLead = await Lead_1.Lead.findById(id).populate('claimedBy', 'name email companyName');
        const wsServer = req.app.wsServer;
        if (wsServer) {
            wsServer.notifyContractor(contractorId, {
                type: 'lead_claimed',
                leadId: id,
                cost: claimCost,
            });
        }
        res.json({
            success: true,
            message: 'Lead claimed successfully',
            claimCost,
            lead: populatedLead,
        });
    }
    catch (error) {
        console.error(`[Leads V2] Failed to claim lead ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Failed to claim lead' });
    }
});
router.put('/:id/complete', auth_1.requireContractor, async (req, res) => {
    try {
        const { id } = req.params;
        const { jobValue, feedback } = req.body;
        const contractorId = req.contractorId;
        const lead = await Lead_1.Lead.findById(id);
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        if (lead.status !== 'claimed') {
            return res.status(400).json({
                success: false,
                message: `Lead must be claimed before completion. Current status: ${lead.status}`,
            });
        }
        lead.status = 'completed';
        lead.completedAt = new Date();
        lead.jobValue = jobValue || 0;
        if (feedback)
            lead.feedback = feedback;
        await lead.save();
        await Contractor_1.Contractor.updateOne({ _id: contractorId }, {
            $inc: {
                'stats.leadsCompleted': 1,
                'stats.totalJobValue': jobValue || 0,
            },
        });
        const giftCardEligible = true;
        res.json({
            success: true,
            message: 'Lead marked as complete',
            giftCardEligible,
            lead,
        });
    }
    catch (error) {
        console.error(`[Leads V2] Failed to complete lead ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Failed to complete lead' });
    }
});
router.post('/:id/refer', auth_1.requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { refereeName, refereeEmail, refereePhone, refereeServiceType, notes } = req.body;
        const lead = await Lead_1.Lead.findById(id);
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        const referralCode = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
        const referredLead = await Lead_1.Lead.create({
            name: refereeName,
            email: refereeEmail,
            phone: refereePhone,
            serviceType: refereeServiceType || lead.serviceType,
            zipCode: lead.zipCode,
            city: lead.city,
            state: lead.state,
            source: 'referral',
            agentSlug: 'referral',
            urgency: 'medium',
            score: 75,
            status: 'new',
            referredBy: id,
            referralCode,
            notes: notes || `Referred by ${lead.name}`,
            createdAt: new Date(),
        });
        lead.referralSent = true;
        lead.referralCode = referralCode;
        await lead.save();
        const { Referral } = await Promise.resolve().then(() => __importStar(require('../models/Referral')));
        await Referral.create({
            referringLeadId: id,
            referredLeadId: referredLead._id,
            referralCode,
            referringCustomerName: lead.name,
            referringCustomerEmail: lead.email,
            refereeName,
            refereeEmail,
            refereePhone,
            serviceType: refereeServiceType || lead.serviceType,
            status: 'pending',
            createdAt: new Date(),
        });
        res.status(201).json({
            success: true,
            message: 'Referral created successfully',
            referralCode,
            referredLead,
        });
    }
    catch (error) {
        console.error(`[Leads V2] Failed to create referral from lead ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Failed to create referral' });
    }
});
router.get('/:id/gift-card', async (req, res) => {
    try {
        const { id } = req.params;
        const lead = await Lead_1.Lead.findById(id);
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        const giftCard = await GiftCard_1.GiftCard.findOne({ leadId: id });
        res.json({
            success: true,
            leadId: id,
            leadStatus: lead.status,
            giftCardEligible: lead.status === 'completed',
            giftCard,
        });
    }
    catch (error) {
        console.error(`[Leads V2] Failed to get gift card for lead ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Failed to retrieve gift card status' });
    }
});
exports.default = router;
//# sourceMappingURL=leads-v2.js.map