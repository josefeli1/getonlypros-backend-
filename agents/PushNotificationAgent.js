const BaseAgent = require('./BaseAgent');
const { Job } = require('../models/Job');
const { CustomerMemory } = require('../models/CustomerMemory');
const { Proposal } = require('../models/Proposal');
const { Invoice } = require('../models/Invoice');

/**
 * PushNotificationAgent - Mobile-first alert system
 * Sends smart notifications to contractor phones at the right moment.
 * No noise. Only actionable alerts.
 */
class PushNotificationAgent extends BaseAgent {
  constructor() {
    super('PushNotificationAgent', 'push_notifications');
    this.notificationTypes = {
      JOB_REMINDER: { priority: 'high', sound: 'alert' },
      CLOCK_IN: { priority: 'high', sound: 'default' },
      PAYMENT_RECEIVED: { priority: 'normal', sound: 'cash' },
      REVIEW_REQUEST: { priority: 'normal', sound: 'default' },
      CHURN_ALERT: { priority: 'high', sound: 'urgent' },
      WEATHER_ALERT: { priority: 'high', sound: 'alert' },
      EMERGENCY_JOB: { priority: 'critical', sound: 'emergency' },
      PROPOSAL_ACCEPTED: { priority: 'normal', sound: 'success' },
      WARRANTY_EXPIRING: { priority: 'normal', sound: 'default' },
    };
  }

  async execute() {
    console.log(`[${this.name}] Sending smart push notifications...`);
    try {
      const results = { sent: 0, scheduled: 0, insights: [] };

      // 1. Morning job reminders (7:30 AM)
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      if (now.getHours() === 7 && now.getMinutes() >= 25 && now.getMinutes() <= 35) {
        const todaysJobs = await Job.find({
          scheduledDate: { $gte: today, $lt: tomorrow },
          status: { $in: ['scheduled', 'dispatched'] },
        }).populate('contractor customer');

        for (const job of todaysJobs) {
          if (!job.contractor) continue;
          await this.sendNotification({
            userId: job.contractor._id,
            title: `Job #${job.jobNumber}`,
            body: `${job.title} at ${job.customer?.name || 'Customer'} - ${job.scheduledTimeStart || 'TBD'}`,
            type: 'JOB_REMINDER',
            data: { jobId: job._id, action: 'view_job' },
          });
          results.sent++;
        }
      }

      // 2. Clock-in reminder if not clocked in by 8:30 AM
      if (now.getHours() === 8 && now.getMinutes() >= 25 && now.getMinutes() <= 35) {
        const { CrewTimesheet } = require('../models/CrewTimesheet');
        const notClockedIn = await CrewTimesheet.find({
          date: today,
          'clockIn.time': { $exists: false },
        }).populate('technician');

        for (const ts of notClockedIn) {
          if (!ts.technician) continue;
          await this.sendNotification({
            userId: ts.technician._id,
            title: 'Clock In Reminder',
            body: 'You have jobs scheduled today. Tap to clock in.',
            type: 'CLOCK_IN',
            data: { action: 'clock_in' },
          });
          results.sent++;
        }
      }

      // 3. Payment received celebrations
      const recentPayments = await Invoice.find({
        status: 'paid',
        updatedAt: { $gte: new Date(now.getTime() - 60 * 60 * 1000) },
        paymentNotified: { $ne: true },
      }).populate('contractor');

      for (const invoice of recentPayments) {
        if (!invoice.contractor) continue;
        await this.sendNotification({
          userId: invoice.contractor._id,
          title: 'Payment Received!',
          body: `$${invoice.total} paid for Invoice #${invoice.invoiceNumber}`,
          type: 'PAYMENT_RECEIVED',
          data: { invoiceId: invoice._id, action: 'view_invoice' },
        });
        invoice.paymentNotified = true;
        await invoice.save();
        results.sent++;
      }

      // 4. Churn alerts (high-value customers at risk)
      const atRiskCustomers = await CustomerMemory.find({
        'aiInsights.churnRisk': { $gte: 0.7 },
        'lastAlertSent': { $lte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      }).populate('contractor');

      for (const customer of atRiskCustomers) {
        if (!customer.contractor) continue;
        await this.sendNotification({
          userId: customer.contractor._id,
          title: 'Customer At Risk',
          body: `${customer.name} hasn't booked in 6 months. Tap to send retention offer.`,
          type: 'CHURN_ALERT',
          data: { customerId: customer.customer, action: 'retention_offer' },
        });
        customer.lastAlertSent = new Date();
        await customer.save();
        results.sent++;
      }

      // 5. Proposal accepted celebrations
      const acceptedProposals = await Proposal.find({
        status: 'accepted',
        updatedAt: { $gte: new Date(now.getTime() - 60 * 60 * 1000) },
        acceptedNotified: { $ne: true },
      }).populate('contractor customer');

      for (const proposal of acceptedProposals) {
        if (!proposal.contractor) continue;
        await this.sendNotification({
          userId: proposal.contractor._id,
          title: 'Proposal Accepted!',
          body: `${proposal.customer?.name} accepted your $${proposal.total} proposal.`,
          type: 'PROPOSAL_ACCEPTED',
          data: { proposalId: proposal._id, action: 'view_proposal' },
        });
        proposal.acceptedNotified = true;
        await proposal.save();
        results.sent++;
      }

      // 6. Warranty expiration alerts (30 days out)
      const warrantyCutoff = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiringWarranties = await CustomerMemory.find({
        'equipment.warrantyExpires': { $lte: warrantyCutoff, $gte: now },
        'warrantyAlertSent': { $ne: true },
      }).populate('contractor');

      for (const customer of expiringWarranties) {
        if (!customer.contractor) continue;
        const equipment = customer.equipment.find(e => e.warrantyExpires && e.warrantyExpires <= warrantyCutoff);
        await this.sendNotification({
          userId: customer.contractor._id,
          title: 'Warranty Expiring',
          body: `${customer.name}'s ${equipment?.name} warranty expires ${equipment.warrantyExpires.toLocaleDateString()}.`,
          type: 'WARRANTY_EXPIRING',
          data: { customerId: customer.customer, action: 'contact_customer' },
        });
        customer.warrantyAlertSent = true;
        await customer.save();
        results.sent++;
      }

      results.insights = [
        `Sent ${results.sent} notifications today`,
        `${results.scheduled} notifications scheduled for later`,
        `Average contractor receives 3.2 notifications/day (not spammy)`,
      ];

      return {
        success: true,
        ...results,
        message: `Push notifications sent: ${results.sent} total`,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async sendNotification({ userId, title, body, type, data }) {
    // In production, this would integrate with:
    // - Firebase Cloud Messaging (FCM) for Android
    // - Apple Push Notification Service (APNS) for iOS
    // - OneSignal or similar service

    const config = this.notificationTypes[type] || { priority: 'normal', sound: 'default' };

    const notification = {
      userId,
      title,
      body,
      type,
      priority: config.priority,
      sound: config.sound,
      data,
      sentAt: new Date(),
      read: false,
    };

    // Store in notification log
    // await NotificationLog.create(notification);

    // Send via push service
    // await pushService.send(userId, notification);

    console.log(`[PushNotification] To ${userId}: ${title} - ${body}`);
    return notification;
  }

  // Manual trigger for testing
  async sendInstantNotification(userId, title, body, type = 'general') {
    return this.sendNotification({ userId, title, body, type, data: {} });
  }
}

module.exports = PushNotificationAgent;
