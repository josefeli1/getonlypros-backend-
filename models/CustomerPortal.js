const mongoose = require('mongoose');

const customerPortalSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor', required: true },

  // Jobs
  jobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  activeJobs: { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },

  // Proposals
  proposals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Proposal' }],
  pendingProposals: { type: Number, default: 0 },

  // Invoices
  invoices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' }],
  outstandingBalance: { type: Number, default: 0 },
  lastPayment: { type: Date },

  // Preferences
  preferences: {
    notificationChannel: { type: String, enum: ['sms', 'email', 'push', 'all'], default: 'all' },
    appointmentReminders: { type: Boolean, default: true },
    textOptIn: { type: Boolean, default: true },
    emailOptIn: { type: Boolean, default: true },
    preferredTimeWindow: { type: String, default: 'morning' },
  },

  // Property info
  properties: [{
    nickname: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
    },
    lat: { type: Number },
    lng: { type: Number },
    propertyType: { type: String, enum: ['single_family', 'condo', 'townhouse', 'apartment', 'commercial'] },
    yearBuilt: { type: Number },
    squareFootage: { type: Number },
    hoa: { type: String },
    notes: { type: String },
  }],

  // Equipment/warranty tracking
  equipment: [{
    name: { type: String },
    brand: { type: String },
    model: { type: String },
    serialNumber: { type: String },
    installedDate: { type: Date },
    warrantyExpires: { type: Date },
    lastServiceDate: { type: Date },
    nextServiceDate: { type: Date },
    serviceHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  }],

  // Loyalty
  loyaltyPoints: { type: Number, default: 0 },
  referralCount: { type: Number, default: 0 },
  referralRewards: { type: Number, default: 0 },

  // Reviews
  reviewHistory: [{
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    rating: { type: Number },
    comment: { type: String },
    createdAt: { type: Date },
    platform: { type: String },
  }],

  // AI insights
  aiInsights: {
    predictedNextService: { type: Date },
    recommendedServices: [{ type: String }],
    seasonalAlerts: [{ type: String }],
    estimatedPropertyValue: { type: Number },
    lifetimeValue: { type: Number, default: 0 },
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

customerPortalSchema.index({ customer: 1, contractor: 1 });

const CustomerPortal = mongoose.model('CustomerPortal', customerPortalSchema);
module.exports = { CustomerPortal };
