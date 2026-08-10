"use strict";
/**
 * GetOnlyPros Database Seeder
 * Run this after first deployment to initialize agents and demo data
 *
 * Usage: node dist/seed.js
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();

// Agent definitions matching AgentRegistry
const AGENT_DEFINITIONS = [
    {
        slug: 'email-survey',
        name: 'Email Survey Agent',
        description: 'Sends automated email surveys to past customers to collect feedback and identify new leads. Gift card incentives drive 40%+ response rates.',
        category: 'outreach',
        schedule: '0 9 * * *',
        enabled: true,
        config: { surveyTemplate: 'home_services_v1', giftCardAmount: 10, followUpDelay: 72 }
    },
    {
        slug: 'weather-trigger',
        name: 'Weather Trigger Agent',
        description: 'Monitors NOAA weather data for storms, hail, floods, and extreme temperatures. Automatically triggers geo-targeted campaigns for affected homeowners.',
        category: 'monitoring',
        schedule: '*/15 * * * *',
        enabled: true,
        config: { alertRadius: 25, minSeverity: 'moderate', autoLaunch: true }
    },
    {
        slug: 'social-signal',
        name: 'Social Signal Miner',
        description: 'Mines Reddit, Nextdoor, and Facebook groups for home service intent signals like "recommend a plumber" or "AC broke".',
        category: 'monitoring',
        schedule: '*/30 * * * *',
        enabled: true,
        config: { platforms: ['reddit', 'nextdoor'], keywords: ['recommend', 'broke', 'repair', 'estimate', 'quote'], minScore: 0.7 }
    },
    {
        slug: 'gift-card',
        name: 'Gift Card Engine',
        description: 'Manages digital gift card generation and distribution. Integrates with Tango Card for instant email delivery of $75-150 rewards.',
        category: 'engagement',
        schedule: '*/10 * * * *',
        enabled: true,
        config: { provider: 'tango_card', denominations: [75, 100, 125, 150], expiryDays: 90 }
    },
    {
        slug: 'sms-alert',
        name: 'SMS Alert Agent',
        description: 'Sends instant SMS notifications to contractors for high-score leads (80+) via Twilio. 98% open rate vs 22% for email.',
        category: 'outreach',
        schedule: '*/5 * * * *',
        enabled: true,
        config: { provider: 'twilio', minLeadScore: 80, maxPerHour: 10 }
    },
    {
        slug: 'google-ads',
        name: 'Google Ads Agent',
        description: 'Manages Google Ads campaigns targeting high-intent keywords like "emergency plumber near me". Tracks CPC, CTR, and lead quality.',
        category: 'advertising',
        schedule: '0 */2 * * *',
        enabled: false,
        config: { campaignId: null, targetCpa: 45, minQualityScore: 7 }
    },
    {
        slug: 'facebook-ads',
        name: 'Facebook Ads Agent',
        description: 'Manages Meta Lead Ads campaigns targeting homeowners by interests, behaviors, and lookalike audiences.',
        category: 'advertising',
        schedule: '0 */2 * * *',
        enabled: false,
        config: { campaignId: null, targetCpa: 35, audienceType: 'homeowners' }
    },
    {
        slug: 'seo-content',
        name: 'SEO Content Agent',
        description: 'Tracks organic search traffic and lead conversions. Identifies top-performing content and keyword opportunities.',
        category: 'marketing',
        schedule: '0 8 * * *',
        enabled: true,
        config: { trackKeywords: true, minPosition: 20, contentTypes: ['blog', 'guide', 'comparison'] }
    },
    {
        slug: 'new-mover',
        name: 'New Mover Agent',
        description: 'Identifies new homeowners within 30 days of move-in. New movers spend 3x more on home services in their first year.',
        category: 'outreach',
        schedule: '0 7 * * *',
        enabled: true,
        config: { moveInWindow: 30, targetServices: ['hvac', 'plumbing', 'electrical', 'roofing'], offerType: 'welcome_discount' }
    },
    {
        slug: 'warranty-expiration',
        name: 'Warranty Expiration Agent',
        description: 'Tracks appliance and system warranties. Contacts homeowners 60 days before expiration with preventive service offers.',
        category: 'outreach',
        schedule: '0 6 * * *',
        enabled: true,
        config: { warningDays: 60, targetSystems: ['hvac', 'water_heater', 'roof', 'appliances'] }
    },
    {
        slug: 'competitor-review',
        name: 'Competitor Review Miner',
        description: 'Mines 1-2 star reviews on competitors from Google, Yelp, BBB. Identifies frustrated customers ready to switch.',
        category: 'intelligence',
        schedule: '0 */6 * * *',
        enabled: true,
        config: { platforms: ['google', 'yelp', 'bbb'], maxStars: 2, minReviewAge: 7, autoRespond: true }
    },
    {
        slug: 'building-permit',
        name: 'Building Permit Agent',
        description: 'Scrapes city building permit databases to identify homeowners starting renovation projects. Permits = guaranteed jobs.',
        category: 'intelligence',
        schedule: '0 */4 * * *',
        enabled: true,
        config: { permitTypes: ['renovation', 'addition', 'roofing', 'hvac'], lookbackDays: 7 }
    },
    {
        slug: 'pricing-intelligence',
        name: 'Pricing Intelligence Agent',
        description: 'Analyzes market pricing gaps. Identifies zip codes where contractors are overcharging, creating opportunities for competitive pricing.',
        category: 'intelligence',
        schedule: '0 12 * * *',
        enabled: true,
        config: { priceVariance: 0.15, minSampleSize: 5, alertThreshold: 'high' }
    },
    {
        slug: 'market-analysis',
        name: 'Market Analysis Agent',
        description: 'Predicts demand surges using seasonality, weather, and economic indicators. Proactively positions contractors before demand spikes.',
        category: 'intelligence',
        schedule: '0 5 * * *',
        enabled: true,
        config: { predictionWindow: 14, indicators: ['seasonality', 'weather', 'permits', 'search_trends'] }
    },
    {
        slug: 'churn-recovery',
        name: 'Churn Recovery Agent',
        description: 'Re-engages past leads that went cold with targeted offers. Recovers 15-20% of lost leads at 1/10th the cost of new acquisition.',
        category: 'engagement',
        schedule: '0 10 * * *',
        enabled: true,
        config: { churnThreshold: 30, maxAttempts: 3, offerDiscount: 0.1 }
    }
];

