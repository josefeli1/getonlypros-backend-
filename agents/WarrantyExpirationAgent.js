"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarrantyExpirationAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");

// Las Vegas market data
const LV_FIRST_NAMES = [
  'Maria', 'Jose', 'Jennifer', 'Michael', 'David', 'Jessica', 'Christopher',
  'Ashley', 'Daniel', 'Amanda', 'James', 'Sarah', 'Robert', 'Stephanie',
  'John', 'Melissa', 'Matthew', 'Nicole', 'Joseph', 'Michelle', 'Ryan',
  'Lisa', 'William', 'Elizabeth', 'Anthony', 'Rebecca', 'Andrew', 'Laura',
  'Joshua', 'Kimberly', 'Brandon', 'Amy', 'Kevin', 'Angela', 'Eric',
  'Heather', 'Steven', 'Rachel', 'Brian', 'Emily', 'Jason', 'Kelly',
  'Richard', 'Christina', 'Thomas', 'Samantha', 'Mark', 'Katie',
  'Nicholas', 'Lauren', 'Jonathan', 'Amber', 'Benjamin', 'Brittany',
  'Justin', 'Crystal', 'Tyler', 'Tiffany', 'Aaron', 'Andrea', 'Timothy',
  'Megan', 'Adam', 'Erin', 'Cody', 'Anna', 'Kyle', 'Victoria',
  'Zachary', 'Kathryn', 'Juan', 'Monica', 'Carlos', 'Diana',
];

const LV_LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
  'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
  'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
  'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz',
  'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales',
  'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim',
  'Cox', 'Ward', 'Richardson', 'Watson', 'Brooks', 'Chavez', 'Wood',
  'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes', 'Price',
];

const LV_STREETS = [
  'Desert Inn Rd', 'Sahara Ave', 'Charleston Blvd', 'Flamingo Rd',
  'Tropicana Ave', 'Spring Mountain Rd', 'Warm Springs Rd', 'Blue Diamond Rd',
  'Durango Dr', 'Rainbow Blvd', 'Jones Blvd', 'Decatur Blvd',
  'Eastern Ave', 'Lamb Blvd', 'Nellis Blvd', 'Centennial Pkwy',
  'Lake Mead Blvd', 'Washington Ave', 'Bonanza Rd', 'Craig Rd',
  'Cheyenne Ave', 'Vegas Valley Dr', 'Pecos Rd', 'Green Valley Pkwy',
  'Anthem Pkwy', 'St Rose Pkwy', 'Southern Highlands Pkwy', 'Sunset Rd',
  'Windmill Ln', 'Robinson St', 'Cimarron Rd', 'Fort Apache Rd',
  'Hualapai Way', 'Grand Canyon Dr', 'Summerlin Pkwy', 'Town Center Dr',
];

const LV_NEIGHBORHOODS = [
  { name: 'Summerlin', city: 'Las Vegas' },
  { name: 'Henderson', city: 'Henderson' },
  { name: 'Enterprise', city: 'Las Vegas' },
  { name: 'Spring Valley', city: 'Las Vegas' },
  { name: 'Centennial Hills', city: 'Las Vegas' },
  { name: 'Downtown', city: 'Las Vegas' },
  { name: 'North Las Vegas', city: 'North Las Vegas' },
  { name: 'Paradise', city: 'Las Vegas' },
  { name: 'Boulder City', city: 'Boulder City' },
];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function phone() { return `702-${randInt(200, 999)}-${String(randInt(1000, 9999)).padStart(4, '0')}`; }
function streetNum() { return randInt(1000, 9999); }

