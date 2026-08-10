"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromEmail = exports.resend = void 0;
exports.sendEmail = sendEmail;
exports.sendWelcomeEmail = sendWelcomeEmail;
exports.sendLeadConfirmation = sendLeadConfirmation;
exports.sendNewLeadNotification = sendNewLeadNotification;
exports.sendReviewRequest = sendReviewRequest;
exports.sendPasswordReset = sendPasswordReset;
exports.sendPayoutConfirmation = sendPayoutConfirmation;
const resend_1 = require("resend");
const fs_1 = require("fs");
const path_1 = require("path");
const resendApiKey = process.env.RESEND_API_KEY || '';
const fromEmail = process.env.FROM_EMAIL || 'no-reply@getonlypros.com';
exports.fromEmail = fromEmail;
if (!resendApiKey) {
    console.warn('RESEND_API_KEY is not defined in environment variables');
}
const resend = new resend_1.Resend(resendApiKey);
exports.resend = resend;
function loadTemplate(templateName, placeholders = {}) {
    try {
        const templatePath = (0, path_1.resolve)(__dirname, '..', '..', 'templates', templateName);
        let template = (0, fs_1.readFileSync)(templatePath, 'utf-8');
        Object.entries(placeholders).forEach(([key, value]) => {
            template = template.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
        });
        return template;
    }
    catch (error) {
        console.error(`Error loading template ${templateName}:`, error);
        throw new Error(`Failed to load email template: ${templateName}`);
    }
}
async function sendEmail(to, subject, html) {
    try {
        if (!resendApiKey) {
            throw new Error('Resend API key is not configured');
        }
        const response = await resend.emails.send({
            from: fromEmail,
            to,
            subject,
            html,
        });
        console.log(`Email sent to ${to}: ${subject}`);
        return response;
    }
    catch (error) {
        console.error(`Error sending email to ${to}:`, error);
        throw error;
    }
}
async function sendWelcomeEmail(user) {
    try {
        const html = loadTemplate('welcome.html', {
            userName: user.name,
            userRole: user.role || 'homeowner',
            dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
        });
        return await sendEmail(user.email, 'Welcome to GetOnlyPros!', html);
    }
    catch (error) {
        console.error('Error sending welcome email:', error);
        throw error;
    }
}
async function sendLeadConfirmation(submission) {
    try {
        const html = loadTemplate('lead-confirmation.html', {
            homeownerName: submission.homeownerName,
            serviceType: submission.serviceType,
            city: submission.city,
            referenceNumber: submission.referenceNumber,
            trackUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/track/${submission.referenceNumber}`,
        });
        return await sendEmail(submission.email, `We received your ${submission.serviceType} request!`, html);
    }
    catch (error) {
        console.error('Error sending lead confirmation email:', error);
        throw error;
    }
}
async function sendNewLeadNotification(contractor, lead) {
    try {
        const html = loadTemplate('new-lead-notification.html', {
            contractorName: contractor.name,
            serviceType: lead.serviceType,
            location: lead.location,
            budget: lead.budget || 'Not specified',
            urgency: lead.urgency,
            leadPrice: lead.leadPrice,
            leadUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/contractor/leads/${lead.leadId}`,
        });
        return await sendEmail(contractor.email, `New ${lead.serviceType} Lead Available in ${lead.location}!`, html);
    }
    catch (error) {
        console.error('Error sending new lead notification:', error);
        throw error;
    }
}
async function sendReviewRequest(homeownerName, email, contractor, service) {
    try {
        const html = loadTemplate('review-request.html', {
            homeownerName,
            contractorName: contractor.name,
            companyName: contractor.companyName || contractor.name,
            service,
            reviewUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/review?contractor=${encodeURIComponent(contractor.name)}&service=${encodeURIComponent(service)}`,
        });
        return await sendEmail(email, `How was your ${service} experience with ${contractor.name}?`, html);
    }
    catch (error) {
        console.error('Error sending review request email:', error);
        throw error;
    }
}
async function sendPasswordReset(email, resetToken) {
    try {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        const html = loadTemplate('password-reset.html', {
            resetUrl,
            expiryTime: '1 hour',
        });
        return await sendEmail(email, 'Reset Your GetOnlyPros Password', html);
    }
    catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
}
async function sendPayoutConfirmation(contractor, amount) {
    try {
        const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount / 100);
        const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #C45C26 0%, #E87A3D 100%); padding: 32px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Payout Sent!</h1>
        </div>
        <div style="padding: 32px 24px; background: #ffffff;">
          <p style="color: #0F1923; font-size: 16px; line-height: 1.6;">Hi ${contractor.name},</p>
          <p style="color: #0F1923; font-size: 16px; line-height: 1.6;">Your payout of <strong>${formattedAmount}</strong> has been sent to your connected account.</p>
          <p style="color: #0F1923; font-size: 16px; line-height: 1.6;">It should arrive within 1-2 business days.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contractor/payouts" style="display: inline-block; background: #C45C26; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">View Payouts</a>
          </div>
          <p style="color: #6B7280; font-size: 14px;">Questions? Contact us at support@getonlypros.com</p>
        </div>
        <div style="padding: 24px; text-align: center; background: #0F1923; color: #9CA3AF; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} GetOnlyPros. All rights reserved.</p>
        </div>
      </div>
    `;
        return await sendEmail(contractor.email, `Payout of ${formattedAmount} Sent`, html);
    }
    catch (error) {
        console.error('Error sending payout confirmation email:', error);
        throw error;
    }
}
//# sourceMappingURL=email.js.map