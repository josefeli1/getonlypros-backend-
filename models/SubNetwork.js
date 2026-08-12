const mongoose = require('mongoose');

/**
 * SubNetwork - Trusted subcontractor marketplace
 * Performance database, cross-referrals, joint ventures.
 * Your private army of vetted subs. Leaving = starting over.
 */
const subPerformanceSchema = new mongoose.Schema({
  subContractor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor', required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor', required: true },

  // Basic info
  trade: { type: String, required: true }, // plumbing, electrical, roofing, etc.
  companyName: { type: String },
  contactName: { type: String },
  phone: { type: String },
  email: { type: String },
  licenseNumber: { type: String },
  insuranceExpires: { type: Date },
  serviceArea: [{ type: String }], // zip codes

  // Performance tracking
  performance: {
    jobsCompleted: { type: Number, default: 0 },
    jobsReferred: { type: Number, default: 0 },
    onTimeRate: { type: Number, default: 0 }, // 0-100
    qualityScore: { type: Number, default: 0 }, // 0-100
    communicationScore: { type: Number, default: 0 }, // 0-100
    callbackRate: { type: Number, default: 0 }, // 0-100
    avgResponseTime: { type: Number }, // minutes
    avgJobPrice: { type: Number },
    callbackCount: { type: Number, default: 0 },
    complaintCount: { type: Number, default: 0 },
    praiseCount: { type: Number, default: 0 },
  },

  // Ratings from multiple contractors
  ratings: [{
    rater: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor' },
    overall: { type: Number, min: 1, max: 5 },
    timeliness: { type: Number, min: 1, max: 5 },
    quality: { type: Number, min: 1, max: 5 },
    pricing: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    date: { type: Date, default: Date.now },
  }],
  averageRating: { type: Number, default: 0 },

  // Cross-referral tracking
  referrals: {
    given: [{ // I referred jobs to this sub
      jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
      value: { type: Number },
      date: { type: Date },
      status: { type: String, enum: ['pending', 'completed', 'cancelled'] },
    }],
    received: [{ // This sub referred jobs to me
      jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
      value: { type: Number },
      date: { type: Date },
      status: { type: String, enum: ['pending', 'completed', 'cancelled'] },
    }],
    totalGivenValue: { type: Number, default: 0 },
    totalReceivedValue: { type: Number, default: 0 },
    netValue: { type: Number, default: 0 },
  },

  // Joint ventures
  jointVentures: [{
    partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor' },
    projectName: { type: String },
    totalValue: { type: Number },
    splitPercent: { type: Number },
    status: { type: String, enum: ['planning', 'active', 'completed', 'cancelled'] },
    startDate: { type: Date },
    endDate: { type: Date },
  }],

  // Trust level
  trustLevel: { type: String, enum: ['new', 'verified', 'trusted', 'preferred', 'blacklisted'], default: 'new' },
  trustScore: { type: Number, min: 0, max: 100, default: 50 },

  // Emergency availability
  emergencyAvailable: { type: Boolean, default: false },
  emergencyResponseTime: { type: Number }, // minutes

  // Notes
  notes: { type: String },
  tags: [{ type: String }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Aggregate sub marketplace view
const subMarketplaceSchema = new mongoose.Schema({
  subContractor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor', required: true, index: true },
  trade: { type: String, required: true, index: true },
  serviceArea: [{ type: String, index: true }], // zip codes

  // Aggregated stats across ALL contractors who've used this sub
  totalContractors: { type: Number, default: 0 },
  totalJobs: { type: Number, default: 0 },
  overallRating: { type: Number, default: 0 },
  onTimeRate: { type: Number, default: 0 },
  qualityScore: { type: Number, default: 0 },
  avgPrice: { type: Number, default: 0 },
  callbackRate: { type: Number, default: 0 },

  // Availability
  currentlyAvailable: { type: Boolean, default: true },
  nextAvailableDate: { type: Date },
  typicalLeadTime: { type: Number }, // days

  // Featured status
  featured: { type: Boolean, default: false },
  featuredUntil: { type: Date },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

subPerformanceSchema.index({ addedBy: 1, trade: 1 });
subPerformanceSchema.index({ trustLevel: 1 });
subMarketplaceSchema.index({ trade: 1, serviceArea: 1 });

subPerformanceSchema.pre('save', function(next) {
  if (this.ratings && this.ratings.length > 0) {
    this.averageRating = (this.ratings.reduce((s, r) => s + r.overall, 0) / this.ratings.length).toFixed(2);
  }
  this.referrals.netValue = (this.referrals.totalReceivedValue || 0) - (this.referrals.totalGivenValue || 0);
  this.updatedAt = new Date();
  next();
});

const SubPerformance = mongoose.model('SubPerformance', subPerformanceSchema);
const SubMarketplace = mongoose.model('SubMarketplace', subMarketplaceSchema);
module.exports = { SubPerformance, SubMarketplace };
