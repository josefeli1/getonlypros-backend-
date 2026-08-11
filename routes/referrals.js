/**
 * CONTRACTOR REFERRAL PROGRAM
 * Growth engine: contractors refer other contractors, get free leads
 */

const express = require('express');
const router = express.Router();
const { requireAuth, requireContractor } = require('../middleware/auth');
const User = require('../models/User').User;
const Contractor = require('../models/Contractor').Contractor;

// Referral tiers
const REFERRAL_TIERS = {
  bronze: { minReferrals: 1, reward: 3, label: 'Bronze Partner' },
  silver: { minReferrals: 3, reward: 5, label: 'Silver Partner' },
  gold: { minReferrals: 5, reward: 10, label: 'Gold Partner' },
  platinum: { minReferrals: 10, reward: 20, label: 'Platinum Partner' },
  diamond: { minReferrals: 25, reward: 50, label: 'Diamond Partner' },
};

// POST /api/referrals/invite - Generate referral link
router.post('/invite', requireAuth, requireContractor, async (req, res) => {
  try {
    const contractorId = req.user.userId;
    const contractor = await Contractor.findOne({ userId: contractorId });
    
    if (!contractor) {
      return res.status(404).json({ success: false, message: 'Contractor not found' });
    }
    
    const referralCode = `GOP-${contractor._id.toString().slice(-6).toUpperCase()}`;
    
    res.json({
      success: true,
      referralCode,
      shareLink: `https://getonlypros.com/join?ref=${referralCode}`,
      messageTemplates: [
        `Hey! I'm using GetOnlyPros to get exclusive leads in Las Vegas. Join with my code ${referralCode} and we both get free leads.`,
        `Tired of fighting for leads on Angi? GetOnlyPros gives me exclusive territory. Use code ${referralCode} to join.`,
        `Las Vegas contractors: GetOnlyPros has real-time leads, no shared leads, exclusive zip codes. My code: ${referralCode}`,
      ],
      currentStats: {
        referralsMade: contractor.referralCount || 0,
        leadsEarned: contractor.referralLeadsEarned || 0,
        currentTier: calculateTier(contractor.referralCount || 0),
        nextTier: getNextTier(contractor.referralCount || 0),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/referrals/claim - Claim a referral reward
router.post('/claim', requireAuth, requireContractor, async (req, res) => {
  try {
    const contractorId = req.user.userId;
    const { referralCode } = req.body;
    
    const contractor = await Contractor.findOne({ userId: contractorId });
    if (!contractor) {
      return res.status(404).json({ success: false, message: 'Contractor not found' });
    }
    
    // Validate referral code
    const referrerId = extractReferrerId(referralCode);
    if (!referrerId) {
      return res.status(400).json({ success: false, message: 'Invalid referral code' });
    }
    
    // Check if already claimed
    if (contractor.referredBy) {
      return res.status(409).json({ success: false, message: 'You have already claimed a referral' });
    }
    
    // Get referrer
    const referrer = await Contractor.findById(referrerId);
    if (!referrer) {
      return res.status(404).json({ success: false, message: 'Referrer not found' });
    }
    
    // Update both contractors
    contractor.referredBy = referrerId;
    contractor.referralClaimedAt = new Date();
    contractor.freeLeadsRemaining = (contractor.freeLeadsRemaining || 0) + 5; // New contractor gets 5 free leads
    await contractor.save();
    
    referrer.referralCount = (referrer.referralCount || 0) + 1;
    referrer.referralLeadsEarned = (referrer.referralLeadsEarned || 0) + REFERRAL_TIERS.bronze.reward;
    referrer.freeLeadsRemaining = (referrer.freeLeadsRemaining || 0) + REFERRAL_TIERS.bronze.reward;
    await referrer.save();
    
    res.json({
      success: true,
      message: 'Referral claimed!',
      newContractor: {
        freeLeads: 5,
        message: 'Welcome to GetOnlyPros! You get 5 free exclusive leads to start.',
      },
      referrer: {
        name: referrer.companyName,
        leadsEarned: REFERRAL_TIERS.bronze.reward,
        totalReferrals: referrer.referralCount,
        tier: calculateTier(referrer.referralCount),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/referrals/stats - Referral program stats
router.get('/stats', async (req, res) => {
  try {
    const totalContractors = await Contractor.countDocuments();
    const referredContractors = await Contractor.countDocuments({ referredBy: { $ne: null } });
    
    const topReferrers = await Contractor.find({ referralCount: { $gt: 0 } })
      .sort({ referralCount: -1 })
      .limit(10)
      .select('companyName referralCount referralLeadsEarned');
    
    res.json({
      success: true,
      program: 'GetOnlyPros Contractor Referral Program',
      stats: {
        totalContractors,
        referredContractors,
        referralRate: totalContractors > 0 ? ((referredContractors / totalContractors) * 100).toFixed(1) + '%' : '0%',
        totalFreeLeadsGiven: referredContractors * 5,
      },
      tiers: REFERRAL_TIERS,
      topReferrers: topReferrers.map(c => ({
        company: c.companyName,
        referrals: c.referralCount || 0,
        leadsEarned: c.referralLeadsEarned || 0,
        tier: calculateTier(c.referralCount || 0),
      })),
      howItWorks: [
        'Share your unique referral code with other Las Vegas contractors',
        'When they join using your code, they get 5 FREE leads',
        'You get 3-50 FREE leads depending on your tier',
        'No limit on referrals. Refer 25 = Diamond = 50 free leads each',
      ],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/referrals/my - My referral stats
router.get('/my', requireAuth, requireContractor, async (req, res) => {
  try {
    const contractorId = req.user.userId;
    const contractor = await Contractor.findOne({ userId: contractorId });
    
    if (!contractor) {
      return res.status(404).json({ success: false, message: 'Contractor not found' });
    }
    
    const tier = calculateTier(contractor.referralCount || 0);
    const nextTier = getNextTier(contractor.referralCount || 0);
    
    res.json({
      success: true,
      myStats: {
        companyName: contractor.companyName,
        referralCode: `GOP-${contractor._id.toString().slice(-6).toUpperCase()}`,
        referralsMade: contractor.referralCount || 0,
        leadsEarned: contractor.referralLeadsEarned || 0,
        freeLeadsRemaining: contractor.freeLeadsRemaining || 0,
        currentTier: tier,
        nextTier,
        progressToNext: nextTier ? `${contractor.referralCount || 0}/${nextTier.minReferrals}` : 'Max tier reached!',
      },
      earningsProjection: {
        ifRefer5More: (contractor.referralCount || 0) + 5 >= 5 ? 'Gold tier = 10 free leads per referral' : 'Keep referring!',
        monthlyEstimate: ((contractor.referralCount || 0) * (tier ? tier.reward : 0)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

function calculateTier(count) {
  if (count >= 25) return REFERRAL_TIERS.diamond;
  if (count >= 10) return REFERRAL_TIERS.platinum;
  if (count >= 5) return REFERRAL_TIERS.gold;
  if (count >= 3) return REFERRAL_TIERS.silver;
  return REFERRAL_TIERS.bronze;
}

function getNextTier(count) {
  if (count >= 25) return null;
  if (count >= 10) return REFERRAL_TIERS.diamond;
  if (count >= 5) return REFERRAL_TIERS.platinum;
  if (count >= 3) return REFERRAL_TIERS.gold;
  if (count >= 1) return REFERRAL_TIERS.silver;
  return REFERRAL_TIERS.bronze;
}

function extractReferrerId(code) {
  if (!code || !code.startsWith('GOP-')) return null;
  // In production, this would look up the code in a database
  // For now, we use a simplified approach
  return code.slice(4);
}

module.exports = router;
