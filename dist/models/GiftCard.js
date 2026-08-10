"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiftCard = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const GiftCardSchema = new mongoose_1.Schema({
    leadId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    contractorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Contractor' },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['amazon', 'visa', 'starbucks', 'home_depot', 'custom'], default: 'amazon' },
    code: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'issued', 'redeemed', 'expired', 'cancelled'], default: 'pending', index: true },
    message: { type: String },
    issuedAt: { type: Date },
    expiresAt: { type: Date },
    redeemedAt: { type: Date },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
}, {
    timestamps: true,
});
GiftCardSchema.index({ status: 1, createdAt: 1 });
GiftCardSchema.index({ customerEmail: 1 });
exports.GiftCard = mongoose_1.default.model('GiftCard', GiftCardSchema);
//# sourceMappingURL=GiftCard.js.map