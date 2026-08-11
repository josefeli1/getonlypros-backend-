/**
 * VIDEO STUDIO API
 * Create, manage, and schedule social media video content
 * Generates videos for TikTok, Instagram Reels, YouTube Shorts, Facebook
 */

const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Video project queue (in-memory, would be MongoDB in production)
let videoProjects = [];
let videoTemplates = [];

// Initialize default templates
function initTemplates() {
  videoTemplates = [
    {
      id: 'contractor-spotlight',
      name: 'Contractor Spotlight',
      description: 'Feature a contractor with their best work, ratings, and unique value proposition',
      platforms: ['tiktok', 'instagram', 'youtube', 'facebook'],
      duration: 15,
      ratio: '9:16',
      scenes: 3,
      hook: 'Meet the ONLY [service] contractor trusted in [zipCode]...',
      scriptTemplate: 'contractor_spotlight_script',
      style: 'fast-paced, text overlays, upbeat music',
      soundEffect: 'upbeat-energetic',
    },
    {
      id: 'new-homeowner-welcome',
      name: 'New Homeowner Welcome',
      description: 'Congratulate new homeowners with special offer and local tips',
      platforms: ['tiktok', 'instagram'],
      duration: 12,
      ratio: '9:16',
      scenes: 4,
      hook: 'Just bought a home in [neighborhood]? Stop everything...',
      scriptTemplate: 'new_homeowner_script',
      style: 'trending audio, fast cuts, emoji text overlays',
      soundEffect: 'trending-pop',
    },
    {
      id: 'emergency-service',
      name: 'Emergency Service Promo',
      description: 'Urgent call-to-action for emergency home services in Vegas heat',
      platforms: ['tiktok', 'instagram', 'facebook'],
      duration: 10,
      ratio: '9:16',
      scenes: 3,
      hook: 'Your AC died at 2am in 115 degrees. Heres what to do...',
      scriptTemplate: 'emergency_script',
      style: 'urgent, red overlays, fast-paced countdown',
      soundEffect: 'tense-dramatic',
    },
    {
      id: 'before-after-transformation',
      name: 'Before & After Transformation',
      description: 'Dramatic home transformation video showing contractor work',
      platforms: ['tiktok', 'instagram', 'youtube'],
      duration: 15,
      ratio: '9:16',
      scenes: 2,
      hook: 'This [service] transformation in [neighborhood] is INSANE...',
      scriptTemplate: 'transformation_script',
      style: 'dramatic reveal, swipe transition, wow factor',
      soundEffect: 'buildup-suspense',
    },
    {
      id: 'vegas-heat-warning',
      name: 'Vegas Heat Warning',
      description: 'Educational content about Vegas heat impact on home systems',
      platforms: ['tiktok', 'instagram', 'facebook'],
      duration: 15,
      ratio: '9:16',
      scenes: 5,
      hook: 'Your AC is DYING and you dont even know it...',
      scriptTemplate: 'heat_warning_script',
      style: 'educational, scary stats, green/red color coding',
      soundEffect: 'alert-warning',
    },
    {
      id: 'contractor-tip',
      name: 'Contractor Pro Tip',
      description: 'Quick 15-second expert tip from a contractor',
      platforms: ['tiktok', 'instagram', 'youtube'],
      duration: 15,
      ratio: '9:16',
      scenes: 2,
      hook: 'Vegas homeowners: do THIS before summer hits...',
      scriptTemplate: 'pro_tip_script',
      style: 'talking head style, text callouts, expert authority',
      soundEffect: 'professional-informative',
    },
    {
      id: 'lead-gen-offer',
      name: 'Lead Generation Offer',
      description: 'Direct CTA video offering free quotes or gift cards',
      platforms: ['tiktok', 'instagram', 'facebook', 'youtube'],
      duration: 12,
      ratio: '9:16',
      scenes: 3,
      hook: 'Free $[amount] gift card for [service] in [zipCode]...',
      scriptTemplate: 'lead_gen_script',
      style: 'offer-focused, countdown timer, scarcity messaging',
      soundEffect: 'exciting-offer',
    },
    {
      id: 'customer-testimonial',
      name: 'Customer Testimonial',
      description: 'Happy customer sharing their experience with a contractor',
      platforms: ['tiktok', 'instagram', 'facebook'],
      duration: 15,
      ratio: '9:16',
      scenes: 2,
      hook: 'I almost got scammed by a Vegas contractor. Then I found...',
      scriptTemplate: 'testimonial_script',
      style: 'authentic, story-driven, emotional hook',
      soundEffect: 'warm-inspiring',
    },
    {
      id: 'monsoon-prep',
      name: 'Monsoon Season Prep',
      description: 'Pre-monsoon checklist for Las Vegas homeowners',
      platforms: ['tiktok', 'instagram', 'facebook'],
      duration: 15,
      ratio: '9:16',
      scenes: 4,
      hook: 'Monsoon season is HERE and your roof is NOT ready...',
      scriptTemplate: 'monsoon_script',
      style: 'seasonal urgency, checklist format, rain effects',
      soundEffect: 'storm-building',
    },
    {
      id: 'territory-scarcity',
      name: 'Territory Scarcity Alert',
      description: 'Urgency video showing limited contractor spots in zip codes',
      platforms: ['tiktok', 'instagram', 'facebook'],
      duration: 10,
      ratio: '9:16',
      scenes: 3,
      hook: 'Only 1 [service] spot left in [zipCode]...',
      scriptTemplate: 'scarcity_script',
      style: 'countdown, map visualization, red alert styling',
      soundEffect: 'urgent-countdown',
    },
  ];
}
initTemplates();

