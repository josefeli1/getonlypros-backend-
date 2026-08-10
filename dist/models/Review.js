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
exports.Review = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ReviewSchema = new mongoose_1.Schema({
    contractorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Contractor',
        required: [true, 'Contractor reference is required'],
        index: true,
    },
    homeownerName: {
        type: String,
        required: [true, 'Homeowner name is required'],
        trim: true,
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
        type: String,
        required: [true, 'Comment is required'],
        trim: true,
        minlength: [5, 'Comment must be at least 5 characters long'],
        maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    service: {
        type: String,
        required: [true, 'Service type is required'],
        trim: true,
        index: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    sentiment: {
        type: String,
        enum: {
            values: ['Positive', 'Neutral', 'Negative'],
            message: 'Sentiment must be Positive, Neutral, or Negative',
        },
        required: [true, 'Sentiment is required'],
        index: true,
    },
    responded: {
        type: Boolean,
        default: false,
    },
    responseText: {
        type: String,
        default: '',
        trim: true,
        maxlength: [2000, 'Response cannot exceed 2000 characters'],
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (_doc, ret) {
            ret.id = ret._id.toString();
            ret.contractorId = ret.contractorId.toString();
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
    toObject: {
        virtuals: true,
        transform: function (_doc, ret) {
            ret.id = ret._id.toString();
            ret.contractorId = ret.contractorId.toString();
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});
ReviewSchema.index({ contractorId: 1, date: -1 });
ReviewSchema.index({ contractorId: 1, rating: -1 });
ReviewSchema.index({ sentiment: 1 });
ReviewSchema.methods.addResponse = function (responseText) {
    this.responded = true;
    this.responseText = responseText;
};
ReviewSchema.statics.getAverageRating = async function (contractorId) {
    const result = await this.aggregate([
        { $match: { contractorId: new mongoose_1.default.Types.ObjectId(contractorId) } },
        {
            $group: {
                _id: '$contractorId',
                averageRating: { $avg: '$rating' },
                count: { $sum: 1 },
            },
        },
    ]);
    if (result.length === 0)
        return 0;
    return Math.round(result[0].averageRating * 10) / 10;
};
ReviewSchema.statics.getSentimentDistribution = async function (contractorId) {
    const result = await this.aggregate([
        { $match: { contractorId: new mongoose_1.default.Types.ObjectId(contractorId) } },
        {
            $group: {
                _id: '$sentiment',
                count: { $sum: 1 },
            },
        },
    ]);
    const distribution = { positive: 0, neutral: 0, negative: 0 };
    result.forEach((item) => {
        const key = item._id.toLowerCase();
        if (distribution[key] !== undefined) {
            distribution[key] = item.count;
        }
    });
    return distribution;
};
exports.Review = mongoose_1.default.model('Review', ReviewSchema);
exports.default = exports.Review;
//# sourceMappingURL=Review.js.map