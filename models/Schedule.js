const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor', required: true, index: true },
  date: { type: Date, required: true, index: true },
  jobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  
  // Time blocks for the day
  timeBlocks: [{
    startTime: { type: String },
    endTime: { type: String },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    type: { type: String, enum: ['job', 'break', 'travel', 'buffer', 'emergency_slot'], default: 'job' },
    status: { type: String, enum: ['available', 'booked', 'tentative', 'blocked'], default: 'available' },
  }],

  // AI-optimized route for the day
  optimizedRoute: {
    isOptimized: { type: Boolean, default: false },
    totalDistance: { type: Number },
    estimatedDriveTime: { type: Number },
    fuelCost: { type: Number },
    route: [{
      jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
      order: { type: Number },
      fromLat: { type: Number },
      fromLng: { type: Number },
      toLat: { type: Number },
      toLng: { type: Number },
      distance: { type: Number },
      estimatedTime: { type: Number },
    }],
    aiRecommendation: { type: String },
    savings: {
      minutesSaved: { type: Number },
      fuelSaved: { type: Number },
      co2Saved: { type: Number },
    },
  },

  // Crew assignments for the day
  crewAssignments: [{
    technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor' },
    technicianName: { type: String },
    assignedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
    startLocation: { lat: Number, lng: Number, address: String },
    endLocation: { lat: Number, lng: Number, address: String },
    totalHours: { type: Number },
  }],

  // Day metadata
  isWorkingDay: { type: Boolean, default: true },
  workingHours: { start: { type: String, default: '08:00' }, end: { type: String, default: '17:00' } },
  totalJobs: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  totalDriveTime: { type: Number, default: 0 },

  // AI insights
  aiInsights: {
    predictedNoShow: { type: Boolean, default: false },
    noShowRisk: { type: Number, default: 0 },
    weatherAlert: { type: String },
    suggestedBuffer: { type: Number },
    revenueOpportunity: { type: Number },
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

scheduleSchema.index({ contractor: 1, date: 1 });

const Schedule = mongoose.model('Schedule', scheduleSchema);
module.exports = { Schedule };
