"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = require("../middleware/auth");
const Lead_1 = require("../models/Lead");
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
router.post('/', [
    (0, express_validator_1.body)('service')
        .trim()
        .notEmpty()
        .withMessage('Service type is required'),
    (0, express_validator_1.body)('homeownerName')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ max: 100 })
        .withMessage('Name cannot exceed 100 characters'),
    (0, express_validator_1.body)('zipCode')
        .trim()
        .notEmpty()
        .withMessage('ZIP code is required')
        .matches(/^\d{5}(-\d{4})?$/)
        .withMessage('Please provide a valid ZIP code'),
    (0, express_validator_1.body)('city')
        .trim()
        .notEmpty()
        .withMessage('City is required'),
    (0, express_validator_1.body)('urgency')
        .isIn(['Emergency', 'High', 'Medium', 'Low'])
        .withMessage('Urgency must be Emergency, High, Medium, or Low'),
    (0, express_validator_1.body)('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ min: 10, max: 2000 })
        .withMessage('Description must be between 10 and 2000 characters'),
    (0, express_validator_1.body)('homeownerEmail')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('homeownerPhone')
        .optional()
        .trim(),
    (0, express_validator_1.body)('budgetMin')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Minimum budget must be a positive number'),
    (0, express_validator_1.body)('budgetMax')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Maximum budget must be a positive number'),
    handleValidationErrors,
], async (req, res) => {
    try {
        const { service, homeownerName, zipCode, city, urgency, description, homeownerEmail, homeownerPhone, budgetMin, budgetMax, } = req.body;
        const lead = await Lead_1.Lead.create({
            service,
            homeownerName,
            zipCode,
            city,
            distance: 0,
            budgetMin: budgetMin || 0,
            budgetMax: budgetMax || 0,
            urgency,
            description,
            homeownerEmail: homeownerEmail || '',
            homeownerPhone: homeownerPhone || '',
            status: 'New',
            score: 50,
        });
        lead.score = lead.calculateScore();
        await lead.save();
        res.status(201).json({
            success: true,
            message: 'Your request has been submitted successfully! Contractors in your area will be notified.',
            data: { lead },
        });
    }
    catch (error) {
        console.error('Lead submission error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while submitting your request.',
        });
    }
});
router.get('/', auth_1.protect, (0, auth_1.restrictTo)('contractor', 'admin'), [
    (0, express_validator_1.query)('service').optional().trim(),
    (0, express_validator_1.query)('urgency')
        .optional()
        .isIn(['Emergency', 'High', 'Medium', 'Low']),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['New', 'Viewed', 'Accepted', 'Declined', 'Completed']),
    (0, express_validator_1.query)('zipCode').optional().trim(),
    (0, express_validator_1.query)('minBudget').optional().isFloat({ min: 0 }),
    (0, express_validator_1.query)('maxBudget').optional().isFloat({ min: 0 }),
    (0, express_validator_1.query)('assignedToMe').optional().isBoolean(),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('sortBy').optional().isIn(['createdAt', 'score', 'budgetMax', 'urgency']),
    (0, express_validator_1.query)('sortOrder').optional().isIn(['asc', 'desc']),
    handleValidationErrors,
], async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated',
            });
        }
        const filters = {};
        if (req.query.service)
            filters.service = req.query.service;
        if (req.query.urgency)
            filters.urgency = req.query.urgency;
        if (req.query.status)
            filters.status = req.query.status;
        if (req.query.zipCode)
            filters.zipCode = req.query.zipCode;
        if (req.query.minBudget)
            filters.minBudget = Number(req.query.minBudget);
        if (req.query.maxBudget)
            filters.maxBudget = Number(req.query.maxBudget);
        const queryObj = { ...filters };
        delete queryObj.assignedToMe;
        delete queryObj.minBudget;
        delete queryObj.maxBudget;
        if (filters.minBudget || filters.maxBudget) {
            queryObj.budgetMax = {};
            if (filters.minBudget)
                queryObj.budgetMax.$gte = filters.minBudget;
            if (filters.maxBudget)
                queryObj.budgetMax.$lte = filters.maxBudget;
        }
        if (!filters.status) {
            queryObj.status = { $in: ['New', 'Viewed'] };
        }
        const contractor = await Contractor_1.Contractor.findOne({
            userId: new mongoose_1.default.Types.ObjectId(req.user.userId),
        });
        if (req.query.assignedToMe === 'true' && contractor) {
            queryObj.assignedContractorId = contractor._id;
            delete queryObj.status;
        }
        else {
            queryObj.assignedContractorId = null;
        }
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 10);
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const sort = {};
        sort[sortBy] = sortOrder;
        const leads = await Lead_1.Lead.find(queryObj)
            .sort(sort)
            .skip(skip)
            .limit(limit);
        const total = await Lead_1.Lead.countDocuments(queryObj);
        res.status(200).json({
            success: true,
            data: {
                leads,
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
        console.error('Get leads error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching leads.',
        });
    }
});
router.get('/:id', auth_1.protect, async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid lead ID format.',
            });
        }
        const lead = await Lead_1.Lead.findById(id);
        if (!lead) {
            return res.status(404).json({
                success: false,
                error: 'Lead not found.',
            });
        }
        if (lead.status === 'New' && req.user?.type === 'contractor') {
            lead.status = 'Viewed';
            await lead.save();
        }
        res.status(200).json({
            success: true,
            data: { lead },
        });
    }
    catch (error) {
        console.error('Get lead error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching the lead.',
        });
    }
});
router.put('/:id/accept', auth_1.protect, (0, auth_1.restrictTo)('contractor'), async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid lead ID format.',
            });
        }
        const contractor = await Contractor_1.Contractor.findOne({
            userId: new mongoose_1.default.Types.ObjectId(req.user.userId),
        });
        if (!contractor) {
            return res.status(404).json({
                success: false,
                error: 'Contractor profile not found.',
            });
        }
        const lead = await Lead_1.Lead.findOne({
            _id: id,
            assignedContractorId: null,
            status: { $in: ['New', 'Viewed'] },
        });
        if (!lead) {
            return res.status(404).json({
                success: false,
                error: 'Lead not found or has already been accepted by another contractor.',
            });
        }
        lead.assignedContractorId = contractor._id;
        lead.status = 'Accepted';
        await lead.save();
        contractor.totalLeads += 1;
        contractor.acceptedLeads += 1;
        await contractor.save();
        res.status(200).json({
            success: true,
            message: 'Lead accepted successfully! Contact the homeowner to get started.',
            data: { lead },
        });
    }
    catch (error) {
        console.error('Accept lead error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while accepting the lead.',
        });
    }
});
router.put('/:id/decline', auth_1.protect, (0, auth_1.restrictTo)('contractor'), async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid lead ID format.',
            });
        }
        const lead = await Lead_1.Lead.findById(id);
        if (!lead) {
            return res.status(404).json({
                success: false,
                error: 'Lead not found.',
            });
        }
        lead.status = 'Declined';
        await lead.save();
        res.status(200).json({
            success: true,
            message: 'Lead declined.',
            data: { lead },
        });
    }
    catch (error) {
        console.error('Decline lead error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while declining the lead.',
        });
    }
});
router.get('/my/submissions', auth_1.protect, (0, auth_1.restrictTo)('homeowner', 'admin'), async (req, res) => {
    try {
        const leads = await Lead_1.Lead.find()
            .sort({ createdAt: -1 })
            .limit(20);
        res.status(200).json({
            success: true,
            data: { leads },
        });
    }
    catch (error) {
        console.error('Get submissions error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching your submissions.',
        });
    }
});
exports.default = router;
//# sourceMappingURL=leads.js.map