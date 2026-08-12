const BaseAgent = require('./BaseAgent');
const { SubPerformance, SubMarketplace } = require('../models/SubNetwork');
const { Job } = require('../models/Job');

/**
 * SubNetworkAgent - Trusted subcontractor intelligence
 * Tracks sub performance, manages cross-referrals, builds marketplace.
 * Your private army of vetted subs. Leaving = losing your network.
 */
class SubNetworkAgent extends BaseAgent {
  constructor() {
    super('SubNetworkAgent', 'sub_network');
    this.trustThresholds = {
      new: 0,
      verified: 50,
      trusted: 70,
      preferred: 85,
    };
  }

  async execute() {
    console.log(`[${this.name}] Managing subcontractor network...`);
    try {
      const results = { subRatingsUpdated: 0, marketplaceUpdated: 0, crossReferralsTracked: 0, insights: [] };

      // 1. Update sub performance from completed jobs
      const completedJobs = await Job.find({
        status: 'completed',
        updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        subContractor: { $exists: true },
      }).populate('contractor subContractor');

      for (const job of completedJobs) {
        if (!job.subContractor || !job.contractor) continue;

        let perf = await SubPerformance.findOne({
          subContractor: job.subContractor._id,
          addedBy: job.contractor._id,
        });

        if (!perf) {
          perf = new SubPerformance({
            subContractor: job.subContractor._id,
            addedBy: job.contractor._id,
            trade: job.serviceCategory || 'General',
            companyName: job.subContractor.companyName || job.subContractor.name,
          });
        }

        // Update performance stats
        perf.performance.jobsCompleted++;
        perf.performance.onTimeRate = this.calculateOnTimeRate(perf);
        perf.performance.avgJobPrice = this.calculateAvgPrice(perf, job.total);
        perf.performance.callbackRate = this.calculateCallbackRate(perf, job.callbackRequired);

        // Update trust score
        perf.trustScore = this.calculateTrustScore(perf);
        perf.trustLevel = this.getTrustLevel(perf.trustScore);

        await perf.save();
        results.subRatingsUpdated++;
      }

      // 2. Update marketplace aggregations
      const allSubs = await SubPerformance.find();
      const subMap = new Map();

      for (const perf of allSubs) {
        const key = perf.subContractor.toString();
        if (!subMap.has(key)) {
          subMap.set(key, {
            subContractor: perf.subContractor,
            trade: perf.trade,
            serviceArea: perf.serviceArea || [],
            totalContractors: 0,
            totalJobs: 0,
            ratings: [],
            onTimeRates: [],
            qualityScores: [],
            prices: [],
            callbacks: 0,
          });
        }
        const data = subMap.get(key);
        data.totalContractors++;
        data.totalJobs += perf.performance.jobsCompleted;
        data.ratings.push(perf.averageRating);
        data.onTimeRates.push(perf.performance.onTimeRate);
        data.qualityScores.push(perf.performance.qualityScore);
        data.prices.push(perf.performance.avgJobPrice);
        data.callbacks += perf.performance.callbackCount;
      }

      for (const [key, data] of subMap) {
        let marketplace = await SubMarketplace.findOne({ subContractor: data.subContractor });
        if (!marketplace) {
          marketplace = new SubMarketplace({
            subContractor: data.subContractor,
            trade: data.trade,
            serviceArea: data.serviceArea,
          });
        }

        marketplace.totalContractors = data.totalContractors;
        marketplace.totalJobs = data.totalJobs;
        marketplace.overallRating = data.ratings.length > 0 ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length : 0;
        marketplace.onTimeRate = data.onTimeRates.length > 0 ? data.onTimeRates.reduce((a, b) => a + b, 0) / data.onTimeRates.length : 0;
        marketplace.qualityScore = data.qualityScores.length > 0 ? data.qualityScores.reduce((a, b) => a + b, 0) / data.qualityScores.length : 0;
        marketplace.avgPrice = data.prices.length > 0 ? data.prices.reduce((a, b) => a + b, 0) / data.prices.length : 0;
        marketplace.callbackRate = data.totalJobs > 0 ? (data.callbacks / data.totalJobs) * 100 : 0;

        await marketplace.save();
        results.marketplaceUpdated++;
      }

      // 3. Track cross-referrals
      const referralJobs = await Job.find({
        status: 'completed',
        source: 'sub_referral',
        updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }).populate('contractor referredBy');

      for (const job of referralJobs) {
        if (!job.referredBy || !job.contractor) continue;

        let perf = await SubPerformance.findOne({
          subContractor: job.referredBy._id,
          addedBy: job.contractor._id,
        });

        if (perf) {
          perf.referrals.received.push({
            jobId: job._id,
            value: job.total,
            date: job.updatedAt,
            status: 'completed',
          });
          perf.referrals.totalReceivedValue += job.total;
          await perf.save();
          results.crossReferralsTracked++;
        }
      }

      // Insights
      const totalSubs = await SubPerformance.countDocuments();
      const totalMarketplace = await SubMarketplace.countDocuments();
      const preferredSubs = await SubPerformance.countDocuments({ trustLevel: 'preferred' });
      const totalReferralValue = await SubPerformance.aggregate([
        { $group: { _id: null, total: { $sum: '$referrals.netValue' } } },
      ]);

      results.insights = [
        `Updated ${results.subRatingsUpdated} sub performance records`,
        `Marketplace updated: ${results.marketplaceUpdated} subs`,
        `Cross-referrals tracked: ${results.crossReferralsTracked} jobs`,
        `Total subs in network: ${totalSubs}`,
        `Preferred subs: ${preferredSubs}`,
        `Total cross-referral value: $${(totalReferralValue[0]?.total || 0).toLocaleString()}`,
      ];

      return {
        success: true,
        ...results,
        message: `Sub network updated: ${results.subRatingsUpdated} ratings, ${results.marketplaceUpdated} marketplace entries, ${results.crossReferralsTracked} referrals.`,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  calculateOnTimeRate(perf) {
    // Simplified - would track scheduled vs actual completion
    const current = perf.performance.onTimeRate || 0;
    const jobs = perf.performance.jobsCompleted || 1;
    return Math.round(((current * (jobs - 1)) + 95) / jobs); // Assume 95% on-time for latest
  }

  calculateAvgPrice(perf, newPrice) {
    const current = perf.performance.avgJobPrice || 0;
    const jobs = perf.performance.jobsCompleted || 1;
    return Math.round(((current * (jobs - 1)) + newPrice) / jobs);
  }

  calculateCallbackRate(perf, hadCallback) {
    const callbacks = perf.performance.callbackCount || 0;
    const jobs = perf.performance.jobsCompleted || 1;
    return (callbacks / jobs) * 100;
  }

  calculateTrustScore(perf) {
    let score = 50; // Base
    score += (perf.performance.onTimeRate || 0) * 0.2;
    score += (perf.performance.qualityScore || 0) * 0.2;
    score += (perf.performance.communicationScore || 0) * 0.1;
    score += Math.min(20, (perf.performance.jobsCompleted || 0) * 0.5);
    score += (perf.averageRating || 0) * 5;
    score -= (perf.performance.callbackRate || 0) * 0.5;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  getTrustLevel(score) {
    if (score >= this.trustThresholds.preferred) return 'preferred';
    if (score >= this.trustThresholds.trusted) return 'trusted';
    if (score >= this.trustThresholds.verified) return 'verified';
    return 'new';
  }
}

module.exports = SubNetworkAgent;
