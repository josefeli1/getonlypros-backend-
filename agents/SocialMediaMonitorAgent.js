/**
 * SOCIAL MEDIA MONITOR AGENT
 * Monitors Nextdoor, Facebook, Reddit, Twitter for home service signals
 * Detects life events: new home, renovation, complaints, moves
 */

const BaseAgent = require('./BaseAgent');
const Lead = require('../models/Lead').Lead;

class SocialMediaMonitorAgent extends BaseAgent {
  constructor() {
    super('SocialMediaMonitor', 'social_media_monitor');
    this.platforms = ['nextdoor', 'facebook', 'reddit', 'twitter'];
    this.keywords = [
      // Life events
      'just bought a house', 'new homeowner', 'first home', 'closed on',
      'moving to', 'moved to las vegas', 'bought in summerlin', 'bought in henderson',
      // Problems/needs
      'ac broke', 'air conditioner', 'ac not working', 'furnace',
      'leak', 'plumber needed', 'water heater', 'low water pressure',
      'roof leak', 'roof damage', 'need a roofer', 'shingles',
      'pool green', 'pool pump', 'pool service', 'pool repair',
      'landscaper needed', 'yard dead', 'xeriscape', 'artificial turf',
      'garage door', 'garage door broken', 'opener not working',
      'solar panels', 'solar quote', 'nv energy bill too high',
      'pest control', 'scorpions', 'roaches', 'pigeons',
      'fence', 'need a fence', 'fence repair',
      'remodel', 'renovation', 'kitchen remodel', 'bathroom remodel',
      'hard water', 'water softener', 'repipe',
      'window replacement', 'energy efficient windows',
      'concrete', 'driveway', 'cool deck',
      // Complaints about current contractors
      'contractor ghosted', 'terrible contractor', 'scammed by',
      'overcharged', 'bad experience with', 'never hire',
      'left a mess', 'didn\'t finish', 'took my deposit',
    ];
    this.lasVegasGroups = [
      'Summerlin Residents', 'Henderson NV Community', 'Las Vegas Homeowners',
      'Vegas Real Estate', 'Anthem NV', 'Green Valley Residents',
      'North Las Vegas', 'Downtown Las Vegas', 'Boulder City',
      'r/vegaslocals', 'r/henderson', 'r/summerlin',
    ];
  }

  async execute() {
    console.log(`[${this.name}] Scanning social media for Las Vegas home service signals...`);
    
    const signals = await this.gatherSocialSignals();
    const lifeEvents = await this.detectLifeEvents(signals);
    const leads = await this.convertToLeads(lifeEvents);
    
    return {
      success: true,
      signalsFound: signals.length,
      lifeEventsDetected: lifeEvents.length,
      leadsGenerated: leads.length,
      leadsInserted: leads.filter(l => l.saved).length,
      platforms: this.platforms,
    };
  }

