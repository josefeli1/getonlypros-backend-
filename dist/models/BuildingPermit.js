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
exports.BuildingPermit = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const BuildingPermitSchema = new mongoose_1.Schema({
    permitNumber: { type: String, required: true },
    permitType: { type: String, required: true },
    description: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    issueDate: { type: Date, required: true },
    estimatedValue: { type: Number, default: 0 },
    contractorName: { type: String },
    homeownerName: { type: String },
    status: { type: String, enum: ['new', 'converted', 'expired'], default: 'new' },
    leadId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Lead' },
    sourceUrl: { type: String, required: true },
}, { timestamps: true });
BuildingPermitSchema.index({ status: 1, city: 1 });
BuildingPermitSchema.index({ zipCode: 1, issueDate: -1 });
exports.BuildingPermit = mongoose_1.default.model('BuildingPermit', BuildingPermitSchema);
//# sourceMappingURL=BuildingPermit.js.map