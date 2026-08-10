"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const email_1 = require("../services/email");
const router = (0, express_1.Router)();
router.post('/send', async (req, res) => {
    try {
        const { to, subject, html } = req.body;
        if (!to || !subject || !html) {
            return res.status(400).json({
                error: 'Missing required fields: to, subject, html.',
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(to)) {
            return res.status(400).json({
                error: 'Invalid email address format.',
            });
        }
        const response = await (0, email_1.sendEmail)(to, subject, html);
        return res.status(200).json({
            success: true,
            message: 'Email sent successfully.',
            data: response,
        });
    }
    catch (error) {
        console.error('Error in POST /send:', error);
        return res.status(500).json({
            error: 'Failed to send email.',
            message: error.message,
        });
    }
});
router.post('/welcome', async (req, res) => {
    try {
        const { name, email, role } = req.body;
        if (!name || !email) {
            return res.status(400).json({
                error: 'Missing required fields: name, email.',
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email address format.',
            });
        }
        const response = await (0, email_1.sendWelcomeEmail)({ name, email, role });
        return res.status(200).json({
            success: true,
            message: `Welcome email sent to ${email}.`,
            data: response,
        });
    }
    catch (error) {
        console.error('Error in POST /welcome:', error);
        return res.status(500).json({
            error: 'Failed to send welcome email.',
            message: error.message,
        });
    }
});
router.post('/lead-confirmation', async (req, res) => {
    try {
        const { homeownerName, email, serviceType, city, referenceNumber } = req.body;
        if (!homeownerName || !email || !serviceType || !city || !referenceNumber) {
            return res.status(400).json({
                error: 'Missing required fields: homeownerName, email, serviceType, city, referenceNumber.',
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email address format.',
            });
        }
        const response = await (0, email_1.sendLeadConfirmation)({
            homeownerName,
            email,
            serviceType,
            city,
            referenceNumber,
        });
        return res.status(200).json({
            success: true,
            message: `Lead confirmation email sent to ${email}.`,
            data: response,
        });
    }
    catch (error) {
        console.error('Error in POST /lead-confirmation:', error);
        return res.status(500).json({
            error: 'Failed to send lead confirmation email.',
            message: error.message,
        });
    }
});
router.post('/review-request', async (req, res) => {
    try {
        const { homeownerName, email, contractor, service } = req.body;
        if (!homeownerName || !email || !contractor?.name || !service) {
            return res.status(400).json({
                error: 'Missing required fields: homeownerName, email, contractor.name, service.',
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email address format.',
            });
        }
        const response = await (0, email_1.sendReviewRequest)(homeownerName, email, contractor, service);
        return res.status(200).json({
            success: true,
            message: `Review request email sent to ${email}.`,
            data: response,
        });
    }
    catch (error) {
        console.error('Error in POST /review-request:', error);
        return res.status(500).json({
            error: 'Failed to send review request email.',
            message: error.message,
        });
    }
});
router.post('/new-lead-notification', async (req, res) => {
    try {
        const { contractor, lead } = req.body;
        if (!contractor?.name ||
            !contractor?.email ||
            !lead?.serviceType ||
            !lead?.location ||
            !lead?.urgency ||
            !lead?.leadPrice ||
            !lead?.leadId) {
            return res.status(400).json({
                error: 'Missing required fields: contractor (name, email), lead (serviceType, location, urgency, leadPrice, leadId).',
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contractor.email)) {
            return res.status(400).json({
                error: 'Invalid contractor email address format.',
            });
        }
        const response = await (0, email_1.sendNewLeadNotification)(contractor, lead);
        return res.status(200).json({
            success: true,
            message: `New lead notification sent to ${contractor.email}.`,
            data: response,
        });
    }
    catch (error) {
        console.error('Error in POST /new-lead-notification:', error);
        return res.status(500).json({
            error: 'Failed to send new lead notification.',
            message: error.message,
        });
    }
});
router.post('/password-reset', async (req, res) => {
    try {
        const { email, resetToken } = req.body;
        if (!email || !resetToken) {
            return res.status(400).json({
                error: 'Missing required fields: email, resetToken.',
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email address format.',
            });
        }
        const response = await (0, email_1.sendPasswordReset)(email, resetToken);
        return res.status(200).json({
            success: true,
            message: `Password reset email sent to ${email}.`,
            data: response,
        });
    }
    catch (error) {
        console.error('Error in POST /password-reset:', error);
        return res.status(500).json({
            error: 'Failed to send password reset email.',
            message: error.message,
        });
    }
});
router.post('/payout-confirmation', async (req, res) => {
    try {
        const { contractor, amount } = req.body;
        if (!contractor?.name || !contractor?.email || !amount) {
            return res.status(400).json({
                error: 'Missing required fields: contractor (name, email), amount (in cents).',
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contractor.email)) {
            return res.status(400).json({
                error: 'Invalid contractor email address format.',
            });
        }
        const response = await (0, email_1.sendPayoutConfirmation)(contractor, amount);
        return res.status(200).json({
            success: true,
            message: `Payout confirmation sent to ${contractor.email}.`,
            data: response,
        });
    }
    catch (error) {
        console.error('Error in POST /payout-confirmation:', error);
        return res.status(500).json({
            error: 'Failed to send payout confirmation.',
            message: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=email.js.map