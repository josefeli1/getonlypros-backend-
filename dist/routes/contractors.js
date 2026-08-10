"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = require("../middleware/auth");
const Contractor_1 = require("../models/Contractor");
const Review_1 = require("../models/Review");
const router = express_1.default.Router();
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map((e) => ({
                field: e.path || e.param,
                message: e.msg,
            })),
        });
    }
    next();
};
router.get('/', [
    (0, express_validator_1.query)('service').optional().trim(),
    (0, express_validator_1.query)('zipCode').optional().trim(),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['active', 'pending', 'suspended']),
    (0, express_validator_1.query)('minRating').optional().isFloat({ min: 0, max: 5 }),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }),
    (0, express_validator_1.query)('sortBy')
        .optional()
        .isIn(['rating', 'reviewCount', 'yearsInBusiness', 'createdAt']),
    (0, express_validator_1.query)('sortOrder').optional().isIn(['asc', 'desc']),
    handleValidationErrors,
], async (req, res) => {
    try {
        const queryObj = { status: 'active' };
        if (req.query.service) {
            queryObj.services = { $in: [req.query.service] };
        }
        if (req.query.status) {
            queryObj.status = req.query.status;
        }
        if (req.query.minRating) {
            queryObj.rating = { $gte: Number(req.query.minRating) };
        }
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Number(req.query.limit) || 10);
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'rating';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const sort = {};
        sort[sortBy] = sortOrder;
        const contractors = await Contractor_1.Contractor.find(queryObj)
            .populate('userId', 'firstName lastName email phone zipCode')
            .sort(sort)
            .skip(skip)
            .limit(limit);
        const total = await Contractor_1.Contractor.countDocuments(queryObj);
        const contractorsWithReviews = await Promise.all(contractors.map(async (contractor) => {
            const recentReviews = await Review_1.Review.find({
                contractorId: contractor._id,
            })
                .sort({ date: -1 })
                .limit(3);
            const reviewDistribution = await Review_1.Review.aggregate([
                { $match: { contractorId: contractor._id } },
                {
                    $group: {
                        _id: '$rating',
                        count: { $sum: 1 },
                    },
                },
            ]);
            return {
                ...contractor.toJSON(),
                recentReviews,
                reviewDistribution,
            };
        }));
        res.status(200).json({
            success: true,
            data: {
                contractors: contractorsWithReviews,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    }
    catch (error) {
        console.error('Get contractors error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching contractors.',
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid contractor ID format.',
            });
        }
        const contractor = await Contractor_1.Contractor.findById(id).populate('userId', 'firstName lastName email phone zipCode createdAt');
        if (!contractor) {
            return res.status(404).json({
                success: false,
                error: 'Contractor not found.',
            });
        }
        const reviews = await Review_1.Review.find({
            contractorId: contractor._id,
        })
            .sort({ date: -1 })
            .limit(10);
        const reviewStats = await Review_1.Review.aggregate([
            { $match: { contractorId: contractor._id } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    rating5: {
                        $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] },
                    },
                    rating4: {
                        $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] },
                    },
                    rating3: {
                        $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] },
                    },
                    rating2: {
                        $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] },
                    },
                    rating1: {
                        $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] },
                    },
                },
            },
        ]);
        const sentimentDistribution = await Review_1.Review.aggregate([
            { $match: { contractorId: contractor._id } },
            {
                $group: {
                    _id: '$sentiment',
                    count: { $sum: 1 },
                },
            },
        ]);
        res.status(200).json({
            success: true,
            data: {
                contractor,
                reviews,
                reviewStats: reviewStats.length > 0 ? reviewStats[0] : null,
                sentimentDistribution,
            },
        });
    }
    catch (error) {
        console.error('Get contractor error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching the contractor.',
        });
    }
});
router.put('/:id', auth_1.protect, [
    (0, express_validator_1.body)('companyName')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Company name cannot be empty')
        .isLength({ max: 100 })
        .withMessage('Company name cannot exceed 100 characters'),
    (0, express_validator_1.body)('services')
        .optional()
        .isArray({ min: 1 })
        .withMessage('At least one service is required'),
    (0, express_validator_1.body)('serviceRadius')
        .optional()
        .isInt({ min: 1, max: 200 })
        .withMessage('Service radius must be between 1 and 200 miles'),
    (0, express_validator_1.body)('licenseNumber').optional().trim(),
    (0, express_validator_1.body)('hasInsurance')
        .optional()
        .isBoolean()
        .withMessage('Insurance must be a boolean value'),
    (0, express_validator_1.body)('yearsInBusiness')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('Years in business must be between 0 and 100'),
    handleValidationErrors,
], async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid contractor ID format.',
            });
        }
        const contractor = await Contractor_1.Contractor.findById(id);
        if (!contractor) {
            return res.status(404).json({
                success: false,
                error: 'Contractor not found.',
            });
        }
        if (req.user?.type !== 'admin') {
            const userContractor = await Contractor_1.Contractor.findOne({
                userId: new mongoose_1.default.Types.ObjectId(req.user.userId),
            });
            if (!userContractor || userContractor._id.toString() !== id) {
                return res.status(403).json({
                    success: false,
                    error: 'You can only update your own contractor profile.',
                });
            }
        }
        const updateData = {};
        const allowedFields = [
            'companyName',
            'services',
            'serviceRadius',
            'licenseNumber',
            'hasInsurance',
            'yearsInBusiness',
            'stripeAccountId',
            'stripeOnboardingComplete',
        ];
        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });
        const updatedContractor = await Contractor_1.Contractor.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        res.status(200).json({
            success: true,
            message: 'Contractor profile updated successfully.',
            data: { contractor: updatedContractor },
        });
    }
    catch (error) {
        console.error('Update contractor error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while updating the contractor profile.',
        });
    }
});
exports.default = router;
//# sourceMappingURL=contractors.js.map