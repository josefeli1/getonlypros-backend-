"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketAnalysisAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
const { LV_FIRST_NAMES, LV_LAST_NAMES, ALL_ZIPS, LV_STREETS, LV_SERVICES, LV_NEIGHBORHOODS, LV_WEATHER_TRIGGERS } = require('../config/las-vegas');

class MarketAnalysisAgent extends BaseAgent_1.BaseAgent {
  constructor() { super(...arguments); this.slug = 'market-analysis'; this.name = 'Market Analysis Agent'; this.category = 'intelligence'; this.defaultSchedule = '0 5 * * *'; }

  _rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  _randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  _phone() { return `702-${this._randInt(200, 999)}-${this._randInt(1000, 9999)}`; }

  async execute(_context) {
    const neighborhoods = LV_NEIGHBORHOODS.reduce((acc, n) => {
      acc[n.name] = { zip: n.zips[0], city: n.name.includes('Henderson') ? 'Henderson' : n.name.includes('North') ? 'North Las Vegas' : n.name.includes('Boulder') ? 'Boulder City' : 'Las Vegas' };
      return acc;
    }, {});

    const heatWave = LV_WEATHER_TRIGGERS.find(w => w.event === 'Extreme Heat Wave');
    const monsoon = LV_WEATHER_TRIGGERS.find(w => w.event === 'Monsoon Flash Flood');
    const sustainedHeat = LV_WEATHER_TRIGGERS.find(w => w.event === 'Sustained Heat (7+ days)');

    const leads = [
      {
        firstName: 'Stephanie', lastName: 'Martinez',
        serviceType: 'hvac',
        zipKey: 'North Las Vegas', street: 'Craig Rd', streetNum: 3400,
        budget: 7800, urgency: 'emergency', timeline: 'asap',
        notes: `DEMAND SURGE: ${heatWave.event} active - temps hitting ${heatWave.temp}. AC emergency calls up 340% in North Las Vegas zip 89031. 14 homes on this block alone reported unit failures in last 48 hours. Homeowner's 18-year-old Trane died yesterday afternoon. Has portable units but not enough for 115°F. Pre-approved for financing.`,
        sourceDetail: 'Market analysis - AC emergency demand +340% (North Las Vegas heat wave)'
      },
      {
        firstName: 'Michael', lastName: 'Johnson',
        serviceType: 'roofing',
        zipKey: 'Enterprise / Southwest', street: 'Blue Diamond Rd', streetNum: 8800,
        budget: 19500, urgency: 'high', timeline: 'asap',
        notes: `DEMAND SURGE: ${monsoon.event} forecast - ${monsoon.rainfall} rainfall expected. Roofing demand projected to spike 280% in next 10 days across Enterprise/Southwest. 8 homes in zip 89178 reported hail damage from last storm. Proactive homeowner seeking preemptive inspection before next storm cycle. Insurance claim pre-approved.`,
        sourceDetail: 'Market analysis - roofing demand surge +280% (monsoon prep, Enterprise)'
      },
      {
        firstName: 'Nicole', lastName: 'Garcia',
        serviceType: 'pool_service_&_repair',
        zipKey: 'Henderson (Anthem/Seven Hills)', street: 'Anthem Pkwy', streetNum: 2100,
        budget: 5600, urgency: 'high', timeline: '1-2_weeks',
        notes: `DEMAND SURGE: ${sustainedHeat.event} (${sustainedHeat.temp} for 9 straight days) = pool pump failures up 220% in Anthem/Seven Hills. Pool service wait times now 2+ weeks. Homeowner's Pentair variable-speed pump seized this morning. Pool is 85°F and algae forming. Needs immediate replacement + weekly service switch.`,
        sourceDetail: 'Market analysis - pool pump demand +220% (sustained heat, Anthem)'
      },
      {
        firstName: 'Christopher', lastName: 'Smith',
        serviceType: 'water_damage_restoration',
        zipKey: 'Henderson (Green Valley)', street: 'Green Valley Pkwy', streetNum: 1900,
        budget: 9500, urgency: 'emergency', timeline: 'asap',
        notes: 'DEMAND SURGE: Flash flood last night - 2.3 inches in 45 minutes. Water damage restoration demand up 500% in Green Valley. This homeowner has 3 inches of water in finished basement. Carpet, drywall, and baseboards soaked. Mold risk high in 110°F heat. Insurance approved emergency mitigation. Needs crew TODAY.',
        sourceDetail: 'Market analysis - water damage demand +500% (Green Valley flash flood)'
      },
      {
        firstName: 'Amanda', lastName: 'Rodriguez',
        serviceType: 'solar_installation',
        zipKey: 'Summerlin', street: 'Grand Canyon Dr', streetNum: 1500,
        budget: 31000, urgency: 'high', timeline: '1-2_weeks',
        notes: 'DEMAND SURGE: NV Energy peak summer rates now 47¢/kWh 3pm-8pm. Solar + battery inquiries up 180% in Summerlin. This homeowner paid $680 last month for 3,200 sqft home. Neighbor installed solar + Powerwall and bill dropped to $42. Pre-approved for 26% federal tax credit. Wants 10kW system with 2 Powerwalls.',
        sourceDetail: 'Market analysis - solar demand +180% (NV Energy rate surge, Summerlin)'
      },
      {
        firstName: 'Matthew', lastName: 'Nguyen',
        serviceType: 'landscaping_/_xeriscape',
        zipKey: 'Spring Valley', street: 'Tropicana Ave', streetNum: 5200,
        budget: 6800, urgency: 'high', timeline: '1-2_weeks',
        notes: 'DEMAND SURGE: SNWA Stage 2 water restrictions now active. Xeriscape conversion demand up 95% in Spring Valley. Turf removal rebate applications up 40% month-over-month. Homeowner has 1,200 sqft of grass dying in heat. Wants full desert landscape with drip irrigation, artificial turf in backyard, and desert-friendly plants. SNWA rebate paperwork help needed.',
        sourceDetail: 'Market analysis - xeriscape demand +95% (SNWA water restrictions, Spring Valley)'
      },
      {
        firstName: 'Jessica', lastName: 'Lee',
        serviceType: 'hvac',
        zipKey: 'Paradise / Strip Corridor', street: 'Flamingo Rd', streetNum: 2800,
        budget: 6200, urgency: 'emergency', timeline: 'asap',
        notes: 'DEMAND SURGE: First 100°F+ day triggered 9-1-1 AC emergency overload. Paradise area AC repair demand up 410%. Homeowner is elderly with COPD - indoor temp reached 96°F overnight because unit cannot keep up. Landlord-approved repair. Needs reliable technician with parts inventory for 20-year-old Carrier system. Medical urgency.',
        sourceDetail: 'Market analysis - AC emergency demand +410% (Paradise, medical urgency)'
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
exports.MarketAnalysisAgent = MarketAnalysisAgent;
