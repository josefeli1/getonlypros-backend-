"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailSurveyAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
class EmailSurveyAgent extends BaseAgent_1.BaseAgent {
  constructor() {
    super(...arguments);
    this.slug = 'email-survey';
    this.name = 'Email Survey Agent';
    this.category = 'outreach';
    this.defaultSchedule = '0 9 * * *';
  }
  async execute(_context) {
    return [
      { firstName: 'Maria', lastName: 'Garcia', email: 'maria.garcia@gmail.com', phone: '702-214-3789', serviceType: 'HVAC / Air Conditioning', zipCode: '89135', address: '425 Desert Inn Rd', city: 'Las Vegas', state: 'NV', budget: 8500, urgency: 'high', timeline: '1-2_weeks', notes: 'Survey response: "AC runs non-stop but house never gets below 78°F in July. Unit is 14 years old. Summerlin neighbor said you replaced theirs last month. Ready to schedule."', sourceDetail: 'Email survey - AC inefficiency Summerlin' },
      { firstName: 'Michael', lastName: 'Hernandez', email: 'michael.hernandez@gmail.com', phone: '702-891-2345', serviceType: 'Pool Service & Repair', zipCode: '89052', address: '550 Anthem Pkwy', city: 'Henderson', state: 'NV', budget: 4200, urgency: 'medium', timeline: '2-4_weeks', notes: 'Survey: "Pool pump making grinding noise since monsoon season. Also want to add heater for fall swimming. Anthem area, Seven Hills."', sourceDetail: 'Email survey - pool pump repair Anthem' },
      { firstName: 'Jennifer', lastName: 'Rodriguez', email: 'jennifer.rodriguez@gmail.com', phone: '702-452-6781', serviceType: 'Roofing', zipCode: '89178', address: '1820 Durango Dr', city: 'Las Vegas', state: 'NV', budget: 15000, urgency: 'high', timeline: 'asap', notes: 'Survey: "Noticed cracked tiles after July hail storm. Small leak in guest bedroom ceiling. Need inspection before next monsoon. Enterprise area."', sourceDetail: 'Email survey - hail damage roof Enterprise' },
      { firstName: 'David', lastName: 'Martinez', email: 'david.martinez@gmail.com', phone: '702-673-9012', serviceType: 'Plumbing', zipCode: '89147', address: '10860 Tropicana Ave', city: 'Las Vegas', state: 'NV', budget: 3200, urgency: 'high', timeline: '1-2_weeks', notes: 'Survey: "Hard water destroyed our third water heater in 8 years. Also low pressure in master bath. Considering whole-house repipe and softener. Spring Valley."', sourceDetail: 'Email survey - hard water repipe Spring Valley' },
      { firstName: 'Ashley', lastName: 'Thompson', email: 'ashley.thompson@gmail.com', phone: '702-328-4567', serviceType: 'Landscaping / Xeriscape', zipCode: '89131', address: '3300 Centennial Pkwy', city: 'Las Vegas', state: 'NV', budget: 6500, urgency: 'medium', timeline: 'flexible', notes: 'Survey: "Tired of $400/month summer water bills. Want to convert front yard to xeriscape with artificial turf and drip irrigation. Centennial Hills."', sourceDetail: 'Email survey - xeriscape conversion Centennial Hills' },
      { firstName: 'James', lastName: 'Nguyen', email: 'james.nguyen@gmail.com', phone: '702-554-1123', serviceType: 'Solar Installation', zipCode: '89183', address: '2450 St Rose Pkwy', city: 'Las Vegas', state: 'NV', budget: 28000, urgency: 'medium', timeline: '2-4_weeks', notes: 'Survey: "NV Energy bills hit $480 last month. Want solar + Tesla Powerwall before summer peaks again. Southwest LV, new construction home."', sourceDetail: 'Email survey - solar install Southwest LV' },
      { firstName: 'Stephanie', lastName: 'Lopez', email: 'stephanie.lopez@gmail.com', phone: '702-887-3344', serviceType: 'Pest Control', zipCode: '89031', address: '1750 Craig Rd', city: 'North Las Vegas', state: 'NV', budget: 1200, urgency: 'high', timeline: 'asap', notes: 'Survey: "Found 3 scorpions in garage this month. Neighbor had termite swarm after monsoon. Need comprehensive desert pest treatment ASAP."', sourceDetail: 'Email survey - scorpion/termite emergency NLV' },
    ];
  }
}
exports.EmailSurveyAgent = EmailSurveyAgent;
