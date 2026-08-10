"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SCHEDULES = exports.Scheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const AgentRun_1 = require("../models/AgentRun");
const Agent_1 = require("../models/Agent");
const DEFAULT_SCHEDULES = {
    'email-survey': '0 9 * * *',
    'weather-trigger': '*/15 * * * *',
    'social-signal': '*/30 * * * *',
    'gift-card': '*/10 * * * *',
    'sms-alert': '*/5 * * * *',
    'google-ads': '0 */2 * * *',
    'facebook-ads': '0 */2 * * *',
    'seo-content': '0 8 * * *',
    'new-mover': '0 7 * * *',
    'warranty-expiration': '0 6 * * *',
    'competitor-review': '0 */6 * * *',
    'building-permit': '0 */4 * * *',
    'pricing-intelligence': '0 12 * * *',
    'market-analysis': '0 5 * * *',
    'churn-recovery': '0 10 * * *',
};
exports.DEFAULT_SCHEDULES = DEFAULT_SCHEDULES;
class Scheduler {
    constructor(registry) {
        this.tasks = new Map();
        this.isRunning = false;
        this.registry = registry;
    }
    async start() {
        if (this.isRunning) {
            console.warn('[Scheduler] Already running');
            return;
        }
        console.log('[Scheduler] Starting scheduler...');
        this.isRunning = true;
        const agents = await Agent_1.Agent.find({ enabled: true });
        for (const agent of agents) {
            const schedule = agent.schedule || DEFAULT_SCHEDULES[agent.slug];
            if (schedule && this.validateCron(schedule)) {
                this.scheduleAgent(agent.slug, schedule);
            }
            else {
                console.warn(`[Scheduler] No valid schedule for agent: ${agent.slug}`);
            }
        }
        console.log(`[Scheduler] Scheduled ${this.tasks.size} agents`);
    }
    scheduleAgent(slug, cronExpression) {
        if (!this.validateCron(cronExpression)) {
            console.error(`[Scheduler] Invalid cron expression: ${cronExpression} for agent ${slug}`);
            return false;
        }
        this.stopAgent(slug);
        try {
            const task = node_cron_1.default.schedule(cronExpression, async () => {
                await this.executeAgent(slug);
            });
            this.tasks.set(slug, { slug, task, expression: cronExpression });
            console.log(`[Scheduler] Scheduled ${slug}: ${cronExpression}`);
            return true;
        }
        catch (error) {
            console.error(`[Scheduler] Failed to schedule ${slug}:`, error);
            return false;
        }
    }
    stopAgent(slug) {
        const scheduled = this.tasks.get(slug);
        if (scheduled) {
            scheduled.task.stop();
            this.tasks.delete(slug);
            console.log(`[Scheduler] Stopped agent: ${slug}`);
            return true;
        }
        return false;
    }
    stopAll() {
        for (const [slug, scheduled] of this.tasks) {
            scheduled.task.stop();
            console.log(`[Scheduler] Stopped agent: ${slug}`);
        }
        this.tasks.clear();
        this.isRunning = false;
        console.log('[Scheduler] All tasks stopped');
    }
    async runAll() {
        console.log('[Scheduler] Manually triggering all enabled agents...');
        const agents = await Agent_1.Agent.find({ enabled: true });
        const results = await Promise.allSettled(agents.map((agent) => this.executeAgent(agent.slug)));
        const succeeded = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;
        console.log(`[Scheduler] Run all complete: ${succeeded} succeeded, ${failed} failed`);
    }
    async executeAgent(slug) {
        const runId = `run_${Date.now()}_${slug}`;
        const startTime = new Date();
        console.log(`[Scheduler] Executing agent: ${slug} (run: ${runId})`);
        const runRecord = await AgentRun_1.AgentRun.create({
            runId,
            agentSlug: slug,
            status: 'running',
            startedAt: startTime,
            logs: [`[${startTime.toISOString()}] Agent ${slug} started`],
        });
        try {
            const result = await this.registry.runAgent(slug);
            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            await AgentRun_1.AgentRun.updateOne({ runId }, {
                $set: {
                    status: 'completed',
                    completedAt: endTime,
                    duration,
                    result: result ? JSON.stringify(result).slice(0, 10000) : null,
                },
                $push: {
                    logs: `[${endTime.toISOString()}] Agent ${slug} completed in ${duration}ms`,
                },
            });
            await Agent_1.Agent.updateOne({ slug }, {
                $inc: { 'stats.totalRuns': 1, 'stats.successfulRuns': 1 },
                $set: { 'stats.lastRunAt': endTime },
            });
            console.log(`[Scheduler] Agent ${slug} completed in ${duration}ms`);
        }
        catch (error) {
            const endTime = new Date();
            const errorMessage = error instanceof Error ? error.message : String(error);
            await AgentRun_1.AgentRun.updateOne({ runId }, {
                $set: {
                    status: 'failed',
                    completedAt: endTime,
                    error: errorMessage,
                },
                $push: {
                    logs: `[${endTime.toISOString()}] ERROR: ${errorMessage}`,
                },
            });
            await Agent_1.Agent.updateOne({ slug }, {
                $inc: { 'stats.totalRuns': 1, 'stats.failedRuns': 1 },
                $set: { 'stats.lastRunAt': endTime, 'stats.lastError': errorMessage },
            });
            console.error(`[Scheduler] Agent ${slug} failed:`, errorMessage);
        }
    }
    getScheduledTasks() {
        return Array.from(this.tasks.values()).map(({ slug, expression }) => ({
            slug,
            expression,
        }));
    }
    validateCron(expression) {
        return node_cron_1.default.validate(expression);
    }
}
exports.Scheduler = Scheduler;
//# sourceMappingURL=Scheduler.js.map