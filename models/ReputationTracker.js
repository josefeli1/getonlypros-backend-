const mongoose = require('mongoose');

/**
 * ReputationTracker - Irreplaceable social proof engine
 * Reviews, case studies, before/after photos, video testimonials.
 * Compounds over time. Cannot be transferred to competitors.
 */
const reviewSchema = new mongoose.Schema({
  platform: { type: String, enum: ['google', 'yelp', 'facebook', 'angi', 'thumbtack', 'bbb', 'nextdoor', 'internal', 'getonlypros'], required: true },
  externalId: { type: String },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  reviewerName: { type: String },
  reviewerPhoto: { type: String },
  verified: { type: Boolean, default: false },
  verifiedMethod: { type: String, enum: ['email', 'phone', 'purchase', 'none'] },
  photos: [{ url: String, caption: String }],
  helpfulVotes: { type: Number, default: 0 },
  response: {
    text: { type: String },
    respondedAt: { type: Date },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor' },
  },
  aiSentiment: { type: String, enum: ['very_negative', 'negative', 'neutral', 'positive', 'very_positive'] },
  aiSentimentScore: { type: Number, min: -1, max: 1 },
  aiKeywords: [{ type: String }],
  aiTopics: [{ type: String }], // e.g., "punctuality", "quality", "price"
  impact: {
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    estimatedRevenue: { type: Number, default: 0 },
  },
  createdAt: { type: Date, default: Date.now },
});

const caseStudySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  serviceCategory: { type: String },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  customerName: { type: String },
  beforePhotos: [{ url: String, caption: String }],
  afterPhotos: [{ url: String, caption: String }],
  problem: { type: String },
  solution: { type: String },
  results: { type: String },
  timeline: { type: String },
  cost: { type: Number },
  customerQuote: { type: String },
  videoUrl: { type: String },
  aiGenerated: { type: Boolean, default: false },
  platformsPosted: [{ type: String }],
  engagement: {
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
  },
  createdAt: { type: Date, default: Date.now },
});

const reputationTrackerSchema = new mongoose.Schema({
  contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor', required: true, index: true },

  // Review aggregation
  reviews: [reviewSchema],
  totalReviews: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  ratingDistribution: {
    5: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    1: { type: Number, default: 0 },
  },

  // Platform-specific scores
  platformScores: {
    google: { rating: Number, count: Number, url: String },
    yelp: { rating: Number, count: Number, url: String },
    facebook: { rating: Number, count: Number, url: String },
    angi: { rating: Number, count: Number, url: String },
    nextdoor: { rating: Number, count: Number, url: String },
    bbb: { rating: Number, count: Number, url: String, grade: String },
  },

  // Case studies
  caseStudies: [caseStudySchema],
  totalCaseStudies: { type: Number, default: 0 },

  // Before/After photo library
  photoLibrary: [{
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    category: { type: String, enum: ['before', 'during', 'after'] },
    url: { type: String },
    caption: { type: String },
    serviceCategory: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    usedIn: [{ type: String }], // proposal, social, website, case_study
  }],
  totalPhotos: { type: Number, default: 0 },

  // Video testimonials
  videoTestimonials: [{
    customerName: { type: String },
    videoUrl: { type: String },
    thumbnailUrl: { type: String },
    transcript: { type: String },
    duration: { type: Number },
    serviceCategory: { type: String },
    aiHighlights: [{ type: String }], // Auto-extracted quotes
    platformsPosted: [{ type: String }],
    engagement: { views: Number, shares: Number, likes: Number },
    createdAt: { type: Date, default: Date.now },
  }],

  // Review request automation
  reviewRequests: [{
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date },
    channel: { type: String, enum: ['sms', 'email', 'app', 'phone'] },
    status: { type: String, enum: ['sent', 'opened', 'clicked', 'completed', 'declined', 'reminded'] },
    completedAt: { type: Date },
    reminderCount: { type: Number, default: 0 },
  }],

  // Reputation score (AI-calculated)
  reputationScore: {
    overall: { type: Number, min: 0, max: 100, default: 50 },
    reviewQuality: { type: Number, min: 0, max: 100, default: 50 },
    reviewQuantity: { type: Number, min: 0, max: 100, default: 50 },
    responseRate: { type: Number, min: 0, max: 100, default: 50 },
    sentimentTrend: { type: Number, min: 0, max: 100, default: 50 },
    photoQuality: { type: Number, min: 0, max: 100, default: 50 },
    videoPresence: { type: Number, min: 0, max: 100, default: 50 },
    lastCalculated: { type: Date },
  },

  // Competitor comparison
  vsCompetitors: {
    rankInZip: { type: Number },
    totalContractorsInZip: { type: Number },
    reviewGap: { type: Number }, // How many more reviews than #2
    ratingGap: { type: Number }, // How much higher rating than #2
    marketShare: { type: Number }, // % of reviews in zip
  },

  // AI insights
  aiInsights: {
    bestPerformingReview: { type: String },
    worstPerformingReview: { type: String },
    reviewConversionRate: { type: Number },
    estimatedRevenueFromReviews: { type: Number, default: 0 },
    recommendedActions: [{ type: String }],
    trendingTopics: [{ type: String }],
    atRiskReviews: [{ type: String }], // Reviews that might be removed
  },

  // Value tracking
  reputationValue: {
    reviewCountValue: { type: Number, default: 0 }, // $25 per review
    caseStudyValue: { type: Number, default: 0 }, // $200 per case study
    photoLibraryValue: { type: Number, default: 0 }, // $10 per photo
    videoValue: { type: Number, default: 0 }, // $500 per video
    totalReputationValue: { type: Number, default: 0 },
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

reputationTrackerSchema.index({ contractor: 1 });
reputationTrackerSchema.index({ 'reviews.platform': 1, 'reviews.rating': 1 });

reputationTrackerSchema.pre('save', function(next) {
  this.totalReviews = this.reviews?.length || 0;
  this.totalCaseStudies = this.caseStudies?.length || 0;
  this.totalPhotos = this.photoLibrary?.length || 0;

  if (this.reviews && this.reviews.length > 0) {
    this.averageRating = (this.reviews.reduce((s, r) => s + r.rating, 0) / this.reviews.length).toFixed(2);
  }

  // Calculate reputation value (switching cost)
  this.reputationValue = {
    reviewCountValue: this.totalReviews * 25,
    caseStudyValue: this.totalCaseStudies * 200,
    photoLibraryValue: this.totalPhotos * 10,
    videoValue: (this.videoTestimonials?.length || 0) * 500,
    totalReputationValue: 0,
  };
  this.reputationValue.totalReputationValue =
    this.reputationValue.reviewCountValue +
    this.reputationValue.caseStudyValue +
    this.reputationValue.photoLibraryValue +
    this.reputationValue.videoValue;

  this.updatedAt = new Date();
  next();
});

const ReputationTracker = mongoose.model('ReputationTracker', reputationTrackerSchema);
module.exports = { ReputationTracker };
