const BaseAgent = require('./BaseAgent');
const Lead = require('../models/Lead').Lead;
const TerritoryLock = require('../models/TerritoryLock').TerritoryLock;

/**
 * CreativeDirector Agent
 * The strategy brain. Decides WHAT video to make, for WHICH audience,
 * on WHAT platform, using WHAT angle. Like a CMO + creative strategist.
 */
class CreativeDirector extends BaseAgent {
  constructor() {
    super('CreativeDirector', 'creative_director');
    this.strategies = {
      urgency: { weight: 0.25, desc: 'Fear-based, time-sensitive, emergency angles' },
      aspiration: { weight: 0.20, desc: 'Dream home, lifestyle upgrade, social proof' },
      education: { weight: 0.20, desc: 'Teach something valuable, build trust' },
      scarcity: { weight: 0.15, desc: 'Limited spots, exclusive access, FOMO' },
      social_proof: { weight: 0.15, desc: 'Reviews, testimonials, neighbor recommendations' },
      humor: { weight: 0.05, desc: 'Funny, relatable, meme-style content' },
    };
  }

  async execute() {
    console.log(`[${this.name}] Analyzing market signals and creative opportunities...`);
    const marketIntel = await this.gatherMarketIntel();
    const audienceInsights = await this.analyzeAudience();
    const contentPlan = await this.createContentPlan(marketIntel, audienceInsights);
    return {
      success: true,
      contentPlan,
      strategies: this.strategies,
      decisions: contentPlan.map(p => ({
        template: p.templateId,
        platform: p.platform,
        strategy: p.strategy,
        why: p.rationale,
        expectedEngagement: p.expectedEngagement,
      })),
    };
  }

  async gatherMarketIntel() {
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth();
    const day = now.getDay();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    // Real signals from database
    const [emergencyLeads, newHomeLeads, renovationLeads, activeTerritories, weatherAlert] = await Promise.all([
      Lead.countDocuments({ urgency: 'high', createdAt: { $gte: oneDayAgo } }).catch(() => 0),
      Lead.countDocuments({ lifeEvent: 'new_homeowner', createdAt: { $gte: oneDayAgo } }).catch(() => 0),
      Lead.countDocuments({ tags: { $in: ['renovation', 'remodel'] }, createdAt: { $gte: oneDayAgo } }).catch(() => 0),
      TerritoryLock.countDocuments({ status: 'active' }).catch(() => 0),
      this.checkWeatherAlert(),
    ]);

    // Determine season
    const season = month >= 5 && month <= 8 ? 'summer' : month >= 11 || month <= 1 ? 'winter' : 'mild';
    const isWeekend = day === 0 || day === 6;
    const isEvening = hour >= 17;

    return {
      timestamp: now.toISOString(),
      signals: {
        emergencyLeads,
        newHomeLeads,
        renovationLeads,
        activeTerritories,
        weatherAlert,
      },
      context: {
        season,
        isWeekend,
        isEvening,
        hour,
        dayOfWeek: day,
      },
      opportunities: this.identifyOpportunities({ emergencyLeads, newHomeLeads, renovationLeads, weatherAlert, season }),
    };
  }

  async checkWeatherAlert() {
    // Check for extreme weather that triggers emergency content
    const month = new Date().getMonth();
    if (month >= 5 && month <= 8) {
      return { active: true, type: 'extreme_heat', temperature: 110, message: 'Vegas heat wave - AC emergency content needed' };
    }
    if (month >= 6 && month <= 9) {
      return { active: true, type: 'monsoon', message: 'Monsoon season - roof/leak emergency content needed' };
    }
    return { active: false };
  }

  identifyOpportunities(signals) {
    const ops = [];
    if (signals.emergencyLeads >= 3) {
      ops.push({ type: 'emergency_spike', priority: 'critical', message: `${signals.emergencyLeads} emergency leads in 24h - create urgency content` });
    }
    if (signals.newHomeLeads >= 2) {
      ops.push({ type: 'new_homeowner_wave', priority: 'high', message: 'New homeowners detected - create welcome content' });
    }
    if (signals.weatherAlert.active) {
      ops.push({ type: 'weather_trigger', priority: 'high', message: `Weather alert: ${signals.weatherAlert.type} - create timely content` });
    }
    if (signals.activeTerritories < 5) {
      ops.push({ type: 'territory_scarcity', priority: 'medium', message: 'Few locked territories - create scarcity content for contractors' });
    }
    return ops;
  }

