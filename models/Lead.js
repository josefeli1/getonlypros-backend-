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
        if (mod != null) for (var k in ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lead = void 0;
const mongoose_1 = __importStar(require("mongoose"));

const LeadSchema = new mongoose_1.Schema({
    // Core lead info (from agents)
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    homeownerName: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    homeownerEmail: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    homeownerPhone: { type: String, trim: true },

    // Service & location
    serviceType: { type: String, trim: true, index: true },
    service: { type: String, trim: true, index: true },
    zipCode: { type: String, trim: true, index: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },

    // Lead details
    budget: { type: Number, min: 0, default: 0 },
    budgetMin: { type: Number, min: 0, default: 0 },
    budgetMax: { type: Number, min: 0, default: 0 },
    urgency: {
        type: String,
        enum: ['emergency', 'high', 'medium', 'low', 'Emergency', 'High', 'Medium', 'Low'],
        default: 'medium',
        index: true,
    },
    timeline: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 2000 },
    description: { type: String, trim: true, maxlength: 2000 },

    // Source tracking
    source: { type: String, trim: true, index: true },
    sourceDetail: { type: String, trim: true },
    agentSlug: { type: String, trim: true, index: true },

    // Scoring & value
    score: { type: Number, min: 0, max: 100, default: 50, index: true },
    estimatedValue: { type: Number, min: 0, default: 0 },
    giftCardAmount: { type: Number, min: 0, default: 0 },

    // Status & assignment
    status: {
        type: String,
        enum: ['new', 'viewed', 'accepted', 'declined', 'completed', 'New', 'Viewed', 'Accepted', 'Declined', 'Completed'],
        default: 'new',
        index: true,
    },
    assignedContractorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Contractor',
        default: null,
        index: true,
    },
    claimedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Contractor',
        default: null,
        index: true,
    },

    // Distance for matching
    distance: { type: Number, min: 0, default: 0 },

}, {
    timestamps: true,
    strict: false,
    toJSON: {
        virtuals: true,
        transform: function (_doc, ret) {
            ret.id = ret._id.toString();
            if (ret.assignedContractorId) {
                ret.assignedContractorId = ret.assignedContractorId.toString();
            }
            if (ret.claimedBy) {
                ret.claimedBy = ret.claimedBy.toString();
            }
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
    toObject: {
        virtuals: true,
        transform: function (_doc, ret) {
            ret.id = ret._id.toString();
            if (ret.assignedContractorId) {
                ret.assignedContractorId = ret.assignedContractorId.toString();
            }
            if (ret.claimedBy) {
                ret.claimedBy = ret.claimedBy.toString();
            }
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});

// Indexes
LeadSchema.index({ serviceType: 1, status: 1 });
LeadSchema.index({ service: 1, status: 1 });
LeadSchema.index({ urgency: 1, status: 1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ zipCode: 1, serviceType: 1 });
LeadSchema.index({ zipCode: 1, service: 1 });
LeadSchema.index({ source: 1, createdAt: -1 });
LeadSchema.index({ score: -1 });

// Virtual for full name
LeadSchema.virtual('fullName').get(function () {
    if (this.firstName && this.lastName) {
        return `${this.firstName} ${this.lastName}`;
    }
    if (this.homeownerName) {
        return this.homeownerName;
    }
    return 'Unknown';
});

// Virtual for budget range display
LeadSchema.virtual('budgetRange').get(function () {
    if (this.budgetMin && this.budgetMax && this.budgetMin !== this.budgetMax) {
        return `$${this.budgetMin.toLocaleString()} - $${this.budgetMax.toLocaleString()}`;
    }
    if (this.budget && this.budget > 0) {
        return `$${this.budget.toLocaleString()}`;
    }
    if (this.budgetMin && this.budgetMin > 0) {
        return `From $${this.budgetMin.toLocaleString()}`;
    }
    if (this.budgetMax && this.budgetMax > 0) {
        return `Up to $${this.budgetMax.toLocaleString()}`;
    }
    return 'Not specified';
});

// Pre-save hook to normalize data
LeadSchema.pre('save', function (next) {
    // Normalize homeownerName from firstName/lastName
    if (!this.homeownerName && (this.firstName || this.lastName)) {
        this.homeownerName = `${this.firstName || ''} ${this.lastName || ''}`.trim();
    }
    // Normalize service from serviceType
    if (!this.service && this.serviceType) {
        this.service = this.serviceType;
    }
    if (!this.serviceType && this.service) {
        this.serviceType = this.service;
    }
    // Normalize email/phone
    if (!this.homeownerEmail && this.email) {
        this.homeownerEmail = this.email;
    }
    if (!this.email && this.homeownerEmail) {
        this.email = this.homeownerEmail;
    }
    if (!this.homeownerPhone && this.phone) {
        this.homeownerPhone = this.phone;
    }
    if (!this.phone && this.homeownerPhone) {
        this.phone = this.homeownerPhone;
    }
    // Normalize budget
    if (this.budget && !this.budgetMin && !this.budgetMax) {
        this.budgetMin = this.budget;
        this.budgetMax = this.budget;
    }
    if (!this.budget && (this.budgetMin || this.budgetMax)) {
        this.budget = this.budgetMax || this.budgetMin || 0;
    }
    // Normalize description from notes
    if (!this.description && this.notes) {
        this.description = this.notes;
    }
    if (!this.notes && this.description) {
        this.notes = this.description;
    }
    // Calculate score if default
    if (this.score === 50) {
        this.score = this.calculateScore ? this.calculateScore() : 50;
    }
    next();
});

exports.Lead = mongoose_1.default.model('Lead', LeadSchema);
exports.default = exports.Lead;
