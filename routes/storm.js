/**
 * STORM CHASER INTEGRATION
 * After hail/monsoon/dust storms, instantly identify damaged homes
 * Generate leads BEFORE homeowners even know they have damage
 */

const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Storm damage database
const STORM_EVENTS = [];

// POST /api/storm/alert - Report a storm event
router.post('/alert', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { type, severity, affectedZips, date, description, windSpeed, hailSize } = req.body;
    
    const storm = {
      id: `storm_${Date.now()}`,
      type, // 'hail', 'wind', 'flood', 'dust', 'lightning'
      severity, // 'minor', 'moderate', 'severe', 'catastrophic'
      affectedZips: affectedZips || [],
      date: date || new Date(),
      description,
      windSpeed,
      hailSize,
      status: 'active',
      leadsGenerated: 0,
      estimatedDamage: calculateDamageEstimate(type, severity, affectedZips),
      createdAt: new Date(),
    };
    
    STORM_EVENTS.push(storm);
    
    // Auto-generate leads for affected areas
    const generatedLeads = await generateStormLeads(storm);
    storm.leadsGenerated = generatedLeads.length;
    
    res.json({
      success: true,
      message: `Storm alert logged. ${generatedLeads.length} leads generated for affected areas.`,
      storm: {
        ...storm,
        affectedHomes: affectedZips.length * 850, // avg homes per zip
        estimatedJobs: generatedLeads.length,
        avgTicket: type === 'hail' ? 15000 : type === 'wind' ? 12000 : 8000,
        totalMarketValue: generatedLeads.length * (type === 'hail' ? 15000 : type === 'wind' ? 12000 : 8000),
      },
      generatedLeads: generatedLeads.slice(0, 5),
      contractorNotification: `Contractors in ${affectedZips.join(', ')} have been notified of ${type} damage opportunity.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/storm/active - Active storm events
router.get('/active', async (req, res) => {
  try {
    const active = STORM_EVENTS.filter(s => s.status === 'active');
    
    res.json({
      success: true,
      activeStorms: active.length,
      storms: active.map(s => ({
        id: s.id,
        type: s.type,
        severity: s.severity,
        affectedZips: s.affectedZips,
        date: s.date,
        leadsGenerated: s.leadsGenerated,
        estimatedDamage: s.estimatedDamage,
        status: s.status,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/storm/zip/:zipCode - Storm history for zip
router.get('/zip/:zipCode', async (req, res) => {
  try {
    const { zipCode } = req.params;
    const zipStorms = STORM_EVENTS.filter(s => s.affectedZips.includes(zipCode));
    
    res.json({
      success: true,
      zipCode,
      stormHistory: zipStorms.length,
      storms: zipStorms,
      riskAssessment: calculateZipRisk(zipCode, zipStorms),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/storm/stats - Storm market stats
router.get('/stats', async (req, res) => {
  try {
    const totalStorms = STORM_EVENTS.length;
    const totalLeads = STORM_EVENTS.reduce((a, s) => a + s.leadsGenerated, 0);
    const totalValue = STORM_EVENTS.reduce((a, s) => a + (s.leadsGenerated * 12000), 0);
    
    // Seasonal risk calendar
    const riskCalendar = [
      { month: 'January', risk: 'low', threats: [] },
      { month: 'February', risk: 'low', threats: [] },
      { month: 'March', risk: 'low', threats: ['wind'] },
      { month: 'April', risk: 'medium', threats: ['wind', 'dust'] },
      { month: 'May', risk: 'high', threats: ['wind', 'dust', 'heat'] },
      { month: 'June', risk: 'very_high', threats: ['monsoon', 'wind', 'hail', 'heat'] },
      { month: 'July', risk: 'very_high', threats: ['monsoon', 'flash_flood', 'wind', 'hail'] },
      { month: 'August', risk: 'very_high', threats: ['monsoon', 'flash_flood', 'wind', 'hail'] },
      { month: 'September', risk: 'high', threats: ['monsoon', 'wind', 'heat'] },
      { month: 'October', risk: 'medium', threats: ['wind'] },
      { month: 'November', risk: 'low', threats: [] },
      { month: 'December', risk: 'low', threats: [] },
    ];
    
    res.json({
      success: true,
      market: 'Las Vegas, NV',
      stats: {
        totalStormsLogged: totalStorms,
        totalStormLeads: totalLeads,
        totalMarketValue: totalValue,
        avgLeadsPerStorm: totalStorms > 0 ? Math.round(totalLeads / totalStorms) : 0,
      },
      riskCalendar,
      topOpportunities: [
        { type: 'Hail Damage', season: 'Jun-Aug', avgTicket: 15000, urgency: 'immediate' },
        { type: 'Wind Damage', season: 'Apr-Sep', avgTicket: 12000, urgency: '24hrs' },
        { type: 'Flash Flood', season: 'Jul-Aug', avgTicket: 25000, urgency: 'immediate' },
        { type: 'Dust Storm', season: 'May-Sep', avgTicket: 3500, urgency: '48hrs' },
      ],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

function calculateDamageEstimate(type, severity, zips) {
  const homesPerZip = 850;
  const totalHomes = zips.length * homesPerZip;
  
  const damageRates = {
    hail: { minor: 0.05, moderate: 0.15, severe: 0.35, catastrophic: 0.60 },
    wind: { minor: 0.08, moderate: 0.20, severe: 0.40, catastrophic: 0.70 },
    flood: { minor: 0.10, moderate: 0.25, severe: 0.50, catastrophic: 0.80 },
    dust: { minor: 0.03, moderate: 0.08, severe: 0.15, catastrophic: 0.30 },
    lightning: { minor: 0.02, moderate: 0.05, severe: 0.10, catastrophic: 0.20 },
  };
  
  const rate = damageRates[type]?.[severity] || 0.10;
  return Math.round(totalHomes * rate);
}

async function generateStormLeads(storm) {
  const leads = [];
  const { type, severity, affectedZips } = storm;
  
  // Generate leads based on storm type
  for (const zip of affectedZips) {
    const damageEstimate = calculateDamageEstimate(type, severity, [zip]);
    const leadCount = Math.min(damageEstimate, 50); // Cap at 50 per zip
    
    for (let i = 0; i < leadCount; i++) {
      const serviceMap = {
        hail: 'Roofing',
        wind: 'Roofing',
        flood: 'Water Damage Restoration',
        dust: 'HVAC / Air Conditioning',
        lightning: 'Electrical',
      };
      
      leads.push({
        id: `storm_${storm.id}_${zip}_${i}`,
        type: 'storm_damage',
        stormType: type,
        zipCode: zip,
        serviceType: serviceMap[type] || 'General Contractor',
        urgency: severity === 'catastrophic' ? 'emergency' : severity === 'severe' ? 'high' : 'medium',
        estimatedDamage: type === 'hail' ? 15000 : type === 'wind' ? 12000 : 8000,
        source: `Storm Chaser - ${type.toUpperCase()} ${severity}`,
        message: `Home in ${zip} likely has ${type} damage from recent storm. Immediate inspection recommended.`,
        createdAt: new Date(),
      });
    }
  }
  
  return leads;
}

function calculateZipRisk(zipCode, storms) {
  const hailCount = storms.filter(s => s.type === 'hail').length;
  const windCount = storms.filter(s => s.type === 'wind').length;
  const floodCount = storms.filter(s => s.type === 'flood').length;
  
  const riskLevel = hailCount > 2 || windCount > 3 ? 'very_high' :
    hailCount > 0 || windCount > 1 ? 'high' :
    storms.length > 0 ? 'medium' : 'low';
  
  return {
    overallRisk: riskLevel,
    hailRisk: hailCount > 2 ? 'very_high' : hailCount > 0 ? 'high' : 'low',
    windRisk: windCount > 3 ? 'very_high' : windCount > 1 ? 'high' : 'low',
    floodRisk: floodCount > 0 ? 'medium' : 'low',
    totalEvents: storms.length,
    lastEvent: storms.length > 0 ? storms[storms.length - 1].date : null,
    recommendation: riskLevel === 'very_high' 
      ? 'High-risk area. Contractors should pre-position materials and crews.'
      : riskLevel === 'high'
      ? 'Monitor weather closely. Have emergency response plan ready.'
      : 'Standard preparedness sufficient.',
  };
}

module.exports = router;
