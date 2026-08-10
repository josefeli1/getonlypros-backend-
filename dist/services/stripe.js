"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhookSecret = exports.stripe = void 0;
exports.createPaymentIntent = createPaymentIntent;
exports.createConnectedAccount = createConnectedAccount;
exports.createAccountLink = createAccountLink;
exports.transferToContractor = transferToContractor;
exports.getBalance = getBalance;
exports.createCheckoutSession = createCheckoutSession;
const stripe_1 = __importDefault(require("stripe"));
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
exports.stripeWebhookSecret = stripeWebhookSecret;
if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}
exports.stripe = new stripe_1.default(stripeSecretKey, {
    apiVersion: '2023-10-16',
    typescript: true,
});
async function createPaymentIntent(amount, currency = 'usd') {
    try {
        const paymentIntent = await exports.stripe.paymentIntents.create({
            amount,
            currency,
            automatic_payment_methods: { enabled: true },
            metadata: {
                type: 'lead_purchase',
                createdAt: new Date().toISOString(),
            },
        });
        return paymentIntent;
    }
    catch (error) {
        console.error('Error creating PaymentIntent:', error);
        throw error;
    }
}
async function createConnectedAccount(email) {
    try {
        const account = await exports.stripe.accounts.create({
            type: 'express',
            email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            settings: {
                payouts: {
                    schedule: {
                        interval: 'manual',
                    },
                },
            },
        });
        return account;
    }
    catch (error) {
        console.error('Error creating Connected Account:', error);
        throw error;
    }
}
async function createAccountLink(accountId) {
    try {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const accountLink = await exports.stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${baseUrl}/contractor/onboard?refresh=true`,
            return_url: `${baseUrl}/contractor/onboard?success=true`,
            type: 'account_onboarding',
        });
        return accountLink;
    }
    catch (error) {
        console.error('Error creating Account Link:', error);
        throw error;
    }
}
async function transferToContractor(amount, contractorStripeAccountId) {
    try {
        const transfer = await exports.stripe.transfers.create({
            amount,
            currency: 'usd',
            destination: contractorStripeAccountId,
            metadata: {
                type: 'contractor_payout',
                createdAt: new Date().toISOString(),
            },
        });
        return transfer;
    }
    catch (error) {
        console.error('Error transferring to contractor:', error);
        throw error;
    }
}
async function getBalance() {
    try {
        const balance = await exports.stripe.balance.retrieve();
        return balance;
    }
    catch (error) {
        console.error('Error retrieving balance:', error);
        throw error;
    }
}
async function createCheckoutSession(contractorId, leadId, amount) {
    try {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const session = await exports.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Lead Access',
                            description: `Exclusive lead purchase - Lead #${leadId}`,
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${baseUrl}/contractor/leads/${leadId}?purchase=success`,
            cancel_url: `${baseUrl}/contractor/leads/${leadId}?purchase=cancelled`,
            metadata: {
                contractorId,
                leadId,
                type: 'lead_purchase',
            },
        });
        return session;
    }
    catch (error) {
        console.error('Error creating Checkout Session:', error);
        throw error;
    }
}
//# sourceMappingURL=stripe.js.map