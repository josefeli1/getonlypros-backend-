"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMSAlertAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");

class SMSAlertAgent extends BaseAgent_1.BaseAgent {
    constructor() {
        super(...arguments);
        this.slug = 'sms-alert';
        this.name = 'SMS Alert Agent';
        this.category = 'outreach';
        this.defaultSchedule = '*/5 * * * *';
        this.twilioSid = process.env.TWILIO_ACCOUNT_SID || '';
        this.twilioToken = process.env.TWILIO_AUTH_TOKEN || '';
        this.twilioPhone = process.env.TWILIO_PHONE_NUMBER || '';
        this.alertPhone = process.env.ALERT_PHONE_NUMBER || '';
    }
    run() {
        return this.execute({});
    }     
    async execute(context) {
        const hasTwilio = this.twilioSid && this.twilioToken && this.twilioPhone;
        const hasAlertPhone = this.alertPhone;

        if (!hasTwilio) {
            console.warn('[SMSAlertAgent] No Twilio credentials. Running in DEMO mode.');
            return this.generateDemoLeads();
        }

        if (!hasAlertPhone) {
            console.warn('[SMSAlertAgent] No ALERT_PHONE_NUMBER set. SMS alerts disabled.');
        }

        const leads = this.generateDemoLeads();

        if (hasTwilio && hasAlertPhone && leads.length > 0) {
            const topLead = leads[0];
            try {
                await this.sendSMS(topLead);
                console.log(`[SMSAlertAgent] SMS sent for lead: ${topLead.firstName} ${topLead.lastName}`);
            } catch (err) {
                console.error('[SMSAlertAgent] Failed to send SMS:', err);
            }
        }

        return leads;
    }

    async sendSMS(lead) {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioSid}/Messages.json`;
        const body = this.formatAlertMessage(lead);
        const auth = Buffer.from(`${this.twilioSid}:${this.twilioToken}`).toString('base64');

        const params = new URLSearchParams();
        params.append('From', this.twilioPhone);
        params.append('To', this.alertPhone);
        params.append('Body', body);

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Twilio API error ${res.status}: ${err}`);
        }

        const data = await res.json();
        console.log(`[SMSAlertAgent] Twilio message SID: ${data.sid}, status: ${data.status}`);
    }

    formatAlertMessage(lead) {
        const urgencyEmoji = lead.urgency === 'emergency' ? '🚨' : '⚡';
        return `${urgencyEmoji} URGENT LEAD — ${lead.serviceType}\n\nName: ${lead.firstName} ${lead.lastName}\nPhone: ${lead.phone}\nZip: ${lead.zipCode}\nBudget: $${(lead.budget || 0).toLocaleString()}\nUrgency: ${lead.urgency?.toUpperCase()}\n\n${lead.notes?.substring(0, 100)}...\n\nReply CLAIM to accept this lead.`;
    }

    generateDemoLeads() {
        return [
            { firstName: 'Emergency', lastName: 'Dispatch', email: 'dispatch@vegaspros.com', phone: '702-911-0000', serviceType: 'Plumbing', zipCode: '89147', address: '421 Tropicana Ave', city: 'Las Vegas', state: 'NV', budget: 3200, urgency: 'emergency', timeline: 'asap', notes: 'EMERGENCY: Copper pipe burst from hard water corrosion in Spring Valley home. Water flooding garage and hallway. Hard water mineral buildup caused pinhole leak. Needs immediate repipe + softener install. Score: 98/100', sourceDetail: 'SMS alert - hard water burst pipe Spring Valley' },
            { firstName: 'Angela', lastName: 'Ruiz', email: 'angela.ruiz@gmail.com', phone: '702-404-5678', serviceType: 'Water Damage Restoration', zipCode: '89052', address: '2900 Green Valley Pkwy', city: 'Henderson', state: 'NV', budget: 8500, urgency: 'emergency', timeline: 'asap', notes: 'EMERGENCY: Monsoon flash flood caused 3 inches standing water in Henderson basement. Black mold detected behind drywall. Family with young children. Air quality test shows spores at dangerous levels. Needs containment + dry-out immediately. Score: 96/100', sourceDetail: 'SMS alert - monsoon flood mold Henderson' },
            { firstName: 'James', lastName: 'Wilson', email: 'james.wilson@gmail.com', phone: '702-555-7890', serviceType: 'HVAC / Air Conditioning', zipCode: '89135', address: '880 Grand Canyon Dr', city: 'Las Vegas', state: 'NV', budget: 8500, urgency: 'emergency', timeline: 'asap', notes: 'EMERGENCY: AC compressor seized at 3pm during 116°F heat wave. Summerlin home with 88-year-old resident. Indoor temp 94°F. NV Energy rolling blackout risk. Priority elderly dispatch requested. Score: 99/100', sourceDetail: 'SMS alert - AC failure elderly 116°F Summerlin' },
            { firstName: 'Michelle', lastName: 'Taylor', email: 'michelle.taylor@gmail.com', phone: '702-666-8901', serviceType: 'Electrical', zipCode: '89031', address: '1500 Craig Rd', city: 'North Las Vegas', state: 'NV', budget: 4800, urgency: 'emergency', timeline: 'asap', notes: 'EMERGENCY: Electrical panel overheated running AC + pool pump + EV charger simultaneously in 112°F heat. Burning smell from garage. Fire risk. Need emergency panel upgrade to 200A. Score: 97/100', sourceDetail: 'SMS alert - panel overload fire risk NLV' },
            { firstName: 'Robert', lastName: 'Hernandez', email: 'robert.hernandez@gmail.com', phone: '702-777-9012', serviceType: 'Pool Service & Repair', zipCode: '89044', address: '2200 Anthem Pkwy', city: 'Henderson', state: 'NV', budget: 4200, urgency: 'emergency', timeline: 'asap', notes: 'EMERGENCY: Pool pump motor burned out during haboobs + 109°F heat. Water green in 48 hours. HOA violation notice issued. Seven Hills home. Needs emergency pump replacement + chemical treatment. Score: 94/100', sourceDetail: 'SMS alert - pool pump failure HOA violation Seven Hills' },
        ];
    }
}

exports.SMSAlertAgent = SMSAlertAgent;