  async analyzeAudience() {
    return {
      primary: {
        segment: 'las_vegas_homeowners',
        age: '30-55',
        income: '75k-150k',
        painPoints: ['AC failing in 110F heat', 'Finding trusted contractors', 'Avoiding scams'],
        platforms: { tiktok: 0.35, instagram: 0.30, facebook: 0.20, youtube: 0.15 },
      },
      secondary: {
        segment: 'new_homeowners',
        age: '28-40',
        platforms: { tiktok: 0.45, instagram: 0.35, facebook: 0.15, youtube: 0.05 },
      },
      contractor: {
        segment: 'service_contractors',
        platforms: { facebook: 0.40, youtube: 0.30, instagram: 0.20, tiktok: 0.10 },
      },
    };
  }

  async createContentPlan(marketIntel, audience) {
    const plan = [];
    const { signals, context } = marketIntel;

    // Priority 1: Emergency content if needed
    if (signals.emergencyLeads >= 3 || signals.weatherAlert.active) {
      plan.push({
        templateId: 'emergency-service',
        platform: 'tiktok',
        strategy: 'urgency',
        rationale: `High emergency lead volume (${signals.emergencyLeads}) demands immediate attention-grabbing content`,
        expectedEngagement: 'very_high',
        urgency: 'now',
        targetAudience: 'primary',
      });
    }

    // Priority 2: New homeowner welcome
    if (signals.newHomeLeads >= 2) {
      plan.push({
        templateId: 'new-homeowner-welcome',
        platform: 'instagram',
        strategy: 'aspiration',
        rationale: 'New homeowners are in discovery mode - perfect time to introduce GetOnlyPros',
        expectedEngagement: 'high',
        urgency: 'today',
        targetAudience: 'secondary',
      });
    }

    // Priority 3: Territory scarcity (contractor-focused)
    if (signals.activeTerritories < 10) {
      plan.push({
        templateId: 'territory-scarcity',
        platform: 'facebook',
        strategy: 'scarcity',
        rationale: 'Low territory lock-in creates FOMO for contractors',
        expectedEngagement: 'medium',
        urgency: 'this_week',
        targetAudience: 'contractor',
      });
    }

    // Priority 4: Seasonal content
    if (context.season === 'summer') {
      plan.push({
        templateId: 'vegas-heat-warning',
        platform: 'tiktok',
        strategy: 'education',
        rationale: 'Summer heat is universal Vegas experience - educational content performs well',
        expectedEngagement: 'high',
        urgency: 'today',
        targetAudience: 'primary',
      });
    }

    // Priority 5: Social proof (always works)
    plan.push({
      templateId: 'customer-testimonial',
      platform: 'instagram',
      strategy: 'social_proof',
      rationale: 'Social proof is evergreen - build trust continuously',
      expectedEngagement: 'medium',
      urgency: 'this_week',
      targetAudience: 'primary',
    });

    // Priority 6: Contractor spotlight
    plan.push({
      templateId: 'contractor-spotlight',
      platform: 'youtube',
      strategy: 'social_proof',
      rationale: 'Deep-dive contractor stories build long-term brand trust',
      expectedEngagement: 'medium',
      urgency: 'this_week',
      targetAudience: 'primary',
    });

    return plan;
  }

  async generateVideoBrief(contentPlanItem) {
    const { templateId, platform, strategy, targetAudience } = contentPlanItem;
    const audience = await this.analyzeAudience();
    const target = audience[targetAudience] || audience.primary;

    return {
      concept: templateId,
      platform,
      strategy,
      targetAudience: target,
      keyMessage: this.getKeyMessage(templateId, strategy),
      tone: this.getToneForStrategy(strategy),
      duration: this.getDurationForPlatform(platform),
      lasVegasElements: ['desert landscape', 'palm trees', 'red rock', 'summer heat', 'Las Vegas skyline'],
      callToAction: this.getCTAForTemplate(templateId),
      hooks: this.getHookOptions(templateId, strategy),
      hashtags: this.getHashtagsForPlatform(platform),
    };
  }

