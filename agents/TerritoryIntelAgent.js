const BaseAgent = require('./BaseAgent');
const { TerritoryIntel } = require('../models/TerritoryIntel');
const { Job } = require('../models/Job');
const { CustomerMemory } = require('../models/CustomerMemory');

/**
 * TerritoryIntelAgent - Your zip becomes your fortress
 * Analyzes every job to build zip code intelligence.
 * The longer you own a zip, the smarter you become about it.
 */
class TerritoryIntelAgent extends BaseAgent {
  constructor() {
    super('TerritoryIntelAgent', 'territory_intel');
    this.seasons = ['winter', 'spring', 'summer', 'fall'];
  }

  async execute() {
    console.log(`[${this.name}] Building territory intelligence...`);
    try {
      const results = { zipsProcessed: 0, competitorsFound: 0, insights: [] };

      // 1. Process recent jobs into territory intelligence
      const recentJobs = await Job.find({
        status: 'completed',
        updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        'customer.address.zip': { $exists: true },
      }).populate('customer contractor');

      const zipMap = new Map();

      for (const job of recentJobs) {
        if (!job.customer?.address?.zip || !job.contractor) continue;

        const zip = job.customer.address.zip;
        const key = `${job.contractor._id}_${zip}`;

        if (!zipMap.has(key)) {
          zipMap.set(key, { contractor: job.contractor._id, zip, jobs: [] });
        }
        zipMap.get(key).jobs.push(job);
      }

      for (const [key, data] of zipMap) {
        let intel = await TerritoryIntel.findOne({
          contractor: data.contractor,
          zipCode: data.zip,
        });

        if (!intel) {
          intel = new TerritoryIntel({
            contractor: data.contractor,
            zipCode: data.zip,
            zipProfile: { city: data.jobs[0].customer.address.city },
          });
        }

        for (const job of data.jobs) {
          // Add to job history
          intel.jobHistory.push({
            jobId: job._id,
            serviceCategory: job.serviceCategory,
            date: job.updatedAt,
            price: job.total,
            customerSatisfaction: job.customerSatisfaction,
            technician: job.assignedCrew?.[0],
            duration: job.actualDuration || job.estimatedDuration,
            season: this.getSeason(job.updatedAt),
          });

          // Update pricing curve
          const category = job.serviceCategory || 'Unknown';
          const prices = intel.jobHistory
            .filter(j => j.serviceCategory === category)
            .map(j => j.price);
          intel.pricingCurve.byCategory.set(category, prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0);
        }

        // Calculate pricing stats
        const allPrices = intel.jobHistory.map(j => j.price).filter(p => p > 0);
        if (allPrices.length > 0) {
          intel.pricingCurve.avgJobValue = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
          intel.pricingCurve.minJobValue = Math.min(...allPrices);
          intel.pricingCurve.maxJobValue = Math.max(...allPrices);
          const sorted = [...allPrices].sort((a, b) => a - b);
          intel.pricingCurve.medianJobValue = sorted[Math.floor(sorted.length / 2)];
        }

        // Update seasonal patterns
        intel.seasonalPatterns.byMonth = this.calculateMonthlyPatterns(intel.jobHistory);
        intel.seasonalPatterns.peakSeasons = this.findPeakSeasons(intel.seasonalPatterns.byMonth);
        intel.seasonalPatterns.slowSeasons = this.findSlowSeasons(intel.seasonalPatterns.byMonth);
        intel.seasonalPatterns.emergencyRate = intel.jobHistory.filter(j => j.serviceCategory?.toLowerCase().includes('emergency')).length / Math.max(1, intel.jobHistory.length);

        // Update customer density
        const customers = await CustomerMemory.find({
          contractor: data.contractor,
          'address.zip': data.zip,
        }).select('address.lat address.lng');

        intel.customerLocations = customers.map(c => ({
          lat: c.address?.lat,
          lng: c.address?.lng,
          customerId: c.customer,
          serviceCount: c.totalJobs,
          lastService: c.lastJobDate,
        })).filter(c => c.lat && c.lng);

        // AI insights
        intel.aiInsights = {
          territoryValue: this.calculateTerritoryValue(intel),
          recommendedInvestment: this.recommendInvestment(intel),
          expansionOpportunities: this.findExpansionOpportunities(intel),
          riskFactors: this.identifyRisks(intel),
          demandForecast: this.forecastDemand(intel),
          optimalServiceMix: this.optimizeServiceMix(intel),
        };

        await intel.save();
        results.zipsProcessed++;
      }

      // 2. Find competitor activity (from public data)
      // In real implementation, this would scrape Angi, Google, etc.
      // For now, flag zips with high competition
      const zipCounts = await TerritoryIntel.aggregate([
        { $group: { _id: '$zipCode', contractorCount: { $sum: 1 } } },
        { $match: { contractorCount: { $gt: 1 } } },
      ]);
      results.competitorsFound = zipCounts.length;

      // Insights
      const totalZips = await TerritoryIntel.countDocuments();
      const totalTerritoryValue = await TerritoryIntel.aggregate([
        { $group: { _id: null, total: { $sum: '$territoryValue.totalTerritoryValue' } } },
      ]);

      results.insights = [
        `Processed ${results.zipsProcessed} zip codes this week`,
        `Total zip territories tracked: ${totalZips}`,
        `Competition detected in ${results.competitorsFound} zip codes`,
        `Total territory intelligence value: $${(totalTerritoryValue[0]?.total || 0).toLocaleString()}`,
        `Average territory value per zip: $${totalZips > 0 ? Math.round((totalTerritoryValue[0]?.total || 0) / totalZips) : 0}`,
      ];

      return {
        success: true,
        ...results,
        message: `Territory intelligence updated: ${results.zipsProcessed} zips processed, ${results.competitorsFound} competitive zips identified.`,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  getSeason(date) {
    const month = date.getMonth();
    if (month >= 11 || month <= 1) return 'winter';
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    return 'fall';
  }

  calculateMonthlyPatterns(jobHistory) {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      jobCount: 0,
      avgPrice: 0,
      topService: '',
    }));

    const serviceCounts = {};
    jobHistory.forEach(job => {
      const month = job.date.getMonth();
      months[month].jobCount++;
      if (job.serviceCategory) {
        serviceCounts[job.serviceCategory] = (serviceCounts[job.serviceCategory] || 0) + 1;
      }
    });

    months.forEach(m => {
      const monthJobs = jobHistory.filter(j => j.date.getMonth() === m.month);
      if (monthJobs.length > 0) {
        m.avgPrice = monthJobs.reduce((s, j) => s + (j.price || 0), 0) / monthJobs.length;
      }
      const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0];
      m.topService = topService ? topService[0] : '';
    });

