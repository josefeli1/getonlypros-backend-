/**
 * SOCIAL LEADS API
 * Manage social media leads, webhooks, and enrichment
 */

const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const Lead = require('../models/Lead').Lead;

// POST /api/social/webhook - Receive social media webhook
router.post('/webhook', async (req, res) => {
  try {
    const { platform, content, author, url, postedAt, engagement, hashtags, location } = req.body;
    
    // Validate webhook payload
    if (!platform || !content) {
      return res.status(400).json({ success: false, message: 'platform and content required' });
    }
    
    // Detect life event from content
    const lifeEvent = detectLifeEventFromContent(content);
    
    // Extract location info
    const zipCode = extractZipCode(content, location);
    const neighborhood = extractNeighborhood(content, location);
    const serviceType = detectServiceType(content);
    
    // Create social lead
    const leadData = {
      source: `SocialMedia:${platform}`,
      subSource: lifeEvent?.type || 'SOCIAL_MENTION',
      firstName: author?.name?.split(' ')[0] || 'Social User',
      lastName: author?.name?.split(' ').slice(1).join(' ') || '',
      email: author?.email || '',
      phone: author?.phone || '',
      address: location?.address || `${neighborhood}, Las Vegas, NV`,
      zipCode: zipCode || '89135',
      serviceType: serviceType || 'General Contractor',
      urgency: lifeEvent?.urgency || 'medium',
      description: content,
      budget: estimateBudget(serviceType, lifeEvent?.type),
      status: 'new',
      score: calculateSocialScore(content, engagement, lifeEvent),
      socialSignal: {
        platform,
        postUrl: url,
        postContent: content,
        author: author?.name || 'Unknown',
        authorHandle: author?.handle || '',
        postedAt: postedAt || new Date(),
        engagement: engagement || { likes: 0, comments: 0, shares: 0 },
        hashtags: hashtags || [],
        location: location || {},
        lifeEvent: lifeEvent?.type || null,
        eventConfidence: lifeEvent?.confidence || 0.5,
      },
      giftCardEligible: !!lifeEvent,
      giftCardAmount: lifeEvent?.giftAmount || 0,
      outreachStatus: 'pending',
      createdAt: new Date(),
    };
    
    // Check for duplicates
    const existing = await Lead.findOne({
      'socialSignal.postUrl': url,
    });
    
    if (existing) {
      return res.json({
        success: true,
        message: 'Duplicate social signal ignored',
        leadId: existing._id.toString(),
        duplicate: true,
      });
    }
    
    const lead = new Lead(leadData);
    await lead.save();
    
    // Auto-trigger outreach for high-confidence life events
    if (lifeEvent && lifeEvent.confidence > 0.85) {
      // In production, this would queue an outreach job
      lead.outreachStatus = 'queued';
      await lead.save();
    }
    
    res.json({
      success: true,
      message: 'Social lead captured',
      leadId: lead._id.toString(),
      lifeEvent: lifeEvent?.type || null,
      giftCardAmount: lead.giftCardAmount,
      autoOutreachQueued: lifeEvent?.confidence > 0.85,
    });
  } catch (error) {
    console.error('[Social Webhook] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/social/leads - List social media leads
router.get('/leads', requireAuth, async (req, res) => {
  try {
    const { platform, lifeEvent, minScore, limit = 50, page = 1 } = req.query;
    
    const query = { source: { $regex: '^SocialMedia' } };
    if (platform) query['socialSignal.platform'] = platform;
    if (lifeEvent) query['socialSignal.lifeEvent'] = lifeEvent;
    if (minScore) query.score = { $gte: parseInt(minScore) };
    
    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Lead.countDocuments(query);
    
    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      leads: leads.map(l => ({
        id: l._id.toString(),
        platform: l.socialSignal?.platform,
        lifeEvent: l.socialSignal?.lifeEvent,
        content: l.description?.substring(0, 200),
        author: l.socialSignal?.author,
        zipCode: l.zipCode,
        serviceType: l.serviceType,
        score: l.score,
        giftCardAmount: l.giftCardAmount,
        outreachStatus: l.outreachStatus,
        createdAt: l.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/social/feeds - Active social feeds being monitored
router.get('/feeds', async (req, res) => {
  try {
    const feeds = [
      {
        platform: 'nextdoor',
        groups: ['Summerlin Residents', 'Henderson NV Community', 'Las Vegas Homeowners', 'Anthem NV', 'Green Valley Residents'],
        keywords: 45,
        status: 'active',
        lastScan: new Date(),
      },
      {
        platform: 'facebook',
        groups: ['Las Vegas Real Estate', 'Vegas Home Improvement', 'Henderson Moms', 'Summerlin Neighbors'],
        keywords: 32,
        status: 'active',
        lastScan: new Date(),
      },
      {
        platform: 'reddit',
        subreddits: ['r/vegaslocals', 'r/henderson', 'r/summerlin', 'r/homeimprovement'],
        keywords: 28,
        status: 'active',
        lastScan: new Date(),
      },
      {
        platform: 'twitter',
        hashtags: ['#LasVegas', '#VegasHome', '#Summerlin', '#Henderson', '#VegasHeat'],
        keywords: 20,
        status: 'active',
        lastScan: new Date(),
      },
      {
        platform: 'tiktok',
        hashtags: ['#vegaslocal', '#vegaslife', '#lasvegashomes', '#summerlinliving', '#hendersonnv', '#vegashomeimprovement', '#vegaspool', '#vegassolar', '#vegashvac', '#vegasroofing', '#vegasrealestate'],
        keywords: 35,
        status: 'active',
        lastScan: new Date(),
      },
      {
        platform: 'instagram',
        hashtags: ['#vegaslocal', '#vegaslife', '#lasvegashomes', '#summerlinliving', '#hendersonnv', '#vegashomeimprovement', '#vegaspool', '#vegassolar', '#vegashvac', '#vegasroofing', '#vegasrealestate'],
        keywords: 32,
        status: 'active',
        lastScan: new Date(),
      },
    ];
    
    res.json({
      success: true,
      feeds,
      totalKeywordsMonitored: feeds.reduce((a, f) => a + f.keywords, 0),
      totalGroupsMonitored: feeds.reduce((a, f) => a + (f.groups?.length || f.subreddits?.length || f.hashtags?.length || 0), 0),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/social/stats - Social lead stats
router.get('/stats', async (req, res) => {
  try {
    const totalSocialLeads = await Lead.countDocuments({ source: { $regex: '^SocialMedia' } });
    const byPlatform = await Lead.aggregate([
      { $match: { source: { $regex: '^SocialMedia' } } },
      { $group: { _id: '$socialSignal.platform', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    
    const byLifeEvent = await Lead.aggregate([
      { $match: { source: { $regex: '^SocialMedia' }, 'socialSignal.lifeEvent': { $exists: true } } },
      { $group: { _id: '$socialSignal.lifeEvent', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    
    const giftCardsIssued = await Lead.aggregate([
      { $match: { source: { $regex: '^SocialMedia' }, giftCardEligible: true } },
      { $group: { _id: null, total: { $sum: '$giftCardAmount' } } },
    ]);
    
    res.json({
      success: true,
      stats: {
        totalSocialLeads,
        byPlatform,
        byLifeEvent,
        totalGiftCardsIssued: giftCardsIssued.length > 0 ? giftCardsIssued[0].total : 0,
        avgScore: await Lead.aggregate([
          { $match: { source: { $regex: '^SocialMedia' } } },
          { $group: { _id: null, avg: { $avg: '$score' } } },
        ]).then(r => r.length > 0 ? Math.round(r[0].avg) : 0),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper functions
function detectLifeEventFromContent(content) {
  const lower = content.toLowerCase();
  
  if (lower.includes('just bought') || lower.includes('closed on') || lower.includes('new homeowner') || lower.includes('first home') || lower.includes('moved to') || lower.includes('bought a house') || lower.includes('new keys') || lower.includes('new house') || lower.includes('house tour') || lower.includes('move-in') || lower.includes('move in')) {
    return { type: 'NEW_HOME_PURCHASE', confidence: 0.92, urgency: 'medium', giftAmount: 100 };
  }
  
  if (lower.includes('broke') || lower.includes('died') || lower.includes('burst') || lower.includes('flooding') || lower.includes('leaking') || lower.includes('emergency') || lower.includes('now!') || lower.includes('stat') || lower.includes('asap') || lower.includes('send help') || lower.includes('done for')) {
    return { type: 'EMERGENCY_NEED', confidence: 0.95, urgency: 'high', giftAmount: 50 };
  }
  
  if (lower.includes('remodel') || lower.includes('renovation') || lower.includes('starting') || lower.includes('project') || lower.includes('makeover') || lower.includes('transformation') || lower.includes('before and after') || lower.includes('before vs after')) {
    return { type: 'RENOVATION_PLANNED', confidence: 0.85, urgency: 'low', giftAmount: 150 };
  }
  
  if (lower.includes('scammed') || lower.includes('bad experience') || lower.includes('never finished') || lower.includes('overcharged') || lower.includes('avoid') || lower.includes('terrible') || lower.includes('ghosted') || lower.includes('psa')) {
    return { type: 'CONTRACTOR_DISAPPOINTMENT', confidence: 0.88, urgency: 'medium', giftAmount: 75 };
  }
  
  if (lower.includes('recommendations') || lower.includes('who do you trust') || lower.includes('suggestions') || lower.includes('looking for') || lower.includes('send me') || lower.includes('portfolio')) {
    return { type: 'SEEKING_RECOMMENDATIONS', confidence: 0.75, urgency: 'low', giftAmount: 25 };
  }
  
  return null;
}

function extractZipCode(content, location) {
  if (location?.zipCode) return location.zipCode;
  const match = content.match(/89\d{3}/);
  return match ? match[0] : '89135';
}

function extractNeighborhood(content, location) {
  if (location?.neighborhood) return location.neighborhood;
  const neighborhoods = ['Summerlin', 'Henderson', 'Green Valley', 'Anthem', 'Enterprise', 'Spring Valley', 'Centennial Hills', 'North Las Vegas', 'Downtown', 'Boulder City'];
  for (const n of neighborhoods) {
    if (content.includes(n)) return n;
  }
  return 'Las Vegas';
}

function detectServiceType(content) {
  const lower = content.toLowerCase();
  const services = [
    { keywords: ['ac', 'air condition', 'hvac', 'furnace', 'cooling'], service: 'HVAC / Air Conditioning' },
    { keywords: ['pool', 'swimming'], service: 'Pool Service & Repair' },
    { keywords: ['roof', 'shingle', 'leak'], service: 'Roofing' },
    { keywords: ['plumb', 'pipe', 'water heater', 'leak'], service: 'Plumbing' },
    { keywords: ['electric', 'wiring', 'outlet'], service: 'Electrical' },
    { keywords: ['garage door', 'opener'], service: 'Garage Door' },
    { keywords: ['landscape', 'yard', 'xeriscape', 'turf'], service: 'Landscaping / Xeriscape' },
    { keywords: ['solar', 'panel', 'nv energy'], service: 'Solar Installation' },
    { keywords: ['pest', 'scorpion', 'roach', 'termite'], service: 'Pest Control' },
    { keywords: ['window', 'energy efficiency'], service: 'Window / Energy Efficiency' },
    { keywords: ['kitchen', 'bathroom', 'remodel'], service: 'Kitchen Remodel' },
    { keywords: ['fence'], service: 'Fence Installation' },
  ];
  
  for (const s of services) {
    if (s.keywords.some(k => lower.includes(k))) return s.service;
  }
  return 'General Contractor';
}

function estimateBudget(serviceType, lifeEvent) {
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
    'Kitchen Remodel': 25000,
    'Fence Installation': 4500,
  };
  
  let multiplier = 1;
  if (lifeEvent === 'NEW_HOME_PURCHASE') multiplier = 1.5;
  if (lifeEvent === 'RENOVATION_PLANNED') multiplier = 2.0;
  if (lifeEvent === 'EMERGENCY_NEED') multiplier = 1.2;
  
  return Math.round((baseBudgets[serviceType] || 5000) * multiplier);
}

function calculateSocialScore(content, engagement, lifeEvent) {
  let score = 40; // Base for social leads
  
  if (lifeEvent) {
    score += 20;
    if (lifeEvent.type === 'EMERGENCY_NEED') score += 25;
    if (lifeEvent.type === 'NEW_HOME_PURCHASE') score += 20;
    if (lifeEvent.type === 'RENOVATION_PLANNED') score += 15;
  }
  
  if (engagement) {
    score += Math.min((engagement.likes || 0) + (engagement.comments || 0) * 2 + (engagement.shares || 0) * 3, 15);
  }
  
  // Keywords indicating urgency
  const urgencyWords = ['asap', 'now', 'emergency', 'urgent', 'desperate', 'need help', 'broken'];
  if (urgencyWords.some(w => content.toLowerCase().includes(w))) score += 10;
  
  return Math.min(score, 100);
}

module.exports = router;
