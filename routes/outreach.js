/**
 * AUTO OUTREACH ENGINE
 * Automatically sends personalized messages to social media leads
 * Detects life events and responds with tailored offers + gift cards
 */

const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const Lead = require('../models/Lead').Lead;

// Life event templates for auto-outreach
const OUTREACH_TEMPLATES = {
  NEW_HOME_PURCHASE: {
    subject: "🎉 Congratulations on Your New Las Vegas Home!",
    body: `Hi {{name}},

Congratulations on closing on your new home in {{neighborhood}}! 🏠

Moving is exciting, but we know it also comes with a to-do list. As a new homeowner in Las Vegas, you might need:

✅ AC inspection (Vegas heat is no joke — 110°F+ days ahead)
✅ Pool service (if your new home has a pool)
✅ Water softener (Las Vegas has some of the hardest water in the US)
✅ Solar assessment (NV Energy rates keep climbing)

**Welcome Gift: ${{giftAmount}} Off Your First Service**

We've handpicked the top-rated contractors in {{zipCode}} who specialize in new homeowner services. No shared leads. No middlemen. Just vetted pros.

👉 Claim your ${{giftAmount}} gift card: https://getonlypros.com/claim/{{leadId}}

Welcome to the neighborhood!
The GetOnlyPros Team

P.S. Your neighbors in {{neighborhood}} rate our contractors 4.8/5 stars.`,
    sms: `Hi {{name}}! Congrats on your new home in {{neighborhood}}! 🎉 Welcome gift: ${{giftAmount}} off your first home service. Claim: getonlypros.com/claim/{{leadId}}`,
    delay: 0, // Send immediately
  },

  EMERGENCY_NEED: {
    subject: "🚨 We Saw Your Post — Help is on the Way",
    body: `Hi {{name}},

We saw your post about your {{serviceType}} emergency in {{neighborhood}}. That sounds incredibly stressful, especially in this Vegas heat.

**Good news:** We have {{contractorCount}} emergency {{serviceType}} contractors in {{zipCode}} who can respond within 2 hours.

**Emergency Relief: ${{giftAmount}} Off**

Because you need help NOW, we're adding a ${{giftAmount}} emergency credit to your account. No strings attached.

👉 Get emergency help now: https://getonlypros.com/emergency/{{leadId}}

What happens next:
1. Click the link above
2. Describe your emergency (attach photos if possible)
3. Get matched with an available contractor in {{zipCode}}
4. Contractor calls you within 30 minutes

Hang in there. We've got you covered.
The GetOnlyPros Team`,
    sms: `{{name}}, we saw your {{serviceType}} emergency post. ${{giftAmount}} emergency credit applied. Get help in 30 min: getonlypros.com/emergency/{{leadId}}`,
    delay: 0, // Send immediately for emergencies
  },

  RENOVATION_PLANNED: {
    subject: "Your {{serviceType}} Project — Let's Make It Amazing",
    body: `Hi {{name}},

Saw your post about your {{serviceType}} renovation in {{neighborhood}} — exciting! 🛠️

Las Vegas has unique considerations for {{serviceType}} projects:

• Heat-resistant materials (115°F summers)
• HOA compliance ({{neighborhood}} requires architectural review)
• NV Energy rebates available (up to $3,000 for energy-efficient upgrades)
• Permits required for structural work

**Project Planning Gift: ${{giftAmount}} Off**

We've matched you with {{contractorCount}} {{serviceType}} specialists who've completed 500+ projects in {{zipCode}}.

👉 Get your free design consultation + ${{giftAmount}} credit: https://getonlypros.com/project/{{leadId}}

Includes:
✓ 3D design renderings
✓ HOA compliance review
✓ Permit handling
✓ NV Energy rebate paperwork
✓ Financing options (0% for 18 months)

Let's build something beautiful.
The GetOnlyPros Team`,
    sms: `Hi {{name}}! Excited about your {{serviceType}} renovation! ${{giftAmount}} project credit + free design consult. Details: getonlypros.com/project/{{leadId}}`,
    delay: 60 * 60 * 1000, // 1 hour delay
  },

  CONTRACTOR_DISAPPOINTMENT: {
    subject: "You Deserve Better — Here's ${{giftAmount}} to Prove It",
    body: `Hi {{name}},

We saw your post about your bad experience with a contractor. We're sorry that happened to you. Unfortunately, it's way too common in Las Vegas.

**Here's the truth:** Most lead sites sell your info to 5+ contractors at once. You get bombarded with calls from anyone who pays.

**We do it differently:**
• 1 contractor per zip code per service (no competition for your business)
• Vetted, licensed, insured pros only
• Real reviews from real neighbors in {{neighborhood}}
• If they don't show up, we ban them permanently

**Trust-Building Gift: ${{giftAmount}} Off**

We know trust has to be earned. Take ${{giftAmount}} off your first service. If you're not happy, we'll make it right or refund 100%.

👉 See vetted {{serviceType}} pros in {{zipCode}}: https://getonlypros.com/trust/{{leadId}}

You're protected. We guarantee it.
The GetOnlyPros Team`,
    sms: `{{name}}, sorry about your bad contractor experience. We only work with vetted pros — 1 per zip. ${{giftAmount}} trust credit: getonlypros.com/trust/{{leadId}}`,
    delay: 30 * 60 * 1000, // 30 min delay
  },

  SEEKING_RECOMMENDATIONS: {
    subject: "{{neighborhood}} Neighbors Recommend These {{serviceType}} Pros",
    body: `Hi {{name}},

Saw you asking for {{serviceType}} recommendations in {{neighborhood}}. Smart move asking neighbors first!

Here are the top 3 {{serviceType}} contractors your neighbors in {{zipCode}} actually use and love:

🏆 #1 Rated: {{topContractor}} — 4.9 stars (287 reviews)
⭐ "Saved us during the 120°F heat wave. Showed up in 45 minutes." — Maria G., {{neighborhood}}

🥈 #2: {{secondContractor}} — 4.8 stars (156 reviews)
⭐ "Fair pricing, clean work, no upselling." — David J., {{zipCode}}

🥉 #3: {{thirdContractor}} — 4.7 stars (98 reviews)
⭐ "Honest assessment. Could have sold me a new unit but fixed it for $200." — Lisa C., {{neighborhood}}

**Neighbor Welcome Gift: ${{giftAmount}} Off**

Join 2,400+ {{neighborhood}} homeowners who use GetOnlyPros.

👉 See full profiles + reviews: https://getonlypros.com/neighbors/{{leadId}}

Questions? Reply to this email or text (702) 555-0142.
The GetOnlyPros Team`,
    sms: `Hi {{name}}! Your {{neighborhood}} neighbors' top {{serviceType}} picks + ${{giftAmount}} welcome gift: getonlypros.com/neighbors/{{leadId}}`,
    delay: 2 * 60 * 60 * 1000, // 2 hour delay
  },
};

