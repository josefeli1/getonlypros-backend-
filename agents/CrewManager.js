const BaseAgent = require('./BaseAgent');
const { Job } = require('../models/Job');
const { CrewTimesheet } = require('../models/CrewTimesheet');

/**
 * CrewManager Agent
 * AI-powered crew management:
 * - Auto-assigns jobs to crew based on skills, location, availability
 * - Tracks crew performance
 * - Predicts overtime
 * - Suggests crew changes
 * - Validates timesheets with AI anomaly detection
 */
class CrewManager extends BaseAgent {
  constructor() {
    super('CrewManager', 'crew_manager');
    this.maxDailyHours = 10;
    this.maxWeeklyHours = 50;
    this.overtimeThreshold = 8;
  }

  async execute() {
    console.log(`[${this.name}] Running crew management optimization...`);
    try {
      const results = { assigned: 0, alerts: [], validated: 0, insights: [] };

      // 1. Find unassigned jobs for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const nextDay = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);

      const unassignedJobs = await Job.find({
        scheduledDate: { $gte: tomorrow, $lt: nextDay },
        status: { $in: ['scheduled', 'dispatched'] },
        $or: [
          { assignedCrew: { $exists: false } },
          { assignedCrew: { $size: 0 } },
        ],
        isDeleted: false,
      }).limit(20);

      for (const job of unassignedJobs) {
        // Get contractor crew members (simplified - would query contractor team)
        const crew = await this.getAvailableCrew(job.contractor, tomorrow);
        if (crew.length > 0) {
          // Assign best crew member based on proximity, skills, workload
          const bestCrew = this.selectBestCrew(crew, job);
          job.assignedCrew = bestCrew.map(c => c._id);
          job.primaryTechnician = bestCrew[0]._id;
          await job.save();
          results.assigned++;
        }
      }

      // 2. Validate today's timesheets for anomalies
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const timesheets = await CrewTimesheet.find({ date: today }).populate('technician');

      for (const ts of timesheets) {
        const anomalies = this.detectAnomalies(ts);
        if (anomalies.length > 0) {
          ts.aiValidation = {
            isValid: false,
            flags: anomalies,
            anomalies,
            suggestedReview: true,
          };
          await ts.save();
          results.alerts.push({ technician: ts.technician?.name, anomalies });
        }
        results.validated++;
      }

      // 3. Generate crew insights
      const weekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
      const weekTimesheets = await CrewTimesheet.find({ date: { $gte: weekStart } });
      const totalHours = weekTimesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0);
      const avgHours = weekTimesheets.length > 0 ? totalHours / weekTimesheets.length : 0;
      const overtimeCount = weekTimesheets.filter(ts => ts.overtimeHours > 0).length;

      results.insights = [
        `Crew logged ${totalHours.toFixed(1)} hours this week (avg ${avgHours.toFixed(1)} per tech)`,
        `${overtimeCount} technicians have overtime hours this week`,
        `Average job completion time: ${results.avgJobTime || 'N/A'}`,
        `Recommended: ${overtimeCount > 2 ? 'Add 1 more technician to reduce overtime costs' : 'Crew capacity is optimal'}`,
      ];

      return {
        success: true,
        ...results,
        message: `Assigned ${results.assigned} jobs, validated ${results.validated} timesheets, found ${results.alerts.length} anomalies.`,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getAvailableCrew(contractorId, date) {
    // This would query the contractor's team members
    // For now, return a placeholder that the contractor would populate
    // In real implementation, this queries Contractor model for team members
    return []; // Placeholder - crew data comes from contractor team collection
  }

  selectBestCrew(crew, job) {
    // Score each crew member
    const scored = crew.map(member => {
      let score = 0;
      // Proximity score (if location data available)
      if (member.homeLocation && job.customer.lat) {
        const dist = Math.sqrt(
          Math.pow((member.homeLocation.lat - job.customer.lat) * 69, 2) +
          Math.pow((member.homeLocation.lng - job.customer.lng) * 54.6, 2)
        );
        score += Math.max(0, 20 - dist); // Closer = higher score
      }
      // Skill match
      if (member.skills && job.serviceCategory) {
        if (member.skills.includes(job.serviceCategory)) score += 30;
      }
      // Workload (fewer hours = better)
      if (member.todayHours !== undefined) {
        score += Math.max(0, 20 - member.todayHours);
      }
      // Rating
      score += (member.rating || 4.5) * 4;
      return { ...member, score };
    });

    // Sort by score descending, take top 2
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 2);
  }

  detectAnomalies(timesheet) {
    const anomalies = [];
    if (!timesheet.clockIn || !timesheet.clockIn.time) {
      anomalies.push('Missing clock-in time');
    }
    if (!timesheet.clockOut || !timesheet.clockOut.time) {
      anomalies.push('Missing clock-out time');
    }
    if (timesheet.totalHours > 12) {
      anomalies.push(`Excessive hours: ${timesheet.totalHours}h (max expected: 12h)`);
    }
    if (timesheet.totalHours > 0 && timesheet.totalHours < 2) {
      anomalies.push(`Very short day: ${timesheet.totalHours}h (possible missed clock-out yesterday)`);
    }
    if (timesheet.jobEntries) {
      timesheet.jobEntries.forEach(entry => {
        if (entry.duration > 480) { // 8 hours
          anomalies.push(`Job ${entry.jobNumber} shows ${Math.round(entry.duration / 60)}h (verify)`);
        }
        if (entry.duration && entry.duration < 15) {
          anomalies.push(`Job ${entry.jobNumber} shows only ${entry.duration}min (possible quick clock-out)`);
        }
      });
    }
    // GPS anomaly: if clock-in and first job location differ by > 50 miles
    if (timesheet.clockIn?.location && timesheet.jobEntries?.[0]?.clockInLocation) {
      const gpsDist = Math.sqrt(
        Math.pow((timesheet.clockIn.location.lat - timesheet.jobEntries[0].clockInLocation.lat) * 69, 2) +
        Math.pow((timesheet.clockIn.location.lng - timesheet.jobEntries[0].clockInLocation.lng) * 54.6, 2)
      );
      if (gpsDist > 50) {
        anomalies.push(`GPS anomaly: Clock-in location ${gpsDist.toFixed(1)} miles from first job`);
      }
    }
    return anomalies;
  }

  async predictOvertime(technicianId, weekStart) {
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const timesheets = await CrewTimesheet.find({
      technician: technicianId,
      date: { $gte: weekStart, $lt: weekEnd },
    });
    const totalHours = timesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0);
    const remainingCapacity = this.maxWeeklyHours - totalHours;
    return {
      totalHours,
      remainingCapacity,
      willHitOvertime: totalHours > this.overtimeThreshold * 5, // More than 40 regular hours
      predictedOvertime: Math.max(0, totalHours - this.overtimeThreshold * 5),
      recommendation: remainingCapacity < 10 ? 'Reduce assignments or schedule another tech' : 'Capacity available',
    };
  }
}

module.exports = CrewManager;
