const mongoose = require('mongoose');

const invoiceStatus = ['draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded'];
const paymentMethod = ['cash', 'check', 'credit_card', 'debit_card', 'ach', 'apple_pay', 'google_pay', 'financing', 'other'];

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true, index: true },
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

  // References
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  proposalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal' },

  // Invoice type
  type: { type: String, enum: ['deposit', 'progress', 'final', 'recurring', 'credit_memo'], default: 'final' },
  description: { type: String },

  // Line items
  lineItems: [{
    name: { type: String, required: true },
    description: { type: String },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    total: { type: Number },
  }],

  // Pricing
  subtotal: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0.0825 },
  taxAmount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  amountPaid: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  tipAmount: { type: Number, default: 0 },

  // Status
  status: { type: String, enum: invoiceStatus, default: 'draft' },
  sentAt: { type: Date },
  viewedAt: { type: Date },
  paidAt: { type: Date },
  dueDate: { type: Date, index: true },
  overdueNotifiedAt: { type: Date },

  // Payment collection
  paymentMethod: { type: String, enum: paymentMethod },
  payments: [{
    amount: { type: Number, required: true },
    method: { type: String, enum: paymentMethod },
    transactionId: { type: String },
    processor: { type: String },
    paidAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'] },
    receiptUrl: { type: String },
    notes: { type: String },
  }],

  // Public payment
  publicPaymentUrl: { type: String },
  paymentQrCode: { type: String },

  // Financing
  financing: {
    used: { type: Boolean, default: false },
    provider: { type: String },
    approvedAmount: { type: Number },
    monthlyPayment: { type: Number },
    termMonths: { type: Number },
    apr: { type: Number },
  },

  // Reminders
  reminders: [{
    sentAt: { type: Date },
    type: { type: String, enum: ['email', 'sms', 'phone'] },
    status: { type: String },
  }],
  autoRemindersEnabled: { type: Boolean, default: true },

  // AI insights
  aiInsights: {
    predictedPayDate: { type: Date },
    paymentRisk: { type: Number, default: 0 },
    suggestedDiscount: { type: Number },
    recommendedFollowUp: { type: String },
  },

  // Accounting sync
  quickbooksId: { type: String },
  xeroId: { type: String },
  syncStatus: { type: String, enum: ['pending', 'synced', 'failed', 'not_synced'], default: 'not_synced' },
  lastSyncAt: { type: Date },

  // Notes
  notes: { type: String },
  internalNotes: { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }
  if (this.lineItems && this.lineItems.length > 0) {
    this.lineItems.forEach(item => item.total = item.quantity * item.unitPrice);
    this.subtotal = this.lineItems.reduce((sum, item) => sum + item.total, 0);
    this.taxAmount = (this.subtotal - (this.discount || 0)) * (this.taxRate || 0.0825);
    this.total = this.subtotal - (this.discount || 0) + this.taxAmount;
    this.balanceDue = this.total - (this.amountPaid || 0);
  }
  if (this.balanceDue <= 0 && this.total > 0) {
    this.status = 'paid';
    this.paidAt = this.paidAt || new Date();
  }
  this.updatedAt = new Date();
  next();
});

invoiceSchema.index({ contractor: 1, status: 1 });
invoiceSchema.index({ dueDate: 1, status: 1 });
invoiceSchema.index({ createdAt: -1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = { Invoice, invoiceStatus, paymentMethod };
