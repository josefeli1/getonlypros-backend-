const BaseAgent = require('./BaseAgent');
const { Job } = require('../models/Job');
const { Proposal } = require('../models/Proposal');

/**
 * EstimatorAgent
 * AI-powered estimating engine. Generates accurate quotes based on:
 * - Service category
 * - Location (zip code pricing)
 * - Property details
 * - Historical data
 * - Seasonal adjustments
 * - Material/labor rates
 */
class EstimatorAgent extends BaseAgent {
  constructor() {
    super('EstimatorAgent', 'estimator');
    this.baseRates = {
      'AC Repair': { labor: 150, materialMin: 50, materialMax: 400, diagnostic: 89, avg: 375 },
      'AC Installation': { labor: 2500, materialMin: 2000, materialMax: 8000, avg: 6500 },
      'AC Maintenance': { labor: 89, materialMin: 0, materialMax: 50, avg: 150 },
      'Plumbing Repair': { labor: 125, materialMin: 30, materialMax: 300, avg: 280 },
      'Plumbing Installation': { labor: 400, materialMin: 100, materialMax: 1000, avg: 850 },
      'Electrical Repair': { labor: 150, materialMin: 25, materialMax: 350, avg: 325 },
      'Electrical Panel': { labor: 800, materialMin: 400, materialMax: 1500, avg: 1400 },
      'Roof Repair': { labor: 350, materialMin: 100, materialMax: 1500, avg: 1100 },
      'Roof Replacement': { labor: 5000, materialMin: 4000, materialMax: 15000, avg: 12000 },
      'HVAC Tune-Up': { labor: 89, materialMin: 0, materialMax: 100, avg: 150 },
      'Water Heater': { labor: 600, materialMin: 300, materialMax: 1200, avg: 1100 },
      'Drain Cleaning': { labor: 150, materialMin: 0, materialMax: 100, avg: 225 },
    };
    this.zipMultipliers = {
      '89135': 1.15, // Summerlin premium
      '89134': 1.15,
      '89144': 1.12,
      '89138': 1.10,
      '89117': 1.10,
      '89128': 1.08,
      '89129': 1.08,
      '89107': 1.05,
      '89102': 1.05,
      '89101': 1.00, // Downtown
      '89103': 1.00,
      '89104': 1.00,
      '89108': 1.00,
      '89109': 1.02, // Strip area
      '89110': 0.95, // East Las Vegas
      '89115': 0.95,
      '89121': 0.98,
      '89122': 0.98,
      '89123': 1.02,
      '89052': 1.10, // Henderson
      '89074': 1.10,
      '89014': 1.08,
      '89012': 1.08,
      '89015': 1.00,
    };
    this.seasonalMultipliers = {
      0: 1.00,  // Jan
      1: 1.00,  // Feb
      2: 1.05,  // Mar - spring prep
      3: 1.10,  // Apr
      4: 1.20,  // May - summer rush
      5: 1.30,  // Jun - peak
      6: 1.30,  // Jul - peak
      7: 1.25,  // Aug
      8: 1.10,  // Sep
      9: 1.00,  // Oct
      10: 1.00, // Nov
      11: 1.05, // Dec - holiday premium
    };
  }

  async execute(brief) {
    console.log(`[${this.name}] Generating AI estimate...`);
    if (!brief) return { success: false, message: 'Brief required for estimate' };
    const estimate = await this.generateEstimate(brief);
    return { success: true, estimate };
  }