async function seed() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error('ERROR: MONGODB_URI environment variable is required');
            console.error('Set it with: export MONGODB_URI="mongodb+srv://..."');
            process.exit(1);
        }

        console.log('\n╔══════════════════════════════════════════════════════════╗');
        console.log('║     GetOnlyPros Database Seeder v2.0                     ║');
        console.log('╚══════════════════════════════════════════════════════════╝\n');

        await mongoose_1.default.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Import Agent model
        const { Agent } = require('./models/Agent');

        // Seed agents
        console.log('\n--- Seeding 15 Lead Generation Agents ---\n');
        let created = 0;
        let updated = 0;

        for (const def of AGENT_DEFINITIONS) {
            const existing = await Agent.findOne({ slug: def.slug });
            if (existing) {
                await Agent.updateOne({ slug: def.slug }, {
                    $set: {
                        name: def.name,
                        description: def.description,
                        category: def.category,
                        schedule: def.schedule,
                        config: def.config,
                    }
                });
                console.log(`  Updated: ${def.name}`);
                updated++;
            } else {
                await Agent.create({
                    slug: def.slug,
                    name: def.name,
                    description: def.description,
                    category: def.category,
                    enabled: def.enabled,
                    schedule: def.schedule,
                    config: def.config,
                    stats: {
                        totalRuns: 0,
                        totalLeadsFound: 0,
                        totalLeadsInserted: 0,
                        avgExecutionTimeMs: 0,
                        lastRunAt: null,
                    }
                });
                console.log(`  Created: ${def.name}`);
                created++;
            }
        }

        console.log(`\n--- Results ---`);
        console.log(`  Created: ${created}`);
        console.log(`  Updated: ${updated}`);
        console.log(`  Total:   ${AGENT_DEFINITIONS.length}`);

        // Summary
        const allAgents = await Agent.find().sort({ category: 1 });
        console.log('\n--- Agent Inventory ---\n');
        const byCategory = {};
        for (const a of allAgents) {
            if (!byCategory[a.category]) byCategory[a.category] = [];
            byCategory[a.category].push(a);
        }
        for (const [cat, agents] of Object.entries(byCategory)) {
            console.log(`  ${cat.toUpperCase()}:`);
            for (const a of agents) {
                const status = a.enabled ? 'ON' : 'OFF';
                console.log(`    [${status}] ${a.name} (${a.schedule})`);
            }
        }

        console.log('\n--- Next Steps ---');
        console.log('1. Your 15 agents are now configured in MongoDB');
        console.log('2. Start the server: node dist/server.js');
        console.log('3. Agents will auto-start based on their schedules');
        console.log('4. Check status: GET /api/agents');
        console.log('5. Trigger manually: POST /api/agents/{slug}/trigger');
        console.log('\nSeeding complete!');

        await mongoose_1.default.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('\nSeed failed:', error.message);
        process.exit(1);
    }
}

seed();