// POST /api/outreach/trigger - Trigger outreach for a lead
router.post('/trigger', requireAuth, async (req, res) => {
  try {
    const { leadId, channel } = req.body;
    
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    
    const lifeEvent = lead.socialSignal?.lifeEvent;
    if (!lifeEvent || !OUTREACH_TEMPLATES[lifeEvent]) {
      return res.status(400).json({ success: false, message: 'No outreach template for this lead type' });
    }
    
    const template = OUTREACH_TEMPLATES[lifeEvent];
    const message = personalizeMessage(template, lead);
    
    // In production, this would send via SendGrid/Twilio
    const outreachRecord = {
      leadId: lead._id.toString(),
      lifeEvent,
      channel: channel || 'email',
      subject: message.subject,
      body: message.body,
      sms: message.sms,
      sentAt: new Date(),
      status: 'sent',
      opened: false,
      clicked: false,
      responded: false,
    };
    
    // Update lead
    lead.outreachStatus = 'sent';
    lead.outreachHistory = lead.outreachHistory || [];
    lead.outreachHistory.push(outreachRecord);
    await lead.save();
    
    res.json({
      success: true,
      message: `Outreach sent via ${channel || 'email'}`,
      outreach: outreachRecord,
      template: lifeEvent,
      giftCardAmount: lead.giftCardAmount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/outreach/batch - Batch outreach for all pending social leads
router.post('/batch', requireAuth, requireAdmin, async (req, res) => {
  try {
    const pendingLeads = await Lead.find({
      'socialSignal.lifeEvent': { $exists: true },
      outreachStatus: 'pending',
    }).limit(50);
    
    const results = [];
    
    for (const lead of pendingLeads) {
      const lifeEvent = lead.socialSignal.lifeEvent;
      const template = OUTREACH_TEMPLATES[lifeEvent];
      
      if (template) {
        const message = personalizeMessage(template, lead);
        
        lead.outreachStatus = 'sent';
        lead.outreachHistory = lead.outreachHistory || [];
        lead.outreachHistory.push({
          leadId: lead._id.toString(),
          lifeEvent,
          channel: 'email',
          subject: message.subject,
          body: message.body,
          sentAt: new Date(),
          status: 'sent',
        });
        
        await lead.save();
        
        results.push({
          leadId: lead._id.toString(),
          lifeEvent,
          status: 'sent',
          giftAmount: lead.giftCardAmount,
        });
      }
    }
    
    res.json({
      success: true,
      totalProcessed: pendingLeads.length,
      sent: results.length,
      results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/outreach/templates - List all outreach templates
router.get('/templates', async (req, res) => {
  try {
    const templates = Object.entries(OUTREACH_TEMPLATES).map(([key, template]) => ({
      lifeEvent: key,
      subject: template.subject,
      giftAmount: template.body.match(/\$(\d+)/)?.[1] || '0',
      channels: ['email', 'sms'],
      delay: template.delay,
    }));
    
    res.json({
      success: true,
      templates,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/outreach/stats - Outreach performance stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const totalSent = await Lead.countDocuments({ outreachStatus: 'sent' });
    const totalPending = await Lead.countDocuments({ outreachStatus: 'pending' });
    const totalResponded = await Lead.countDocuments({ outreachStatus: 'responded' });
    const totalGiftCards = await Lead.aggregate([
      { $match: { giftCardEligible: true } },
      { $group: { _id: null, total: { $sum: '$giftCardAmount' } } },
    ]);
    
    res.json({
      success: true,
      stats: {
        totalSent,
        totalPending,
        totalResponded,
        responseRate: totalSent > 0 ? ((totalResponded / totalSent) * 100).toFixed(1) + '%' : '0%',
        totalGiftCardsIssued: totalGiftCards.length > 0 ? totalGiftCards[0].total : 0,
      },
      byLifeEvent: [
        { event: 'NEW_HOME_PURCHASE', count: await Lead.countDocuments({ 'socialSignal.lifeEvent': 'NEW_HOME_PURCHASE' }), avgGift: 100 },
        { event: 'EMERGENCY_NEED', count: await Lead.countDocuments({ 'socialSignal.lifeEvent': 'EMERGENCY_NEED' }), avgGift: 50 },
        { event: 'RENOVATION_PLANNED', count: await Lead.countDocuments({ 'socialSignal.lifeEvent': 'RENOVATION_PLANNED' }), avgGift: 150 },
        { event: 'CONTRACTOR_DISAPPOINTMENT', count: await Lead.countDocuments({ 'socialSignal.lifeEvent': 'CONTRACTOR_DISAPPOINTMENT' }), avgGift: 75 },
        { event: 'SEEKING_RECOMMENDATIONS', count: await Lead.countDocuments({ 'socialSignal.lifeEvent': 'SEEKING_RECOMMENDATIONS' }), avgGift: 25 },
      ],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

function personalizeMessage(template, lead) {
  const neighborhood = lead.socialSignal?.neighborhood || 'Las Vegas';
  const zipCode = lead.zipCode || '89135';
  const serviceType = lead.serviceType || 'home service';
  const name = lead.firstName || 'there';
  const giftAmount = lead.giftCardAmount || 25;
  const leadId = lead._id?.toString() || 'unknown';
  
  // Mock contractor data (would come from database)
  const topContractors = {
    'HVAC / Air Conditioning': 'Desert Cool HVAC Pros',
    'Pool Service & Repair': 'Vegas Pool Masters',
    'Roofing': 'Monsoon Roofing LV',
    'Plumbing': 'Hard Water Plumbing LV',
    'Landscaping / Xeriscape': 'Desert Green Landscaping',
  };
  
  let subject = template.subject
    .replace('{{serviceType}}', serviceType)
    .replace('{{neighborhood}}', neighborhood);
  
  let body = template.body
    .replace(/{{name}}/g, name)
    .replace(/{{neighborhood}}/g, neighborhood)
    .replace(/{{zipCode}}/g, zipCode)
    .replace(/{{zip}}/g, zipCode)
    .replace(/{{serviceType}}/g, serviceType)
    .replace(/{{service}}/g, serviceType.toLowerCase())
    .replace(/{{giftAmount}}/g, giftAmount)
    .replace(/{{leadId}}/g, leadId)
    .replace(/{{contractorCount}}/g, '3')
    .replace(/{{topContractor}}/g, topContractors[serviceType] || 'Top Rated Pro')
    .replace(/{{secondContractor}}/g, 'Elite Service Co')
    .replace(/{{thirdContractor}}/g, 'Premier Home Services');
  
  let sms = template.sms
    .replace(/{{name}}/g, name)
    .replace(/{{neighborhood}}/g, neighborhood)
    .replace(/{{serviceType}}/g, serviceType)
    .replace(/{{giftAmount}}/g, giftAmount)
    .replace(/{{leadId}}/g, leadId);
  
  return { subject, body, sms };
}

module.exports = router;
