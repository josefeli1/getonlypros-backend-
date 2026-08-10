"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = require("../middleware/auth");
const Review_1 = require("../models/Review");
const Contractor_1 = require("../models/Contractor");
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
    (0, express_validator_1.query)('contractorId').optional().isMongoId(),
    (0, express_validator_1.query)('rating').optional().isInt({ min: 1, max: 5 }),
    (0, express_validator_1.query)('sentiment')
        .optional()
        .isIn(['Positive', 'Neutral', 'Negative']),
    (0, express_validator_1.query)('service').optional().trim(),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('sortBy').optional().isIn(['date', 'rating', 'createdAt']),
    (0, express_validator_1.query)('sortOrder').optional().isIn(['asc', 'desc']),
    handleValidationErrors,
], async (req, res) => {
    try {
        const filters = {};
        if (req.query.contractorId) {
            if (mongoose_1.default.Types.ObjectId.isValid(req.query.contractorId)) {
                filters.contractorId = req.query.contractorId;
            }
        }
        if (req.query.rating)
            filters.rating = Number(req.query.rating);
        if (req.query.sentiment)
            filters.sentiment = req.query.sentiment;
        if (req.query.service)
            filters.service = req.query.service;
        const queryObj = {};
        if (filters.contractorId) {
            queryObj.contractorId = new mongoose_1.default.Types.ObjectId(filters.contractorId);
        }
        if (filters.rating)
            queryObj.rating = filters.rating;
        if (filters.sentiment)
            queryObj.sentiment = filters.sentiment;
        if (filters.service)
            queryObj.service = filters.service;
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 10);
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'date';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const sort = {};
        sort[sortBy] = sortOrder;
        const reviews = await Review_1.Review.find(queryObj).sort(sort).skip(skip).limit(limit);
        const total = await Review_1.Review.countDocuments(queryObj);
        let stats = null;
        if (filters.contractorId) {
            stats = await Review_1.Review.aggregate([
                {
                    $match: {
                        contractorId: new mongoose_1.default.Types.ObjectId(filters.contractorId),
                    },
                },
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
        }
        res.status(200).json({
            success: true,
            data: {
                reviews,
                stats: stats && stats.length > 0 ? stats[0] : null,
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
        console.error('Get reviews error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching reviews.',
        });
    }
});
router.post('/', auth_1.protect, (0, auth_1.restrictTo)('homeowner', 'admin'), [
    (0, express_validator_1.body)('contractorId')
        .notEmpty()
        .withMessage('Contractor ID is required')
        .isMongoId()
        .withMessage('Invalid contractor ID'),
    (0, express_validator_1.body)('homeownerName')
        .trim()
        .notEmpty()
        .withMessage('Your name is required'),
    (0, express_validator_1.body)('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    (0, express_validator_1.body)('comment')
        .trim()
        .notEmpty()
        .withMessage('Comment is required')
        .isLength({ min: 5, max: 2000 })
        .withMessage('Comment must be between 5 and 2000 characters'),
    (0, express_validator_1.body)('service')
        .trim()
        .notEmpty()
        .withMessage('Service type is required'),
    (0, express_validator_1.body)('sentiment')
        .optional()
        .isIn(['Positive', 'Neutral', 'Negative'])
        .withMessage('Sentiment must be Positive, Neutral, or Negative'),
    handleValidationErrors,
], async (req, res) => {
    try {
        const { contractorId, homeownerName, rating, comment, service, sentiment, } = req.body;
        const contractor = await Contractor_1.Contractor.findById(contractorId);
        if (!contractor) {
            return res.status(404).json({
                success: false,
                error: 'Contractor not found.',
            });
        }
        let reviewSentiment = sentiment;
        if (!reviewSentiment) {
            if (rating >= 4)
                reviewSentiment = 'Positive';
            else if (rating === 3)
                reviewSentiment = 'Neutral';
            else
                reviewSentiment = 'Negative';
        }
        const review = await Review_1.Review.create({
            contractorId: new mongoose_1.default.Types.ObjectId(contractorId),
            homeownerName,
            rating,
            comment,
            service,
            sentiment: reviewSentiment,
            date: new Date(),
        });
        contractor.rating =
            (contractor.rating * contractor.reviewCount + rating) /
                (contractor.reviewCount + 1);
        contractor.rating = Math.round(contractor.rating * 10) / 10;
        contractor.reviewCount += 1;
        await contractor.save();
        res.status(201).json({
            success: true,
            message: 'Review submitted successfully. Thank you for your feedback!',
            data: { review },
        });
    }
    catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while submitting your review.',
        });
    }
});
router.put('/:id/respond', auth_1.protect, (0, auth_1.restrictTo)('contractor', 'admin'), [
    (0, express_validator_1.body)('responseText')
        .trim()
        .notEmpty()
        .withMessage('Response text is required')
        .isLength({ max: 2000 })
        .withMessage('Response cannot exceed 2000 characters'),
    handleValidationErrors,
], async (req, res) => {
    try {
        const { id } = req.params;
        const { responseText } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid review ID format.',
            });
        }
        const review = await Review_1.Review.findById(id);
        if (!review) {
            return res.status(404).json({
                success: false,
                error: 'Review not found.',
            });
        }
        const contractor = await Contractor_1.Contractor.findOne({
            userId: new mongoose_1.default.Types.ObjectId(req.user.userId),
        });
        if (!contractor ||
            review.contractorId.toString() !== contractor._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'You can only respond to reviews for your own services.',
            });
        }
        review.responded = true;
        review.responseText = responseText;
        await review.save();
        res.status(200).json({
            success: true,
            message: 'Response added successfully.',
            data: { review },
        });
    }
    catch (error) {
        console.error('Respond to review error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while adding your response.',
        });
    }
});
exports.default = router;
//# sourceMappingURL=reviews.js.map