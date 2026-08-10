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
exports.Activity = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ActivitySchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: {
            values: [
                'new_lead',
                'lead_accepted',
                'review',
                'payout',
                'milestone',
                'profile_update',
            ],
            message: 'Activity type must be new_lead, lead_accepted, review, payout, milestone, or profile_update',
        },
        required: [true, 'Activity type is required'],
        index: true,
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true,
        maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true,
        maxlength: [100, 'Location cannot exceed 100 characters'],
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },
}, {
    timestamps: {
        createdAt: false,
        updatedAt: false,
    },
    toJSON: {
        virtuals: true,
        transform: function (_doc, ret) {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
    toObject: {
        virtuals: true,
        transform: function (_doc, ret) {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});
ActivitySchema.index({ type: 1, timestamp: -1 });
ActivitySchema.index({ timestamp: -1 });
ActivitySchema.virtual('timeAgo').get(function () {
    const now = new Date();
    const diff = now.getTime() - this.timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (minutes < 1)
        return 'Just now';
    if (minutes < 60)
        return `${minutes}m ago`;
    if (hours < 24)
        return `${hours}h ago`;
    if (days < 7)
        return `${days}d ago`;
    return this.timestamp.toLocaleDateString();
});
ActivitySchema.virtual('icon').get(function () {
    const icons = {
        new_lead: 'PlusCircle',
        lead_accepted: 'CheckCircle',
        review: 'Star',
        payout: 'DollarSign',
        milestone: 'Trophy',
        profile_update: 'User',
    };
    return icons[this.type] || 'Bell';
});
ActivitySchema.virtual('color').get(function () {
    const colors = {
        new_lead: '#3b82f6',
        lead_accepted: '#10b981',
        review: '#f59e0b',
        payout: '#8b5cf6',
        milestone: '#ef4444',
        profile_update: '#6b7280',
    };
    return colors[this.type] || '#6b7280';
});
ActivitySchema.statics.getRecent = async function (limit = 10, type) {
    const query = {};
    if (type) {
        query.type = type;
    }
    return this.find(query).sort({ timestamp: -1 }).limit(limit);
};
ActivitySchema.statics.createActivity = async function (type, message, location) {
    return this.create({
        type,
        message,
        location,
        timestamp: new Date(),
    });
};
exports.Activity = mongoose_1.default.model('Activity', ActivitySchema);
exports.default = exports.Activity;
//# sourceMappingURL=Activity.js.map