    return months;
  }

  findPeakSeasons(monthlyData) {
    const avg = monthlyData.reduce((s, m) => s + m.jobCount, 0) / 12;
    return monthlyData
      .filter(m => m.jobCount > avg * 1.3)
      .map(m => this.seasons[Math.floor(m.month / 3)]);
  }

  findSlowSeasons(monthlyData) {
    const avg = monthlyData.reduce((s, m) => s + m.jobCount, 0) / 12;
    return monthlyData
      .filter(m => m.jobCount < avg * 0.7)
      .map(m => this.seasons[Math.floor(m.month / 3)]);
  }

  calculateTerritoryValue(intel) {
    const homeCount = intel.zipProfile?.homeCount || 5000;
    const avgValue = intel.pricingCurve?.avgJobValue || 500;
    const marketShare = intel.marketShare?.sharePercent || 5;
    return Math.round(homeCount * avgValue * (marketShare / 100) * 5); // 5 year value
  }

  recommendInvestment(intel) {
    if (intel.totalJobsInZip < 10) return 'Increase marketing presence - under 10 jobs';
    if (intel.marketShare?.sharePercent < 10) return 'Aggressive growth - market share under 10%';
    if (intel.competitorCount > 5) return 'Defensive positioning - high competition';
    return 'Maintain dominance - strong position';
  }

  findExpansionOpportunities(intel) {
    const ops = [];
    const categories = Array.from(intel.pricingCurve?.byCategory?.keys() || []);
    if (!categories.includes('Maintenance Plan')) ops.push('maintenance_plans');
    if (!categories.includes('Emergency')) ops.push('emergency_service');
    if (intel.zipProfile?.avgHomeValue > 500000) ops.push('premium_services');
    return ops;
  }

  identifyRisks(intel) {
    const risks = [];
    if (intel.competitorCount > 3) risks.push('High competition');
    if (intel.seasonalPatterns?.emergencyRate > 0.4) risks.push('High emergency rate - possible quality issues');
    if (intel.pricingCurve?.avgJobValue < 300) risks.push('Low average ticket - pricing pressure');
    return risks;
  }

  forecastDemand(intel) {
    const history = intel.jobHistory;
    const last30Days = history.filter(j => j.date > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
    const last90Days = history.filter(j => j.date > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)).length;
    const monthlyAvg = history.length / Math.max(1, (Date.now() - (history[0]?.date?.getTime() || Date.now())) / (30 * 24 * 60 * 60 * 1000));

    return {
      next30Days: Math.round(last30Days * 0.8 + monthlyAvg * 0.2),
      next90Days: Math.round(last90Days * 0.6 + monthlyAvg * 3 * 0.4),
      confidence: Math.min(0.9, history.length / 100),
    };
  }

  optimizeServiceMix(intel) {
    const categoryCounts = {};
    intel.jobHistory.forEach(j => {
      categoryCounts[j.serviceCategory] = (categoryCounts[j.serviceCategory] || 0) + 1;
    });

    return Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([service, count]) => ({
        service,
        projectedRevenue: count * (intel.pricingCurve?.byCategory?.get(service) || 500),
      }));
  }
}

module.exports = TerritoryIntelAgent;
