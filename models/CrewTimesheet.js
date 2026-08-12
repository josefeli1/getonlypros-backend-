const mongoose = require('mongoose');

const timesheetSchema = new mongoose.Schema({
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor', required: true, index: true },
  contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor', required: true },
  date: { type: Date, required: true, index: true },

  // Clock in/out
  clockIn: {
    time: { type: Date },
    method: { type: String, enum: ['app', 'kiosk', 'manual', 'auto_geofence'], default: 'app' },
    location: { lat: Number, lng: Number, address: String },
    photoUrl: { type: String },
    deviceInfo: { type: String },
  },
  clockOut: {
    time: { type: Date },
    method: { type: String, enum: ['app', 'kiosk', 'manual', 'auto_geofence'], default: 'app' },
    location: { lat: Number, lng: Number, address: String },
    photoUrl: { type: String },
    deviceInfo: { type: String },
  },

  // Job entries (clock in/out per job)
  jobEntries: [{
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    jobNumber: { type: String },
    startTime: { type: Date },
    endTime: { type: Date },
    duration: { type: Number }, // minutes
    clockInLocation: { lat: Number, lng: Number },
    clockOutLocation: { lat: Number, lng: Number },
    travelTime: { type: Number }, // minutes from previous job
    status: { type: String, enum: ['working', 'break', 'lunch', 'travel'], default: 'working' },
    notes: { type: String },
    photos: [{ url: String, caption: String }],
  }],

  // Breaks
  breaks: [{
    startTime: { type: Date },
    endTime: { type: Date },
    duration: { type: Number },
    type: { type: String, enum: ['rest', 'lunch', 'travel', 'other'] },
  }],

  // Totals
  totalHours: { type: Number, default: 0 },
  regularHours: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  totalBreakTime: { type: Number, default: 0 },
  totalTravelTime: { type: Number, default: 0 },

  // Payroll
  hourlyRate: { type: Number },
  overtimeRate: { type: Number },
  totalPay: { type: Number, default: 0 },

  // GPS tracking
  gpsLog: [{
    timestamp: { type: Date },
    lat: { type: Number },
    lng: { type: Number },
    accuracy: { type: Number },
    source: { type: String, enum: ['gps', 'network', 'manual'] },
  }],

  // AI validation
  aiValidation: {
    isValid: { type: Boolean, default: true },
    flags: [{ type: String }],
    anomalies: [{ type: String }],
    suggestedReview: { type: Boolean, default: false },
  },

  status: { type: String, enum: ['active', 'completed', 'pending_review', 'approved', 'rejected'], default: 'active' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  notes: { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

timesheetSchema.index({ technician: 1, date: 1 });

const CrewTimesheet = mongoose.model('CrewTimesheet', timesheetSchema);
module.exports = { CrewTimesheet };
