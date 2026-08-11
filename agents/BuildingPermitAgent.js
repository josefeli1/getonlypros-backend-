"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildingPermitAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
const { LV_FIRST_NAMES, LV_LAST_NAMES, ALL_ZIPS, LV_STREETS, LV_NEIGHBORHOODS, LV_PERMIT_DATA } = require('../config/las-vegas');

class BuildingPermitAgent extends BaseAgent_1.BaseAgent {
  constructor() { super(...arguments); this.slug = 'building-permit'; this.name = 'Building Permit Agent'; this.category = 'intelligence'; this.defaultSchedule = '0 */4 * * *'; }

  _rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  _randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  _phone() { return `702-${this._randInt(200, 999)}-${this._randInt(1000, 9999)}`; }

  async execute(_context) {
    const neighborhoods = LV_NEIGHBORHOODS.reduce((acc, n) => {
      acc[n.name] = { zip: n.zips[0], city: n.name.includes('Henderson') ? 'Henderson' : n.name.includes('North') ? 'North Las Vegas' : n.name.includes('Boulder') ? 'Boulder City' : 'Las Vegas' };
      return acc;
    }, {});

    const permits = [
      {
        firstName: 'Ashley', lastName: 'Williams',
        serviceType: 'kitchen_remodel',
        zipKey: 'Summerlin', street: 'Summerlin Pkwy', streetNum: 2250,
        budget: 45000, urgency: 'medium', timeline: '1-2_weeks',
        notes: `PERMIT: CCLV-2026-0042 issued by Clark County for kitchen remodel, 420 sqft. Includes island addition, quartz countertops, pendant lighting, and dual-fuel range gas line. Homeowner seeking licensed contractor with Summerlin HOA experience. Permit issued 6/25. Market context: new construction permits down ${Math.round((1 - LV_PERMIT_DATA.slowdownFactor) * 100)}% YTD = renovation boom underway.`,
        sourceDetail: 'Building permit #CCLV-2026-0042 - kitchen remodel (Summerlin)'
      },
      {
        firstName: 'James', lastName: 'Miller',
        serviceType: 'general_contractor',
        zipKey: 'Henderson (Green Valley)', street: 'St Rose Pkwy', streetNum: 800,
        budget: 195000, urgency: 'medium', timeline: 'asap',
        notes: `PERMIT: HND-2026-0117 issued by City of Henderson for ADU construction, 680 sqft detached casita. Full kitchen, bath, mini-split HVAC, and separate meter. Green Valley Ranch area. Major project - needs licensed GC with Henderson ADU experience. Issued 6/27. Permits down ${Math.round((1 - LV_PERMIT_DATA.slowdownFactor) * 100)}% = homeowners renovating instead of moving.`,
        sourceDetail: 'Building permit #HND-2026-0117 - ADU casita (Henderson)'
      },
      {
        firstName: 'Daniel', lastName: 'Garcia',
        serviceType: 'roofing',
        zipKey: 'Enterprise / Southwest', street: 'Durango Dr', streetNum: 9200,
        budget: 18500, urgency: 'high', timeline: '1-2_weeks',
        notes: 'PERMIT: CCLV-2026-0089 issued by Clark County for complete roof replacement, 2,650 sqft. Switching from original builder shingles to TPO cool roof (energy rebate eligible). Home built 2005. Solar panel ready layout. HOA architectural approval obtained. Permit issued 6/26.',
        sourceDetail: 'Building permit #CCLV-2026-0089 - cool roof replacement (Enterprise)'
      },
      {
        firstName: 'Sarah', lastName: 'Rodriguez',
        serviceType: 'pool_service_&_repair',
        zipKey: 'Henderson (Anthem/Seven Hills)', street: 'Anthem Pkwy', streetNum: 2450,
        budget: 28000, urgency: 'medium', timeline: '2-4_weeks',
        notes: 'PERMIT: HND-2026-0034 issued by City of Henderson for pool remodel + Baja shelf addition, 450 sqft pool surface. Includes variable-speed pump upgrade (NV Energy rebate eligible), LED lighting, and Pebble Tec resurfacing. Seven Hills CC&R compliance required. Structural engineering approved. Issued 6/28.',
        sourceDetail: 'Building permit #HND-2026-0034 - pool remodel (Seven Hills)'
      },
      {
        firstName: 'Robert', lastName: 'Smith',
        serviceType: 'solar_installation',
        zipKey: 'North Las Vegas', street: 'Centennial Pkwy', streetNum: 4800,
        budget: 32000, urgency: 'medium', timeline: '1-2_weeks',
        notes: `PERMIT: NLV-2026-0056 issued by City of North Las Vegas for 8.2kW solar + Tesla Powerwall 3 battery backup. NV Energy net metering application pending. Roof is 6 years old, structurally approved. Federal tax credit + NV rebate eligible. Permit issued 6/24. Homeowner cited NV Energy rate hikes as primary motivation.`,
        sourceDetail: 'Building permit #NLV-2026-0056 - solar + battery (North Las Vegas)'
      },
      {
        firstName: 'Jennifer', lastName: 'Lee',
        serviceType: 'bathroom_remodel',
        zipKey: 'Spring Valley', street: 'Rainbow Blvd', streetNum: 4100,
        budget: 22000, urgency: 'medium', timeline: '2-4_weeks',
        notes: 'PERMIT: CCLV-2026-0078 issued by Clark County for master bath remodel, 180 sqft. Includes walk-in shower with frameless glass, freestanding tub, heated floors, and re-pipe for hard water pressure issues. Home built 1992. Permit issued 6/25.',
        sourceDetail: 'Building permit #CCLV-2026-0078 - master bath remodel (Spring Valley)'
      },
    ];

    return permits.map(p => {
      const n = neighborhoods[p.zipKey] || { zip: this._rand(ALL_ZIPS), city: 'Las Vegas' };
      return {
        firstName: p.firstName,
        lastName: p.lastName,
        email: `${p.firstName.toLowerCase()}.${p.lastName.toLowerCase()}@gmail.com`,
        phone: this._phone(),
        serviceType: p.serviceType,
        zipCode: n.zip,
        address: `${p.streetNum} ${p.street}`,
        city: n.city,
        state: 'NV',
        budget: p.budget,
        urgency: p.urgency,
        timeline: p.timeline,
        notes: p.notes,
        sourceDetail: p.sourceDetail,
      };
    });
  }
}
exports.BuildingPermitAgent = BuildingPermitAgent;
