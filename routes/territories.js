/**
 * EXCLUSIVE TERRITORY SYSTEM
 * Only 1 contractor per zip code per service type
 * Creates artificial scarcity + contractor loyalty
 */

const express = require('express');
const router = express.Router();
const { requireAuth, requireContractor } = require('../middleware/auth');
const Contractor = require('../models/Contractor').Contractor;
const TerritoryLock = require('../models/TerritoryLock').TerritoryLock;

// GET /api/territories/available - Show available territories
router.get('/available', async (req, res) => {
  try {
    const { service, zipCode } = req.query;
    
    // Get all locked territories
    const locked = await TerritoryLock.find({ status: 'active' });
    const lockedMap = {};
    locked.forEach(t => {
      const key = `${t.serviceType}-${t.zipCode}`;
      lockedMap[key] = t.contractorId;
    });

    // Las Vegas zip codes by tier
    const zipTiers = {
      luxury: ['89135', '89138', '89144', '89052', '89044'],
      premium: ['89178', '89183', '89141', '89074', '89012', '89166'],
      midMarket: ['89117', '89147', '89149', '89131', '89014', '89011', '89128'],
      value: ['89101', '89104', '89106', '89110', '89121', '89032', '89031', '89084'],
      emerging: ['89139', '89148', '89143', '89156', '89005', '89006'],
    };

    const services = [
      'HVAC / Air Conditioning', 'Pool Service & Repair', 'Roofing',
      'Landscaping / Xeriscape', 'Plumbing', 'Electrical',
      'Solar Installation', 'Garage Door', 'Pest Control',
      'Window / Energy Efficiency', 'Concrete / Cool Decking',
      'Water Damage Restoration', 'Fence Installation',
      'Kitchen Remodel', 'Bathroom Remodel',
    ];

    const result = {};
    
    for (const [tier, zips] of Object.entries(zipTiers)) {
      result[tier] = {};
      for (const zip of zips) {
        result[tier][zip] = {};
        for (const svc of services) {
          const key = `${svc}-${zip}`;
          const isLocked = !!lockedMap[key];
          
          if (!service || service === svc) {
            if (!zipCode || zipCode === zip) {
              result[tier][zip][svc] = {
                available: !isLocked,
                lockedBy: isLocked ? lockedMap[key].toString() : null,
                demandScore: calculateDemandScore(svc, zip),
              };
            }
          }
        }
      }
    }

    res.json({
      success: true,
      market: 'Las Vegas, NV',
      totalZips: Object.values(zipTiers).flat().length,
      totalServices: services.length,
      totalTerritories: Object.values(zipTiers).flat().length * services.length,
      lockedCount: locked.length,
      availableCount: (Object.values(zipTiers).flat().length * services.length) - locked.length,
      territories: result,
    });
  } catch (error) {
    console.error('[Territory] Available error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/territories/claim - Contractor claims a territory
router.post('/claim', requireAuth, requireContractor, async (req, res) => {
  try {
    const { zipCode, serviceType } = req.body;
    const contractorId = req.user.userId;

    if (!zipCode || !serviceType) {
      return res.status(400).json({ success: false, message: 'zipCode and serviceType required' });
    }

    // Check if already locked
    const existing = await TerritoryLock.findOne({
      zipCode,
      serviceType,
      status: 'active',
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Territory already claimed by another contractor`,
        lockedBy: existing.contractorId.toString(),
        lockedAt: existing.lockedAt,
      });
    }

    // Check contractor's service areas
    const contractor = await Contractor.findOne({ userId: contractorId });
    if (!contractor) {
      return res.status(404).json({ success: false, message: 'Contractor not found' });
    }

    if (!contractor.serviceAreas.includes(zipCode)) {
      return res.status(403).json({
        success: false,
        message: 'You must service this zip code to claim it',
        yourServiceAreas: contractor.serviceAreas,
      });
    }

    // Create territory lock
    const lock = await TerritoryLock.create({
      contractorId: contractor._id,
      userId: contractorId,
      zipCode,
      serviceType,
      status: 'active',
      lockedAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      autoRenew: true,
      leadGuarantee: 5, // minimum 5 leads/month guarantee
      monthlyFee: 0, // free during beta
    });

    res.json({
      success: true,
      message: `Territory claimed: ${serviceType} in ${zipCode}`,
      territory: {
        id: lock._id.toString(),
        zipCode: lock.zipCode,
        serviceType: lock.serviceType,
        lockedAt: lock.lockedAt,
        expiresAt: lock.expiresAt,
        leadGuarantee: lock.leadGuarantee,
      },
    });
  } catch (error) {
    console.error('[Territory] Claim error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/territories/my - Get contractor's claimed territories
router.get('/my', requireAuth, requireContractor, async (req, res) => {
  try {
    const contractorId = req.user.userId;
    const contractor = await Contractor.findOne({ userId: contractorId });
    
    if (!contractor) {
      return res.status(404).json({ success: false, message: 'Contractor not found' });
    }

    const locks = await TerritoryLock.find({
      contractorId: contractor._id,
      status: 'active',
    }).sort({ lockedAt: -1 });

    // Get lead counts for each territory
    const territoriesWithStats = await Promise.all(
      locks.map(async (lock) => {
        const leadCount = await require('../models/Lead').Lead.countDocuments({
          zipCode: lock.zipCode,
          serviceType: lock.serviceType,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        });
        
        return {
          id: lock._id.toString(),
          zipCode: lock.zipCode,
          serviceType: lock.serviceType,
          lockedAt: lock.lockedAt,
          expiresAt: lock.expiresAt,
          leadGuarantee: lock.leadGuarantee,
          leadsReceived: leadCount,
          guaranteeMet: leadCount >= lock.leadGuarantee,
          daysRemaining: Math.ceil((lock.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)),
        };
      })
    );

    res.json({
      success: true,
      contractor: contractor.companyName,
      totalTerritories: locks.length,
      territories: territoriesWithStats,
    });
  } catch (error) {
    console.error('[Territory] My error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/territories/stats - Public stats (for marketing)
router.get('/stats', async (req, res) => {
  try {
    const totalLocks = await TerritoryLock.countDocuments({ status: 'active' });
    const totalZips = 60;
    const totalServices = 15;
    const totalTerritories = totalZips * totalServices;
    
    const topTerritories = await TerritoryLock.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$serviceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      market: 'Las Vegas, NV',
      totalTerritories,
      claimedTerritories: totalLocks,
      availableTerritories: totalTerritories - totalLocks,
      claimRate: ((totalLocks / totalTerritories) * 100).toFixed(1) + '%',
      topServices: topTerritories,
      urgencyMessage: totalLocks > (totalTerritories * 0.3) 
        ? 'Territories are being claimed fast. Lock yours now.'
        : 'Be the first contractor in your zip code.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

function calculateDemandScore(service, zip) {
  // Las Vegas demand heatmap
  const demandMap = {
    'HVAC / Air Conditioning': 10,
    'Pool Service & Repair': 9,
    'Roofing': 8,
    'Plumbing': 8,
    'Solar Installation': 7,
    'Landscaping / Xeriscape': 7,
    'Electrical': 7,
    'Water Damage Restoration': 6,
    'Window / Energy Efficiency': 6,
    'Bathroom Remodel': 5,
    'Kitchen Remodel': 5,
    'Concrete / Cool Decking': 5,
    'Pest Control': 4,
    'Garage Door': 4,
    'Fence Installation': 3,
  };
  
  const zipMultiplier = ['89135', '89138', '89052', '89044'].includes(zip) ? 1.5 :
    ['89178', '89183', '89074', '89141'].includes(zip) ? 1.3 :
    ['89117', '89147', '89149', '89131'].includes(zip) ? 1.1 : 0.9;
  
  return Math.round((demandMap[service] || 5) * zipMultiplier);
}

module.exports = router;