// POST /api/video-studio/create - Create a new video project
router.post('/create', requireAuth, async (req, res) => {
  try {
    const { templateId, contractorId, platform, customizations } = req.body;
    
    const template = videoTemplates.find(t => t.id === templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found', available: videoTemplates.map(t => ({ id: t.id, name: t.name })) });
    }
    
    const projectId = `vid_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const script = generateScript(template, customizations);
    const videoPrompt = generateVideoPrompt(template, customizations);
    
    const project = {
      id: projectId,
      templateId,
      templateName: template.name,
      platform: platform || 'tiktok',
      contractorId,
      status: 'script_ready',
      script,
      videoPrompt,
      customizations: customizations || {},
      scenes: template.scenes,
      duration: template.duration,
      ratio: template.ratio,
      createdAt: new Date(),
      videoUrl: null,
      thumbnailUrl: null,
      postedUrl: null,
      analytics: { views: 0, likes: 0, shares: 0, leads: 0 },
    };
    
    videoProjects.push(project);
    
    res.json({
      success: true,
      message: 'Video project created successfully',
      project: {
        id: project.id,
        templateName: project.templateName,
        platform: project.platform,
        status: project.status,
        script: project.script,
        videoPrompt: project.videoPrompt,
        scenes: project.scenes,
        duration: project.duration,
        ratio: project.ratio,
      },
      nextSteps: [
        'Review and edit the generated script',
        'Approve the video prompt',
        'Generate the video asset',
        'Schedule for posting',
      ],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/video-studio/generate/:projectId - Generate video asset
router.post('/generate/:projectId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = videoProjects.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    // In production, this would call an AI video generation API
    // For now, we return the video prompt that would be used
    project.status = 'generating';
    
    // Simulate video generation
    setTimeout(() => {
      project.status = 'ready';
      project.videoUrl = `https://cdn.getonlypros.com/videos/${project.id}.mp4`;
      project.thumbnailUrl = `https://cdn.getonlypros.com/thumbnails/${project.id}.jpg`;
    }, 2000);
    
    res.json({
      success: true,
      message: 'Video generation started',
      project: {
        id: project.id,
        status: project.status,
        videoPrompt: project.videoPrompt,
        estimatedDuration: '2-5 minutes',
      },
      videoGenerationPrompt: project.videoPrompt,
      instructions: 'Use the videoGenerationPrompt with an AI video generation tool to create the video asset. Upload to CDN and update project with videoUrl.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/video-studio/templates - List all templates
router.get('/templates', async (req, res) => {
  try {
    const { platform } = req.query;
    let templates = videoTemplates;
    if (platform) {
      templates = templates.filter(t => t.platforms.includes(platform));
    }
    
    res.json({
      success: true,
      count: templates.length,
      templates: templates.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        platforms: t.platforms,
        duration: t.duration,
        ratio: t.ratio,
        hook: t.hook,
        scenes: t.scenes,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/video-studio/projects - List all video projects
router.get('/projects', requireAuth, async (req, res) => {
  try {
    const { status, platform, limit = 20 } = req.query;
    
    let projects = videoProjects;
    if (status) projects = projects.filter(p => p.status === status);
    if (platform) projects = projects.filter(p => p.platform === platform);
    
    projects = projects.sort((a, b) => b.createdAt - a.createdAt).slice(0, parseInt(limit));
    
    res.json({
      success: true,
      count: projects.length,
      projects: projects.map(p => ({
        id: p.id,
        templateName: p.templateName,
        platform: p.platform,
        status: p.status,
        duration: p.duration,
        createdAt: p.createdAt,
        videoUrl: p.videoUrl,
        thumbnailUrl: p.thumbnailUrl,
        analytics: p.analytics,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/video-studio/project/:projectId - Get single project
router.get('/project/:projectId', requireAuth, async (req, res) => {
  try {
    const project = videoProjects.find(p => p.id === req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    res.json({
      success: true,
      project,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/video-studio/project/:projectId/script - Update script
router.post('/project/:projectId/script', requireAuth, async (req, res) => {
  try {
    const { script } = req.body;
    const project = videoProjects.find(p => p.id === req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    project.script = script;
    project.status = 'script_edited';
    
    res.json({
      success: true,
      message: 'Script updated',
      project: { id: project.id, status: project.status, script: project.script },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/video-studio/schedule - Schedule video for posting
router.post('/schedule', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { projectId, platform, scheduledAt, caption, hashtags } = req.body;
    
    const project = videoProjects.find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    project.status = 'scheduled';
    project.scheduledPost = {
      platform,
      scheduledAt: new Date(scheduledAt),
      caption: caption || generateCaption(project),
      hashtags: hashtags || generateHashtags(project),
    };
    
    res.json({
      success: true,
      message: 'Video scheduled for posting',
      schedule: project.scheduledPost,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/video-studio/stats - Video studio analytics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const totalProjects = videoProjects.length;
    const byStatus = {};
    videoProjects.forEach(p => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    });
    
    const byPlatform = {};
    videoProjects.forEach(p => {
      byPlatform[p.platform] = (byPlatform[p.platform] || 0) + 1;
    });
    
    res.json({
      success: true,
      stats: {
        totalProjects,
        byStatus,
        byPlatform,
        readyToPost: videoProjects.filter(p => p.status === 'ready').length,
        posted: videoProjects.filter(p => p.status === 'posted').length,
        totalViews: videoProjects.reduce((a, p) => a + (p.analytics?.views || 0), 0),
        totalLeads: videoProjects.reduce((a, p) => a + (p.analytics?.leads || 0), 0),
      },
      topPerformingTemplates: videoTemplates.map(t => ({
        id: t.id,
        name: t.name,
        estimatedEngagement: t.id.includes('emergency') || t.id.includes('scarcity') ? 'high' : 'medium',
        bestPlatform: t.platforms[0],
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/video-studio/quick-generate - One-click video creation
router.post('/quick-generate', requireAuth, async (req, res) => {
  try {
    const { type, platform, contractorName, service, zipCode, neighborhood } = req.body;
    
    const templateMap = {
      spotlight: 'contractor-spotlight',
      emergency: 'emergency-service',
      transformation: 'before-after-transformation',
      tip: 'contractor-tip',
      offer: 'lead-gen-offer',
      monsoon: 'monsoon-prep',
      scarcity: 'territory-scarcity',
      testimonial: 'customer-testimonial',
      welcome: 'new-homeowner-welcome',
      heat: 'vegas-heat-warning',
    };
    
    const templateId = templateMap[type];
    if (!templateId) {
      return res.status(400).json({ success: false, message: 'Unknown video type', available: Object.keys(templateMap) });
    }
    
    const customizations = { contractorName, service, zipCode, neighborhood };
    
    // Auto-create project
    const template = videoTemplates.find(t => t.id === templateId);
    const projectId = `vid_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const script = generateScript(template, customizations);
    const videoPrompt = generateVideoPrompt(template, customizations);
    
    const project = {
      id: projectId,
      templateId,
      templateName: template.name,
      platform: platform || 'tiktok',
      status: 'script_ready',
      script,
      videoPrompt,
      customizations,
      scenes: template.scenes,
      duration: template.duration,
      ratio: template.ratio,
      createdAt: new Date(),
    };
    
    videoProjects.push(project);
    
    res.json({
      success: true,
      message: 'Quick video project created',
      project: {
        id: project.id,
        type,
        platform: project.platform,
        script,
        videoPrompt,
        caption: generateCaption(project),
        hashtags: generateHashtags(project),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Script generation engine
function generateScript(template, customizations = {}) {
  const { contractorName = 'Our Top Pro', service = 'home service', zipCode = '89135', neighborhood = 'Summerlin', amount = '100' } = customizations;
  
  const scripts = {
    contractor_spotlight_script: `HOOK (0-3s): Meet ${contractorName} — the ONLY [service] pro trusted by ${neighborhood} homeowners.
BODY (3-10s): 4.9 stars. 287 reviews. Emergency response in 45 minutes. Licensed. Bonded. Insured.
CTA (10-15s): Book ${contractorName} exclusively on GetOnlyPros. Your zip. Your pro. Zero competition.`,

    new_homeowner_script: `HOOK (0-3s): Just bought a home in ${neighborhood}? STOP everything.
SCENE 1 (3-5s): Vegas heat is 115 degrees. Your AC WILL fail if it's not inspected.
SCENE 2 (5-8s): Hard water destroys pipes. Solar saves $3,000/year. Pool needs weekly love.
SCENE 3 (8-11s): We handpicked the top 5 contractors in ${zipCode} for new homeowners.
CTA (11-15s): FREE $${amount} gift card at getonlypros.com/welcome. Limited time.`,

    emergency_script: `HOOK (0-2s): RED ALERT. Vegas heat. Broken AC. 2am.
BODY (2-7s): Don't panic. We have 3 emergency ${service} contractors in ${zipCode} who respond in 45 MINUTES.
BODY (7-10s): $${amount} emergency credit. No after-hours fees. Just help.
CTA (10-12s): Tap link in bio. Get help NOW.`,

    transformation_script: `HOOK (0-3s): This ${service} transformation in ${neighborhood} is INSANE.
BEFORE (3-8s): [Show before footage — cracked, broken, outdated]
AFTER (8-13s): [Show after footage — beautiful, modern, perfect]
CTA (13-15s): Want this? Book the same contractor on GetOnlyPros. $${amount} off.`,

    heat_warning_script: `HOOK (0-3s): Your AC is DYING and you don't even know it.
FACT 1 (3-5s): Vegas heat = 115 degrees.
FACT 2 (5-7s): 12-year-old AC = 78% failure rate this summer.
FACT 3 (7-9s): Emergency replacement = $8,500. Preventive fix = $450.
FACT 4 (9-11s): Summerlin, Henderson, Green Valley — we're booking 3 weeks out.
CTA (11-15s): FREE inspection + $${amount} credit at getonlypros.com/summer`,

    pro_tip_script: `HOOK (0-3s): Vegas homeowners — do THIS before summer hits.
TIP (3-10s): Change your AC filter. Check your capacitor. Clear debris. $200 in parts = $8,500 saved.
CTA (10-15s): Want the full checklist? FREE at getonlypros.com/checklist + $${amount} service credit.`,

    lead_gen_script: `HOOK (0-2s): FREE $${amount} gift card for ${service} in ${zipCode}.
BODY (2-7s): No catch. No spam. Just the highest-rated ${service} contractor in ${neighborhood}.
BODY (7-10s): 1 contractor per zip. Exclusive. No shared leads.
CTA (10-12s): First 50 homeowners only. Tap link NOW.`,

    testimonial_script: `HOOK (0-3s): I almost got scammed by a Vegas contractor. Then I found GetOnlyPros.
STORY (3-10s): "They sent me ONE contractor. Vetted. Reviewed. Local. He showed up on time, finished early, $500 under budget."
CTA (10-15s): Don't gamble with your home. GetOnlyPros.com. $${amount} welcome gift.`,

    monsoon_script: `HOOK (0-3s): Monsoon season is HERE and your roof is NOT ready.
CHECKLIST (3-9s): Gutters clear? Shingles secure? Flashing sealed? Pool overflow drain open?
WARNING (9-11s): Last storm caused $2.3M in damage across ${neighborhood}.
CTA (11-15s): FREE roof inspection + $${amount} credit. Book before the next storm.`,

    scarcity_script: `HOOK (0-2s): Only 1 ${service} spot left in ${zipCode}.
BODY (2-7s): ${neighborhood} has 2,400 homes. 1 contractor gets ALL the leads.
BODY (7-9s): Desert Cool HVAC Pros just claimed Summerlin. Green Valley is OPEN.
CTA (9-10s): Lock your zip NOW. getonlypros.com/claim`,
  };
  
  return scripts[template.scriptTemplate] || 'Script template not found. Please customize manually.';
}

// Video prompt generation for AI video generation
function generateVideoPrompt(template, customizations = {}) {
  const { contractorName = 'Our Top Pro', service = 'home service', zipCode = '89135', neighborhood = 'Summerlin' } = customizations;
  
  const prompts = {
    contractor_spotlight_script: `Create a fast-paced 15-second vertical video featuring a professional ${service} contractor working on a Las Vegas home in ${neighborhood}. Show them in uniform, using professional tools, with a satisfied homeowner. Include text overlays: "${contractorName}", "4.9 Stars", "${neighborhood} Favorite", "Book Exclusively". Style: energetic, trustworthy, modern. Background: desert landscape, palm trees, luxury home. Bright, warm lighting. Upbeat background music feel.`,

    new_homeowner_script: `Create a 15-second vertical celebration video for new Las Vegas homeowners. Show a couple getting keys to a beautiful ${neighborhood} home, then quick cuts of home service needs: AC unit, pool, solar panels, water softener. Text overlays: "Just Moved In?", "$100 Welcome Gift", "Vetted Pros Only", "${neighborhood}". Style: trendy, fast cuts, emoji-style text, warm and welcoming. Golden hour lighting.`,

    emergency_script: `Create an urgent 10-second vertical video showing a Las Vegas home in extreme heat (115 degrees visual effect). Show a broken AC unit with steam, then a professional contractor arriving in a branded van, fixing the problem. Red and orange color grading for urgency. Text overlays: "AC DIED?", "45 Min Response", "$50 Emergency Credit", "${zipCode}". Fast-paced, dramatic music feel.`,

    transformation_script: `Create a dramatic 15-second vertical before-and-after video for a ${service} project in ${neighborhood}. Split screen or wipe transition showing old/broken vs new/beautiful. Include text overlays: "Before", "After", "${contractorName}", "$${customizations.amount || '100'} Off". Style: satisfying transformation, cinematic lighting for the after shot, modern and clean aesthetic.`,

    heat_warning_script: `Create an educational 15-second vertical video showing Las Vegas summer heat effects on home systems. Visual: thermometer hitting 115F, AC unit struggling, high NV Energy bill. Text overlays: "115F Heat", "AC Failure Risk: 78%", "Prevention: $450", "Replacement: $8,500". Color coding: red for danger, green for solution. Professional, authoritative style.`,

    pro_tip_script: `Create a 15-second vertical DIY tip video showing a homeowner performing simple AC maintenance: changing filter, checking capacitor. Professional contractor appears in corner giving advice. Text overlays: "Pro Tip", "Save $8,500", "FREE Checklist", "${neighborhood}". Style: helpful, friendly, educational. Clean, bright lighting.`,

    lead_gen_script: `Create a 12-second vertical promotional video with bold text: "FREE $${customizations.amount || '100'} GIFT CARD". Show gift card animation, then quick cuts of satisfied homeowners, professional contractors, 5-star reviews. Text overlays: "${service}", "${zipCode}", "Limited Time", "Tap Link". Style: high-energy, offer-focused, urgency-driven. Bright, attention-grabbing colors.`,

    testimonial_script: `Create a 15-second vertical testimonial video showing a happy Las Vegas homeowner in their ${neighborhood} home. They speak to camera (voiceover text), showing before photos of a bad contractor job, then beautiful finished work by GetOnlyPros contractor. Text overlays: "Almost Got Scammed", "Then Found GetOnlyPros", "4.9 Stars", "$${customizations.amount || '25'} Welcome Gift". Authentic, relatable style.`,

    monsoon_script: `Create a 15-second vertical dramatic video showing Las Vegas monsoon storm approaching. Quick cuts: dark clouds, rain hitting roof, gutter overflowing, then a professional roofer inspecting and securing the roof. Text overlays: "Monsoon Season", "FREE Inspection", "$${customizations.amount || '100'} Credit", "${neighborhood}". Stormy atmosphere transitioning to safety and security.`,

    scarcity_script: `Create a 10-second vertical urgency video showing a map of ${neighborhood} with zip code ${zipCode} highlighted. Countdown animation: "1 Spot Left". Flashing red alerts. Professional contractor standing confidently. Text overlays: "Only 1 Left", "${service}", "${zipCode}", "Lock It Now". Style: scarcity-driven, FOMO, high urgency.`,
  };
  
  return prompts[template.scriptTemplate] || 'Create a professional 15-second vertical video for a Las Vegas home services company. Modern, energetic, trustworthy style with desert landscape background.';
}

function generateCaption(project) {
  const captions = {
    'contractor-spotlight': 'Meet the best {service} contractor in {neighborhood}. Exclusive on GetOnlyPros. Your zip. Your pro. Zero competition. Link in bio!',
    'new-homeowner-welcome': 'Just bought a home in {neighborhood}? Heres $100 to get you started. Vetted pros only. No shared leads. Welcome to Vegas!',
    'emergency-service': '2am. 115 degrees. Broken AC. Weve got you. Emergency response in 45 minutes. {zipCode} homeowners, save this post.',
    'before-after-transformation': 'This transformation tho {neighborhood} {service} game is STRONG. Same contractor available on GetOnlyPros. Link in bio!',
    'vegas-heat-warning': 'Your AC is dying and you dont know it yet. Vegas summer is NO JOKE. Free inspection + $100 credit. Link in bio.',
    'contractor-tip': 'Vegas homeowner tip: Do THIS before summer hits. Save $8,500. Full checklist FREE at link in bio!',
    'lead-gen-offer': 'FREE ${amount} gift card for {service} in {zipCode}. No catch. First 50 only. Tap link NOW!',
    'customer-testimonial': 'I almost got scammed by a Vegas contractor. Then I found GetOnlyPros. This is my story. Link in bio!',
    'monsoon-prep': 'Monsoon season is HERE {neighborhood}. Is your roof ready? Free inspection + $100 credit. Book before the storm.',
    'territory-scarcity': 'Only 1 {service} spot left in {zipCode}. 2,400 homes. 1 contractor gets ALL leads. Will it be you?',
  };
  
  let caption = captions[project.templateId] || 'GetOnlyPros - The best way to find vetted home service contractors in Las Vegas.';
  
  const { service = 'home service', zipCode = '89135', neighborhood = 'Summerlin', amount = '100' } = project.customizations || {};
  caption = caption
    .replace(/{service}/g, service)
    .replace(/{zipCode}/g, zipCode)
    .replace(/{neighborhood}/g, neighborhood)
    .replace(/{amount}/g, amount);
  
  return caption;
}

function generateHashtags(project) {
  const baseTags = ['#GetOnlyPros', '#LasVegas', '#VegasLocal', '#HomeServices'];
  
  const platformTags = {
    tiktok: ['#FYP', '#ForYou', '#VegasTikTok', '#HomeTok', '#Viral'],
    instagram: ['#VegasLife', '#HomeImprovement', '#LasVegasHomes', '#Reels'],
    youtube: ['#Shorts', '#VegasShorts', '#HomeTips'],
    facebook: ['#VegasCommunity', '#LocalBusiness', '#ContractorLife'],
  };
  
  const templateTags = {
    'contractor-spotlight': ['#ContractorSpotlight', '#VettedPro', '#TopRated'],
    'new-homeowner-welcome': ['#NewHomeowner', '#VegasHome', '#WelcomeHome'],
    'emergency-service': ['#EmergencyService', '#VegasHeat', '#ACRepair'],
    'before-after-transformation': ['#BeforeAfter', '#HomeTransformation', '#RenoReveal'],
    'vegas-heat-warning': ['#VegasSummer', '#ACMaintenance', '#StayCool'],
    'contractor-tip': ['#ProTip', '#HomeMaintenance', '#DIY'],
    'lead-gen-offer': ['#FreeGift', '#LimitedTime', '#SpecialOffer'],
    'customer-testimonial': ['#RealReview', '#HappyCustomer', '#Trust'],
    'monsoon-prep': ['#MonsoonReady', '#StormPrep', '#RoofCheck'],
    'territory-scarcity': ['#Exclusive', '#LockYourZip', '#BeTheFirst'],
  };
  
  const custom = project.customizations || {};
  const customTags = [
    custom.service ? `#${custom.service.replace(/\s+/g, '')}` : '',
    custom.neighborhood ? `#${custom.neighborhood.replace(/\s+/g, '')}` : '',
    custom.zipCode ? `#Zip${custom.zipCode}` : '',
  ].filter(Boolean);
  
  return [...baseTags, ...(platformTags[project.platform] || []), ...(templateTags[project.templateId] || []), ...customTags].join(' ');
}

module.exports = router;