  getKeyMessage(templateId, strategy) {
    const messages = {
      'emergency-service': 'When your AC dies at 2am in 110F Vegas heat, we have the ONLY pro you need',
      'new-homeowner-welcome': 'Welcome to Vegas! Here is your $100 gift and the only contractor list you will ever need',
      'territory-scarcity': 'Only 1 contractor per zip code. Lock yours before your competitor does',
      'vegas-heat-warning': 'Your AC is working 3x harder this summer. Here is what happens if you ignore it',
      'customer-testimonial': 'Real Vegas homeowner. Real emergency. Real result.',
      'contractor-spotlight': 'Meet the most trusted AC pro in Summerlin - 847 5-star reviews',
    };
    return messages[templateId] || 'GetOnlyPros - trusted home services in Las Vegas';
  }

  getToneForStrategy(strategy) {
    const tones = {
      urgency: 'Urgent, alarming, action-oriented. Short punchy sentences. Use numbers and time pressure.',
      aspiration: 'Inspiring, warm, dream-building. Show the lifestyle. Use golden hour visuals.',
      education: 'Helpful, authoritative, clear. Teach something valuable. Use before/after visuals.',
      scarcity: 'Exclusive, limited, FOMO-driven. Countdown timers. Only X spots left.',
      social_proof: 'Authentic, relatable, trustworthy. Real people. Real stories. Real results.',
      humor: 'Funny, relatable, meme-aware. Self-deprecating. Vegas-specific jokes.',
    };
    return tones[strategy] || tones.social_proof;
  }

  getDurationForPlatform(platform) {
    const durations = { tiktok: 15, instagram: 30, youtube: 45, facebook: 30 };
    return durations[platform] || 15;
  }

  getCTAForTemplate(templateId) {
    const ctas = {
      'emergency-service': 'Save this post. When your AC dies, you will know exactly who to call.',
      'new-homeowner-welcome': 'Comment WELCOME and we will DM you your $100 gift card + checklist',
      'territory-scarcity': 'Contractors: DM us CLAIM + your zip to lock your territory now',
      'vegas-heat-warning': 'Book your free pre-summer AC check at link in bio. Zero obligation.',
      'customer-testimonial': 'Link in bio to meet the only vetted pros in your zip code',
      'contractor-spotlight': 'Book David directly through link in bio. Summerlin 89135 only.',
    };
    return ctas[templateId] || 'Link in bio for trusted Vegas contractors';
  }

  getHookOptions(templateId, strategy) {
    const hooks = {
      'emergency-service': [
        'Your AC is DYING and you do not even know it...',
        '2am. 110 degrees. My AC just died. Then THIS happened...',
        'Vegas homeowners: this mistake costs $8,500 every summer',
      ],
      'new-homeowner-welcome': [
        'Just bought a house in Vegas? Here is what nobody tells you...',
        'Welcome to the neighborhood! Here is $100 + the only contractor list you need',
        'New homeowner? Avoid these 3 scams in your first 90 days',
      ],
      'territory-scarcity': [
        'Only 1 spot left in 89135...',
        'Your competitor just locked 3 zip codes. Here is how to catch up',
        'We only work with ONE contractor per area. Is it you?',
      ],
    };
    return hooks[templateId] || ['Wait for it...', 'You need to see this', 'Vegas homeowners, STOP scrolling'];
  }

  getHashtagsForPlatform(platform) {
    const base = ['#GetOnlyPros', '#LasVegas', '#VegasLocal'];
    const platformTags = {
      tiktok: ['#FYP', '#ForYou', '#VegasTikTok', '#HomeTok'],
      instagram: ['#Reels', '#VegasLife', '#HomeImprovement', '#LasVegasHomes'],
      youtube: ['#Shorts', '#VegasShorts', '#HomeTips'],
      facebook: ['#VegasCommunity', '#LocalBusiness', '#VegasHomes'],
    };
    return [...base, ...(platformTags[platform] || [])];
  }
}

module.exports = CreativeDirector;
