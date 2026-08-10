"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const WeatherEvent_1 = require("../models/WeatherEvent");
const Lead_1 = require("../models/Lead");
const router = (0, express_1.Router)();
router.get('/events', async (req, res) => {
    try {
        const { status, eventType, severity, zipCode, active, limit = '20', offset = '0', } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        if (eventType)
            filter.eventType = eventType;
        if (severity)
            filter.severity = severity;
        if (zipCode)
            filter.affectedZipCodes = zipCode;
        if (active === 'true') {
            filter.startTime = { $lte: new Date() };
            filter.$or = [
                { endTime: { $exists: false } },
                { endTime: null },
                { endTime: { $gte: new Date() } },
            ];
        }
        const [events, total] = await Promise.all([
            WeatherEvent_1.WeatherEvent.find(filter)
                .sort({ severity: -1, startTime: -1 })
                .skip(parseInt(offset))
                .limit(parseInt(limit)),
            WeatherEvent_1.WeatherEvent.countDocuments(filter),
        ]);
        const eventsWithLeads = await Promise.all(events.map(async (event) => {
            const leadCount = await Lead_1.Lead.countDocuments({
                source: 'weather-trigger',
                'metadata.weatherEventId': event._id.toString(),
            });
            return {
                ...event.toObject(),
                leadsGenerated: leadCount,
            };
        }));
        res.json({
            success: true,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
            },
            events: eventsWithLeads,
        });
    }
    catch (error) {
        console.error('[Weather] Failed to list events:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve weather events' });
    }
});
router.get('/events/:id/leads', async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = '20', offset = '0' } = req.query;
        const event = await WeatherEvent_1.WeatherEvent.findById(id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Weather event not found' });
        }
        const filter = {
            source: 'weather-trigger',
            'metadata.weatherEventId': id,
        };
        const [leads, total] = await Promise.all([
            Lead_1.Lead.find(filter)
                .sort({ createdAt: -1 })
                .skip(parseInt(offset))
                .limit(parseInt(limit))
                .populate('claimedBy', 'name companyName'),
            Lead_1.Lead.countDocuments(filter),
        ]);
        res.json({
            success: true,
            event: {
                id: event._id,
                eventType: event.eventType,
                severity: event.severity,
                description: event.description,
                startTime: event.startTime,
                endTime: event.endTime,
            },
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
            },
            leads,
        });
    }
    catch (error) {
        console.error(`[Weather] Failed to get leads for event ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Failed to retrieve weather leads' });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [eventTypeBreakdown, severityBreakdown, activeEvents, recentEventsCount, leadsGenerated, topZipCodes, eventTrend,] = await Promise.all([
            WeatherEvent_1.WeatherEvent.aggregate([
                { $group: { _id: '$eventType', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            WeatherEvent_1.WeatherEvent.aggregate([
                { $group: { _id: '$severity', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            WeatherEvent_1.WeatherEvent.countDocuments({
                startTime: { $lte: new Date() },
                $or: [
                    { endTime: { $exists: false } },
                    { endTime: null },
                    { endTime: { $gte: new Date() } },
                ],
            }),
            WeatherEvent_1.WeatherEvent.countDocuments({ startTime: { $gte: thirtyDaysAgo } }),
            Lead_1.Lead.countDocuments({ source: 'weather-trigger' }),
            WeatherEvent_1.WeatherEvent.aggregate([
                { $unwind: '$affectedZipCodes' },
                { $group: { _id: '$affectedZipCodes', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),
            WeatherEvent_1.WeatherEvent.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: '$startTime' },
                            month: { $month: '$startTime' },
                            day: { $dayOfMonth: '$startTime' },
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
                { $limit: 30 },
            ]),
        ]);
        const weatherLeadsStats = await Lead_1.Lead.aggregate([
            { $match: { source: 'weather-trigger' } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    claimed: {
                        $sum: { $cond: [{ $ne: ['$claimedBy', null] }, 1, 0] },
                    },
                    completed: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                    },
                },
            },
        ]);
        res.json({
            success: true,
            overview: {
                totalEvents: await WeatherEvent_1.WeatherEvent.countDocuments(),
                activeEvents,
                recentEventsCount,
                leadsGenerated,
                claimRate: weatherLeadsStats[0]
                    ? ((weatherLeadsStats[0].claimed / weatherLeadsStats[0].total) * 100).toFixed(1)
                    : 0,
                completionRate: weatherLeadsStats[0]
                    ? ((weatherLeadsStats[0].completed / weatherLeadsStats[0].total) * 100).toFixed(1)
                    : 0,
            },
            eventTypeBreakdown,
            severityBreakdown,
            topZipCodes,
            eventTrend,
        });
    }
    catch (error) {
        console.error('[Weather] Failed to get stats:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve weather statistics' });
    }
});
exports.default = router;
//# sourceMappingURL=weather.js.map