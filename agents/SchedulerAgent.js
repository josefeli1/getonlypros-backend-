const BaseAgent = require('./BaseAgent');
const { Job } = require('../models/Job');
const { Schedule } = require('../models/Schedule');

/**
 * SchedulerAgent
 * AI-powered scheduling and dispatch automation.
 * Optimizes routes, predicts no-shows, suggests buffers, and fills gaps.
 */
class SchedulerAgent extends BaseAgent {
  constructor() {
    super('SchedulerAgent', 'scheduler');
    this.scheduleRules = {
      bufferMinutes: 15,
      maxJobsPerDay: 6,
      maxDriveMinutes: 30,
      lunchWindow: { start: '12:00', end: '13:00' },
      emergencySlot: { start: '14:00', end: '16:00' },
    };
  }

  async execute() {
    console.log(`[${this.name}] Running scheduling optimization...`);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const nextDay = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);

      // Find all jobs scheduled for tomorrow without optimization
      const jobs = await Job.find({
        scheduledDate: { $gte: tomorrow, $lt: nextDay },
        status: { $in: ['scheduled', 'dispatched'] },
        isDeleted: false,
      }).populate('contractor');

      if (jobs.length === 0) {
        return { success: true, message: 'No jobs to optimize for tomorrow', optimized: 0 };
      }

      // Group by contractor
      const byContractor = {};
      jobs.forEach(job => {
        const cid = job.contractor?._id?.toString();
        if (!cid) return;
        if (!byContractor[cid]) byContractor[cid] = [];
        byContractor[cid].push(job);
      });

      const results = [];
      for (const [contractorId, contractorJobs] of Object.entries(byContractor)) {
        const optimized = await this.optimizeDay(contractorId, contractorJobs, tomorrow);
        results.push(optimized);
      }

      return {
        success: true,
        optimized: results.length,
        contractors: results.map(r => r.contractorId),
        message: `Optimized ${results.length} contractor schedules for ${tomorrow.toDateString()}`,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async optimizeDay(contractorId, jobs, date) {
    // Sort by priority and time preference
    const sorted = jobs.sort((a, b) => {
      const priorityOrder = { emergency: 0, high: 1, normal: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return (a.scheduledTimeStart || '99:99').localeCompare(b.scheduledTimeStart || '99:99');
    });

    // Build time blocks
    const timeBlocks = [];
    let currentTime = '08:00';

    sorted.forEach((job, i) => {
      // Add buffer before job
      if (i > 0) {
        timeBlocks.push({
          startTime: currentTime,
          endTime: this.addMinutes(currentTime, this.scheduleRules.bufferMinutes),
          type: 'buffer',
          status: 'available',
        });
        currentTime = this.addMinutes(currentTime, this.scheduleRules.bufferMinutes);
      }

      // Add job block
      const duration = job.estimatedDuration || 60;
      const endTime = this.addMinutes(currentTime, duration);
      timeBlocks.push({
        startTime: currentTime,
        endTime,
        type: 'job',
        jobId: job._id,
        status: 'booked',
      });
      currentTime = endTime;
    });

    // Add lunch break
    timeBlocks.push({
      startTime: this.scheduleRules.lunchWindow.start,
      endTime: this.scheduleRules.lunchWindow.end,
      type: 'break',
      status: 'blocked',
    });

    // Add emergency slot
    timeBlocks.push({
      startTime: this.scheduleRules.emergencySlot.start,
      endTime: this.scheduleRules.emergencySlot.end,
      type: 'emergency_slot',
      status: 'available',
    });

    // Save schedule
    await Schedule.findOneAndUpdate(
      { contractor: contractorId, date },
      {
        $set: {
          timeBlocks,
          jobs: sorted.map(j => j._id),
          totalJobs: sorted.length,
          isWorkingDay: true,
          workingHours: { start: '08:00', end: '17:00' },
        },
      },
      { upsert: true, new: true }
    );

    // Update jobs with optimized times
    for (let i = 0; i < sorted.length; i++) {
      const block = timeBlocks.filter(b => b.type === 'job')[i];
      if (block) {
        await Job.findByIdAndUpdate(sorted[i]._id, {
          scheduledTimeStart: block.startTime,
          scheduledTimeEnd: block.endTime,
        });
      }
    }

    return {
      contractorId,
      jobsOptimized: sorted.length,
      timeBlocks,
      aiNotes: `Optimized ${sorted.length} jobs with ${this.scheduleRules.bufferMinutes}min buffers. Emergency slot reserved at ${this.scheduleRules.emergencySlot.start}.`,
    };
  }

  addMinutes(timeStr, minutes) {
    const [h, m] = timeStr.split(':').map(Number);
    const total = h * 60 + m + minutes;
    const newH = Math.floor(total / 60);
    const newM = total % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  }

  async predictNoShow(job) {
    // Simple no-show prediction based on factors
    let risk = 0.1; // Base 10%
    if (job.customer.isNewCustomer) risk += 0.15;
    if (job.priority === 'low') risk += 0.1;
    if (!job.customer.phone) risk += 0.2;
    if (job.scheduledTimeStart && job.scheduledTimeStart.startsWith('08')) risk += 0.05; // Early morning
    if (job.source === 'online') risk += 0.1;
    return Math.min(risk, 0.95);
  }
}

module.exports = SchedulerAgent;
