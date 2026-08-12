const express = require('express');
const router = express.Router();
const { CustomerMemory } = require('../models/CustomerMemory');
const { ReputationTracker } = require('../models/ReputationTracker');
const { TerritoryIntel } = require('../models/TerritoryIntel');
const { SubPerformance, SubMarketplace } = require('../models/SubNetwork');
const { Job } = require('../models/Job');

// ============================================
// CUSTOMER MEMORY BANK (Ultimate Lock-in)
// ============================================

// Get all customer memories for a contractor
router.get('/memory', async (req, res) => {
  try {
    const { contractorId, churnRisk, trend, zip, tag, limit = 50 } = req.query;
    const filter = { contractor: contractorId };
    if (churnRisk) filter['aiInsights.churnRisk'] = { $gte: parseFloat(churnRisk) };
    if (trend) filter['relationshipHealth.trend'] = trend;
    if (zip) filter['address.zip'] = zip;
    if (tag) filter.tags = tag;

    const memories = await CustomerMemory.find(filter)
      .sort({ 'lifetimeValue.totalValue': -1 })
      .limit(parseInt(limit));

    res.json({ success: true, count: memories.length, customers: memories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single customer memory with full detail
router.get('/memory/:customerId', async (req, res) => {
  try {
    const { contractorId } = req.query;
    const memory = await CustomerMemory.findOne({
      customer: req.params.customerId,
      contractor: contractorId,
    }).populate('jobs equipment.serviceHistory.jobId');

    if (!memory) return res.status(404).json({ success: false, message: 'Customer not found' });

    res.json({ success: true, customer: memory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add interaction to customer memory
router.post('/memory/:customerId/interaction', async (req, res) => {
  try {
    const { contractorId, type, direction, content, sentiment, channel } = req.body;
    const memory = await CustomerMemory.findOneAndUpdate(
      { customer: req.params.customerId, contractor: contractorId },
      {
        $push: {
          interactions: {
            type, direction, content, sentiment,
            sentimentScore: sentiment === 'very_positive' ? 1 : sentiment === 'positive' ? 0.5 : sentiment === 'negative' ? -0.5 : sentiment === 'very_negative' ? -1 : 0,
            channel,
            createdAt: new Date(),
          },
        },
        $set: { lastContactDate: new Date() },
      },
      { new: true, upsert: true }
    );

    res.json({ success: true, customer: memory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add equipment to customer registry
router.post('/memory/:customerId/equipment', async (req, res) => {
  try {
    const { contractorId, category, name, brand, model, serialNumber, installDate, warrantyMonths } = req.body;
    const memory = await CustomerMemory.findOneAndUpdate(
      { customer: req.params.customerId, contractor: contractorId },
      {
        $push: {
          equipment: {
            category, name, brand, model, serialNumber,
            installDate: installDate ? new Date(installDate) : null,
            warrantyMonths,
            warrantyExpires: warrantyMonths && installDate ? new Date(new Date(installDate).getTime() + warrantyMonths * 30 * 24 * 60 * 60 * 1000) : null,
            lastServiceDate: new Date(),
          },
        },
      },
      { new: true }
    );

    res.json({ success: true, equipment: memory.equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get at-risk customers (churn alerts)
router.get('/memory/alerts/churn', async (req, res) => {
  try {
    const { contractorId, limit = 20 } = req.query;
    const atRisk = await CustomerMemory.find({
      contractor: contractorId,
      $or: [
        { 'relationshipHealth.trend': { $in: ['declining', 'at_risk'] } },
        { 'aiInsights.churnRisk': { $gte: 0.5 } },
        { lastJobDate: { $lte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } },
      ],
    })
      .sort({ 'aiInsights.churnRisk': -1 })
      .limit(parseInt(limit));

    res.json({ success: true, count: atRisk.length, customers: atRisk });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get upsell opportunities
router.get('/memory/opportunities/upsell', async (req, res) => {
  try {
    const { contractorId, limit = 20 } = req.query;
    const customers = await CustomerMemory.find({
      contractor: contractorId,
      'aiInsights.upsellOpportunities.0': { $exists: true },
    })
      .sort({ 'lifetimeValue.totalValue': -1 })
      .limit(parseInt(limit));

    res.json({ success: true, count: customers.length, opportunities: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get equipment nearing warranty expiration
router.get('/memory/alerts/warranty', async (req, res) => {
  try {
    const { contractorId, days = 90 } = req.query;
    const cutoff = new Date(Date.now() + parseInt(days) * 24 * 60 * 60 * 1000);

    const customers = await CustomerMemory.find({
      contractor: contractorId,
      'equipment.warrantyExpires': { $lte: cutoff, $gte: new Date() },
    });

    const alerts = [];
    customers.forEach(c => {
      c.equipment.forEach(e => {
        if (e.warrantyExpires && e.warrantyExpires <= cutoff && e.warrantyExpires >= new Date()) {
          alerts.push({
            customer: c.name,
            customerId: c.customer,
            equipment: e.name,
            warrantyExpires: e.warrantyExpires,
            daysRemaining: Math.ceil((e.warrantyExpires - Date.now()) / (24 * 60 * 60 * 1000)),
          });
        }
      });
    });

    res.json({ success: true, count: alerts.length, alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// REPUTATION ENGINE (Irreplaceable Social Proof)
// ============================================

// Get reputation tracker for contractor
router.get('/reputation/:contractorId', async (req, res) => {
  try {
    let tracker = await ReputationTracker.findOne({ contractor: req.params.contractorId });
    if (!tracker) {
      tracker = new ReputationTracker({ contractor: req.params.contractorId });
      await tracker.save();
    }
    res.json({ success: true, reputation: tracker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add review
router.post('/reputation/:contractorId/review', async (req, res) => {
  try {
    const { platform, rating, comment, reviewerName, verified, reviewerPhoto } = req.body;
    const tracker = await ReputationTracker.findOneAndUpdate(
      { contractor: req.params.contractorId },
      {
        $push: {
          reviews: {
            platform, rating, comment, reviewerName, verified,
            reviewerPhoto,
            aiSentiment: rating >= 4 ? 'positive' : rating >= 3 ? 'neutral' : 'negative',
            aiSentimentScore: (rating - 3) / 2,
            createdAt: new Date(),
          },
        },
      },
      { new: true, upsert: true }
    );

    res.json({ success: true, review: tracker.reviews[tracker.reviews.length - 1] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Respond to review
router.post('/reputation/:contractorId/review/:reviewId/respond', async (req, res) => {
  try {
    const { text, respondedBy } = req.body;
    const tracker = await ReputationTracker.findOne({ contractor: req.params.contractorId });
    if (!tracker) return res.status(404).json({ success: false, message: 'Not found' });

    const review = tracker.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    review.response = { text, respondedAt: new Date(), respondedBy };
    await tracker.save();

    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add before/after photo
router.post('/reputation/:contractorId/photo', async (req, res) => {
  try {
    const { jobId, category, url, caption, serviceCategory } = req.body;
    const tracker = await ReputationTracker.findOneAndUpdate(
      { contractor: req.params.contractorId },
      {
        $push: {
          photoLibrary: { jobId, category, url, caption, serviceCategory, uploadedAt: new Date() },
        },
      },
      { new: true, upsert: true }
    );

    res.json({ success: true, photo: tracker.photoLibrary[tracker.photoLibrary.length - 1] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get case studies
router.get('/reputation/:contractorId/case-studies', async (req, res) => {
  try {
    const tracker = await ReputationTracker.findOne({ contractor: req.params.contractorId });
    if (!tracker) return res.json({ success: true, caseStudies: [] });
    res.json({ success: true, caseStudies: tracker.caseStudies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// TERRITORY INTELLIGENCE (Your Zip = Fortress)
// ============================================

// Get all territories for contractor
router.get('/territory', async (req, res) => {
  try {
    const { contractorId } = req.query;
    const territories = await TerritoryIntel.find({ contractor: contractorId })
      .sort({ 'territoryValue.totalTerritoryValue': -1 });

    res.json({ success: true, count: territories.length, territories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single zip intelligence
router.get('/territory/:zip', async (req, res) => {
  try {
    const { contractorId } = req.query;
    const intel = await TerritoryIntel.findOne({ contractor: contractorId, zipCode: req.params.zip });
    if (!intel) return res.status(404).json({ success: false, message: 'Territory not found' });

    res.json({ success: true, territory: intel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get territory comparison (contractor vs competitors)
router.get('/territory/:zip/comparison', async (req, res) => {
  try {
    const { contractorId } = req.query;
    const allInZip = await TerritoryIntel.find({ zipCode: req.params.zip });
    const mine = allInZip.find(t => t.contractor.toString() === contractorId);

    const comparison = {
      myRank: 0,
      totalContractors: allInZip.length,
      myJobs: mine?.totalJobsInZip || 0,
      myAvgPrice: mine?.pricingCurve?.avgJobValue || 0,
      myMarketShare: mine?.marketShare?.sharePercent || 0,
      competitors: allInZip
        .filter(t => t.contractor.toString() !== contractorId)
        .map(t => ({
          jobs: t.totalJobsInZip,
          avgPrice: t.pricingCurve?.avgJobValue,
          marketShare: t.marketShare?.sharePercent,
        })),
    };

    // Calculate rank
    const sorted = [...allInZip].sort((a, b) => b.totalJobsInZip - a.totalJobsInZip);
    comparison.myRank = sorted.findIndex(t => t.contractor.toString() === contractorId) + 1;

    res.json({ success: true, comparison });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add HOA data
router.post('/territory/:zip/hoa', async (req, res) => {
  try {
    const { contractorId, name, managementCompany, phone, email, approvedVendorList, inspectionRequired, workHours, noiseRestrictions } = req.body;
    const intel = await TerritoryIntel.findOneAndUpdate(
      { contractor: contractorId, zipCode: req.params.zip },
      {
        $push: {
          hoas: {
            name, managementCompany, phone, email,
            approvedVendorList: approvedVendorList || [],
            inspectionRequired, workHours, noiseRestrictions,
            lastUpdated: new Date(),
          },
        },
      },
      { new: true, upsert: true }
    );

    res.json({ success: true, hoa: intel.hoas[intel.hoas.length - 1] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// SUBCONTRACTOR NETWORK (Private Army)
// ============================================

// Get my sub network
router.get('/subnetwork', async (req, res) => {
  try {
    const { contractorId, trade, trustLevel } = req.query;
    const filter = { addedBy: contractorId };
    if (trade) filter.trade = trade;
    if (trustLevel) filter.trustLevel = trustLevel;

    const subs = await SubPerformance.find(filter)
      .populate('subContractor', 'name companyName phone email')
      .sort({ trustScore: -1 });

    res.json({ success: true, count: subs.length, subs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Find subs in marketplace
router.get('/subnetwork/marketplace', async (req, res) => {
  try {
    const { trade, zip, minRating, available } = req.query;
    const filter = {};
    if (trade) filter.trade = trade;
    if (zip) filter.serviceArea = zip;
    if (minRating) filter.overallRating = { $gte: parseFloat(minRating) };
    if (available) filter.currentlyAvailable = true;

    const subs = await SubMarketplace.find(filter)
      .populate('subContractor', 'name companyName phone email')
      .sort({ overallRating: -1 });

    res.json({ success: true, count: subs.length, subs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add sub to my network
router.post('/subnetwork', async (req, res) => {
  try {
    const { contractorId, subContractorId, trade, companyName, contactName, phone, email, licenseNumber, serviceArea } = req.body;
    const perf = new SubPerformance({
      subContractor: subContractorId,
      addedBy: contractorId,
      trade,
      companyName,
      contactName,
      phone,
      email,
      licenseNumber,
      serviceArea: serviceArea || [],
    });
    await perf.save();
    res.json({ success: true, sub: perf });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Rate a sub
router.post('/subnetwork/:subId/rate', async (req, res) => {
  try {
    const { contractorId, overall, timeliness, quality, pricing, communication, comment } = req.body;
    const perf = await SubPerformance.findOneAndUpdate(
      { subContractor: req.params.subId, addedBy: contractorId },
      {
        $push: {
          ratings: { rater: contractorId, overall, timeliness, quality, pricing, communication, comment, date: new Date() },
        },
      },
      { new: true }
    );

    res.json({ success: true, rating: perf.ratings[perf.ratings.length - 1] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Track cross-referral
router.post('/subnetwork/:subId/referral', async (req, res) => {
  try {
    const { contractorId, jobId, value, direction } = req.body; // direction: 'given' or 'received'
    const perf = await SubPerformance.findOne({ subContractor: req.params.subId, addedBy: contractorId });
    if (!perf) return res.status(404).json({ success: false, message: 'Sub not found in network' });

    perf.referrals[direction].push({ jobId, value, date: new Date(), status: 'pending' });
    if (direction === 'given') perf.referrals.totalGivenValue += value;
    else perf.referrals.totalReceivedValue += value;
    perf.referrals.netValue = perf.referrals.totalReceivedValue - perf.referrals.totalGivenValue;

    await perf.save();
    res.json({ success: true, referral: perf.referrals[direction][perf.referrals[direction].length - 1] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// STICKINESS DASHBOARD (Switching Cost Calculator)
// ============================================

router.get('/stickiness/:contractorId', async (req, res) => {
  try {
    const contractorId = req.params.contractorId;

    // Gather all sticky data
    const memories = await CustomerMemory.find({ contractor: contractorId });
    const reputation = await ReputationTracker.findOne({ contractor: contractorId });
    const territories = await TerritoryIntel.find({ contractor: contractorId });
    const subs = await SubPerformance.find({ addedBy: contractorId });

    const customerDataValue = memories.reduce((s, m) => s + (m.dataValue?.totalDataValue || 0), 0);
    const reputationValue = reputation?.reputationValue?.totalReputationValue || 0;
    const territoryValue = territories.reduce((s, t) => s + (t.territoryValue?.totalTerritoryValue || 0), 0);
    const subNetworkValue = subs.reduce((s, sub) => s + (sub.referrals?.netValue || 0), 0);

    const totalSwitchingCost = customerDataValue + reputationValue + territoryValue + subNetworkValue;

    const stickiness = {
      tenure: {
        months: Math.ceil((Date.now() - (memories[0]?.createdAt?.getTime() || Date.now())) / (30 * 24 * 60 * 60 * 1000)),
        totalCustomers: memories.length,
        totalJobs: memories.reduce((s, m) => s + m.totalJobs, 0),
      },
      switchingCost: {
        customerData: customerDataValue,
        reputation: reputationValue,
        territory: territoryValue,
        subNetwork: subNetworkValue,
        total: totalSwitchingCost,
      },
      dataGravity: {
        interactions: memories.reduce((s, m) => s + m.interactionCount, 0),
        equipmentTracked: memories.reduce((s, m) => s + (m.equipment?.length || 0), 0),
        reviews: reputation?.totalReviews || 0,
        caseStudies: reputation?.totalCaseStudies || 0,
        photos: reputation?.totalPhotos || 0,
        zipTerritories: territories.length,
        subsInNetwork: subs.length,
        preferredSubs: subs.filter(s => s.trustLevel === 'preferred').length,
      },
      monthlyValueGrowth: {
        currentMonth: totalSwitchingCost / Math.max(1, Math.ceil((Date.now() - (memories[0]?.createdAt?.getTime() || Date.now())) / (30 * 24 * 60 * 60 * 1000))),
        projectedMonth12: totalSwitchingCost * 2.5,
        projectedMonth24: totalSwitchingCost * 5,
      },
      message: `Leaving would cost $${totalSwitchingCost.toLocaleString()} in lost data, reputation, and network value.`,
    };

    res.json({ success: true, stickiness });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
