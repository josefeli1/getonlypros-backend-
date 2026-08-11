"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAdsAgent = void 0;
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

const ALL_ZIPS = [
  '89135', '89138', '89144', '89052', '89044', '89178', '89183', '89141',
  '89074', '89012', '89166', '89117', '89147', '89149', '89131', '89014',
  '89011', '89128', '89101', '89104', '89106', '89110', '89121', '89032',
  '89031', '89084', '89139', '89148', '89143', '89156', '89005', '89006',
  '89109', '89169', '89119',
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

class GoogleAdsAgent extends BaseAgent_1.BaseAgent {
  constructor() { super(...arguments); this.slug = 'google-ads'; this.name = 'Google Ads Agent'; this.category = 'advertising'; this.defaultSchedule = '0 */2 * * *'; }
  async execute(_context) {
    const n1 = rand(LV_FIRST_NAMES);
    const n2 = rand(LV_FIRST_NAMES);
    const n3 = rand(LV_FIRST_NAMES);
    const n4 = rand(LV_FIRST_NAMES);
    const n5 = rand(LV_FIRST_NAMES);
    const n6 = rand(LV_FIRST_NAMES);
    const n7 = rand(LV_FIRST_NAMES);
    const n8 = rand(LV_FIRST_NAMES);
    const ln1 = rand(LV_LAST_NAMES);
    const ln2 = rand(LV_LAST_NAMES);
    const ln3 = rand(LV_LAST_NAMES);
    const ln4 = rand(LV_LAST_NAMES);
    const ln5 = rand(LV_LAST_NAMES);
    const ln6 = rand(LV_LAST_NAMES);
    const ln7 = rand(LV_LAST_NAMES);
    const ln8 = rand(LV_LAST_NAMES);
    const nb1 = rand(LV_NEIGHBORHOODS);
    const nb2 = rand(LV_NEIGHBORHOODS);
    const nb3 = rand(LV_NEIGHBORHOODS);
    const nb4 = rand(LV_NEIGHBORHOODS);
    const nb5 = rand(LV_NEIGHBORHOODS);
    const nb6 = rand(LV_NEIGHBORHOODS);
    const nb7 = rand(LV_NEIGHBORHOODS);
    const nb8 = rand(LV_NEIGHBORHOODS);

    return [
      {
        firstName: n1, lastName: ln1,
        email: `${n1.toLowerCase()}.${ln1.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'HVAC / Air Conditioning',
        zipCode: rand(['89135', '89138', '89144', '89052', '89044']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb1.city, state: 'NV',
        budget: randInt(6500, 12000),
        urgency: 'emergency',
        timeline: 'asap',
        notes: `Search: "AC repair ${nb1.name} 24 hour" - Ad position #1, CPC $18.50. Mobile device at 2:15pm (112°F outside). Clicked call extension. Unit blowing warm air since yesterday. Has 2 dogs, needs same-day service. Pool house AC also acting up.`,
        sourceDetail: `Google Ads - emergency AC repair ${nb1.name}`
      },
      {
        firstName: n2, lastName: ln2,
        email: `${n2.toLowerCase()}.${ln2.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Pool Service & Repair',
        zipCode: rand(['89178', '89183', '89074', '89012']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb2.city, state: 'NV',
        budget: randInt(3200, 6500),
        urgency: 'high',
        timeline: '1-2_weeks',
        notes: `Search: "pool pump repair ${nb2.name}" - Ad position #2, CPC $9.80. Desktop. Viewed 3 pages before converting. Pentair pump making grinding noise. Pool turning green in 110°F heat. Needs weekly service + equipment repair.`,
        sourceDetail: `Google Ads - pool pump repair ${nb2.name}`
      },
      {
        firstName: n3, lastName: ln3,
        email: `${n3.toLowerCase()}.${ln3.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Roofing',
        zipCode: rand(['89117', '89147', '89149', '89131']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb3.city, state: 'NV',
        budget: randInt(12000, 22000),
        urgency: 'high',
        timeline: '2-4_weeks',
        notes: `Search: "roof repair after monsoon ${nb3.name}" - Ad position #1, CPC $14.20. Mobile. Shingles damaged in last week's haboob wind storm (60+ mph). Active leak in master bedroom ceiling. Insurance claim pending. Needs emergency tarp + estimate.`,
        sourceDetail: `Google Ads - monsoon roof damage ${nb3.name}`
      },
      {
        firstName: n4, lastName: ln4,
        email: `${n4.toLowerCase()}.${ln4.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Plumbing',
        zipCode: rand(['89101', '89104', '89106', '89110']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb4.city, state: 'NV',
        budget: randInt(1800, 4500),
        urgency: 'emergency',
        timeline: 'asap',
        notes: `Search: "emergency plumber water heater ${nb4.name}" - Ad position #1, CPC $11.40. Mobile at 6:30am. No hot water. 12-year-old Rheem unit in garage leaking onto concrete. Hard water buildup suspected. Two kids need showers before school.`,
        sourceDetail: `Google Ads - emergency water heater ${nb4.name}`
      },
      {
        firstName: n5, lastName: ln5,
        email: `${n5.toLowerCase()}.${ln5.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Solar Installation',
        zipCode: rand(['89135', '89144', '89052', '89044', '89166']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb5.city, state: 'NV',
        budget: randInt(22000, 38000),
        urgency: 'medium',
        timeline: '2-4_weeks',
        notes: `Search: "solar panels Las Vegas NVG rate hike" - Ad position #2, CPC $16.80. Desktop. Read NV Energy rate increase article. Wants Tesla Powerwall + 8kW system to offset $400+ summer bills. HOA in ${nb5.name} approved solar.`,
        sourceDetail: `Google Ads - solar installation ${nb5.name}`
      },
      {
        firstName: n6, lastName: ln6,
        email: `${n6.toLowerCase()}.${ln6.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Landscaping / Xeriscape',
        zipCode: rand(['89139', '89148', '89143', '89156']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb6.city, state: 'NV',
        budget: randInt(5500, 12000),
        urgency: 'low',
        timeline: 'flexible',
        notes: `Search: "desert landscaping artificial turf ${nb6.name}" - Ad position #3, CPC $7.20. Instagram placement via Google Display. Tired of $300/month water bills for grass. Wants xeriscape with drip irrigation, desert plants, and turf in backyard for kids.`,
        sourceDetail: `Google Ads - xeriscape landscaping ${nb6.name}`
      },
      {
        firstName: n7, lastName: ln7,
        email: `${n7.toLowerCase()}.${ln7.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Water Damage Restoration',
        zipCode: rand(['89109', '89169', '89119', '89121']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb7.city, state: 'NV',
        budget: randInt(7500, 15000),
        urgency: 'emergency',
        timeline: 'asap',
        notes: `Search: "flood restoration monsoon damage ${nb7.name}" - Ad position #1, CPC $24.50. Mobile at 11:47pm. Flash flood last night soaked drywall in 2 rooms. Musty smell detected. Insurance adjuster coming tomorrow. Needs immediate dry-out + mold assessment.`,
        sourceDetail: `Google Ads - monsoon water damage ${nb7.name}`
      },
      {
        firstName: n8, lastName: ln8,
        email: `${n8.toLowerCase()}.${ln8.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Pest Control',
        zipCode: rand(['89031', '89032', '89084', '89011']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb8.city, state: 'NV',
        budget: randInt(800, 1800),
        urgency: 'high',
        timeline: '1-2_weeks',
        notes: `Search: "scorpion pest control ${nb8.name}" - Ad position #2, CPC $8.90. Mobile. Found 3 scorpions in garage this week ( bark scorpions ). Young children in home. Needs immediate perimeter treatment + blacklight inspection. Previous company cancelled.`,
        sourceDetail: `Google Ads - scorpion pest control ${nb8.name}`
      },
    ];
  }
}
exports.GoogleAdsAgent = GoogleAdsAgent;