class WarrantyExpirationAgent extends BaseAgent_1.BaseAgent {
  constructor() { super(...arguments); this.slug = 'warranty-expiration'; this.name = 'Warranty Expiration Agent'; this.category = 'outreach'; this.defaultSchedule = '0 6 * * *'; }
  async execute(_context) {
    const n1 = rand(LV_FIRST_NAMES); const ln1 = rand(LV_LAST_NAMES);
    const n2 = rand(LV_FIRST_NAMES); const ln2 = rand(LV_LAST_NAMES);
    const n3 = rand(LV_FIRST_NAMES); const ln3 = rand(LV_LAST_NAMES);
    const n4 = rand(LV_FIRST_NAMES); const ln4 = rand(LV_LAST_NAMES);
    const n5 = rand(LV_FIRST_NAMES); const ln5 = rand(LV_LAST_NAMES);
    const n6 = rand(LV_FIRST_NAMES); const ln6 = rand(LV_LAST_NAMES);
    const n7 = rand(LV_FIRST_NAMES); const ln7 = rand(LV_LAST_NAMES);
    const n8 = rand(LV_FIRST_NAMES); const ln8 = rand(LV_LAST_NAMES);
    const nb1 = rand(LV_NEIGHBORHOODS); const nb2 = rand(LV_NEIGHBORHOODS);
    const nb3 = rand(LV_NEIGHBORHOODS); const nb4 = rand(LV_NEIGHBORHOODS);
    const nb5 = rand(LV_NEIGHBORHOODS); const nb6 = rand(LV_NEIGHBORHOODS);
    const nb7 = rand(LV_NEIGHBORHOODS); const nb8 = rand(LV_NEIGHBORHOODS);

    return [
      {
        firstName: n1, lastName: ln1,
        email: `${n1.toLowerCase()}.${ln1.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'HVAC / Air Conditioning',
        zipCode: rand(['89135', '89138', '89144', '89052']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb1.city, state: 'NV',
        budget: randInt(7500, 14000),
        urgency: 'high',
        timeline: '1-2_weeks',
        notes: `WARRANTY ALERT: Carrier Infinity Series 16 SEER HVAC unit warranty expires in 42 days (installed May 2019). Unit has run 3,200+ hours/year in ${nb1.name} desert heat. Last diagnostic showed declining compressor amp draw (12.8A vs spec 10.5A). Proactive replacement offer sent with 20% pre-expiration discount + 10-year labor warranty. Customer called after 108°F weekend with weak airflow.`,
        sourceDetail: `Warranty exp - Carrier HVAC 16 SEER, 42 days, ${nb1.name}`
      },
      {
        firstName: n2, lastName: ln2,
        email: `${n2.toLowerCase()}.${ln2.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Pool Service & Repair',
        zipCode: rand(['89178', '89183', '89074', '89012']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb2.city, state: 'NV',
        budget: randInt(4800, 9500),
        urgency: 'medium',
        timeline: '2-4_weeks',
        notes: `WARRANTY ALERT: Pentair IntelliFlo VS pump warranty expires in 55 days (purchased 2018). Motor making high-pitched whine after running 10hrs/day in ${nb2.name} summer heat. Pool deck gets 8+ hours direct sun. Salt cell also showing 67% remaining life. Recommended pump replacement + salt cell + automation upgrade before warranty void. 15% bundle discount offered.`,
        sourceDetail: `Warranty exp - Pentair pool pump, 55 days, ${nb2.name}`
      },
      {
        firstName: n3, lastName: ln3,
        email: `${n3.toLowerCase()}.${ln3.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Plumbing',
        zipCode: rand(['89117', '89147', '89149', '89131']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb3.city, state: 'NV',
        budget: randInt(2800, 5500),
        urgency: 'medium',
        timeline: '2-4_weeks',
        notes: `WARRANTY ALERT: Rheem Performance Platinum water heater warranty expires in 38 days (installed 2016). Extreme hard water in ${nb3.name} has caused 3/8" scale buildup on heating elements. Recovery time dropped from 45min to 82min. Anode rod fully consumed. Preventive replacement with tankless Navien NPE recommended + whole-house softener bundle. Avoid flood risk in garage.`,
        sourceDetail: `Warranty exp - Rheem water heater, 38 days, ${nb3.name}`
      },
      {
        firstName: n4, lastName: ln4,
        email: `${n4.toLowerCase()}.${ln4.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Electrical',
        zipCode: rand(['89166', '89143', '89005', '89006']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb4.city, state: 'NV',
        budget: randInt(5500, 11000),
        urgency: 'high',
        timeline: '1-2_weeks',
        notes: `WARRANTY ALERT: Siemens 200A electrical panel warranty expires in 29 days. Two breakers tripped during last week's 115°F heat wave when AC + pool pump + EV charger all running simultaneously in ${nb4.name} home. Panel showing heat discoloration on bus bars. Safety inspection + potential 400A service upgrade recommended before warranty expiration. 25% off panel upgrade offer.`,
        sourceDetail: `Warranty exp - Siemens panel, 29 days, ${nb4.name}`
      },
      {
        firstName: n5, lastName: ln5,
        email: `${n5.toLowerCase()}.${ln5.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Window / Energy Efficiency',
        zipCode: rand(['89101', '89104', '89106', '89110']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb5.city, state: 'NV',
        budget: randInt(12000, 22000),
        urgency: 'medium',
        timeline: 'flexible',
        notes: `WARRANTY ALERT: Milgard Ultra C650 window seal warranty expires in 64 days (installed 2015). Fogging between panes on 4 south-facing windows in ${nb5.name} home. Seal failure confirmed from 8 years of 110°F+ thermal cycling. UV film delaminating. Full replacement estimate offered with Low-E4 glass upgrade. NV Energy rebate eligible ($800). 18-month financing available.`,
        sourceDetail: `Warranty exp - Milgard window seal, 64 days, ${nb5.name}`
      },
      {
        firstName: n6, lastName: ln6,
        email: `${n6.toLowerCase()}.${ln6.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Pest Control',
        zipCode: rand(['89031', '89032', '89084', '89156']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb6.city, state: 'NV',
        budget: randInt(950, 2200),
        urgency: 'low',
        timeline: '2-4_weeks',
        notes: `WARRANTY ALERT: Terminix Scorpion Defense warranty expires in 31 days. Annual blacklight inspection overdue for ${nb6.name} property. Previous scans found 12 scorpions on perimeter wall last year. Neighbor reported increased bark scorpion activity after July monsoon. Renewal offer includes quarterly service + free attic seal inspection + UV-reactive barrier treatment.`,
        sourceDetail: `Warranty exp - scorpion defense, 31 days, ${nb6.name}`
      },
      {
        firstName: n7, lastName: ln7,
        email: `${n7.toLowerCase()}.${ln7.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Garage Door',
        zipCode: rand(['89109', '89169', '89119', '89121']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb7.city, state: 'NV',
        budget: randInt(1400, 3200),
        urgency: 'medium',
        timeline: '1-2_weeks',
        notes: `WARRANTY ALERT: LiftMaster 8500W garage door opener warranty expires in 47 days (installed 2019). Thermal overload triggered twice in August when ${nb7.name} garage hit 125°F inside. Belt drive showing cracks from heat exposure. Safety sensors misaligned after last haboob dust storm. Replacement with 87504-267 MyQ smart opener recommended + insulated door panels to reduce garage temps.`,
        sourceDetail: `Warranty exp - LiftMaster opener, 47 days, ${nb7.name}`
      },
      {
        firstName: n8, lastName: ln8,
        email: `${n8.toLowerCase()}.${ln8.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Concrete / Cool Decking',
        zipCode: rand(['89135', '89144', '89052', '89044']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb8.city, state: 'NV',
        budget: randInt(8500, 16000),
        urgency: 'medium',
        timeline: '2-4_weeks',
        notes: `WARRANTY ALERT: Keystone Kool Deck acrylic coating warranty expires in 52 days (applied 2018). Surface temperature exceeding 148°F on ${nb8.name} pool deck during afternoon sun. Chalking and small cracks forming around drain areas. Cool deck seal compromised from 7 years of chlorine exposure + thermal expansion. Resurfacing with SunDek Arizona flagstone pattern recommended. 10-year new warranty included.`,
        sourceDetail: `Warranty exp - Kool Deck coating, 52 days, ${nb8.name}`
      },
    ];
  }
}
exports.WarrantyExpirationAgent = WarrantyExpirationAgent;
