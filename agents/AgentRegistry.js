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
        slug: 'social-media-monitor',
        name: 'Social Media Monitor',
        description: 'Monitors Nextdoor, Facebook, Reddit, Twitter for life events and auto-sends personalized offers with gift cards.',
        category: 'monitoring',
        classRef: index_1.SocialMediaMonitorAgent,
        defaultSchedule: '*/20 * * * *',
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
    {
        slug: 'social-media-monitor',
        name: 'Social Media Monitor',
        description: 'Monitors Nextdoor, Facebook, Reddit, Twitter, TikTok, Instagram for life events and auto-sends personalized offers with gift cards.',
        category: 'monitoring',
        classRef: index_1.SocialMediaMonitorAgent,
        defaultSchedule: '*/20 * * * *',
        defaultEnabled: true,
    },
    {
        slug: 'creative-director',
        name: 'Creative Director',
        description: 'Video production strategy brain. Analyzes market signals and decides what video content to create for maximum engagement and lead generation.',
        category: 'video_production',
        classRef: index_1.CreativeDirector,
        defaultSchedule: '0 */6 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'script-writer',
        name: 'Script Writer',
        description: 'Writes scroll-stopping hooks, compelling body copy, and high-converting CTAs for social media videos. Masters TikTok and Instagram voice.',
        category: 'video_production',
        classRef: index_1.ScriptWriter,
        defaultSchedule: '0 */6 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'visual-director',
        name: 'Visual Director',
        description: 'Creates detailed shot lists, storyboards, and AI video generation prompts. Directs the visual language of every video.',
        category: 'video_production',
        classRef: index_1.VisualDirector,
        defaultSchedule: '0 */6 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'video-producer',
        name: 'Video Producer',
        description: 'Generates actual video assets using AI video generation. Produces vertical content for TikTok, Instagram Reels, YouTube Shorts.',
        category: 'video_production',
        classRef: index_1.VideoProducer,
        defaultSchedule: '0 */6 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'video-editor',
        name: 'Video Editor',
        description: 'Post-production agent. Adds captions, visual effects, sound design, transitions, and brand elements to raw video footage.',
        category: 'video_production',
        classRef: index_1.VideoEditor,
        defaultSchedule: '0 */6 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'social-media-manager',
        name: 'Social Media Manager',
        description: 'Packages videos for social media with optimized captions, hashtags, posting schedules, and engagement strategies for each platform.',
        category: 'video_production',
        classRef: index_1.SocialMediaManager,
        defaultSchedule: '0 */6 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'analytics-reviewer',
        name: 'Analytics Reviewer',
        description: 'Reviews video performance metrics, identifies winning patterns, and generates A/B test ideas to continuously improve content performance.',
        category: 'video_production',
        classRef: index_1.AnalyticsReviewer,
        defaultSchedule: '0 9 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'video-pipeline',
        name: 'Video Production Pipeline',
        description: 'Orchestrates all 7 video production agents in sequence from concept to published social media content with performance tracking.',
        category: 'video_production',
        classRef: index_1.VideoProductionPipeline,
        defaultSchedule: '0 */4 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'scheduler',
        name: 'Scheduler Agent',
        description: 'AI-powered scheduling and dispatch automation. Optimizes routes, predicts no-shows, suggests buffers, and fills gaps.',
        category: 'toolbox',
        classRef: index_1.SchedulerAgent,
        defaultSchedule: '0 20 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'estimator',
        name: 'Estimator Agent',
        description: 'AI-powered estimating engine. Generates accurate quotes based on service category, location, property details, and historical data.',
        category: 'toolbox',
        classRef: index_1.EstimatorAgent,
        defaultSchedule: '0 */2 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'invoice-agent',
        name: 'Invoice Agent',
        description: 'AI-powered invoice automation. Auto-generates invoices from completed jobs, sends payment reminders, predicts payment delays, and suggests early-pay discounts.',
        category: 'toolbox',
        classRef: index_1.InvoiceAgent,
        defaultSchedule: '0 9,17 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'crew-manager',
        name: 'Crew Manager',
        description: 'AI-powered crew management. Auto-assigns jobs to crew based on skills, location, and availability. Tracks performance, predicts overtime, and validates timesheets with AI anomaly detection.',
        category: 'toolbox',
        classRef: index_1.CrewManager,
        defaultSchedule: '0 7,15 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'memory-bank',
        name: 'Memory Bank Agent',
        description: 'Builds irreplaceable customer intelligence. Processes every interaction, detects life events, tracks equipment, calculates churn risk, and grows data gravity. The longer a contractor stays, the smarter this agent becomes.',
        category: 'sticky',
        classRef: index_1.MemoryBankAgent,
        defaultSchedule: '0 */6 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'reputation',
        name: 'Reputation Agent',
        description: 'Compounding social proof engine. Auto-requests reviews at perfect moments, builds before/after case studies, tracks review impact, and grows irreplaceable reputation capital across all platforms.',
        category: 'sticky',
        classRef: index_1.ReputationAgent,
        defaultSchedule: '0 10,16 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'territory-intel',
        name: 'Territory Intelligence Agent',
        description: 'Turns zip codes into fortresses. Analyzes every job to build neighborhood intelligence, pricing curves, seasonal patterns, HOA databases, and competitor tracking. The longer you own a zip, the smarter you become.',
        category: 'sticky',
        classRef: index_1.TerritoryIntelAgent,
        defaultSchedule: '0 3 * * 1',
        defaultEnabled: true,
    },
    {
        slug: 'sub-network',
        name: 'Subcontractor Network Agent',
        description: 'Manages your private army of vetted subs. Tracks performance, manages cross-referrals, builds marketplace reputation, and calculates trust scores. Leaving means losing your entire sub network.',
        category: 'sticky',
        classRef: index_1.SubNetworkAgent,
        defaultSchedule: '0 4 * * *',
        defaultEnabled: true,
    },
    {
        slug: 'push-notifications',
        name: 'Push Notification Agent',
        description: 'Smart mobile alerts. Sends job reminders, payment celebrations, churn alerts, and warranty warnings directly to contractor phones. Only actionable notifications - zero spam.',
        category: 'mobile',
        classRef: index_1.PushNotificationAgent,
        defaultSchedule: '*/15 * * * *',
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