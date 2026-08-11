"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGENT_DEFINITIONS = exports.AgentRegistry = void 0;
const index_1 = require("./index");
const Agent_1 = require("../models/Agent");
const AGENT_DEFINITIONS = [
    {
        slug: 'email-survey',
        name: 'Email Survey Agent',
        description: 'Sends automated email surveys to past customers to collect feedback and identify new leads.',
        category: 'outreach',
        classRef: index_1.EmailSurveyAgent,
        defaultSchedule: '0 9 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'weather-trigger',
        name: 'Weather Trigger Agent',
        description: 'Monitors weather patterns to predict and trigger leads for weather-related home services.',
        category: 'monitoring',
        classRef: index_1.WeatherTriggerAgent,
        defaultSchedule: '*/15 * * * *',
        defaultEnabled: true,
    },
    {
        slug: 'social-signal',
        name: 'Social Signal Miner',
        description: 'Mines social media platforms for intent signals indicating home service needs.',
        category: 'monitoring',
        classRef: index_1.SocialSignalMiner,
        defaultSchedule: '*/30 * * * *',
        defaultEnabled: true,
    },
    {
        slug: 'gift-card',
        name: 'Gift Card Engine',
        description: 'Manages gift card generation and distribution for lead referrals and completions.',
        category: 'engagement',
        classRef: index_1.GiftCardEngine,
        defaultSchedule: '*/10 * * * *',
        defaultEnabled: true,
    },
    {
        slug: 'sms-alert',
        name: 'SMS Alert Agent',
        description: 'Sends SMS alerts to contractors for high-urgency leads in real-time.',
        category: 'outreach',
        classRef: index_1.SMSAlertAgent,
        defaultSchedule: '*/5 * * * *',
        defaultEnabled: true,
    },
    {
        slug: 'google-ads',
        name: 'Google Ads Agent',
        description: 'Manages Google Ads campaigns targeting high-intent home service keywords.',
        category: 'advertising',
        classRef: index_1.GoogleAdsAgent,
        defaultSchedule: '0 */2 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'facebook-ads',
        name: 'Facebook Ads Agent',
        description: 'Manages Facebook/Instagram ad campaigns for lead generation.',
        category: 'advertising',
        classRef: index_1.FacebookAdsAgent,
        defaultSchedule: '0 */2 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'seo-content',
        name: 'SEO Content Agent',
        description: 'Generates SEO-optimized content to attract organic home service leads.',
        category: 'content',
        classRef: index_1.SEOContentAgent,
        defaultSchedule: '0 8 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'new-mover',
        name: 'New Mover Agent',
        description: 'Identifies new homeowners moving into service areas for targeted outreach.',
        category: 'monitoring',
        classRef: index_1.NewMoverAgent,
        defaultSchedule: '0 7 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'warranty-expiration',
        name: 'Warranty Expiration Agent',
        description: 'Tracks appliance and system warranty expirations to generate timely service leads.',
        category: 'monitoring',
        classRef: index_1.WarrantyExpirationAgent,
        defaultSchedule: '0 6 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'competitor-review',
        name: 'Competitor Review Miner',
        description: 'Mines competitor reviews to identify dissatisfied customers as potential leads.',
        category: 'intelligence',
        classRef: index_1.CompetitorReviewMiner,
        defaultSchedule: '0 */6 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'building-permit',
        name: 'Building Permit Agent',
        description: 'Monitors local building permits to identify upcoming home improvement projects.',
        category: 'intelligence',
        classRef: index_1.BuildingPermitAgent,
        defaultSchedule: '0 */4 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'pricing-intelligence',
        name: 'Pricing Intelligence Agent',
        description: 'Analyzes market pricing data to optimize service rates and competitive positioning.',
        category: 'intelligence',
        classRef: index_1.PricingIntelligenceAgent,
        defaultSchedule: '0 12 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'market-analysis',
        name: 'Market Analysis Agent',
        description: 'Performs comprehensive market analysis to identify trends and opportunities.',
        category: 'intelligence',
        classRef: index_1.MarketAnalysisAgent,
        defaultSchedule: '0 5 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'churn-recovery',
        name: 'Churn Recovery Agent',
        description: 'Identifies and re-engages past customers who have not returned for services.',
        category: 'engagement',
        classRef: index_1.ChurnRecoveryAgent,
        defaultSchedule: '0 10 * * *',
        defaultEnabled: true,
    },
];
exports.AGENT_DEFINITIONS = AGENT_DEFINITIONS;
class AgentRegistry {
    constructor() {
        this.agents = new Map();
        this.definitions = new Map();
        for (const def of AGENT_DEFINITIONS) {
            this.definitions.set(def.slug, def);
        }
    }
    register(agent) {
        this.agents.set(agent.slug, agent);
        console.log(`[AgentRegistry] Registered agent: ${agent.slug}`);
    }
    getAgent(slug) {
        return this.agents.get(slug);
    }
    getAllAgents() {
        return Array.from(this.agents.values());
    }
    getDefinitions() {
        return Array.from(this.definitions.values());
    }
    getDefinition(slug) {
        return this.definitions.get(slug);
    }
    async runAgent(slug, context) {
        const agent = this.agents.get(slug);
        if (!agent) {
            throw new Error(`Agent not found: ${slug}`);
        }
        const definition = this.definitions.get(slug);
        console.log(`[AgentRegistry] Running agent: ${slug} (${definition?.name || 'unknown'})`);
        try {
            const result = await agent.run(context);
            console.log(`[AgentRegistry] Agent ${slug} completed successfully`);
            return result;
        }
        catch (error) {
            console.error(`[AgentRegistry] Agent ${slug} failed:`, error);
            throw error;
        }
    }
    async initializeAgents() {
        console.log('[AgentRegistry] Initializing agents...');
        for (const def of AGENT_DEFINITIONS) {
            try {
                const existing = await Agent_1.Agent.findOne({ slug: def.slug });
                if (!existing) {
                    await Agent_1.Agent.create({
                        slug: def.slug,
                        name: def.name,
                        description: def.description,
                        category: def.category,
                        enabled: def.defaultEnabled,
                        schedule: def.defaultSchedule,
                        config: {},
                        stats: {
                            totalRuns: 0,
                            successfulRuns: 0,
                            failedRuns: 0,
                            leadsGenerated: 0,
                            lastRunAt: null,
                            lastError: null,
                        },
                    });
                    console.log(`[AgentRegistry] Created Agent document: ${def.slug}`);
                }
                else {
                    console.log(`[AgentRegistry] Agent already exists: ${def.slug}`);
                }
                const agentInstance = new def.classRef();
                this.register(agentInstance);
            }
            catch (error) {
                console.error(`[AgentRegistry] Failed to initialize agent ${def.slug}:`, error);
            }
        }
        console.log(`[AgentRegistry] Initialization complete. ${this.agents.size} agents registered.`);
    }
    async getStatsOverview() {
        const agents = await Agent_1.Agent.find();
        const activeAgents = agents.filter((a) => a.enabled);
        const totalRuns = agents.reduce((sum, a) => sum + (a.stats?.totalRuns || 0), 0);
        const totalLeads = agents.reduce((sum, a) => sum + (a.stats?.leadsGenerated || 0), 0);
        const recentErrors = agents.filter((a) => a.stats?.lastError).length;
        const byCategory = {};
        for (const agent of agents) {
            byCategory[agent.category] = (byCategory[agent.category] || 0) + 1;
        }
        return {
            totalAgents: agents.length,
            activeAgents: activeAgents.length,
            totalRuns,
            totalLeads,
            recentErrors,
            byCategory,
        };
    }
}
exports.AgentRegistry = AgentRegistry;
//# sourceMappingURL=AgentRegistry.js.map