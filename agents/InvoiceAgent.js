const BaseAgent = require('./BaseAgent');
const { Invoice } = require('../models/Invoice');
const { Job } = require('../models/Job');

/**
 * InvoiceAgent
 * AI-powered invoice automation:
 * - Auto-generates invoices from completed jobs
 * - Sends payment reminders
 * - Predicts payment delays
 * - Suggests early-pay discounts
 * - Handles overdue follow-up sequences
 */
class InvoiceAgent extends BaseAgent {
  constructor() {
    super('InvoiceAgent', 'invoice_agent');
    this.reminderSchedule = [1, 3, 7, 14, 30]; // Days after due date
  }

  async execute() {
    console.log(`[${this.name}] Running invoice automation...`);
    try {
      const results = { created: 0, reminded: 0, predicted: 0, insights: [] };

      // 1. Auto-generate invoices from completed jobs without invoices
      const completedJobs = await Job.find({
        status: 'completed',
        paymentStatus: 'unpaid',
        total: { $gt: 0 },
        isDeleted: false,
      }).limit(50);

      for (const job of completedJobs) {
        const existing = await Invoice.findOne({ jobId: job._id });
        if (!existing) {
          const invoice = new Invoice({
            contractor: job.contractor,
            customer: job.customer,
            jobId: job._id,
            type: 'final',
            description: job.title,
            lineItems: job.lineItems.map(item => ({
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.totalPrice,
            })),
            subtotal: job.subtotal,
            taxRate: job.taxRate,
            taxAmount: job.taxAmount,
            total: job.total,
            balanceDue: job.total - (job.depositPaid || 0),
            amountPaid: job.depositPaid || 0,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
            status: 'draft',
            autoRemindersEnabled: true,
          });
          await invoice.save();
          results.created++;
          // Update job
          job.paymentStatus = 'deposit_paid';
          await job.save();
        }
      }

      // 2. Send payment reminders for overdue invoices
      const now = new Date();
      const overdueInvoices = await Invoice.find({
        status: { $in: ['sent', 'viewed', 'overdue'] },
        dueDate: { $lt: now },
        balanceDue: { $gt: 0 },
        autoRemindersEnabled: true,
      }).limit(30);

      for (const invoice of overdueInvoices) {
        const daysOverdue = Math.floor((now - invoice.dueDate) / (1000 * 60 * 60 * 24));
        const shouldRemind = this.reminderSchedule.includes(daysOverdue) &&
          !invoice.reminders.some(r => Math.floor((r.sentAt - invoice.dueDate) / (1000 * 60 * 60 * 24)) === daysOverdue);

        if (shouldRemind) {
          invoice.reminders.push({
            sentAt: now,
            type: daysOverdue <= 3 ? 'email' : 'sms',
            status: 'sent',
          });
          if (daysOverdue >= 7) invoice.status = 'overdue';
          await invoice.save();
          results.reminded++;
        }
      }

      // 3. Predict payment risk for unpaid invoices
      const unpaidInvoices = await Invoice.find({
        status: { $in: ['sent', 'viewed'] },
        balanceDue: { $gt: 0 },
      }).limit(50);

      for (const invoice of unpaidInvoices) {
        const risk = this.predictPaymentRisk(invoice);
        invoice.aiInsights = {
          ...invoice.aiInsights,
          paymentRisk: risk.score,
          predictedPayDate: risk.predictedDate,
          suggestedDiscount: risk.suggestDiscount ? Math.round(invoice.balanceDue * 0.05) : 0,
          recommendedFollowUp: risk.recommendation,
        };
        await invoice.save();
        results.predicted++;
        results.insights.push({ invoiceNumber: invoice.invoiceNumber, risk: risk.score, recommendation: risk.recommendation });
      }

      return {
        success: true,
        ...results,
        message: `Created ${results.created} invoices, sent ${results.reminded} reminders, analyzed ${results.predicted} payment risks.`,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  predictPaymentRisk(invoice) {
    const now = new Date();
    const dueDate = invoice.dueDate || new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const daysToDue = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
    const daysSinceSent = invoice.sentAt ? Math.floor((now - invoice.sentAt) / (1000 * 60 * 60 * 24)) : 0;

    let score = 0.3; // Base 30% risk
    if (daysToDue < 0) score += 0.3; // Overdue = +30%
    if (invoice.total > 2000) score += 0.1; // High value = +10%
    if (invoice.total < 200) score -= 0.1; // Low value = -10% (easier to pay)
    if (daysSinceSent > 5 && !invoice.viewedAt) score += 0.2; // Not viewed = +20%
    if (invoice.reminders.length > 2) score += 0.15; // Multiple reminders = +15%
    if (invoice.type === 'deposit') score -= 0.1; // Deposits paid more reliably

    score = Math.min(0.95, Math.max(0.05, score));

    const predictedDays = daysToDue < 0 ? Math.round(3 + score * 10) : Math.round(7 + score * 14);
    const predictedDate = new Date(now.getTime() + predictedDays * 24 * 60 * 60 * 1000);

    const suggestDiscount = score > 0.6 && invoice.total > 500;

    let recommendation = 'Standard follow-up';
    if (score > 0.7) recommendation = 'Urgent: Call customer directly. Offer 5% early-pay discount.';
    else if (score > 0.5) recommendation = 'Send SMS reminder with payment link. Highlight urgency.';
    else if (score > 0.3) recommendation = 'Send email reminder with payment options and financing.';
    else recommendation = 'Low risk. Standard reminder schedule is sufficient.';

    return { score: parseFloat(score.toFixed(2)), predictedDate, suggestDiscount, recommendation };
  }

  async createDepositInvoice(jobId, percent = 30) {
    const job = await Job.findById(jobId);
    if (!job) return { success: false, message: 'Job not found' };

    const depositAmount = Math.round(job.total * (percent / 100));
    const invoice = new Invoice({
      contractor: job.contractor,
      customer: job.customer,
      jobId: job._id,
      type: 'deposit',
      description: `${job.title} - ${percent}% Deposit`,
      lineItems: [{
        name: 'Deposit',
        description: `${percent}% deposit for ${job.title}`,
        quantity: 1,
        unitPrice: depositAmount,
        total: depositAmount,
      }],
      subtotal: depositAmount,
      taxRate: 0,
      taxAmount: 0,
      total: depositAmount,
      balanceDue: depositAmount,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      status: 'draft',
    });
    await invoice.save();
    return { success: true, invoice };
  }

  async createProgressInvoice(jobId, milestone, amount) {
    const job = await Job.findById(jobId);
    if (!job) return { success: false, message: 'Job not found' };

    const invoice = new Invoice({
      contractor: job.contractor,
      customer: job.customer,
      jobId: job._id,
      type: 'progress',
      description: `${job.title} - ${milestone}`,
      lineItems: [{
        name: milestone,
        description: `Progress payment for ${milestone}`,
        quantity: 1,
        unitPrice: amount,
        total: amount,
      }],
      subtotal: amount,
      taxRate: 0,
      taxAmount: 0,
      total: amount,
      balanceDue: amount,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'draft',
    });
    await invoice.save();
    return { success: true, invoice };
  }
}

module.exports = InvoiceAgent;
