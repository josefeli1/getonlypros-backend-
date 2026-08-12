const mongoose = require('mongoose');

/**
 * CustomerMemory - The ultimate lock-in feature
 * Every interaction, preference, life event, and relationship moment captured forever.
 * After 2 years, this data is worth $50K+ and cannot be exported.
 */
const interactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['call', 'sms', 'email', 'in_person', 'portal', 'review', 'referral', 'complaint', 'compliment', 'emergency'], required: true },
  direction: { type: String, enum: ['inbound', 'outbound'], required: true },
  content: { type: String },
  sentiment: { type: String, enum: ['very_negative', 'negative', 'neutral', 'positive', 'very_positive'] },
  sentimentScore: { type: Number, min: -1, max: 1 },
  createdAt: { type: Date, default: Date.now },
  agent: { type: String }, // AI agent or human
  channel: { type: String, enum: ['phone', 'text', 'email', 'app', 'social', 'in_person'] },
});

const lifeEventSchema = new mongoose.Schema({
  type: { type: String, enum: ['new_home', 'renovation', 'new_baby', 'pool_installed', 'solar_installed', 'aging_parent', 'divorce', 'marriage', 'kids_left', 'downsizing', 'investment_property', 'rental_conversion', 'disaster_damage', 'anniversary'], required: true },
  date: { type: Date },
  detectedAt: { type: Date, default: Date.now },
  source: { type: String, enum: ['social_media', 'customer_told', 'agent_observed', 'permit_data', 'ai_predicted'] },
  notes: { type: String },
  serviceOpportunities: [{ type: String }], // e.g., "babyproofing", "pool maintenance"
});

const preferenceSchema = new mongoose.Schema({
  category: { type: String, enum: ['communication', 'scheduling', 'pricing', 'service_style', 'technician', 'payment'], required: true },
  key: { type: String, required: true },
  value: { type: String, required: true },
  confidence: { type: Number, default: 0.8 },
  learnedFrom: { type: String },
  updatedAt: { type: Date, default: Date.now },
});

const customerMemorySchema = new mongoose.Schema({
  // Identity
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor', required: true, index: true },

  // Contact info (snapshot at time of relationship)
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String, index: true },
    lat: { type: Number },
    lng: { type: Number },
  },

  // Home profile
  propertyType: { type: String, enum: ['single_family', 'condo', 'townhouse', 'apartment', 'duplex', 'commercial', 'multi_family'] },
  yearBuilt: { type: Number },
  squareFootage: { type: Number },
  bedrooms: { type: Number },
  bathrooms: { type: Number },
  stories: { type: Number },
  hoa: { type: String },
  builder: { type: String },
  purchaseDate: { type: Date },
  estimatedValue: { type: Number },

  // Complete interaction history (THE LOCK-IN DATA)
  interactions: [interactionSchema],
  interactionCount: { type: Number, default: 0 },
  lastContactDate: { type: Date },

  // Life events (predictive goldmine)
  lifeEvents: [lifeEventSchema],

  // Learned preferences
  preferences: [preferenceSchema],

  // Equipment registry
  equipment: [{
    category: { type: String, enum: ['hvac', 'water_heater', 'electrical_panel', 'roof', 'plumbing', 'appliance', 'solar', 'pool', 'generator', 'smart_home'] },
    name: { type: String },
    brand: { type: String },
    model: { type: String },
    serialNumber: { type: String },
    installDate: { type: Date },
    installCompany: { type: String },
    warrantyMonths: { type: Number },
    warrantyExpires: { type: Date },
    expectedLifespan: { type: Number }, // months
    lastServiceDate: { type: Date },
    nextServiceDate: { type: Date },
    serviceHistory: [{ jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' }, date: Date, notes: String }],
    photos: [{ url: String, caption: String, date: Date }],
    aiCondition: { type: String, enum: ['excellent', 'good', 'fair', 'poor', 'critical', 'unknown'] },
    aiFailureRisk: { type: Number, min: 0, max: 1 },
    aiRecommendedAction: { type: String },
  }],

  // Job history
  jobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  totalJobs: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  averageJobValue: { type: Number, default: 0 },
  firstJobDate: { type: Date },
  lastJobDate: { type: Date },

  // Referral network
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralsMade: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  referralValue: { type: Number, default: 0 }, // Total revenue from their referrals
  networkSize: { type: Number, default: 0 },

  // Relationship health (AI-calculated)
  relationshipHealth: {
    score: { type: Number, min: 0, max: 100, default: 75 },
    trend: { type: String, enum: ['improving', 'stable', 'declining', 'at_risk', 'lost'], default: 'stable' },
    lastCalculated: { type: Date },
    factors: [{ type: String }],
    riskFlags: [{ type: String }],
  },

  // Lifetime value
  lifetimeValue: {
    directRevenue: { type: Number, default: 0 },
    referralRevenue: { type: Number, default: 0 },
    estimatedFutureValue: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
  },

  // AI insights
  aiInsights: {
    predictedNextService: { type: Date },
    predictedServiceType: { type: String },
    churnRisk: { type: Number, min: 0, max: 1, default: 0.1 },
    upsellOpportunities: [{ type: String }],
    seasonAlerts: [{ type: String }],
    recommendedRetentionAction: { type: String },
  },

  // Tags for quick segmentation
  tags: [{ type: String }],

  // Value tracking for switching cost calculation
  dataValue: {
    interactionsValue: { type: Number, default: 0 },
    equipmentValue: { type: Number, default: 0 },
    historyValue: { type: Number, default: 0 },
    referralValue: { type: Number, default: 0 },
    totalDataValue: { type: Number, default: 0 },
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

customerMemorySchema.index({ contractor: 1, 'relationshipHealth.trend': 1 });
customerMemorySchema.index({ contractor: 1, 'aiInsights.churnRisk': 1 });
customerMemorySchema.index({ 'equipment.warrantyExpires': 1 });
customerMemorySchema.index({ 'equipment.nextServiceDate': 1 });

// Calculate data value before save
customerMemorySchema.pre('save', function(next) {
  this.interactionCount = this.interactions?.length || 0;
  this.totalJobs = this.jobs?.length || 0;
  this.networkSize = this.referralsMade?.length || 0;

  // Calculate data value (the switching cost)
  this.dataValue = {
    interactionsValue: this.interactionCount * 5, // $5 per interaction
    equipmentValue: (this.equipment?.length || 0) * 50, // $50 per equipment tracked
    historyValue: this.totalJobs * 25, // $25 per job history
    referralValue: this.referralValue * 0.5, // 50% of referral revenue value
    totalDataValue: 0,
  };
  this.dataValue.totalDataValue =
    this.dataValue.interactionsValue +
    this.dataValue.equipmentValue +
    this.dataValue.historyValue +
    this.dataValue.referralValue;

  this.updatedAt = new Date();
  next();
});

const CustomerMemory = mongoose.model('CustomerMemory', customerMemorySchema);
module.exports = { CustomerMemory };
