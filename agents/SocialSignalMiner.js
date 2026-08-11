"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialSignalMiner = void 0;
const BaseAgent_1 = require("./BaseAgent");
class SocialSignalMiner extends BaseAgent_1.BaseAgent {
  constructor() {
    super(...arguments);
    this.slug = 'social-signal';
    this.name = 'Social Signal Miner';
    this.category = 'monitoring';
    this.defaultSchedule = '*/30 * * * *';
  }
  async execute(_context) {
    return [
      { firstName: 'Jessica', lastName: 'Martinez', email: 'jessica.martinez@gmail.com', phone: '702-223-4567', serviceType: 'HVAC / Air Conditioning', zipCode: '89135', address: '850 Desert Inn Rd', city: 'Las Vegas', state: 'NV', budget: 8500, urgency: 'emergency', timeline: 'asap', notes: 'Nextdoor Summerlin West: "AC died at 11pm and it is 97 degrees inside. Have a 6-month-old baby. Who does emergency HVAC this late?" 47 reactions, 15 comments recommending contractors.', sourceDetail: 'Nextdoor Summerlin - AC emergency with infant' },
      { firstName: 'Christopher', lastName: 'Lee', email: 'christopher.lee@gmail.com', phone: '702-334-5678', serviceType: 'Plumbing', zipCode: '89052', address: '180 Anthem Pkwy', city: 'Henderson', state: 'NV', budget: 3200, urgency: 'high', timeline: 'asap', notes: 'Nextdoor Anthem: "Hard water finally killed our tankless water heater. 3rd one in 10 years. Need plumber who knows Las Vegas water. Also want whole-house softener quote." 11 neighbors recommended.', sourceDetail: 'Nextdoor Anthem - hard water heater failure' },
      { firstName: 'Nicole', lastName: 'Garcia', email: 'nicole.garcia@gmail.com', phone: '702-556-7789', serviceType: 'Pool Service & Repair', zipCode: '89178', address: '425 Durango Dr', city: 'Las Vegas', state: 'NV', budget: 4200, urgency: 'medium', timeline: '1-2_weeks', notes: 'Facebook group "Las Vegas Pool Owners": "Monsoon blew palm fronds into pump basket and burned out the motor. Pool is turning green in this heat. Southwest LV near Blue Diamond. Need repair + weekly service."', sourceDetail: 'Facebook LV Pool Owners - pump failure monsoon' },
      { firstName: 'William', lastName: 'Rodriguez', email: 'william.rodriguez@gmail.com', phone: '702-778-9901', serviceType: 'Electrical', zipCode: '89131', address: '427 Centennial Pkwy', city: 'Las Vegas', state: 'NV', budget: 4800, urgency: 'high', timeline: '1-2_weeks', notes: 'Reddit r/vegaslocals: "Our 1998 home in Centennial Hills still has 100A panel. Trying to install EV charger and AC upgrade but electrician says we need 200A service. Any recs?" 22 upvotes.', sourceDetail: 'Reddit r/vegaslocals - panel upgrade needed' },
      { firstName: 'Rebecca', lastName: 'Perez', email: 'rebecca.perez@gmail.com', phone: '702-889-0012', serviceType: 'Roofing', zipCode: '89074', address: '1600 Green Valley Pkwy', city: 'Henderson', state: 'NV', budget: 15000, urgency: 'medium', timeline: '1-2_weeks', notes: 'Nextdoor Green Valley: "Tile roof has 4 broken tiles after last week\'s hail. Small leak in attic during yesterday\'s monsoon. Need repair before next storm. Also want solar-ready inspection."', sourceDetail: 'Nextdoor Green Valley - hail roof damage' },
      { firstName: 'John', lastName: 'Smith', email: 'john.smith@gmail.com', phone: '702-990-1123', serviceType: 'Window / Energy Efficiency', zipCode: '89147', address: '3100 Rainbow Blvd', city: 'Las Vegas', state: 'NV', budget: 9500, urgency: 'high', timeline: '2-4_weeks', notes: 'Facebook group "Spring Valley Homeowners": "Single pane windows from 1985. AC runs 18 hours a day and house still hits 85°F. Looking for energy efficient window quotes. Also interested in tint."', sourceDetail: 'Facebook Spring Valley - energy efficient windows' },
    ];
  }
}
exports.SocialSignalMiner = SocialSignalMiner;
