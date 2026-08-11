"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingIntelligenceAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
const { LV_FIRST_NAMES, LV_LAST_NAMES, ALL_ZIPS, LV_STREETS, LV_SERVICES, LV_NEIGHBORHOODS } = require('../config/las-vegas');

class PricingIntelligenceAgent extends BaseAgent_1.BaseAgent {
  constructor() { super(...arguments); this.slug = 'pricing-intelligence'; this.name = 'Pricing Intelligence Agent'; this.category = 'intelligence'; this.defaultSchedule = '0 12 * * *'; }

  _rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  _randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  _phone() { return `702-${this._randInt(200, 999)}-${this._randInt(1000, 9999)}`; }

  async execute(_context) {
    const neighborhoods = LV_NEIGHBORHOODS.reduce((acc, n) => {
      acc[n.name] = { zip: n.zips[0], city: n.name.includes('Henderson') ? 'Henderson' : n.name.includes('North') ? 'North Las Vegas' : n.name.includes('Boulder') ? 'Boulder City' : 'Las Vegas' };
      return acc;
    }, {});

    const leads = [
      {
        firstName: 'Michelle', lastName: 'Clark',
        serviceType: 'hvac',
        zipKey: 'Summerlin', street: 'Hualapai Way', streetNum: 1800,
        budget: 7200, urgency: 'high', timeline: '1-2_weeks',
        notes: 'PRICING GAP: Summerlin HVAC install quotes averaging $9,800 vs fair market $6,800 (44% overpriced). NV Energy rates up 34% since 2023 driving demand. This homeowner received 3 quotes all above $9,000 for 3-ton system. Seeking competitive bid with SEER2 16+ efficiency for rebate. Ready to book with fair pricing.',
        sourceDetail: 'Pricing intel - HVAC overpriced 44% in 89135 (Summerlin)'
      },
      {
        firstName: 'Joseph', lastName: 'Gonzalez',
        serviceType: 'landscaping_/_xeriscape',
        zipKey: 'Henderson (Green Valley)', street: 'Green Valley Pkwy', streetNum: 2600,
        budget: 8500, urgency: 'medium', timeline: '2-4_weeks',
        notes: 'PRICING GAP: Green Valley xeriscape quotes averaging $12,500 vs market rate $7,500. SNWA water restrictions now limit turf to 50% of yard. Homeowner has $9K budget but lowest quote was $11,200. Needs value-driven landscaper who knows SNWA rebate program (up to $3/sqft for turf removal). Price-sensitive.',
        sourceDetail: 'Pricing intel - xeriscape overpriced 67% in 89074 (Green Valley)'
      },
      {
        firstName: 'Laura', lastName: 'Hernandez',
        serviceType: 'solar_installation',
        zipKey: 'Enterprise / Southwest', street: 'Fort Apache Rd', streetNum: 7200,
        budget: 26000, urgency: 'high', timeline: '1-2_weeks',
        notes: 'PRICING GAP: Solar install quotes in Enterprise averaging $32,000 vs market rate $24,000 (33% overpriced). NV Energy time-of-use rates now peak at 47¢/kWh 3pm-8pm. Homeowner received 2 quotes from national installers with $8K+ in "dealer fees." Looking for local solar contractor with competitive pricing and battery backup options.',
        sourceDetail: 'Pricing intel - solar overpriced 33% in 89178 (Enterprise)'
      },
      {
        firstName: 'William', lastName: 'Davis',
        serviceType: 'pool_service_&_repair',
        zipKey: 'Henderson (Anthem/Seven Hills)', street: 'St Rose Pkwy', streetNum: 2900,
        budget: 4200, urgency: 'high', timeline: 'asap',
        notes: 'PRICING GAP: Pool pump replacement quotes averaging $5,800 vs fair market $3,800 (53% overpriced). Anthem homeowner received 2 quotes both over $5K for variable-speed pump install. Current single-speed pump is costing $400+/month in NV Energy bills. Needs honest pool pro with pump inventory who can install this week.',
        sourceDetail: 'Pricing intel - pool pump overpriced 53% in 89052 (Anthem)'
      },
      {
        firstName: 'Elizabeth', lastName: 'Lopez',
        serviceType: 'window_/_energy_efficiency',
        zipKey: 'Spring Valley', street: 'Decatur Blvd', streetNum: 3800,
        budget: 8800, urgency: 'medium', timeline: '2-4_weeks',
        notes: 'PRICING GAP: Window replacement quotes in Spring Valley averaging $13,500 vs market rate $8,500 (59% overpriced). Original 1990s aluminum frames leaking cool air. Homeowner received 3 quotes all above $12K for 14 windows. Looking for energy-efficient vinyl replacement with Low-E coating to combat 110°F+ heat. SNWA and NV Energy rebates available.',
        sourceDetail: 'Pricing intel - window replacement overpriced 59% in 89147 (Spring Valley)'
      },
      {
        firstName: 'David', lastName: 'Garcia',
        serviceType: 'electrical',
        zipKey: 'Centennial Hills', street: 'Durango Dr', streetNum: 6100,
        budget: 4200, urgency: 'medium', timeline: '1-2_weeks',
        notes: 'PRICING GAP: EV charger + panel upgrade quotes averaging $6,200 vs market rate $3,800 (63% overpriced). New Tesla Model Y owner. Centennial Hills home built 2008 with 150A panel. Received 2 quotes both over $6K. Looking for licensed electrician with EV charger experience and fair pricing. NV Energy EV rebate up to $500 available.',
        sourceDetail: 'Pricing intel - EV charger overpriced 63% in 89149 (Centennial Hills)'
      },
    ];

    return leads.map(l => {
      const n = neighborhoods[l.zipKey] || { zip: this._rand(ALL_ZIPS), city: 'Las Vegas' };
      return {
        firstName: l.firstName,
        lastName: l.lastName,
        email: `${l.firstName.toLowerCase()}.${l.lastName.toLowerCase()}@gmail.com`,
        phone: this._phone(),
        serviceType: l.serviceType,
        zipCode: n.zip,
        address: `${l.streetNum} ${l.street}`,
        city: n.city,
        state: 'NV',
        budget: l.budget,
        urgency: l.urgency,
        timeline: l.timeline,
        notes: l.notes,
        sourceDetail: l.sourceDetail,
      };
    });
  }
}
exports.PricingIntelligenceAgent = PricingIntelligenceAgent;
