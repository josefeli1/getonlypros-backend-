"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerritoryLock = void 0;
const mongoose_1 = require("mongoose");

const TerritoryLockSchema = new mongoose_1.Schema({
  contractorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Contractor', required: true, index: true },
  userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
  zipCode: { type: String, required: true, index: true },
  serviceType: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending_payment'],
    default: 'active',
    index: true,
  },
  lockedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  autoRenew: { type: Boolean, default: true },
  leadGuarantee: { type: Number, default: 5 }, // minimum leads per month
  leadsDelivered: { type: Number, default: 0 },
  guaranteePayouts: [{ month: String, leadsShort: Number, payoutAmount: Number, paid: Boolean }],
  monthlyFee: { type: Number, default: 0 },
  paymentHistory: [{ month: String, amount: Number, paidAt: Date }],
}, { timestamps: true });

// Compound index - only 1 contractor per zip/service
TerritoryLockSchema.index({ zipCode: 1, serviceType: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'active' } });

exports.TerritoryLock = mongoose_1.default.model('TerritoryLock', TerritoryLockSchema);
exports.default = exports.TerritoryLock;
