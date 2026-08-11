"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherTriggerAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
class WeatherTriggerAgent extends BaseAgent_1.BaseAgent {
  constructor() {
    super(...arguments);
    this.slug = 'weather-trigger';
    this.name = 'Weather Trigger Agent';
    this.category = 'monitoring';
    this.defaultSchedule = '*/15 * * * *';
  }
  async execute(_context) {
    return [
      { firstName: 'Robert', lastName: 'Ramirez', email: 'robert.ramirez@gmail.com', phone: '702-784-2310', serviceType: 'HVAC / Air Conditioning', zipCode: '89135', address: '9601 Summerlin Pkwy', city: 'Las Vegas', state: 'NV', budget: 9500, urgency: 'emergency', timeline: 'asap', notes: 'EXTREME HEAT WAVE: 114°F peak in Summerlin. AC compressor failed at 2pm. Home has elderly resident. 23 emergency calls logged in zip 89135 today. Insurance may cover hotel.', sourceDetail: 'Weather trigger - extreme heat 114°F Summerlin' },
      { firstName: 'Michelle', lastName: 'Gonzalez', email: 'michelle.gonzalez@gmail.com', phone: '702-901-3456', serviceType: 'Water Damage Restoration', zipCode: '89052', address: '2600 Green Valley Pkwy', city: 'Henderson', state: 'NV', budget: 8500, urgency: 'emergency', timeline: 'asap', notes: 'MONSOON FLASH FLOOD: 1.3 inches rain in 45 minutes. Backyard flooded into home. Standing water in garage and laundry room. Mold risk within 24 hours. Anthem area affected.', sourceDetail: 'Weather trigger - monsoon flash flood Anthem' },
      { firstName: 'Kevin', lastName: 'Walker', email: 'kevin.walker@gmail.com', phone: '702-112-5567', serviceType: 'HVAC / Air Conditioning', zipCode: '89178', address: '645 Blue Diamond Rd', city: 'Las Vegas', state: 'NV', budget: 6800, urgency: 'high', timeline: 'asap', notes: 'HABOOB DUST STORM: 55mph winds with wall of dust. HVAC filter completely clogged. Outdoor condenser coated in fine dust. 8 homes on same Enterprise block reporting issues.', sourceDetail: 'Weather trigger - haboob dust storm Enterprise' },
      { firstName: 'Lisa', lastName: 'Hernandez', email: 'lisa.hernandez@gmail.com', phone: '702-445-8890', serviceType: 'Roofing', zipCode: '89074', address: '201 Pecos Rd', city: 'Henderson', state: 'NV', budget: 12000, urgency: 'high', timeline: '1-2_weeks', notes: 'HAIL STORM: Golf ball-sized hail reported in Green Valley. Multiple broken roof tiles and dented flashing. 12 homes on street need inspection. Monsoon season peak.', sourceDetail: 'Weather trigger - hail storm Green Valley' },
      { firstName: 'Daniel', lastName: 'Clark', email: 'daniel.clark@gmail.com', phone: '702-667-1123', serviceType: 'HVAC / Air Conditioning', zipCode: '89117', address: '20660 Charleston Blvd', city: 'Las Vegas', state: 'NV', budget: 8500, urgency: 'high', timeline: 'asap', notes: 'FIRST 100°F DAY: Spring Valley hit 101°F. 15-year-old AC unit cannot maintain set temp. Compressor cycling constantly. Peak summer demand starting early this year.', sourceDetail: 'Weather trigger - first 100°F day Spring Valley' },
      { firstName: 'Amanda', lastName: 'Torres', email: 'amanda.torres@gmail.com', phone: '702-889-3344', serviceType: 'Pool Service & Repair', zipCode: '89144', address: '4450 Hualapai Way', city: 'Las Vegas', state: 'NV', budget: 4200, urgency: 'high', timeline: 'asap', notes: 'SUSTAINED HEAT (9 days 108°F+): Pool pump overheated and seized. Water turning green in 103°F heat. Summerlin master planned community. 6 pools on block need service.', sourceDetail: 'Weather trigger - sustained heat pool failure Summerlin' },
    ];
  }
}
exports.WeatherTriggerAgent = WeatherTriggerAgent;
