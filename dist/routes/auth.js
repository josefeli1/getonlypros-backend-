"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const User_1 = require("../models/User");
const Contractor_1 = require("../models/Contractor");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
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
router.post('/register', [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    (0, express_validator_1.body)('firstName')
        .trim()
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ max: 50 })
        .withMessage('First name cannot exceed 50 characters'),
    (0, express_validator_1.body)('lastName')
        .trim()
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ max: 50 })
        .withMessage('Last name cannot exceed 50 characters'),
    (0, express_validator_1.body)('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^[\d\s\-+()]{10,20}$/)
        .withMessage('Please provide a valid phone number'),
    (0, express_validator_1.body)('zipCode')
        .trim()
        .notEmpty()
        .withMessage('ZIP code is required')
        .matches(/^\d{5}(-\d{4})?$/)
        .withMessage('Please provide a valid ZIP code'),
    handleValidationErrors,
], async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, zipCode } = req.body;
        const existingUser = await User_1.User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'An account with this email already exists.',
            });
        }
        const user = await User_1.User.create({
            email: email.toLowerCase(),
            password,
            firstName,
            lastName,
            phone,
            zipCode,
            type: 'homeowner',
        });
        const token = (0, auth_1.generateToken)(user._id.toString(), user.email, user.type);
        res.status(201).json({
            success: true,
            message: 'Account created successfully. Welcome to GetOnlyPros!',
            data: {
                user,
                token,
            },
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            throw error;
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred during registration. Please try again.',
        });
    }
});
router.post('/contractor-register', [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    (0, express_validator_1.body)('firstName')
        .trim()
        .notEmpty()
        .withMessage('First name is required'),
    (0, express_validator_1.body)('lastName')
        .trim()
        .notEmpty()
        .withMessage('Last name is required'),
    (0, express_validator_1.body)('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required'),
    (0, express_validator_1.body)('zipCode')
        .trim()
        .notEmpty()
        .withMessage('ZIP code is required')
        .matches(/^\d{5}(-\d{4})?$/)
        .withMessage('Please provide a valid ZIP code'),
    (0, express_validator_1.body)('companyName')
        .trim()
        .notEmpty()
        .withMessage('Company name is required')
        .isLength({ max: 100 })
        .withMessage('Company name cannot exceed 100 characters'),
    (0, express_validator_1.body)('services')
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
        const { email, password, firstName, lastName, phone, zipCode, companyName, services, serviceRadius, licenseNumber, hasInsurance, yearsInBusiness, } = req.body;
        const existingUser = await User_1.User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'An account with this email already exists.',
            });
        }
        const user = await User_1.User.create({
            email: email.toLowerCase(),
            password,
            firstName,
            lastName,
            phone,
            zipCode,
            type: 'contractor',
        });
        const contractor = await Contractor_1.Contractor.create({
            userId: user._id,
            companyName,
            services,
            serviceRadius: serviceRadius || 25,
            licenseNumber: licenseNumber || '',
            hasInsurance: hasInsurance || false,
            yearsInBusiness: yearsInBusiness || 0,
            stripeAccountId: '',
            stripeOnboardingComplete: false,
            status: 'pending',
        });
        const token = (0, auth_1.generateToken)(user._id.toString(), user.email, user.type);
        res.status(201).json({
            success: true,
            message: 'Contractor account created successfully. Your profile is pending approval.',
            data: {
                user,
                contractor,
                token,
            },
        });
    }
    catch (error) {
        console.error('Contractor registration error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred during contractor registration. Please try again.',
        });
    }
});
router.post('/login', [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors,
], async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.User.findOne({
            email: email.toLowerCase(),
        }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password.',
            });
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password.',
            });
        }
        const token = (0, auth_1.generateToken)(user._id.toString(), user.email, user.type);
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        };
        res.cookie('token', token, cookieOptions);
        res.status(200).json({
            success: true,
            message: 'Login successful. Welcome back!',
            data: {
                user,
                token,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred during login. Please try again.',
        });
    }
});
router.post('/logout', (_req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    res.status(200).json({
        success: true,
        message: 'Logged out successfully.',
    });
});
router.get('/me', auth_1.protect, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated',
            });
        }
        const user = await User_1.User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found.',
            });
        }
        let contractor = null;
        if (user.type === 'contractor') {
            contractor = await Contractor_1.Contractor.findOne({ userId: user._id });
        }
        res.status(200).json({
            success: true,
            data: {
                user,
                contractor,
            },
        });
    }
    catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred. Please try again.',
        });
    }
});
router.put('/profile', auth_1.protect, [
    (0, express_validator_1.body)('firstName')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('First name cannot be empty')
        .isLength({ max: 50 })
        .withMessage('First name cannot exceed 50 characters'),
    (0, express_validator_1.body)('lastName')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Last name cannot be empty')
        .isLength({ max: 50 })
        .withMessage('Last name cannot exceed 50 characters'),
    (0, express_validator_1.body)('phone')
        .optional()
        .trim()
        .matches(/^[\d\s\-+()]{10,20}$/)
        .withMessage('Please provide a valid phone number'),
    (0, express_validator_1.body)('zipCode')
        .optional()
        .trim()
        .matches(/^\d{5}(-\d{4})?$/)
        .withMessage('Please provide a valid ZIP code'),
    handleValidationErrors,
], async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated',
            });
        }
        const { firstName, lastName, phone, zipCode } = req.body;
        const updateData = {};
        if (firstName)
            updateData.firstName = firstName;
        if (lastName)
            updateData.lastName = lastName;
        if (phone)
            updateData.phone = phone;
        if (zipCode)
            updateData.zipCode = zipCode;
        const user = await User_1.User.findByIdAndUpdate(req.user.userId, updateData, { new: true, runValidators: true });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found.',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully.',
            data: { user },
        });
    }
    catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while updating your profile.',
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map