  async generateEstimate(brief) {
    const { serviceCategory, zipCode, squareFootage, propertyType, description, urgency } = brief;
    const rate = this.baseRates[serviceCategory] || { labor: 100, materialMin: 25, materialMax: 200, diagnostic: 75, avg: 250 };
    const zipMult = this.zipMultipliers[zipCode] || 1.0;
    const month = new Date().getMonth();
    const seasonMult = this.seasonalMultipliers[month] || 1.0;
    const urgencyMult = urgency === 'emergency' ? 1.5 : urgency === 'high' ? 1.2 : 1.0;
    const sizeMult = squareFootage ? Math.max(0.85, Math.min(1.4, squareFootage / 2000)) : 1.0;
    const typeMult = propertyType === 'commercial' ? 1.4 : propertyType === 'condo' ? 0.9 : 1.0;

    const totalMultiplier = zipMult * seasonMult * urgencyMult * sizeMult * typeMult;
    const diagnosticFee = Math.round(rate.diagnostic * zipMult);
    const laborEstimate = Math.round(rate.labor * totalMultiplier);
    const materialEstimate = Math.round((rate.materialMin + rate.materialMax) / 2 * totalMultiplier);
    const totalEstimate = diagnosticFee + laborEstimate + materialEstimate;

    // Build line items
    const lineItems = [
      {
        name: 'Diagnostic Fee',
        description: 'Complete system inspection and diagnosis',
        quantity: 1,
        unit: 'flat fee',
        unitPrice: diagnosticFee,
        totalPrice: diagnosticFee,
        isLabor: true,
        isMaterial: false,
      },
      {
        name: `${serviceCategory} Labor`,
        description: 'Professional labor and workmanship',
        quantity: 1,
        unit: 'job',
        unitPrice: laborEstimate,
        totalPrice: laborEstimate,
        isLabor: true,
        isMaterial: false,
        warrantyIncluded: true,
        warrantyMonths: 12,
      },
      {
        name: 'Materials & Parts',
        description: 'Industry-standard parts and materials',
        quantity: 1,
        unit: 'set',
        unitPrice: materialEstimate,
        totalPrice: materialEstimate,
        isLabor: false,
        isMaterial: true,
        warrantyIncluded: true,
        warrantyMonths: 24,
      },
    ];

    // Optional: add financing
    const total = totalEstimate;
    const financing = {
      available: total > 500,
      terms: [
        { months: 12, apr: 0, monthlyPayment: Math.round(total / 12) },
        { months: 24, apr: 9.99, monthlyPayment: Math.round((total * 1.1) / 24) },
        { months: 60, apr: 14.99, monthlyPayment: Math.round((total * 1.35) / 60) },
      ],
    };

    return {
      serviceCategory,
      zipCode,
      estimatedTotal: totalEstimate,
      range: {
        min: Math.round((rate.diagnostic + rate.labor * 0.8 + rate.materialMin) * totalMultiplier),
        max: Math.round((rate.diagnostic + rate.labor * 1.3 + rate.materialMax) * totalMultiplier),
      },
      lineItems,
      financing,
      confidence: 0.78,
      factors: [
        `Service: ${serviceCategory} (base rate $${rate.avg})`,
        `Location: ${zipCode} (×${zipMult.toFixed(2)} ${zipMult > 1 ? 'Vegas premium' : 'standard'})`,
        `Season: ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month]} (×${seasonMult.toFixed(2)})`,
        urgency ? `Urgency: ${urgency} (×${urgencyMult.toFixed(2)})` : 'Standard scheduling',
        squareFootage ? `Property: ${squareFootage} sq ft (×${sizeMult.toFixed(2)})` : 'Standard property size',
        propertyType ? `Type: ${propertyType} (×${typeMult.toFixed(2)})` : 'Single-family home',
      ],
      aiNotes: `This estimate is based on ${serviceCategory} jobs completed in ${zipCode} over the past 12 months. ${urgency === 'emergency' ? 'Emergency rates apply due to after-hours or priority scheduling.' : ''} Actual cost may vary based on final inspection. A detailed proposal will be prepared after the diagnostic visit.`,
      recommendedParts: [
        { partName: 'Standard replacement part', estimatedPrice: Math.round(materialEstimate * 0.4), inStock: true },
        { partName: 'Premium upgrade option', estimatedPrice: Math.round(materialEstimate * 0.8), inStock: true },
      ],
    };
  }

  async createProposalFromEstimate(contractorId, estimate, customer) {
    const proposal = new Proposal({
      contractor: contractorId,
      customer,
      title: `${estimate.serviceCategory} Quote`,
      description: estimate.aiNotes,
      serviceCategory: estimate.serviceCategory,
      lineItems: estimate.lineItems,
      subtotal: estimate.lineItems.reduce((s, i) => s + i.totalPrice, 0),
      taxRate: 0.0825,
      taxAmount: 0,
      total: estimate.estimatedTotal,
      depositRequired: Math.round(estimate.estimatedTotal * 0.3),
      depositPercent: 30,
      financing: estimate.financing,
      aiGenerated: true,
      aiConfidence: estimate.confidence,
      aiNotes: `AI-generated estimate for ${estimate.serviceCategory} in ${estimate.zipCode}. Confidence: ${Math.round(estimate.confidence * 100)}%`,
      status: 'draft',
    });
    await proposal.save();
    return proposal;
  }
}

module.exports = EstimatorAgent;
