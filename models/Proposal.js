const mongoose = require('mongoose');

const proposalStatus = ['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'converted_to_job'];

const proposalSchema = new mongoose.Schema({
  proposalNumber: { type: String, unique: true, index: true },
  contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor', required: true },
  customer: {
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
    },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },

  // Job reference (if converted)
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },

  // Proposal content
  title: { type: String, required: true },
  description: { type: String },
  serviceCategory: { type: String },

  // AI-generated content
  aiGenerated: { type: Boolean, default: false },
  aiConfidence: { type: Number, default: 0 },
  aiNotes: { type: String },

  // Line items
  lineItems: [{
    name: { type: String, required: true },
    description: { type: String },
    quantity: { type: Number, default: 1 },
    unit: { type: String, default: 'each' },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number },
    isOptional: { type: Boolean, default: false },
    isLabor: { type: Boolean, default: false },
    isMaterial: { type: Boolean, default: false },
    warrantyIncluded: { type: Boolean, default: false },
    warrantyMonths: { type: Number },
    photos: [{ url: String, caption: String }],
  }],

  // Pricing
  subtotal: { type: Number, default: 0 },
  discount: {
    type: { type: String, enum: ['percentage', 'fixed', 'none'], default: 'none' },
    amount: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    reason: { type: String },
  },
  taxRate: { type: Number, default: 0.0825 },
  taxAmount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },

  // Deposit
  depositRequired: { type: Number, default: 0 },
  depositPercent: { type: Number, default: 0 },

  // Financing options
  financing: {
    available: { type: Boolean, default: false },
    provider: { type: String },
    terms: [{ months: Number, apr: Number, monthlyPayment: Number }],
    monthlyPayment: { type: Number },
    totalWithFinancing: { type: Number },
  },

  // Status
  status: { type: String, enum: proposalStatus, default: 'draft' },
  sentAt: { type: Date },
  viewedAt: { type: Date },
  viewedCount: { type: Number, default: 0 },
  acceptedAt: { type: Date },
  declinedAt: { type: Date },
  declineReason: { type: String },
  expiredAt: { type: Date },

  // E-signature
  signature: {
    signed: { type: Boolean, default: false },
    signedAt: { type: Date },
    signedBy: { type: String },
    ipAddress: { type: String },
    signatureImage: { type: String },
    termsAccepted: { type: Boolean, default: false },
  },

  // Proposal URL for customer
  publicUrl: { type: String },
  expiresInDays: { type: Number, default: 7 },

  // Follow-up automation
  followUpSequence: [{
    step: { type: Number },
    type: { type: String, enum: ['sms', 'email', 'call_reminder'] },
    sentAt: { type: Date },
    content: { type: String },
    status: { type: String, enum: ['pending', 'sent', 'opened', 'clicked', 'replied'] },
  }],
  nextFollowUpAt: { type: Date },

  // Analytics
  analytics: {
    timeOnProposal: { type: Number },
    sectionsViewed: [{ type: String }],
    pricePageViews: { type: Number, default: 0 },
    financingPageViews: { type: Number, default: 0 },
  },

  // Photos and attachments
  photos: [{ url: String, caption: String, uploadedAt: Date }],
  attachments: [{ name: String, url: String, type: String }],

  // Notes
  internalNotes: { type: String },
  customerNotes: { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

proposalSchema.pre('save', async function(next) {
  if (!this.proposalNumber) {
    const count = await mongoose.model('Proposal').countDocuments();
    this.proposalNumber = `PROP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }
  if (this.lineItems && this.lineItems.length > 0) {
    this.lineItems.forEach(item => {
      item.totalPrice = item.quantity * item.unitPrice;
    });
    this.subtotal = this.lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const discount = this.discount && this.discount.type !== 'none' ? this.discount.discountTotal || 0 : 0;
    this.taxAmount = (this.subtotal - discount) * (this.taxRate || 0.0825);
    this.total = this.subtotal - discount + this.taxAmount;
    if (this.depositPercent > 0) {
      this.depositRequired = this.total * (this.depositPercent / 100);
    }
  }
  this.updatedAt = new Date();
  next();
});

proposalSchema.index({ contractor: 1, status: 1 });
proposalSchema.index({ createdAt: -1 });

const Proposal = mongoose.model('Proposal', proposalSchema);
module.exports = { Proposal, proposalStatus };
