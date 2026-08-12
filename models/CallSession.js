const mongoose = require('mongoose');

/**
 * CallSession - AI Phone Agent Call Tracking
 * Every inbound call is captured, transcribed, analyzed, and acted upon.
 * The AI answers 24/7, sounds human, understands context, and never misses a lead.
 */
const callTranscriptSchema = new mongoose.Schema({
  speaker: { type: String, enum: ['ai', 'human', 'contractor'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  sentiment: { type: String, enum: ['very_negative', 'negative', 'neutral', 'positive', 'very_positive'] },
  intent: { type: String }, // e.g., 'schedule', 'pricing', 'emergency', 'complaint'
  confidence: { type: Number, min: 0, max: 1 },
});

const callActionSchema = new mongoose.Schema({
  type: { type: String, enum: ['job_created', 'appointment_scheduled', 'estimate_sent', 'message_left', 'transferred', 'follow_up_set', 'spam_blocked', 'wrong_number'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  details: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

const callSessionSchema = new mongoose.Schema({
  // Call identity
  callId: { type: String, required: true, unique: true, index: true },
  contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor', required: true, index: true },

  // Caller info (auto-identified or new)
  callerPhone: { type: String, required: true, index: true },
  callerName: { type: String },
  callerAddress: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String },
    lat: { type: Number },
    lng: { type: Number },
  },
  isExistingCustomer: { type: Boolean, default: false },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Call metadata
  direction: { type: String, enum: ['inbound', 'outbound'], default: 'inbound' },
  status: { type: String, enum: ['ringing', 'connected', 'in_progress', 'completed', 'transferred', 'voicemail', 'missed', 'blocked'], default: 'ringing' },
  startedAt: { type: Date, default: Date.now },
  answeredAt: { type: Date },
  endedAt: { type: Date },
  duration: { type: Number, default: 0 }, // seconds
  holdTime: { type: Number, default: 0 }, // seconds before AI answered

  // AI configuration for this call
  aiConfig: {
    voiceId: { type: String, default: 'alloy' }, // human-like voice
    personality: { type: String, enum: ['friendly_professional', 'warm_casual', 'efficient_direct', 'empathetic'], default: 'friendly_professional' },
    language: { type: String, default: 'en-US' },
    accent: { type: String, default: 'neutral_american' },
    speed: { type: Number, default: 1.0 }, // speech speed
  },

  // Complete conversation
  transcript: [callTranscriptSchema],
  transcriptText: { type: String }, // Full text for search

  // AI understanding
  aiUnderstanding: {
    callerIntent: { type: String }, // 'new_lead', 'existing_customer', 'spam', 'wrong_number', 'complaint'
    serviceNeeded: { type: String }, // 'AC Repair', 'Plumbing', etc.
    urgency: { type: String, enum: ['low', 'normal', 'high', 'emergency'] },
    propertyType: { type: String },
    estimatedValue: { type: Number },
    preferredTime: { type: String },
    budgetMentioned: { type: Boolean, default: false },
    budgetRange: { type: String },
    competitorMentioned: { type: String },
    objections: [{ type: String }],
    buyingSignals: [{ type: String }],
    emotionalState: { type: String, enum: ['calm', 'urgent', 'frustrated', 'excited', 'neutral'] },
  },

  // Actions taken by AI
  actions: [callActionSchema],

  // Outcome
  outcome: {
    result: { type: String, enum: ['appointment_booked', 'estimate_sent', 'message_taken', 'transferred', 'spam', 'wrong_number', 'callback_scheduled', 'no_action', 'lost'], default: 'no_action' },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    proposalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal' },
    appointmentDate: { type: Date },
    appointmentTime: { type: String },
    followUpDate: { type: Date },
    notes: { type: String },
  },

  // Transfer to human
  transfer: {
    requested: { type: Boolean, default: false },
    reason: { type: String },
    transferredAt: { type: Date },
    transferredTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor' },
    contractorJoinedAt: { type: Date },
    contractorLeftAt: { type: Date },
  },

  // Voice quality metrics
  voiceMetrics: {
    aiVoiceClarity: { type: Number, min: 0, max: 100 },
    humanComprehension: { type: Number, min: 0, max: 100 },
    conversationFlow: { type: Number, min: 0, max: 100 },
    naturalnessScore: { type: Number, min: 0, max: 100 },
  },

  // Call recording
  recording: {
    url: { type: String },
    duration: { type: Number },
    format: { type: String, default: 'mp3' },
  },

  // Quality assurance
  qaReview: {
    reviewed: { type: Boolean, default: false },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor' },
    score: { type: Number, min: 0, max: 100 },
    issues: [{ type: String }],
    praise: [{ type: String }],
    reviewedAt: { type: Date },
  },

  // Cost tracking
  cost: {
    voiceCost: { type: Number, default: 0 }, // per-minute cost
    aiCost: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

callSessionSchema.index({ contractor: 1, startedAt: -1 });
callSessionSchema.index({ callerPhone: 1 });
callSessionSchema.index({ status: 1 });
callSessionSchema.index({ 'outcome.result': 1 });

const CallSession = mongoose.model('CallSession', callSessionSchema);
module.exports = { CallSession };
