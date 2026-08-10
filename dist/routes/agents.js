"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Agent_1 = require("../models/Agent");
const AgentRun_1 = require("../models/AgentRun");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const { category, enabled } = req.query;
        const filter = {};
        if (category)
            filter.category = category;
        if (enabled !== undefined)
            filter.enabled = enabled === 'true';
        const agents = await Agent_1.Agent.find(filter).sort({ category: 1, name: 1 });
        const agentsWithStats = agents.map((agent) => ({
            slug: agent.slug,
            name: agent.name,
            description: agent.description,
            category: agent.category,
            enabled: agent.enabled,
            schedule: agent.schedule,
            config: agent.config,
            stats: agent.stats,
            createdAt: agent.createdAt,
            updatedAt: agent.updatedAt,
        }));
        res.json({
            success: true,
            count: agents.length,
            agents: agentsWithStats,
        });
    }
    catch (error) {
        console.error('[Agents Route] Failed to list agents:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve agents' });
    }
});
router.get('/stats/overview', async (req, res) => {
    try {
        const registry = req.app.agentRegistry;
        const overview = await registry.getStatsOverview();
        res.json({
            success: true,
            overview,
        });
    }
    catch (error) {
        console.error('[Agents Route] Failed to get overview:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve overview' });
    }
});
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const agent = await Agent_1.Agent.findOne({ slug });
        if (!agent) {
            return res.status(404).json({ success: false, message: `Agent not found: ${slug}` });
        }
        const recentRuns = await AgentRun_1.AgentRun.find({ agentSlug: slug })
            .sort({ startedAt: -1 })
            .limit(10);
        res.json({
            success: true,
            agent: {
                slug: agent.slug,
                name: agent.name,
                description: agent.description,
                category: agent.category,
                enabled: agent.enabled,
                schedule: agent.schedule,
                config: agent.config,
                stats: agent.stats,
                recentRuns,
                createdAt: agent.createdAt,
                updatedAt: agent.updatedAt,
            },
        });
    }
    catch (error) {
        console.error(`[Agents Route] Failed to get agent ${req.params.slug}:`, error);
        res.status(500).json({ success: false, message: 'Failed to retrieve agent' });
    }
});
router.put('/:slug/enable', auth_1.requireAuth, async (req, res) => {
    try {
        const { slug } = req.params;
        const agent = await Agent_1.Agent.findOneAndUpdate({ slug }, { $set: { enabled: true } }, { new: true });
        if (!agent) {
            return res.status(404).json({ success: false, message: `Agent not found: ${slug}` });
        }
        const scheduler = req.app.scheduler;
        if (scheduler && agent.schedule) {
            scheduler.scheduleAgent(slug, agent.schedule);
        }
        res.json({
            success: true,
            message: `Agent ${slug} enabled`,
            agent: { slug: agent.slug, enabled: agent.enabled },
        });
    }
    catch (error) {
        console.error(`[Agents Route] Failed to enable agent ${req.params.slug}:`, error);
        res.status(500).json({ success: false, message: 'Failed to enable agent' });
    }
});
router.put('/:slug/disable', auth_1.requireAuth, async (req, res) => {
    try {
        const { slug } = req.params;
        const agent = await Agent_1.Agent.findOneAndUpdate({ slug }, { $set: { enabled: false } }, { new: true });
        if (!agent) {
            return res.status(404).json({ success: false, message: `Agent not found: ${slug}` });
        }
        const scheduler = req.app.scheduler;
        if (scheduler) {
            scheduler.stopAgent(slug);
        }
        res.json({
            success: true,
            message: `Agent ${slug} disabled`,
            agent: { slug: agent.slug, enabled: agent.enabled },
        });
    }
    catch (error) {
        console.error(`[Agents Route] Failed to disable agent ${req.params.slug}:`, error);
        res.status(500).json({ success: false, message: 'Failed to disable agent' });
    }
});
router.post('/:slug/run', auth_1.requireAuth, async (req, res) => {
    try {
        const { slug } = req.params;
        const { context } = req.body;
        const registry = req.app.agentRegistry;
        const agent = await Agent_1.Agent.findOne({ slug });
        if (!agent) {
            return res.status(404).json({ success: false, message: `Agent not found: ${slug}` });
        }
        const result = await registry.runAgent(slug, context);
        res.json({
            success: true,
            message: `Agent ${slug} executed successfully`,
            result,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Agents Route] Failed to run agent ${req.params.slug}:`, error);
        res.status(500).json({ success: false, message: `Agent execution failed: ${errorMessage}` });
    }
});
router.get('/:slug/runs', async (req, res) => {
    try {
        const { slug } = req.params;
        const { limit = '20', offset = '0', status } = req.query;
        const agent = await Agent_1.Agent.findOne({ slug });
        if (!agent) {
            return res.status(404).json({ success: false, message: `Agent not found: ${slug}` });
        }
        const filter = { agentSlug: slug };
        if (status)
            filter.status = status;
        const runs = await AgentRun_1.AgentRun.find(filter)
            .sort({ startedAt: -1 })
            .skip(parseInt(offset))
            .limit(parseInt(limit));
        const total = await AgentRun_1.AgentRun.countDocuments(filter);
        res.json({
            success: true,
            agentSlug: slug,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
            },
            runs,
        });
    }
    catch (error) {
        console.error(`[Agents Route] Failed to get runs for ${req.params.slug}:`, error);
        res.status(500).json({ success: false, message: 'Failed to retrieve run history' });
    }
});
router.get('/:slug/runs/:runId', async (req, res) => {
    try {
        const { slug, runId } = req.params;
        const agent = await Agent_1.Agent.findOne({ slug });
        if (!agent) {
            return res.status(404).json({ success: false, message: `Agent not found: ${slug}` });
        }
        const run = await AgentRun_1.AgentRun.findOne({ agentSlug: slug, runId });
        if (!run) {
            return res.status(404).json({ success: false, message: `Run not found: ${runId}` });
        }
        res.json({
            success: true,
            run,
        });
    }
    catch (error) {
        console.error(`[Agents Route] Failed to get run ${req.params.runId}:`, error);
        res.status(500).json({ success: false, message: 'Failed to retrieve run details' });
    }
});
router.put('/:slug/config', auth_1.requireAuth, async (req, res) => {
    try {
        const { slug } = req.params;
        const { schedule, config } = req.body;
        const agent = await Agent_1.Agent.findOne({ slug });
        if (!agent) {
            return res.status(404).json({ success: false, message: `Agent not found: ${slug}` });
        }
        const update = {};
        if (schedule !== undefined)
            update.schedule = schedule;
        if (config !== undefined)
            update.config = { ...agent.config, ...config };
        const updated = await Agent_1.Agent.findOneAndUpdate({ slug }, { $set: update }, { new: true });
        if (schedule && req.app.scheduler) {
            const scheduler = req.app.scheduler;
            if (updated?.enabled) {
                scheduler.scheduleAgent(slug, schedule);
            }
        }
        res.json({
            success: true,
            message: `Agent ${slug} configuration updated`,
            agent: updated,
        });
    }
    catch (error) {
        console.error(`[Agents Route] Failed to update config for ${req.params.slug}:`, error);
        res.status(500).json({ success: false, message: 'Failed to update agent configuration' });
    }
});
exports.default = router;
//# sourceMappingURL=agents.js.map