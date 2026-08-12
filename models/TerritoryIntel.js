const mongoose = require('mongoose');

/**
 * TerritoryIntel - Zip code becomes your fortress
 * Every job deepens intelligence about a specific neighborhood.
 * After 2 years, you know your zip better than anyone.
 */
const territoryIntelSchema = new mongoose.Schema({
  contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor', required: true, index: true },
  zipCode: { type: String, required: true, index: true },

  // Zip code DNA
  zipProfile: {
    city: { type: String },
    county: { type: String },
    neighborhood: { type: String },
    avgHomeValue: { type: Number },
    medianIncome: { type: Number },
    homeCount: { type: Number },
    avgHomeAge: { type: Number },
    dominantBuilder: { type: String },
    dominantHvacType: { type: String },
    commonRoofType: { type: String },
    commonIssues: [{ type: String }], // e.g., "hard_water", "old_wiring"
    climateZone: { type: String },
    floodZone: { type: String },
    schoolRating: { type: Number },
    crimeIndex: { type: Number },
  },

  // HOA database
  hoas: [{
    name: { type: String, required: true },
    managementCompany: { type: String },
    phone: { type: String },
    email: { type: String },
    approvedVendorList: [{ type: String }],
    inspectionRequired: { type: Boolean, default: false },
    inspectionFee: { type: Number },
    noiseRestrictions: { type: String },
    workHours: { type: String },
    parkingRules: { type: String },
    fenceRules: { type: String },
    commonAreas: [{ type: String }],
    notes: { type: String },
    lastUpdated: { type: Date, default: Date.now },
  }],

  // Job history in this zip
  jobHistory: [{
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    serviceCategory: { type: String },
    date: { type: Date },
    price: { type: Number },
    customerSatisfaction: { type: Number },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    duration: { type: Number }, // minutes
    materials: [{ type: String }],
    issues: [{ type: String }],
    season: { type: String },
  }],
  totalJobsInZip: { type: Number, default: 0 },

  // Pricing intelligence
  pricingCurve: {
    avgJobValue: { type: Number, default: 0 },
    minJobValue: { type: Number, default: 0 },
    maxJobValue: { type: Number, default: 0 },
    medianJobValue: { type: Number, default: 0 },
    byCategory: { type: Map, of: Number }, // { "AC Repair": 450, "Water Heater": 1200 }
    priceSensitivity: { type: String, enum: ['low', 'medium', 'high'] },
    willingnessToPay: { type: Number }, // 0-100 score
  },

  // Seasonal patterns
  seasonalPatterns: {
    byMonth: [{ month: Number, jobCount: Number, avgPrice: Number, topService: String }],
    peakSeasons: [{ type: String }],
    slowSeasons: [{ type: String }],
    emergencyRate: { type: Number }, // % of jobs that are emergency
  },

  // Competitor tracking
  competitors: [{
    name: { type: String },
    estimatedCrewSize: { type: Number },
    reviewCount: { type: Number },
    avgRating: { type: Number },
    estimatedPriceRange: { min: Number, max: Number },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    lastSeen: { type: Date },
    active: { type: Boolean, default: true },
  }],
  competitorCount: { type: Number, default: 0 },

  // Market share
  marketShare: {
    contractorJobs: { type: Number, default: 0 },
    estimatedTotalJobs: { type: Number, default: 0 },
    sharePercent: { type: Number, default: 0 },
    trend: { type: String, enum: ['growing', 'stable', 'declining'] },
  },

  // Customer density
  customerLocations: [{
    lat: { type: Number },
    lng: { type: Number },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    serviceCount: { type: Number },
    lastService: { type: Date },
  }],
  totalCustomersInZip: { type: Number, default: 0 },
  customerDensity: { type: Number, default: 0 }, // customers per square mile

  // AI insights
  aiInsights: {
    territoryValue: { type: Number, default: 0 }, // $ value of this zip
    recommendedInvestment: { type: String },
    expansionOpportunities: [{ type: String }],
    riskFactors: [{ type: String }],
    demandForecast: {
      next30Days: { type: Number },
      next90Days: { type: Number },
      confidence: { type: Number },
    },
    optimalServiceMix: [{ service: String, projectedRevenue: Number }],
  },

  // Territory value (switching cost)
  territoryValue: {
    jobHistoryValue: { type: Number, default: 0 },
    customerDensityValue: { type: Number, default: 0 },
    pricingIntelValue: { type: Number, default: 0 },
    hoaDatabaseValue: { type: Number, default: 0 },
    competitorIntelValue: { type: Number, default: 0 },
    totalTerritoryValue: { type: Number, default: 0 },
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

territoryIntelSchema.index({ contractor: 1, zipCode: 1 }, { unique: true });
territoryIntelSchema.index({ 'zipProfile.avgHomeValue': 1 });

territoryIntelSchema.pre('save', function(next) {
  this.totalJobsInZip = this.jobHistory?.length || 0;
  this.competitorCount = this.competitors?.length || 0;
  this.totalCustomersInZip = this.customerLocations?.length || 0;

  // Calculate territory value
  this.territoryValue = {
    jobHistoryValue: this.totalJobsInZip * 30,
    customerDensityValue: this.totalCustomersInZip * 50,
    pricingIntelValue: Object.keys(this.pricingCurve?.byCategory || {}).length * 200,
    hoaDatabaseValue: (this.hoas?.length || 0) * 100,
    competitorIntelValue: this.competitorCount * 150,
    totalTerritoryValue: 0,
  };
  this.territoryValue.totalTerritoryValue =
    this.territoryValue.jobHistoryValue +
    this.territoryValue.customerDensityValue +
    this.territoryValue.pricingIntelValue +
    this.territoryValue.hoaDatabaseValue +
    this.territoryValue.competitorIntelValue;

  this.updatedAt = new Date();
  next();
});

const TerritoryIntel = mongoose.model('TerritoryIntel', territoryIntelSchema);
module.exports = { TerritoryIntel };
