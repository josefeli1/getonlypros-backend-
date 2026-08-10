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
exports.Earning = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const EarningSchema = new mongoose_1.Schema({
    contractorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Contractor',
        required: [true, 'Contractor reference is required'],
        index: true,
    },
    leadId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Lead',
        required: [true, 'Lead reference is required'],
    },
    service: {
        type: String,
        required: [true, 'Service type is required'],
        trim: true,
    },
    homeownerName: {
        type: String,
        required: [true, 'Homeowner name is required'],
        trim: true,
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative'],
    },
    status: {
        type: String,
        enum: {
            values: ['Paid', 'Pending'],
            message: 'Status must be Paid or Pending',
        },
        default: 'Pending',
        index: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (_doc, ret) {
            ret.id = ret._id.toString();
            ret.contractorId = ret.contractorId.toString();
            ret.leadId = ret.leadId.toString();
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
            ret.leadId = ret.leadId.toString();
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});
EarningSchema.index({ contractorId: 1, date: -1 });
EarningSchema.index({ contractorId: 1, status: 1 });
EarningSchema.index({ leadId: 1 }, { unique: true });
EarningSchema.virtual('formattedAmount').get(function () {
    return `$${this.amount.toFixed(2)}`;
});
EarningSchema.statics.getTotalEarnings = async function (contractorId) {
    const result = await this.aggregate([
        { $match: { contractorId: new mongoose_1.default.Types.ObjectId(contractorId) } },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' },
            },
        },
    ]);
    return result.length > 0 ? result[0].total : 0;
};
EarningSchema.statics.getEarningsByStatus = async function (contractorId) {
    const result = await this.aggregate([
        { $match: { contractorId: new mongoose_1.default.Types.ObjectId(contractorId) } },
        {
            $group: {
                _id: '$status',
                total: { $sum: '$amount' },
            },
        },
    ]);
    const statusMap = {
        paid: 0,
        pending: 0,
    };
    result.forEach((item) => {
        const key = item._id.toLowerCase();
        if (statusMap[key] !== undefined) {
            statusMap[key] = item.total;
        }
    });
    return statusMap;
};
EarningSchema.statics.getMonthlyEarnings = async function (contractorId, months = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const result = await this.aggregate([
        {
            $match: {
                contractorId: new mongoose_1.default.Types.ObjectId(contractorId),
                date: { $gte: startDate },
            },
        },
        {
            $group: {
                _id: {
                    year: { $year: '$date' },
                    month: { $month: '$date' },
                },
                amount: { $sum: '$amount' },
                count: { $sum: 1 },
            },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
    return result.map((item) => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        amount: item.amount,
        count: item.count,
    }));
};
exports.Earning = mongoose_1.default.model('Earning', EarningSchema);
exports.default = exports.Earning;
//# sourceMappingURL=Earning.js.map