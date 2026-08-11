"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiftCardEngine = void 0;
const BaseAgent_1 = require("./BaseAgent");
class GiftCardEngine extends BaseAgent_1.BaseAgent {
  constructor() { super(...arguments); this.slug = 'gift-card'; this.name = 'Gift Card Engine'; this.category = 'engagement'; this.defaultSchedule = '*/10 * * * *'; }
  async execute(_context) {
    return [
      { firstName: 'Sarah', lastName: 'Williams', email: 'sarah.williams@gmail.com', phone: '702-101-2345', serviceType: 'Kitchen Remodel', zipCode: '89135', address: '9550 Summerlin Pkwy', city: 'Las Vegas', state: 'NV', budget: 35000, urgency: 'medium', timeline: 'flexible', notes: '$150 gift card sent for completed kitchen remodel (quartz counters, custom cabinets, LED under-cabinet lighting). Summerlin customer thrilled. Referral potential: HIGH - mentioned HOA neighbor also wants kitchen done.', sourceDetail: 'Gift card referral - kitchen remodel Summerlin $150' },
      { firstName: 'Brian', lastName: 'Jenkins', email: 'brian.jenkins@gmail.com', phone: '702-202-3456', serviceType: 'HVAC / Air Conditioning', zipCode: '89052', address: '700 St Rose Pkwy', city: 'Henderson', state: 'NV', budget: 8500, urgency: 'medium', timeline: '1-2_weeks', notes: '$100 gift card delivered for full HVAC install (Trane 18 SEER with smart thermostat). Anthem customer left 5-star Google review. Referral potential: MEDIUM - asked about referral program for coworker in Seven Hills.', sourceDetail: 'Gift card referral - HVAC install Anthem $100' },
      { firstName: 'Carol', lastName: 'Anderson', email: 'carol.anderson@gmail.com', phone: '702-303-4567', serviceType: 'Roofing', zipCode: '89178', address: '1400 Blue Diamond Rd', city: 'Las Vegas', state: 'NV', budget: 15000, urgency: 'high', timeline: 'asap', notes: '$125 gift card for completed tile roof repair after monsoon hail (replaced 12 broken tiles, sealed flashing). Enterprise job done in 1 day. Customer extremely grateful. Referral potential: HIGH - already told 4 neighbors on Nextdoor.', sourceDetail: 'Gift card referral - roofing Enterprise $125' },
      { firstName: 'Michael', lastName: 'Davis', email: 'michael.davis@gmail.com', phone: '702-404-5678', serviceType: 'Pool Service & Repair', zipCode: '89044', address: '2800 Southern Highlands Pkwy', city: 'Henderson', state: 'NV', budget: 4200, urgency: 'medium', timeline: '1-2_weeks', notes: '$75 gift card for new variable-speed pool pump install + heater hookup. Seven Hills customer swims year-round. Referral potential: HIGH - posted before/after photos in "Henderson Pool Owners" Facebook group.', sourceDetail: 'Gift card referral - pool pump Seven Hills $75' },
      { firstName: 'Laura', lastName: 'Gomez', email: 'laura.gomez@gmail.com', phone: '702-505-6789', serviceType: 'Solar Installation', zipCode: '89183', address: '1900 St Rose Pkwy', city: 'Las Vegas', state: 'NV', budget: 28000, urgency: 'medium', timeline: '2-4_weeks', notes: '$200 gift card for 8.5kW solar + Tesla Powerwall install. Southwest LV customer\'s August bill dropped from $520 to $18. Referral potential: VERY HIGH - 3 coworkers already requested consultations.', sourceDetail: 'Gift card referral - solar Powerwall Southwest LV $200' },
    ];
  }
}
exports.GiftCardEngine = GiftCardEngine;