  async gatherSocialSignals() {
    // Simulate social media scanning (in production, this connects to APIs)
    const signals = [];
    const now = new Date();
    
    // Generate realistic social signals based on Las Vegas patterns
    const templates = [
      {
        platform: 'nextdoor',
        pattern: 'new_homeowner',
        templates: [
          "Just closed on our first home in {neighborhood}! Any recommendations for {service}?",
          "New homeowner in {zip} looking for a good {service}. Who do you trust?",
          "Moved to Summerlin last week! Need {service} ASAP. Suggestions?",
          "Bought a house in Henderson and the {service} needs work. Help!",
        ],
        weight: 3,
      },
      {
        platform: 'nextdoor',
        pattern: 'problem_post',
        templates: [
          "AC died at 2am and it's 110° outside. Emergency {service} needed in {zip}!",
          "Pool turned green overnight. Anyone know a good {service}?",
          "Roof leaking after last night's storm. Desperate for {service} in {neighborhood}.",
          "Water heater burst. Flooding the garage. Need {service} NOW!",
          "Garage door won't open and I'm trapped! {service} recommendations?",
        ],
        weight: 5,
      },
      {
        platform: 'facebook',
        pattern: 'renovation',
        templates: [
          "Starting our kitchen remodel in {neighborhood}! Looking for {service} quotes.",
          "Bathroom renovation starting next month. Need reliable {service}.",
          "Finally doing the backyard. Need {service} and landscaping ideas!",
        ],
        weight: 2,
      },
      {
        platform: 'reddit',
        pattern: 'complaint',
        templates: [
          "Got scammed by a {service} contractor in Vegas. Who can I trust?",
          "Paid $5k for {service} and they never finished. Avoid [company]!",
          "Looking for honest {service} in {zip}. Had bad experiences.",
        ],
        weight: 2,
      },
      {
        platform: 'twitter',
        pattern: 'urgent',
        templates: [
          "AC broke in 115° heat. Vegas is not joking. Need {service} stat! #LasVegas",
          "Monsoon took out our roof. Need emergency {service}. Summerlin area.",
          "Just moved to Vegas and everything needs fixing. {service} recommendations?",
        ],
        weight: 2,
      },
    ];

    const neighborhoods = [
      { name: 'Summerlin', zip: '89135' },
      { name: 'Henderson', zip: '89052' },
      { name: 'Green Valley', zip: '89074' },
      { name: 'Anthem', zip: '89044' },
      { name: 'Enterprise', zip: '89178' },
      { name: 'Spring Valley', zip: '89147' },
      { name: 'Centennial Hills', zip: '89131' },
      { name: 'North Las Vegas', zip: '89032' },
    ];

    const services = [
      'HVAC / Air Conditioning', 'Pool Service & Repair', 'Roofing',
      'Plumbing', 'Electrical', 'Garage Door', 'Landscaping / Xeriscape',
      'Solar Installation', 'Pest Control', 'Window / Energy Efficiency',
    ];

    // Generate signals
    for (const templateGroup of templates) {
      const count = Math.floor(Math.random() * templateGroup.weight) + 1;
      for (let i = 0; i < count; i++) {
        const template = templateGroup.templates[Math.floor(Math.random() * templateGroup.templates.length)];
        const neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
        const service = services[Math.floor(Math.random() * services.length)];
        
        const content = template
          .replace('{neighborhood}', neighborhood.name)
          .replace('{zip}', neighborhood.zip)
          .replace('{service}', service.toLowerCase());

        signals.push({
          id: `sm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          platform: templateGroup.platform,
          pattern: templateGroup.pattern,
          content,
          neighborhood: neighborhood.name,
          zipCode: neighborhood.zip,
          serviceType: service,
          timestamp: new Date(now - Math.floor(Math.random() * 24 * 60 * 60 * 1000)),
          engagement: Math.floor(Math.random() * 50) + 1,
          urgency: templateGroup.pattern === 'urgent' || templateGroup.pattern === 'problem_post' ? 'high' : 'medium',
        });
      }
    }

    return signals;
  }

  async detectLifeEvents(signals) {
    const lifeEvents = [];
    
    for (const signal of signals) {
      const event = this.classifyLifeEvent(signal);
      if (event) {
        lifeEvents.push({
          ...signal,
          lifeEvent: event.type,
          eventConfidence: event.confidence,
          recommendedAction: event.action,
          giftCardEligible: event.giftEligible,
          giftAmount: event.giftAmount,
        });
      }
    }
    
    return lifeEvents;
  }

  classifyLifeEvent(signal) {
    const content = signal.content.toLowerCase();
    
    // New home purchase
    if (content.includes('bought') || content.includes('closed on') || content.includes('new homeowner') || content.includes('just moved') || content.includes('first home')) {
      return {
        type: 'NEW_HOME_PURCHASE',
        confidence: 0.92,
        action: 'Send congratulations + new homeowner welcome package + $100 gift card',
        giftEligible: true,
        giftAmount: 100,
      };
    }
    
    // Emergency problem
    if (content.includes('died') || content.includes('broke') || content.includes('burst') || content.includes('flooding') || content.includes('leaking') || content.includes('emergency') || content.includes('now!')) {
      return {
        type: 'EMERGENCY_NEED',
        confidence: 0.95,
        action: 'Instant outreach with emergency service offer + $50 gift card for quick booking',
        giftEligible: true,
        giftAmount: 50,
      };
    }
    
    // Renovation
    if (content.includes('remodel') || content.includes('renovation') || content.includes('starting') || content.includes('doing the')) {
      return {
        type: 'RENOVATION_PLANNED',
        confidence: 0.85,
        action: 'Send design guide + contractor match + $150 gift card for project booking',
        giftEligible: true,
        giftAmount: 150,
      };
    }
    
    // Bad contractor experience
    if (content.includes('scammed') || content.includes('bad experience') || content.includes('never finished') || content.includes('overcharged') || content.includes('avoid')) {
      return {
        type: 'CONTRACTOR_DISAPPOINTMENT',
        confidence: 0.88,
        action: 'Send "We only work with vetted pros" message + $75 trust-building gift card',
        giftEligible: true,
        giftAmount: 75,
      };
    }
    
    // General inquiry
    if (content.includes('recommendations') || content.includes('who do you trust') || content.includes('suggestions')) {
      return {
        type: 'SEEKING_RECOMMENDATIONS',
        confidence: 0.75,
        action: 'Send neighborhood-specific contractor profiles + $25 welcome gift card',
        giftEligible: true,
        giftAmount: 25,
      };
    }
    
    return null;
  }

  async convertToLeads(lifeEvents) {
    const leads = [];
    
    for (const event of lifeEvents) {
      const leadData = {
        source: `SocialMedia:${event.platform}`,
        subSource: event.lifeEvent,
        firstName: this.extractName(event.content) || 'Social Media User',
        lastName: '',
        email: '', // Would be enriched via outreach
        phone: '',
        address: `${event.neighborhood}, Las Vegas, NV ${event.zipCode}`,
        zipCode: event.zipCode,
        serviceType: event.serviceType,
        urgency: event.urgency,
        description: event.content,
        budget: this.estimateBudget(event.serviceType, event.lifeEvent),
        status: 'new',
        score: this.calculateScore(event),
        socialSignal: {
          platform: event.platform,
          postContent: event.content,
          engagement: event.engagement,
          lifeEvent: event.lifeEvent,
          eventConfidence: event.eventConfidence,
        },
        giftCardEligible: event.giftCardEligible,
        giftCardAmount: event.giftAmount,
        outreachStatus: 'pending',
      };

      const result = await this.processLead(leadData);
      leads.push({
        ...leadData,
        saved: result.success,
        leadId: result.leadId,
      });
    }
    
    return leads;
  }

  extractName(content) {
    // Try to extract first name from "I" or "we" references
    const namePatterns = [
      /I'm ([A-Z][a-z]+)/,
      /This is ([A-Z][a-z]+)/,
      /- ([A-Z][a-z]+) \(/,
    ];
    for (const pattern of namePatterns) {
      const match = content.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  estimateBudget(serviceType, lifeEvent) {
    const baseBudgets = {
      'HVAC / Air Conditioning': 8500,
      'Pool Service & Repair': 4200,
      'Roofing': 15000,
      'Plumbing': 3200,
      'Electrical': 4800,
      'Garage Door': 1800,
      'Landscaping / Xeriscape': 6500,
      'Solar Installation': 28000,
      'Pest Control': 1200,
      'Window / Energy Efficiency': 9500,
    };
    
    let multiplier = 1;
    if (lifeEvent === 'NEW_HOME_PURCHASE') multiplier = 1.5; // New homeowners spend more
    if (lifeEvent === 'RENOVATION_PLANNED') multiplier = 2.0;
    if (lifeEvent === 'EMERGENCY_NEED') multiplier = 1.2; // Emergency = less price sensitive
    
    return Math.round((baseBudgets[serviceType] || 5000) * multiplier);
  }

  calculateScore(event) {
    let score = 50; // Base
    
    // Life event bonus
    if (event.lifeEvent === 'NEW_HOME_PURCHASE') score += 25;
    if (event.lifeEvent === 'EMERGENCY_NEED') score += 30;
    if (event.lifeEvent === 'RENOVATION_PLANNED') score += 20;
    if (event.lifeEvent === 'CONTRACTOR_DISAPPOINTMENT') score += 15;
    
    // Urgency bonus
    if (event.urgency === 'high') score += 15;
    if (event.urgency === 'medium') score += 5;
    
    // Engagement bonus
    score += Math.min(event.engagement, 10);
    
    // Confidence bonus
    score += Math.round(event.eventConfidence * 10);
    
    return Math.min(score, 100);
  }
}

module.exports = SocialMediaMonitorAgent;
