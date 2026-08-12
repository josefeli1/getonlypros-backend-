const BaseAgent = require('./BaseAgent');
const { CustomerMemory } = require('../models/CustomerMemory');
const { Job } = require('../models/Job');

/**
 * MemoryBankAgent - The ultimate sticky agent
 * Processes every customer interaction, builds relationship intelligence,
 * detects life events, calculates churn risk, and grows data gravity.
 * The longer a contractor stays, the smarter this agent becomes about their customers.
 */
class MemoryBankAgent extends BaseAgent {
  constructor() {
    super('MemoryBankAgent', 'memory_bank');
    this.churnThresholds = {
      high: 0.7,
      medium: 0.4,
      low: 0.2,
    };
  }

  async execute() {
    console.log(`[${this.name}] Building customer memory bank...`);
    try {
      const results = { processed: 0, lifeEventsDetected: 0, churnAlerts: 0, insights: [] };

      // 1. Process recent jobs into customer memory
      const recentJobs = await Job.find({
        status: 'completed',
        updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }).populate('customer');

      for (const job of recentJobs) {
        if (!job.customer) continue;

        let memory = await CustomerMemory.findOne({
          customer: job.customer._id,
          contractor: job.contractor,
        });

        if (!memory) {
          // Create new customer memory
          memory = new CustomerMemory({
            customer: job.customer._id,
            contractor: job.contractor,
            name: job.customer.name || job.customer.fullName || 'Unknown',
            phone: job.customer.phone,
            email: job.customer.email,
            address: job.customer.address || job.address,
            firstJobDate: job.createdAt,
          });
        }

        // Add job to history
        memory.jobs.push(job._id);
        memory.totalJobs = memory.jobs.length;
        memory.totalSpent = (memory.totalSpent || 0) + (job.total || 0);
        memory.averageJobValue = memory.totalSpent / memory.totalJobs;
        memory.lastJobDate = job.updatedAt;

        // Add interaction record
        memory.interactions.push({
          type: 'in_person',
          direction: 'outbound',
          content: `Completed ${job.serviceCategory}: ${job.title}`,
          sentiment: job.customerSatisfaction >= 4 ? 'positive' : job.customerSatisfaction >= 3 ? 'neutral' : 'negative',
          sentimentScore: (job.customerSatisfaction - 3) / 2 || 0,
          createdAt: job.updatedAt,
          agent: this.name,
          channel: 'app',
        });

        // Detect equipment from job
        if (job.equipment) {
          job.equipment.forEach(eq => {
            const existing = memory.equipment.find(e => e.serialNumber === eq.serialNumber);
            if (!existing) {
              memory.equipment.push({
                category: eq.category,
                name: eq.name,
                brand: eq.brand,
                model: eq.model,
                serialNumber: eq.serialNumber,
                installDate: eq.installDate,
                installCompany: eq.installCompany,
                warrantyMonths: eq.warrantyMonths,
                warrantyExpires: eq.warrantyExpires,
                expectedLifespan: eq.expectedLifespan,
                lastServiceDate: job.updatedAt,
                serviceHistory: [{ jobId: job._id, date: job.updatedAt, notes: job.notes }],
                aiCondition: eq.condition || 'unknown',
              });
            } else {
              existing.lastServiceDate = job.updatedAt;
              existing.serviceHistory.push({ jobId: job._id, date: job.updatedAt, notes: job.notes });
            }
          });
        }

        // Detect life events from job notes
        const lifeEvent = this.detectLifeEvent(job);
        if (lifeEvent) {
          memory.lifeEvents.push(lifeEvent);
          results.lifeEventsDetected++;
        }

        // Learn preferences
        const preferences = this.extractPreferences(job);
        preferences.forEach(pref => {
          const existing = memory.preferences.find(p => p.key === pref.key);
          if (existing) {
            existing.value = pref.value;
            existing.confidence = Math.min(1, existing.confidence + 0.1);
            existing.updatedAt = new Date();
          } else {
            memory.preferences.push(pref);
          }
        });

        // Update relationship health
        memory.relationshipHealth = this.calculateRelationshipHealth(memory);

        // Update lifetime value
        memory.lifetimeValue = {
          directRevenue: memory.totalSpent,
          referralRevenue: memory.referralValue || 0,
          estimatedFutureValue: this.estimateFutureValue(memory),
          totalValue: memory.totalSpent + (memory.referralValue || 0) + this.estimateFutureValue(memory),
        };

        // Update AI insights
        memory.aiInsights = {
          predictedNextService: this.predictNextService(memory),
          predictedServiceType: this.predictServiceType(memory),
          churnRisk: memory.relationshipHealth.trend === 'at_risk' ? 0.8 : memory.relationshipHealth.trend === 'declining' ? 0.5 : 0.2,
          upsellOpportunities: this.findUpsellOpportunities(memory),
          seasonAlerts: this.generateSeasonAlerts(memory),
          recommendedRetentionAction: this.recommendRetention(memory),
        };

        await memory.save();
        results.processed++;
      }

      // 2. Identify at-risk customers
      const atRiskCustomers = await CustomerMemory.find({
        contractor: { $exists: true },
        $or: [
          { 'relationshipHealth.trend': { $in: ['declining', 'at_risk'] } },
          { 'aiInsights.churnRisk': { $gte: 0.5 } },
          { lastJobDate: { $lte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } }, // No job in 6 months
        ],
      }).limit(50);

      results.churnAlerts = atRiskCustomers.length;

      // 3. Generate insights
      const totalMemories = await CustomerMemory.countDocuments();
      const totalDataValue = await CustomerMemory.aggregate([
        { $group: { _id: null, total: { $sum: '$dataValue.totalDataValue' } } },
      ]);

      results.insights = [
        `Processed ${results.processed} jobs into customer memories`,
        `Detected ${results.lifeEventsDetected} life events`,
        `${results.churnAlerts} customers flagged as at-risk`,
        `Total customer memories: ${totalMemories}`,
        `Total data gravity value: $${(totalDataValue[0]?.total || 0).toLocaleString()}`,
        `Average customer data value: $${totalMemories > 0 ? Math.round((totalDataValue[0]?.total || 0) / totalMemories) : 0}`,
      ];

      return {
        success: true,
        ...results,
        message: `Memory bank updated: ${results.processed} jobs processed, ${results.lifeEventsDetected} life events detected, ${results.churnAlerts} churn alerts.`,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  detectLifeEvent(job) {
    const notes = (job.notes || '').toLowerCase();
    const title = (job.title || '').toLowerCase();

    if (notes.includes('new baby') || notes.includes('baby proof') || notes.includes('nursery')) {
      return { type: 'new_baby', date: job.updatedAt, source: 'agent_observed', serviceOpportunities: ['babyproofing', 'air_quality', 'water_safety'] };
    }
    if (notes.includes('pool') || title.includes('pool')) {
      return { type: 'pool_installed', date: job.updatedAt, source: 'agent_observed', serviceOpportunities: ['pool_maintenance', 'pool_heater', 'landscaping'] };
    }
    if (notes.includes('solar') || title.includes('solar')) {
      return { type: 'solar_installed', date: job.updatedAt, source: 'agent_observed', serviceOpportunities: ['battery_backup', 'panel_maintenance', 'electrical_upgrade'] };
    }
    if (notes.includes('just moved') || notes.includes('new home') || notes.includes('purchased')) {
      return { type: 'new_home', date: job.updatedAt, source: 'agent_observed', serviceOpportunities: ['inspection', 'maintenance_plan', 'warranty_review'] };
    }
    if (notes.includes('aging') || notes.includes('elderly') || notes.includes('accessibility')) {
      return { type: 'aging_parent', date: job.updatedAt, source: 'agent_observed', serviceOpportunities: ['accessibility', 'grab_bars', 'walk_in_tub', 'ramp'] };
    }
    if (notes.includes('rental') || notes.includes('investment')) {
      return { type: 'rental_conversion', date: job.updatedAt, source: 'agent_observed', serviceOpportunities: ['property_management', 'annual_inspection'] };
    }
    if (notes.includes('renovation') || notes.includes('remodel') || notes.includes('upgrade')) {
      return { type: 'renovation', date: job.updatedAt, source: 'agent_observed', serviceOpportunities: ['full_service', 'design_consultation'] };
    }
    return null;
  }

  extractPreferences(job) {
    const prefs = [];
    const notes = (job.notes || '').toLowerCase();

    if (notes.includes('morning') || notes.includes('early')) {
      prefs.push({ category: 'scheduling', key: 'preferred_time', value: 'morning', confidence: 0.7, learnedFrom: `job_${job._id}` });
    }
    if (notes.includes('afternoon') || notes.includes('after')) {
      prefs.push({ category: 'scheduling', key: 'preferred_time', value: 'afternoon', confidence: 0.7, learnedFrom: `job_${job._id}` });
    }
    if (notes.includes('text') || notes.includes('sms')) {
      prefs.push({ category: 'communication', key: 'preferred_channel', value: 'text', confidence: 0.8, learnedFrom: `job_${job._id}` });
    }
    if (notes.includes('email')) {
      prefs.push({ category: 'communication', key: 'preferred_channel', value: 'email', confidence: 0.8, learnedFrom: `job_${job._id}` });
    }
    if (notes.includes('call first') || notes.includes('phone')) {
      prefs.push({ category: 'communication', key: 'preferred_channel', value: 'phone', confidence: 0.8, learnedFrom: `job_${job._id}` });
    }
    if (notes.includes('quick') || notes.includes('fast')) {
      prefs.push({ category: 'service_style', key: 'priority', value: 'speed', confidence: 0.6, learnedFrom: `job_${job._id}` });
    }
    if (notes.includes('thorough') || notes.includes('detailed')) {
      prefs.push({ category: 'service_style', key: 'priority', value: 'quality', confidence: 0.6, learnedFrom: `job_${job._id}` });
    }
    if (notes.includes('budget') || notes.includes('cheaper') || notes.includes('affordable')) {
      prefs.push({ category: 'pricing', key: 'sensitivity', value: 'high', confidence: 0.7, learnedFrom: `job_${job._id}` });
    }

    return prefs;
  }

  calculateRelationshipHealth(memory) {
    let score = 75;
    const factors = [];
    const riskFlags = [];

    // Job frequency
    const daysSinceLastJob = memory.lastJobDate ? (Date.now() - memory.lastJobDate.getTime()) / (1000 * 60 * 60 * 24) : 999;
    if (daysSinceLastJob > 365) {
      score -= 30;
      riskFlags.push('No job in over a year');
    } else if (daysSinceLastJob > 180) {
      score -= 15;
      riskFlags.push('No job in 6 months');
    }

    // Satisfaction trend
    const recentInteractions = memory.interactions.slice(-10);
    const negativeCount = recentInteractions.filter(i => i.sentiment === 'negative' || i.sentiment === 'very_negative').length;
    if (negativeCount >= 2) {
      score -= 20;
      riskFlags.push('Multiple recent negative interactions');
    }

    // Total spend
    if (memory.totalSpent > 5000) {
      score += 10;
      factors.push('High lifetime spend');
    }

    // Referrals
    if (memory.referralsMade && memory.referralsMade.length > 0) {
      score += 15;
      factors.push('Active referrer');
    }

    // Equipment tracked
    if (memory.equipment && memory.equipment.length > 0) {
      score += 5;
      factors.push('Equipment registered');
    }

    score = Math.max(0, Math.min(100, score));

    let trend = 'stable';
    if (score >= 85) trend = 'improving';
    else if (score <= 40) trend = 'at_risk';
    else if (score <= 60) trend = 'declining';

    return {
      score,
      trend,
      lastCalculated: new Date(),
      factors,
      riskFlags,
    };
  }

  estimateFutureValue(memory) {
    const avgJobValue = memory.averageJobValue || 500;
    const estimatedJobsPerYear = memory.totalJobs > 0 ? (memory.totalJobs / Math.max(1, (Date.now() - (memory.firstJobDate?.getTime() || Date.now())) / (365 * 24 * 60 * 60 * 1000))) : 1;
    const yearsRemaining = 5; // Assume 5 year relationship
    return avgJobValue * estimatedJobsPerYear * yearsRemaining;
  }

  predictNextService(memory) {
    if (!memory.equipment || memory.equipment.length === 0) return null;
    const soonest = memory.equipment
      .filter(e => e.nextServiceDate)
      .sort((a, b) => a.nextServiceDate - b.nextServiceDate)[0];
    return soonest?.nextServiceDate || null;
  }

  predictServiceType(memory) {
    if (!memory.jobs || memory.jobs.length === 0) return null;
    // Would need to populate jobs to analyze - simplified
    return 'maintenance';
  }

  findUpsellOpportunities(memory) {
    const opportunities = [];
    const hasHVAC = memory.equipment?.some(e => e.category === 'hvac');
    const hasWaterHeater = memory.equipment?.some(e => e.category === 'water_heater');
    const hasPool = memory.lifeEvents?.some(e => e.type === 'pool_installed');

    if (hasHVAC && !memory.equipment?.some(e => e.category === 'smart_home')) {
      opportunities.push('smart_thermostat');
    }
    if (hasWaterHeater && !memory.equipment?.some(e => e.category === 'water_softener')) {
      opportunities.push('water_softener');
    }
    if (hasPool) {
      opportunities.push('pool_heater', 'solar_pool');
    }
    if (memory.totalSpent > 3000 && !memory.tags?.includes('maintenance_plan')) {
      opportunities.push('maintenance_plan');
    }

    return opportunities;
  }

  generateSeasonAlerts(memory) {
    const alerts = [];
    const month = new Date().getMonth();
    const hasHVAC = memory.equipment?.some(e => e.category === 'hvac');
    const hasPool = memory.lifeEvents?.some(e => e.type === 'pool_installed');

    if (hasHVAC && (month >= 4 && month <= 8)) {
      alerts.push('Summer AC maintenance recommended');
    }
    if (hasHVAC && (month >= 10 || month <= 2)) {
      alerts.push('Winter heating check recommended');
    }
    if (hasPool && (month >= 3 && month <= 5)) {
      alerts.push('Pool opening season - offer opening service');
    }

    return alerts;
  }

  recommendRetention(memory) {
    if (memory.relationshipHealth.trend === 'at_risk') {
      return 'Send personalized check-in call + offer free inspection';
    }
    if (memory.relationshipHealth.trend === 'declining') {
      return 'Send maintenance reminder with 15% loyalty discount';
    }
    if (memory.aiInsights.churnRisk > 0.5) {
      return 'Schedule follow-up call within 48 hours';
    }
    return 'Continue regular service schedule';
  }
}

module.exports = MemoryBankAgent;
