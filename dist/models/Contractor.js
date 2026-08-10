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
exports.Contractor = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ContractorSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required'],
        unique: true,
        index: true,
    },
    companyName: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true,
        maxlength: [100, 'Company name cannot exceed 100 characters'],
    },
    services: {
        type: [String],
        required: [true, 'At least one service is required'],
        validate: {
            validator: function (v) {
                return Array.isArray(v) && v.length > 0;
            },
            message: 'At least one service must be provided',
        },
    },
    serviceRadius: {
        type: Number,
        required: [true, 'Service radius is required'],
        min: [1, 'Service radius must be at least 1 mile'],
        max: [200, 'Service radius cannot exceed 200 miles'],
        default: 25,
    },
    licenseNumber: {
        type: String,
        default: '',
        trim: true,
    },
    hasInsurance: {
        type: Boolean,
        default: false,
    },
    yearsInBusiness: {
        type: Number,
        min: [0, 'Years in business cannot be negative'],
        max: [100, 'Years in business cannot exceed 100'],
        default: 0,
    },
    stripeAccountId: {
        type: String,
        default: '',
        trim: true,
    },
    stripeOnboardingComplete: {
        type: Boolean,
        default: false,
    },
    rating: {
        type: Number,
        min: [0, 'Rating cannot be less than 0'],
        max: [5, 'Rating cannot exceed 5'],
        default: 0,
    },
    reviewCount: {
        type: Number,
        min: [0, 'Review count cannot be negative'],
        default: 0,
    },
    totalLeads: {
        type: Number,
        min: [0, 'Total leads cannot be negative'],
        default: 0,
    },
    acceptedLeads: {
        type: Number,
        min: [0, 'Accepted leads cannot be negative'],
        default: 0,
    },
    responseRate: {
        type: Number,
        min: [0, 'Response rate cannot be less than 0'],
        max: [100, 'Response rate cannot exceed 100'],
        default: 0,
    },
    avgResponseTime: {
        type: Number,
        min: [0, 'Average response time cannot be negative'],
        default: 0,
    },
    totalEarnings: {
        type: Number,
        min: [0, 'Total earnings cannot be negative'],
        default: 0,
    },
    ytdEarnings: {
        type: Number,
        min: [0, 'YTD earnings cannot be negative'],
        default: 0,
    },
    pendingPayout: {
        type: Number,
        min: [0, 'Pending payout cannot be negative'],
        default: 0,
    },
    status: {
        type: String,
        enum: {
            values: ['active', 'pending', 'suspended'],
            message: 'Status must be active, pending, or suspended',
        },
        default: 'pending',
        index: true,
    },
}, {
    timestamps: {
        createdAt: true,
        updatedAt: true,
    },
    toJSON: {
        virtuals: true,
        transform: function (_doc, ret) {
            ret.id = ret._id.toString();
            ret.userId = ret.userId.toString();
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
    toObject: {
        virtuals: true,
        transform: function (_doc, ret) {
            ret.id = ret._id.toString();
            ret.userId = ret.userId.toString();
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});
ContractorSchema.index({ userId: 1 });
ContractorSchema.index({ status: 1 });
ContractorSchema.index({ services: 1 });
ContractorSchema.index({ rating: -1 });
ContractorSchema.index({ companyName: 'text' });
ContractorSchema.virtual('acceptanceRate').get(function () {
    if (this.totalLeads === 0)
        return 0;
    return Math.round((this.acceptedLeads / this.totalLeads) * 100);
});
ContractorSchema.methods.updateRating = function (newRating) {
    const currentTotal = this.rating * this.reviewCount;
    this.reviewCount += 1;
    this.rating = (currentTotal + newRating) / this.reviewCount;
    this.rating = Math.round(this.rating * 10) / 10;
};
ContractorSchema.methods.updateResponseRate = function (totalResponses, totalOpportunities) {
    if (totalOpportunities === 0) {
        this.responseRate = 0;
    }
    else {
        this.responseRate = Math.round((totalResponses / totalOpportunities) * 100);
    }
};
ContractorSchema.pre('save', function (next) {
    if (this.rating < 0)
        this.rating = 0;
    if (this.rating > 5)
        this.rating = 5;
    this.rating = Math.round(this.rating * 10) / 10;
    next();
});
exports.Contractor = mongoose_1.default.model('Contractor', ContractorSchema);
exports.default = exports.Contractor;
//# sourceMappingURL=Contractor.js.map