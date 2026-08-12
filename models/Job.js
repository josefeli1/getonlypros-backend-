const mongoose = require('mongoose');

const JobStatus = ['scheduled', 'dispatched', 'in_progress', 'paused', 'completed', 'cancelled', 'on_hold'];
const JobPriority = ['low', 'normal', 'high', 'emergency'];
const JobType = ['repair', 'maintenance', 'installation', 'inspection', 'emergency', 'quote', 'follow_up'];

const lineItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  quantity: { type: Number, default: 1 },
  unit: { type: String, default: 'each' },
  unitPrice: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 },
  isLabor: { type: Boolean, default: false },
  isMaterial: { type: Boolean, default: false },
  category: { type: String },
});

const jobSchema = new mongoose.Schema({
  // Core job info
  jobNumber: { type: String, unique: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: JobType, default: 'repair' },
  status: { type: String, enum: JobStatus, default: 'scheduled' },
  priority: { type: String, enum: JobPriority, default: 'normal' },

  // Assignment
  contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor', required: true },
  assignedCrew: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contractor' }],
  primaryTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor' },

  // Customer
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: {
      street: { type: String },
      city: { type: String, default: 'Las Vegas' },
      state: { type: String, default: 'NV' },
      zip: { type: String, index: true },
    },
    lat: { type: Number },
    lng: { type: Number },
    notes: { type: String },
    isNewCustomer: { type: Boolean, default: false },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },

  // Scheduling
  scheduledDate: { type: Date, index: true },
  scheduledTimeStart: { type: String },
  scheduledTimeEnd: { type: String },
  estimatedDuration: { type: Number, default: 60 },
  timeWindow: { type: String, default: '8am-12pm' },
  isRecurring: { type: Boolean, default: false },
  recurringPattern: { type: String },

  // Dispatch
  dispatchedAt: { type: Date },
  enRouteAt: { type: Date },
  arrivedAt: { type: Date },
  startedAt: { type: Date },
  completedAt: { type: Date },

  // Location tracking
  technicianLocation: {
    lat: { type: Number },
    lng: { type: Number },
    updatedAt: { type: Date },
  },

  // Job details
  serviceCategory: { type: String, index: true },
  tags: [{ type: String }],
  source: { type: String, default: 'direct' },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },

  // Financial
  lineItems: [lineItemSchema],
  subtotal: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0.0825 },
  taxAmount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  depositRequired: { type: Number, default: 0 },
  depositPaid: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['unpaid', 'deposit_paid', 'partially_paid', 'paid', 'refunded'], default: 'unpaid' },

  // AI features
  aiEstimate: {
    estimatedCost: { type: Number },
    confidence: { type: Number },
    factors: [{ type: String }],
    comparableJobs: { type: Number },
  },
  aiRecommendedParts: [{
    partName: { type: String },
    partNumber: { type: String },
    estimatedPrice: { type: Number },
    inStock: { type: Boolean },
  }],
  aiNotes: { type: String },

  // Photos & documents
  photos: [{
    url: { type: String },
    caption: { type: String },
    takenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor' },
    takenAt: { type: Date },
    category: { type: String, enum: ['before', 'during', 'after', 'diagnostic', 'receipt', 'other'] },
  }],

  // Communication
  notes: [{
    author: { type: String },
    text: { type: String },
    createdAt: { type: Date, default: Date.now },
    isInternal: { type: Boolean, default: false },
  }],
  customerCommunications: [{
    type: { type: String, enum: ['sms', 'email', 'call', 'automated'] },
    direction: { type: String, enum: ['inbound', 'outbound'] },
    content: { type: String },
    sentAt: { type: Date },
    status: { type: String, enum: ['sent', 'delivered', 'read', 'failed'] },
  }],

  // Reviews
  customerReview: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date },
    wouldRecommend: { type: Boolean },
    reviewRequestedAt: { type: Date },
    reviewCompletedAt: { type: Date },
  },

  // Warranty
  warranty: {
    hasWarranty: { type: Boolean, default: false },
    warrantyMonths: { type: Number },
    warrantyExpires: { type: Date },
    warrantyType: { type: String, enum: ['workmanship', 'manufacturer', 'extended'] },
  },

  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false },
});

// Auto-generate job number
jobSchema.pre('save', async function(next) {
  if (!this.jobNumber) {
    const count = await mongoose.model('Job').countDocuments();
    this.jobNumber = `GOP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }
  // Calculate totals
  if (this.lineItems && this.lineItems.length > 0) {
    this.subtotal = this.lineItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    this.taxAmount = this.subtotal * (this.taxRate || 0.0825);
    this.total = this.subtotal + this.taxAmount;
    this.balanceDue = this.total - (this.depositPaid || 0);
  }
  this.updatedAt = new Date();
  next();
});

jobSchema.index({ contractor: 1, scheduledDate: 1 });
jobSchema.index({ 'customer.zip': 1, status: 1 });
jobSchema.index({ status: 1, priority: 1 });
jobSchema.index({ createdAt: -1 });

const Job = mongoose.model('Job', jobSchema);
module.exports = { Job, JobStatus, JobPriority, JobType };
