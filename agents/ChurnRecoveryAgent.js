"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChurnRecoveryAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
const { LV_FIRST_NAMES, LV_LAST_NAMES, ALL_ZIPS, LV_STREETS, LV_SERVICES, LV_NEIGHBORHOODS } = require('../config/las-vegas');

class ChurnRecoveryAgent extends BaseAgent_1.BaseAgent {
  constructor() { super(...arguments); this.slug = 'churn-recovery'; this.name = 'Churn Recovery Agent'; this.category = 'engagement'; this.defaultSchedule = '0 10 * * *'; }

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
        firstName: 'Maria', lastName: 'Gonzalez',
        serviceType: 'hvac',
        zipKey: 'Summerlin', street: 'Summerlin Pkwy', streetNum: 1200,
        budget: 7200, urgency: 'high', timeline: 'asap',
        notes: 'COLD LEAD RECOVERY #1: Requested AC replacement quote 48 days ago during first 100°F day. No response to 2 follow-ups. AC completely died yesterday - 114°F today. Offering 15% summer urgency discount + priority install (next 48 hours). Previously quoted $8,200, now $6,970. Pool home with elderly resident = medical priority.',
        sourceDetail: 'Churn recovery #1 - AC replacement, 48 days cold, heat emergency (Summerlin)'
      },
      {
        firstName: 'James', lastName: 'Rodriguez',
        serviceType: 'pool_service_&_repair',
        zipKey: 'Henderson (Green Valley)', street: 'St Rose Pkwy', streetNum: 1500,
        budget: 3800, urgency: 'high', timeline: '1-2_weeks',
        notes: 'COLD LEAD RECOVERY #2: Pool pump replacement lead, stalled due to budget concerns 55 days ago. Now offering 0% financing for 12 months + free first month of weekly service. Monthly payment $317. Green Valley pool is green and HOA threatening fine. Neighbor referred us after their great experience.',
        sourceDetail: 'Churn recovery #2 - pool pump, financing offer (Green Valley)'
      },
      {
        firstName: 'Jennifer', lastName: 'Martinez',
        serviceType: 'roofing',
        zipKey: 'Enterprise / Southwest', street: 'Fort Apache Rd', streetNum: 7800,
        budget: 15500, urgency: 'emergency', timeline: 'asap',
        notes: 'COLD LEAD RECOVERY #1: Roof inspection requested 41 days ago. Went with cheaper competitor who never showed for scheduled inspection. Last night\'s monsoon caused active leak in garage and water stain on ceiling. Offering emergency tarp + price match guarantee + 10-year workmanship warranty. Insurance claim help included.',
        sourceDetail: 'Churn recovery #1 - roof inspection, competitor no-show, monsoon damage (Enterprise)'
      },
      {
        firstName: 'Robert', lastName: 'Hernandez',
        serviceType: 'solar_installation',
        zipKey: 'Henderson (Anthem/Seven Hills)', street: 'Anthem Pkwy', streetNum: 2600,
        budget: 28000, urgency: 'medium', timeline: '2-4_weeks',
        notes: 'COLD LEAD RECOVERY #3: Solar + battery quote requested 67 days ago. Decided to "wait for prices to drop." NV Energy rates just increased another 12%. Neighbor installed same system and July bill was $38 vs their $520. Now offering $1,500 summer rebate + free 5-year monitoring. Federal tax credit still 26%.',
        sourceDetail: 'Churn recovery #3 - solar install, NV Energy rate hike re-engagement (Anthem)'
      },
      {
        firstName: 'Amanda', lastName: 'Torres',
        serviceType: 'landscaping_/_xeriscape',
        zipKey: 'Spring Valley', street: 'Rainbow Blvd', streetNum: 3900,
        budget: 6500, urgency: 'medium', timeline: '2-4_weeks',
        notes: 'COLD LEAD RECOVERY #2: Xeriscape quote requested 38 days ago. Stalled when husband got laid off. Back to work now. SNWA rebate increased to $3/sqft. Offering phased payment plan (50/50) + free SNWA rebate filing assistance. Lawn is completely dead anyway from 110°F+ heat. Ready to move forward.',
        sourceDetail: 'Churn recovery #2 - xeriscape, phased payment (Spring Valley)'
      },
      {
        firstName: 'David', lastName: 'Nguyen',
        serviceType: 'plumbing',
        zipKey: 'Centennial Hills', street: 'Durango Dr', streetNum: 5800,
        budget: 3400, urgency: 'high', timeline: '1-2_weeks',
        notes: 'COLD LEAD RECOVERY #1: Whole-house repipe quote requested 52 days ago. Chose cheaper unlicensed contractor who abandoned job after demo. Half the house has no water pressure. Drywall is open. City requires licensed plumber to finish. Offering emergency priority + price match on original quote + free drywall patch referral.',
        sourceDetail: 'Churn recovery #1 - repipe, unlicensed contractor disaster (Centennial Hills)'
      },
      {
        firstName: 'Ashley', lastName: 'Lopez',
        serviceType: 'electrical',
        zipKey: 'North Las Vegas', street: 'Centennial Pkwy', streetNum: 4200,
        budget: 4800, urgency: 'medium', timeline: '1-2_weeks',
        notes: 'COLD LEAD RECOVERY #2: EV charger + panel upgrade quote requested 44 days ago. Tesla delivery delayed so lead went cold. Car arrives next week. Now offering $500 NV Energy EV charger rebate assistance + free load calculation. Home has 200A service but needs subpanel for 48A charger. Financing available.',
        sourceDetail: 'Churn recovery #2 - EV charger, Tesla delivery delayed (North Las Vegas)'
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
exports.ChurnRecoveryAgent = ChurnRecoveryAgent;
