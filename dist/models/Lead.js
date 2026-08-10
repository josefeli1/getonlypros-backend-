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
exports.Lead = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const LeadSchema = new mongoose_1.Schema({
    service: {
        type: String,
        required: [true, 'Service type is required'],
        trim: true,
        index: true,
    },
    homeownerName: {
        type: String,
        required: [true, 'Homeowner name is required'],
        trim: true,
    },
    zipCode: {
        type: String,
        required: [true, 'ZIP code is required'],
        trim: true,
        match: [/^\d{5}(-\d{4})?$/, 'Please provide a valid ZIP code'],
        index: true,
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
    },
    distance: {
        type: Number,
        min: [0, 'Distance cannot be negative'],
        default: 0,
    },
    budgetMin: {
        type: Number,
        min: [0, 'Minimum budget cannot be negative'],
        default: 0,
    },
    budgetMax: {
        type: Number,
        min: [0, 'Maximum budget cannot be negative'],
        default: 0,
    },
    urgency: {
        type: String,
        enum: {
            values: ['Emergency', 'High', 'Medium', 'Low'],
            message: 'Urgency must be Emergency, High, Medium, or Low',
        },
        required: [true, 'Urgency level is required'],
        index: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    status: {
        type: String,
        enum: {
            values: ['New', 'Viewed', 'Accepted', 'Declined', 'Completed'],
            message: 'Status must be New, Viewed, Accepted, Declined, or Completed',
        },
        default: 'New',
        index: true,
    },
    assignedContractorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Contractor',
        default: null,
        index: true,
    },
    homeownerEmail: {
        type: String,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email address',
        ],
    },
    homeownerPhone: {
        type: String,
        trim: true,
    },
    score: {
        type: Number,
        min: [0, 'Score cannot be less than 0'],
        max: [100, 'Score cannot exceed 100'],
        default: 50,
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (_doc, ret) {
            ret.id = ret._id.toString();
            if (ret.assignedContractorId) {
                ret.assignedContractorId = ret.assignedContractorId.toString();
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
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});
LeadSchema.index({ service: 1, status: 1 });
LeadSchema.index({ urgency: 1, status: 1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ zipCode: 1, service: 1 });
LeadSchema.virtual('budgetRange').get(function () {
    if (this.budgetMin && this.budgetMax) {
        return `$${this.budgetMin.toLocaleString()} - $${this.budgetMax.toLocaleString()}`;
    }
    if (this.budgetMin) {
        return `From $${this.budgetMin.toLocaleString()}`;
    }
    if (this.budgetMax) {
        return `Up to $${this.budgetMax.toLocaleString()}`;
    }
    return 'Not specified';
});
LeadSchema.methods.calculateScore = function () {
    let score = 50;
    const urgencyScores = {
        Emergency: 25,
        High: 15,
        Medium: 5,
        Low: 0,
    };
    score += urgencyScores[this.urgency] || 0;
    if (this.budgetMin >= 10000)
        score += 15;
    else if (this.budgetMin >= 5000)
        score += 10;
    else if (this.budgetMin >= 1000)
        score += 5;
    if (this.description && this.description.length > 100)
        score += 5;
    return Math.min(score, 100);
};
LeadSchema.pre('save', function (next) {
    if (this.score === 50) {
        this.score = this.calculateScore();
    }
    next();
});
exports.Lead = mongoose_1.default.model('Lead', LeadSchema);
exports.default = exports.Lead;
//# sourceMappingURL=Lead.js.map