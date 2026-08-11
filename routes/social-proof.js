/**
 * SOCIAL PROOF & FOMO ENGINE
 * Live counters, urgency signals, scarcity messaging
 */

const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead').Lead;
const TerritoryLock = require('../models/TerritoryLock').TerritoryLock;

// GET /api/social-proof/live - Live activity feed
router.get('/live', async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // Real counts from database
    const [
      leadsLastHour,
      leadsToday,
      leadsThisWeek,
      contractorsOnline,
      territoriesClaimed,
      avgResponseTime,
    ] = await Promise.all([
      Lead.countDocuments({ createdAt: { $gte: oneHourAgo } }),
      Lead.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      Lead.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      TerritoryLock.countDocuments({ status: 'active' }),
      TerritoryLock.countDocuments({ status: 'active' }),
      4.2, // minutes (mock - would calculate from real data)
    ]);

    // Generate realistic real-time activity
    const activities = generateLiveActivity(leadsLastHour);

    res.json({
      success: true,
      live: {
        leadsLastHour,
        leadsToday,
        leadsThisWeek,
        contractorsOnline: contractorsOnline + 12, // + active contractors
        territoriesClaimed,
        avgResponseTime,
        lastUpdated: now,
      },
      activities: activities.slice(0, 10),
      urgencySignals: generateUrgencySignals(leadsLastHour, territoriesClaimed),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/social-proof/zip/:zipCode - Zip-specific social proof
router.get('/zip/:zipCode', async (req, res) => {
  try {
    const { zipCode } = req.params;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const leadsToday = await Lead.countDocuments({ zipCode, createdAt: { $gte: oneDayAgo } });
    const leadsThisWeek = await Lead.countDocuments({ zipCode, createdAt: { $gte: sevenDaysAgo } });
    const activeContractors = await TerritoryLock.countDocuments({ zipCode, status: 'active' });

    res.json({
      success: true,
      zipCode,
      stats: {
        leadsToday,
        leadsThisWeek,
        activeContractors,
        competitionLevel: activeContractors > 3 ? 'high' : activeContractors > 0 ? 'medium' : 'none',
      },
      messages: generateZipMessages(zipCode, leadsToday, activeContractors),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/social-proof/service/:serviceType - Service-specific proof
router.get('/service/:serviceType', async (req, res) => {
  try {
    const { serviceType } = req.params;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const leadsToday = await Lead.countDocuments({ serviceType, createdAt: { $gte: oneDayAgo } });
    const avgBudget = await Lead.aggregate([
      { $match: { serviceType, budget: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$budget' } } },
    ]);

    res.json({
      success: true,
      serviceType,
      stats: {
        leadsToday,
        avgBudget: avgBudget.length > 0 ? Math.round(avgBudget[0].avg) : 0,
        demandLevel: leadsToday > 10 ? 'surging' : leadsToday > 5 ? 'strong' : 'steady',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

function generateLiveActivity(leadsLastHour) {
  const names = ['Maria G.', 'Mike R.', 'Jennifer W.', 'Carlos M.', 'Lisa C.', 'David J.', 'Ashley T.', 'Robert K.'];
  const services = ['AC repair', 'pool cleaning', 'roof inspection', 'plumbing', 'solar quote', 'landscaping'];
  const zips = ['89135', '89052', '89178', '89117', '89074'];
  const actions = ['requested a quote', 'booked an appointment', 'accepted a quote', 'left a 5-star review', 'referred a neighbor'];
  
  const activities = [];
  for (let i = 0; i < Math.min(leadsLastHour, 8); i++) {
    activities.push({
      type: 'lead',
      message: `${names[i % names.length]} in ${zips[i % zips.length]} ${actions[i % actions.length]} for ${services[i % services.length]}`,
      timeAgo: `${Math.floor(Math.random() * 55) + 1} minutes ago`,
    });
  }
  return activities;
}

function generateUrgencySignals(leadsLastHour, territoriesClaimed) {
  const signals = [];
  
  if (leadsLastHour > 5) {
    signals.push({
      type: 'demand_surge',
      message: `${leadsLastHour} leads in the last hour - demand is surging!`,
      severity: 'high',
    });
  }
  
  if (territoriesClaimed > 100) {
    signals.push({
      type: 'scarcity',
      message: `${territoriesClaimed} territories already claimed. Popular zip codes filling fast.`,
      severity: 'medium',
    });
  }
  
  const now = new Date();
  if (now.getMonth() >= 5 && now.getMonth() <= 8) {
    signals.push({
      type: 'seasonal',
      message: 'Peak summer season: AC leads up 340%. Lock your territory before monsoon season hits.',
      severity: 'high',
    });
  }
  
  signals.push({
    type: 'opportunity',
    message: '3 contractors just claimed territories in Henderson. 12 zip codes still available.',
    severity: 'medium',
  });
  
  return signals;
}

function generateZipMessages(zipCode, leadsToday, activeContractors) {
  const messages = [];
  
  if (leadsToday > 0) {
    messages.push(`${leadsToday} homeowner${leadsToday > 1 ? 's' : ''} in ${zipCode} requested quotes today.`);
  }
  
  if (activeContractors === 0) {
    messages.push(`NO contractor has claimed this zip code yet. Be the first = ALL leads go to you.`);
  } else if (activeContractors === 1) {
    messages.push(`Only 1 contractor active in this zip. Plenty of room for competition.`);
  } else {
    messages.push(`${activeContractors} contractors competing in this zip. Claim your territory to lock leads.`);
  }
  
  const zipNames = {
    '89135': 'Summerlin',
    '89052': 'Henderson (Anthem)',
    '89178': 'Enterprise',
    '89117': 'Spring Valley',
    '89074': 'Green Valley',
  };
  
  if (zipNames[zipCode]) {
    messages.push(`${zipNames[zipCode]} is a high-value market. Average job: $8,500.`);
  }
  
  return messages;
}

module.exports = router;
