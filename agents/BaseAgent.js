"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAgent = void 0;
const Lead_1 = require("../models/Lead");
const AgentRun_1 = require("../models/AgentRun");

const SCORE_WEIGHTS = {
  budget: 0.35,
  urgency: 0.30,
  timeline: 0.20,
  hasContact: 0.15,
};

function calculateLeadScore(lead) {
  let score = 50;
  if (lead.budget) {
    if (lead.budget > 10000) score += 35;
    else if (lead.budget > 5000) score += 25;
    else if (lead.budget > 2000) score += 15;
    else if (lead.budget > 500) score += 8;
    else score += 3;
  }
  switch (lead.urgency) {
    case 'emergency': score += 30; break;
    case 'high': score += 22; break;
    case 'medium': score += 12; break;
    case 'low': score += 5; break;
  }
  switch (lead.timeline) {
    case 'asap': score += 20; break;
    case '1-2_weeks': score += 14; break;
    case '2-4_weeks': score += 8; break;
    case 'flexible': score += 3; break;
  }
  if (lead.email && lead.phone) score += 15;
  else if (lead.email || lead.phone) score += 8;
  return Math.min(100, Math.max(0, score));
}

function calculateGiftCardAmount(score) {
  if (score >= 90) return 150;
  if (score >= 80) return 125;
  if (score >= 70) return 100;
  if (score >= 60) return 75;
  return 50;
}

function calculateEstimatedValue(lead) {
  const baseValues = {
    plumbing: 850, hvac: 4200, electrical: 1200, roofing: 8500,
    painting: 2400, flooring: 3800, kitchen_remodel: 18500,
    bathroom_remodel: 12000, landscaping: 3200, general_contractor: 6500,
    pest_control: 450, water_damage: 5200, mold_remediation: 3800,
    window_replacement: 6200, deck_building: 9500,
  };
  return baseValues[lead.serviceType] || 2000;
}

class BaseAgent {
  async run(context = {}) {
    const logs = [];
    const startTime = Date.now();
    try {
      logs.push(`[${this.slug}] Starting execution...`);
      const rawLeads = await this.execute(context);
      logs.push(`[${this.slug}] Found ${rawLeads.length} raw leads`);
      if (rawLeads.length === 0) {
        return {
          success: true, leadsGenerated: 0, leadsInserted: 0,
          message: `${this.name}: No new leads found this cycle.`, logs,
        };
      }
      let inserted = 0;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      for (const raw of rawLeads) {
        const score = calculateLeadScore(raw);
        const giftCardAmount = calculateGiftCardAmount(score);
        const estimatedValue = calculateEstimatedValue(raw);
        const existing = await Lead_1.Lead.findOne({
          $or: [
            { email: raw.email, serviceType: raw.serviceType, createdAt: { $gte: thirtyDaysAgo } },
            { phone: raw.phone, serviceType: raw.serviceType, createdAt: { $gte: thirtyDaysAgo } },
          ],
        });
        if (existing) {
          logs.push(`[${this.slug}] Duplicate skipped: ${raw.email} for ${raw.serviceType}`);
          continue;
        }
        const lead = new Lead_1.Lead({
          firstName: raw.firstName, lastName: raw.lastName,
          email: raw.email, phone: raw.phone,
          serviceType: raw.serviceType, zipCode: raw.zipCode,
          address: raw.address || '', city: raw.city || '', state: raw.state || 'CA',
          budget: raw.budget || estimatedValue,
          urgency: raw.urgency || 'medium',
          timeline: raw.timeline || 'flexible',
          notes: raw.notes || '',
          source: this.slug,
          sourceDetail: raw.sourceDetail || `${this.name} lead`,
          score, estimatedValue, giftCardAmount,
          status: 'new',
        });
        await lead.save();
        inserted++;
        logs.push(`[${this.slug}] Inserted: ${raw.email} | ${raw.serviceType} | Score: ${score} | Gift: $${giftCardAmount}`);
      }
      const duration = Date.now() - startTime;
      logs.push(`[${this.slug}] Completed in ${duration}ms. ${inserted}/${rawLeads.length} leads inserted.`);
      await AgentRun_1.AgentRun.create({
        agentSlug: this.slug, agentName: this.name,
        status: inserted > 0 ? 'success' : 'completed',
        leadsFound: rawLeads.length, leadsInserted: inserted,
        executionTimeMs: duration, logs, createdAt: new Date(),
      });
      return {
        success: true, leadsGenerated: rawLeads.length, leadsInserted: inserted,
        message: `${this.name}: ${inserted} leads inserted out of ${rawLeads.length} found.`, logs,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logs.push(`[${this.slug}] ERROR: ${errorMsg}`);
      await AgentRun_1.AgentRun.create({
        agentSlug: this.slug, agentName: this.name, status: 'failed',
        leadsFound: 0, leadsInserted: 0, executionTimeMs: Date.now() - startTime,
        logs, error: errorMsg, createdAt: new Date(),
      });
      return {
        success: false, leadsGenerated: 0, leadsInserted: 0,
        message: `${this.name} failed: ${errorMsg}`, logs,
      };
    }
  }
  async healthCheck() { return true; }
  async validateConfig() { return { valid: true, errors: [] }; }
}
exports.BaseAgent = BaseAgent;
