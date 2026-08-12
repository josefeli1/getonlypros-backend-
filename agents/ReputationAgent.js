const BaseAgent = require('./BaseAgent');
const { ReputationTracker } = require('../models/ReputationTracker');
const { Job } = require('../models/Job');

/**
 * ReputationAgent - Compounding social proof engine
 * Auto-requests reviews at perfect moments, builds case studies,
 * tracks review impact, and grows irreplaceable reputation capital.
 */
class ReputationAgent extends BaseAgent {
  constructor() {
    super('ReputationAgent', 'reputation');
    this.reviewRequestDelays = [2, 24, 72, 168]; // hours after job completion
    this.platforms = ['google', 'yelp', 'facebook', 'nextdoor', 'getonlypros'];
  }

  async execute() {
    console.log(`[${this.name}] Building reputation capital...`);
    try {
      const results = { reviewRequestsSent: 0, caseStudiesBuilt: 0, alerts: 0, insights: [] };

      // 1. Find jobs ready for review requests
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const completedJobs = await Job.find({
        status: 'completed',
        customerSatisfaction: { $gte: 4 },
        updatedAt: { $lte: twoHoursAgo, $gte: oneDayAgo },
        'reviewRequest.sent': { $ne: true },
      }).populate('customer contractor');

      for (const job of completedJobs) {
        if (!job.customer || !job.contractor) continue;

        let tracker = await ReputationTracker.findOne({ contractor: job.contractor._id });
        if (!tracker) {
          tracker = new ReputationTracker({ contractor: job.contractor._id });
        }

        // Check if already requested
        const alreadyRequested = tracker.reviewRequests.some(
          r => r.jobId.toString() === job._id.toString()
        );
        if (alreadyRequested) continue;

        // Determine best platform
        const bestPlatform = this.selectBestPlatform(tracker);

        // Send review request (would integrate with SMS/email service)
        tracker.reviewRequests.push({
          jobId: job._id,
          customerId: job.customer._id,
          sentAt: new Date(),
          channel: 'sms',
          status: 'sent',
          reminderCount: 0,
        });

        await tracker.save();
        results.reviewRequestsSent++;
      }

      // 2. Build case studies from jobs with before/after photos
      const jobsWithPhotos = await Job.find({
        status: 'completed',
        'photos.0': { $exists: true },
        customerSatisfaction: { $gte: 4.5 },
        total: { $gte: 1000 },
      }).populate('customer contractor').limit(20);

      for (const job of jobsWithPhotos) {
        if (!job.contractor) continue;

        let tracker = await ReputationTracker.findOne({ contractor: job.contractor._id });
        if (!tracker) {
          tracker = new ReputationTracker({ contractor: job.contractor._id });
        }

        // Check if case study already exists for this job
        const alreadyBuilt = tracker.caseStudies.some(
          c => c.jobId && c.jobId.toString() === job._id.toString()
        );
        if (alreadyBuilt) continue;

        const beforePhotos = job.photos.filter(p => p.type === 'before');
        const afterPhotos = job.photos.filter(p => p.type === 'after');

        if (beforePhotos.length > 0 && afterPhotos.length > 0) {
          tracker.caseStudies.push({
            title: `${job.serviceCategory} Transformation - ${job.customer?.name || 'Customer'}`,
            description: job.description,
            serviceCategory: job.serviceCategory,
            jobId: job._id,
            customerName: job.customer?.name,
            beforePhotos: beforePhotos.map(p => ({ url: p.url, caption: p.caption })),
            afterPhotos: afterPhotos.map(p => ({ url: p.url, caption: p.caption })),
            problem: job.description,
            solution: job.notes,
            results: `Completed in ${job.actualDuration || job.estimatedDuration} minutes. Customer satisfaction: ${job.customerSatisfaction}/5`,
            timeline: `${job.scheduledDate} - ${job.completedAt || job.updatedAt}`,
            cost: job.total,
            customerQuote: job.customerFeedback || '',
            aiGenerated: true,
          });

          await tracker.save();
          results.caseStudiesBuilt++;
        }
      }

      // 3. Calculate reputation scores
      const allTrackers = await ReputationTracker.find();
      for (const tracker of allTrackers) {
        if (tracker.reviews.length === 0) continue;

        const reviews = tracker.reviews;
        const total = reviews.length;
        const avg = reviews.reduce((s, r) => s + r.rating, 0) / total;

        // Response rate
        const responded = reviews.filter(r => r.response && r.response.text).length;
        const responseRate = (responded / total) * 100;

        // Sentiment trend (last 10 vs first 10)
        const recent = reviews.slice(-10);
        const early = reviews.slice(0, 10);
        const recentAvg = recent.reduce((s, r) => s + r.rating, 0) / recent.length;
        const earlyAvg = early.reduce((s, r) => s + r.rating, 0) / early.length;
        const sentimentTrend = ((recentAvg - earlyAvg) / earlyAvg) * 100 + 50;

        // Photo/video quality
        const photoScore = Math.min(100, (tracker.totalPhotos / 50) * 100);
        const videoScore = Math.min(100, ((tracker.videoTestimonials?.length || 0) / 10) * 100);

        tracker.reputationScore = {
          overall: Math.round(avg * 20),
          reviewQuality: Math.round((reviews.filter(r => r.verified).length / total) * 100),
          reviewQuantity: Math.min(100, (total / 200) * 100),
          responseRate: Math.round(responseRate),
          sentimentTrend: Math.max(0, Math.min(100, Math.round(sentimentTrend))),
          photoQuality: Math.round(photoScore),
          videoPresence: Math.round(videoScore),
          lastCalculated: new Date(),
        };

        // Estimate revenue from reviews
        const estimatedRevenue = total * 150; // $150 estimated value per review
        tracker.aiInsights = {
          ...tracker.aiInsights,
          estimatedRevenueFromReviews: estimatedRevenue,
          reviewConversionRate: total > 0 ? (tracker.reviews.filter(r => r.impact.conversions > 0).length / total) : 0,
          recommendedActions: this.generateRecommendations(tracker),
        };

        await tracker.save();
      }

      // 4. Identify reputation risks
      const lowResponseTrackers = allTrackers.filter(t =>
        t.reviews.length > 5 && t.reputationScore.responseRate < 50
      );
      results.alerts = lowResponseTrackers.length;

      // Insights
      const totalReviews = allTrackers.reduce((s, t) => s + t.totalReviews, 0);
      const totalCaseStudies = allTrackers.reduce((s, t) => s + t.totalCaseStudies, 0);
      const totalValue = allTrackers.reduce((s, t) => s + (t.reputationValue?.totalReputationValue || 0), 0);

      results.insights = [
        `Sent ${results.reviewRequestsSent} review requests today`,
        `Built ${results.caseStudiesBuilt} new case studies`,
        `Total reviews across platform: ${totalReviews}`,
        `Total case studies: ${totalCaseStudies}`,
        `Total reputation value: $${totalValue.toLocaleString()}`,
        `${results.alerts} contractors need to respond to more reviews`,
      ];

      return {
        success: true,
        ...results,
        message: `Reputation capital grown: ${results.reviewRequestsSent} requests sent, ${results.caseStudiesBuilt} case studies built.`,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  selectBestPlatform(tracker) {
    // Select platform with lowest review count to balance presence
    const counts = {};
    this.platforms.forEach(p => counts[p] = 0);
    tracker.reviews.forEach(r => {
      if (counts[r.platform] !== undefined) counts[r.platform]++;
    });

    const sorted = Object.entries(counts).sort((a, b) => a[1] - b[1]);
    return sorted[0][0];
  }

  generateRecommendations(tracker) {
    const recs = [];
    if (tracker.reviews.length < 10) {
      recs.push('Focus on review generation - under 10 reviews');
    }
    if (tracker.reputationScore.responseRate < 80) {
      recs.push('Respond to all reviews within 24 hours');
    }
    if (tracker.totalPhotos < 20) {
      recs.push('Add before/after photos to every job');
    }
    if (tracker.totalCaseStudies < 3) {
      recs.push('Build case studies for top 5 jobs');
    }
    if (tracker.reputationScore.sentimentTrend < 50) {
      recs.push('Review recent negative feedback for patterns');
    }
    return recs;
  }
}

module.exports = ReputationAgent;
