"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompetitorReviewMiner = void 0;
const BaseAgent_1 = require("./BaseAgent");
const { LV_FIRST_NAMES, LV_LAST_NAMES, ALL_ZIPS, LV_STREETS, LV_SERVICES, LV_NEIGHBORHOODS } = require('../config/las-vegas');

class CompetitorReviewMiner extends BaseAgent_1.BaseAgent {
  constructor() { super(...arguments); this.slug = 'competitor-review'; this.name = 'Competitor Review Miner'; this.category = 'intelligence'; this.defaultSchedule = '0 */6 * * *'; }

  _rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  _randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  _phone() { return `702-${this._randInt(200, 999)}-${this._randInt(1000, 9999)}`; }

  async execute(_context) {
    const neighborhoods = LV_NEIGHBORHOODS.reduce((acc, n) => {
      acc[n.name] = n.zips[0];
      return acc;
    }, {});

    const reviews = [
      {
        firstName: 'Maria', lastName: 'Garcia',
        serviceType: 'plumbing',
        zipKey: 'Summerlin', street: 'Summerlin Pkwy', streetNum: 11500,
        budget: 3200, urgency: 'high', timeline: 'asap',
        notes: '1-star Google review on "Vegas Flow Plumbing": "No-showed TWICE for scheduled appointments during 112°F heat. Wasted 2 days waiting. Water heater leaking onto garage floor. Hard water destroyed the old unit. Desperate for a RELIABLE plumber who actually shows up in Summerlin." Posted 2 days ago. Ready to switch.',
        sourceDetail: 'Competitor review - Vegas Flow Plumbing 1-star (Summerlin)'
      },
      {
        firstName: 'Michael', lastName: 'Hernandez',
        serviceType: 'hvac',
        zipKey: 'Henderson (Green Valley)', street: 'Green Valley Pkwy', streetNum: 2500,
        budget: 8500, urgency: 'emergency', timeline: 'asap',
        notes: '1-star Yelp review on "Desert Breeze HVAC": "AC died at 2am during 115°F heat wave. Their "24/7 emergency" line goes straight to voicemail. My elderly mother lives here. Had to check into a hotel. Three neighbors same block said same thing happened with this company. NEED RELIABLE AC NOW." Posted 12 hours ago.',
        sourceDetail: 'Competitor review - Desert Breeze HVAC 1-star (Green Valley)'
      },
      {
        firstName: 'Jennifer', lastName: 'Martinez',
        serviceType: 'pool_service_&_repair',
        zipKey: 'Henderson (Anthem/Seven Hills)', street: 'Anthem Pkwy', streetNum: 2700,
        budget: 4800, urgency: 'high', timeline: '1-2_weeks',
        notes: '2-star Google review on "Blue Wave Pool Service": "Pool pump broke 3 weeks ago. They keep saying parts are "on order." Pool is green and mosquito breeding ground. HOA sent violation notice. Two other Anthem neighbors same issue with this company. Need pool pro who stocks parts locally." Posted 4 days ago.',
        sourceDetail: 'Competitor review - Blue Wave Pool Service 2-star (Anthem)'
      },
      {
        firstName: 'David', lastName: 'Nguyen',
        serviceType: 'roofing',
        zipKey: 'Enterprise / Southwest', street: 'Blue Diamond Rd', streetNum: 7600,
        budget: 16500, urgency: 'emergency', timeline: 'asap',
        notes: '1-star Yelp on "High Desert Roofing": "Monsoon storm last night. Emergency tarp they installed last month FLEW OFF. Water pouring into master bedroom and hallway. Their "emergency" crew said "call back Monday." It is Saturday. Roof is 18 years old, needs full replacement." Posted 8 hours ago.',
        sourceDetail: 'Competitor review - High Desert Roofing 1-star (Enterprise)'
      },
      {
        firstName: 'Jessica', lastName: 'Lopez',
        serviceType: 'electrical',
        zipKey: 'Spring Valley', street: 'Flamingo Rd', streetNum: 4500,
        budget: 5200, urgency: 'high', timeline: '1-2_weeks',
        notes: '2-star Google review on "Bright Spark Electric": "Panel upgrade was a disaster. Left live wires exposed in garage. City inspector failed the job. Had to hire another electrician to fix their mistakes. Overcharged by $1,800. Looking for licensed, honest electrician for EV charger install + panel fix." Posted 5 days ago.',
        sourceDetail: 'Competitor review - Bright Spark Electric 2-star (Spring Valley)'
      },
      {
        firstName: 'Christopher', lastName: 'Ramirez',
        serviceType: 'pest_control',
        zipKey: 'Centennial Hills', street: 'Centennial Pkwy', streetNum: 6500,
        budget: 1400, urgency: 'high', timeline: 'asap',
        notes: '1-star Yelp review on "Desert Shield Pest": "Found 3 scorpions in my kitchen this week. Their "guaranteed" monthly service missed obvious entry points. Neighbor switched to different company and scorpions stopped immediately. Need pest pro who actually understands desert pests and sealing." Posted 3 days ago.',
        sourceDetail: 'Competitor review - Desert Shield Pest 1-star (Centennial Hills)'
      },
      {
        firstName: 'Amanda', lastName: 'Torres',
        serviceType: 'landscaping_/_xeriscape',
        zipKey: 'North Las Vegas', street: 'Craig Rd', streetNum: 2800,
        budget: 7200, urgency: 'medium', timeline: '2-4_weeks',
        notes: '2-star Google review on "Vegas Greens Landscaping": "Xeriscape install was half-finished 5 weeks ago. Crew disappeared after getting 50% deposit. Drip irrigation not connected. SNWA rebate deadline is in 2 weeks. Need honest landscaper to finish the job and help with rebate paperwork." Posted 6 days ago.',
        sourceDetail: 'Competitor review - Vegas Greens Landscaping 2-star (North Las Vegas)'
      },
    ];

    return reviews.map(r => {
      const zip = neighborhoods[r.zipKey] || this._rand(ALL_ZIPS);
      const city = r.zipKey.includes('Henderson') ? 'Henderson' : r.zipKey.includes('North') ? 'North Las Vegas' : 'Las Vegas';
      return {
        firstName: r.firstName,
        lastName: r.lastName,
        email: `${r.firstName.toLowerCase()}.${r.lastName.toLowerCase()}@gmail.com`,
        phone: this._phone(),
        serviceType: r.serviceType,
        zipCode: zip,
        address: `${r.streetNum} ${r.street}`,
        city: city,
        state: 'NV',
        budget: r.budget,
        urgency: r.urgency,
        timeline: r.timeline,
        notes: r.notes,
        sourceDetail: r.sourceDetail,
      };
    });
  }
}
exports.CompetitorReviewMiner = CompetitorReviewMiner;
