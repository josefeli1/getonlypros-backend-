"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEOContentAgent = void 0;
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

class SEOContentAgent extends BaseAgent_1.BaseAgent {
  constructor() { super(...arguments); this.slug = 'seo-content'; this.name = 'SEO Content Agent'; this.category = 'marketing'; this.defaultSchedule = '0 8 * * *'; }
  async execute(_context) {
    const n1 = rand(LV_FIRST_NAMES); const ln1 = rand(LV_LAST_NAMES);
    const n2 = rand(LV_FIRST_NAMES); const ln2 = rand(LV_LAST_NAMES);
    const n3 = rand(LV_FIRST_NAMES); const ln3 = rand(LV_LAST_NAMES);
    const n4 = rand(LV_FIRST_NAMES); const ln4 = rand(LV_LAST_NAMES);
    const n5 = rand(LV_FIRST_NAMES); const ln5 = rand(LV_LAST_NAMES);
    const n6 = rand(LV_FIRST_NAMES); const ln6 = rand(LV_LAST_NAMES);
    const n7 = rand(LV_FIRST_NAMES); const ln7 = rand(LV_LAST_NAMES);
    const nb1 = rand(LV_NEIGHBORHOODS); const nb2 = rand(LV_NEIGHBORHOODS);
    const nb3 = rand(LV_NEIGHBORHOODS); const nb4 = rand(LV_NEIGHBORHOODS);
    const nb5 = rand(LV_NEIGHBORHOODS); const nb6 = rand(LV_NEIGHBORHOODS);
    const nb7 = rand(LV_NEIGHBORHOODS);

    return [
      {
        firstName: n1, lastName: ln1,
        email: `${n1.toLowerCase()}.${ln1.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'HVAC / Air Conditioning',
        zipCode: rand(['89135', '89138', '89144']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb1.city, state: 'NV',
        budget: randInt(7200, 14000),
        urgency: 'medium',
        timeline: '1-2_weeks',
        notes: `Blog post "How to Survive a Las Vegas Heat Wave: AC Replacement Guide" ranked #2 on Google. Organic search query: "best AC repair ${nb1.name} NV". Time on page: 5min 47sec. Read section on SEER2 ratings + NV Energy rebates. Downloaded "Summerlin HVAC Buyer's Checklist" PDF. Submitted quote request via embedded CTA.`,
        sourceDetail: `SEO - AC replacement guide (organic #2) ${nb1.name}`
      },
      {
        firstName: n2, lastName: ln2,
        email: `${n2.toLowerCase()}.${ln2.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Pool Service & Repair',
        zipCode: rand(['89052', '89044', '89074']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb2.city, state: 'NV',
        budget: randInt(3500, 7200),
        urgency: 'medium',
        timeline: '1-2_weeks',
        notes: `Guide "Pool Maintenance in 110°F Heat: Henderson Homeowner's Handbook" ranked #3. Organic query: "pool service ${nb2.name} weekly". Spent 7min reading. Clicked pricing calculator for variable-speed pump upgrade. Notes: salt cell needs replacement, pebble tec staining on steps.`,
        sourceDetail: `SEO - Pool maintenance guide (organic #3) ${nb2.name}`
      },
      {
        firstName: n3, lastName: ln3,
        email: `${n3.toLowerCase()}.${ln3.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Landscaping / Xeriscape',
        zipCode: rand(['89178', '89183', '89141']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb3.city, state: 'NV',
        budget: randInt(8000, 16000),
        urgency: 'low',
        timeline: 'flexible',
        notes: `Article "Desert Landscaping Ideas: 15 Water-Wise Designs for Las Vegas" ranked #1. Organic query: "xeriscape ${nb3.name} front yard". Read full article, clicked photo gallery of before/after transformations. Wants to replace 1200 sqft of grass with desert landscape + drip irrigation. Water bill hit $380 last month.`,
        sourceDetail: `SEO - Xeriscape design guide (organic #1) ${nb3.name}`
      },
      {
        firstName: n4, lastName: ln4,
        email: `${n4.toLowerCase()}.${ln4.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Solar Installation',
        zipCode: rand(['89166', '89149', '89131']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb4.city, state: 'NV',
        budget: randInt(24000, 42000),
        urgency: 'medium',
        timeline: '2-4_weeks',
        notes: `Blog post "Is Solar Worth It in Nevada? 2026 ROI Analysis" ranked #4. Organic query: "solar panels Las Vegas NVG net metering". Spent 9min reading, clicked solar savings calculator. Entered $450 avg bill, got 6.2-year payback estimate. Wants Tesla Powerwall 3 + 10kW system. HOA docs already submitted.`,
        sourceDetail: `SEO - Solar ROI guide (organic #4) ${nb4.name}`
      },
      {
        firstName: n5, lastName: ln5,
        email: `${n5.toLowerCase()}.${ln5.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Roofing',
        zipCode: rand(['89117', '89147', '89128']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb5.city, state: 'NV',
        budget: randInt(14000, 26000),
        urgency: 'high',
        timeline: '2-4_weeks',
        notes: `Article "How to Spot Monsoon Roof Damage in Las Vegas" ranked #2. Organic query: "roof repair after hail ${nb5.name}". Read section on tile vs shingle in desert climate. 25-year-old concrete tile roof with cracked tiles from July hail storm. Insurance claim filed, needs contractor estimate for adjuster meeting.`,
        sourceDetail: `SEO - Monsoon roof damage guide (organic #2) ${nb5.name}`
      },
      {
        firstName: n6, lastName: ln6,
        email: `${n6.toLowerCase()}.${ln6.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Plumbing',
        zipCode: rand(['89031', '89032', '89084']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb6.city, state: 'NV',
        budget: randInt(2200, 5500),
        urgency: 'medium',
        timeline: '1-2_weeks',
        notes: `Guide "Hard Water Solutions for Las Vegas Homes" ranked #3. Organic query: "water softener install ${nb6.name}". Spent 4min reading. Downloaded "LV Water Quality Report" PDF. Whole-house water softener + RO under-sink for kitchen. Concerned about scale buildup on new tankless water heater.`,
        sourceDetail: `SEO - Hard water solutions guide (organic #3) ${nb6.name}`
      },
      {
        firstName: n7, lastName: ln7,
        email: `${n7.toLowerCase()}.${ln7.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Pest Control',
        zipCode: rand(['89109', '89169', '89119']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb7.city, state: 'NV',
        budget: randInt(900, 2000),
        urgency: 'high',
        timeline: '1-2_weeks',
        notes: `Blog post "Scorpion Season in Las Vegas: What Homeowners Need to Know" ranked #1. Organic query: "scorpion pest control ${nb7.name}". Time on page: 6min 12sec. Found 2 bark scorpions in master bathroom this week. Has toddler + newborn. Needs immediate blacklight inspection + monthly service plan.`,
        sourceDetail: `SEO - Scorpion prevention guide (organic #1) ${nb7.name}`
      },
    ];
  }
}
exports.SEOContentAgent = SEOContentAgent;
