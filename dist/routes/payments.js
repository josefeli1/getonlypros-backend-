"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stripe_1 = require("../services/stripe");
const router = (0, express_1.Router)();
router.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency = 'usd' } = req.body;
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({
                error: 'Invalid amount. Amount must be a positive number (in cents).',
            });
        }
        const paymentIntent = await (0, stripe_1.createPaymentIntent)(amount, currency);
        return res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
        });
    }
    catch (error) {
        console.error('Error in /create-payment-intent:', error);
        return res.status(500).json({
            error: 'Failed to create payment intent.',
            message: error.message,
        });
    }
});
router.post('/create-checkout-session', async (req, res) => {
    try {
        const { contractorId, leadId, amount } = req.body;
        if (!contractorId || !leadId || !amount) {
            return res.status(400).json({
                error: 'Missing required fields: contractorId, leadId, amount.',
            });
        }
        const session = await (0, stripe_1.createCheckoutSession)(contractorId, leadId, amount);
        return res.status(200).json({
            sessionId: session.id,
            url: session.url,
        });
    }
    catch (error) {
        console.error('Error in /create-checkout-session:', error);
        return res.status(500).json({
            error: 'Failed to create checkout session.',
            message: error.message,
        });
    }
});
router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    if (!sig) {
        return res.status(400).json({ error: 'Missing stripe-signature header.' });
    }
    let event;
    try {
        event = stripe_1.stripe.webhooks.constructEvent(req.body, sig, stripe_1.stripeWebhookSecret);
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
    console.log(`Webhook received: ${event.type}`);
    try {
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                console.log(`PaymentIntent succeeded: ${paymentIntent.id}`, paymentIntent.metadata);
                break;
            }
            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object;
                console.log(`PaymentIntent failed: ${paymentIntent.id}`, paymentIntent.last_payment_error?.message);
                break;
            }
            case 'checkout.session.completed': {
                const session = event.data.object;
                console.log(`Checkout session completed: ${session.id}`, session.metadata);
                const { contractorId, leadId } = session.metadata || {};
                if (contractorId && leadId) {
                    console.log(`Lead ${leadId} purchased by contractor ${contractorId}`);
                }
                break;
            }
            case 'transfer.paid': {
                const transfer = event.data.object;
                console.log(`Transfer paid: ${transfer.id}`, transfer.destination);
                break;
            }
            case 'account.updated': {
                const account = event.data.object;
                console.log(`Account updated: ${account.id}`, `charges_enabled: ${account.charges_enabled}`, `payouts_enabled: ${account.payouts_enabled}`);
                break;
            }
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        return res.status(200).json({ received: true });
    }
    catch (handlerError) {
        console.error('Error handling webhook event:', handlerError);
        return res.status(500).json({ error: 'Webhook handler failed.' });
    }
});
router.get('/account-status', async (req, res) => {
    try {
        const { accountId } = req.query;
        if (!accountId || typeof accountId !== 'string') {
            return res.status(400).json({
                error: 'Missing required query parameter: accountId.',
            });
        }
        const account = await stripe_1.stripe.accounts.retrieve(accountId);
        return res.status(200).json({
            accountId: account.id,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            detailsSubmitted: account.details_submitted,
            requirements: account.requirements,
            email: account.email,
        });
    }
    catch (error) {
        console.error('Error in /account-status:', error);
        return res.status(500).json({
            error: 'Failed to retrieve account status.',
            message: error.message,
        });
    }
});
router.post('/onboard', async (req, res) => {
    try {
        const { email, contractorId } = req.body;
        if (!email) {
            return res.status(400).json({
                error: 'Missing required field: email.',
            });
        }
        const account = await (0, stripe_1.createConnectedAccount)(email);
        const accountLink = await (0, stripe_1.createAccountLink)(account.id);
        console.log(`Contractor ${contractorId} onboarded with account ${account.id}`);
        return res.status(200).json({
            accountId: account.id,
            onboardingUrl: accountLink.url,
        });
    }
    catch (error) {
        console.error('Error in /onboard:', error);
        return res.status(500).json({
            error: 'Failed to create onboarding link.',
            message: error.message,
        });
    }
});
router.get('/balance', async (req, res) => {
    try {
        const balance = await (0, stripe_1.getBalance)();
        return res.status(200).json({
            available: balance.available,
            pending: balance.pending,
            connectReserved: balance.connect_reserved,
        });
    }
    catch (error) {
        console.error('Error in /balance:', error);
        return res.status(500).json({
            error: 'Failed to retrieve platform balance.',
            message: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=payments.js.map