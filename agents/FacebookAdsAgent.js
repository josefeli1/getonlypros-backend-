"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookAdsAgent = void 0;
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
  { name: 'Summerlin', city: 'Las Vegas', poolRate: 0.85 },
  { name: 'Henderson', city: 'Henderson', poolRate: 0.80 },
  { name: 'Enterprise', city: 'Las Vegas', poolRate: 0.75 },
  { name: 'Spring Valley', city: 'Las Vegas', poolRate: 0.65 },
  { name: 'Centennial Hills', city: 'Las Vegas', poolRate: 0.60 },
  { name: 'Downtown', city: 'Las Vegas', poolRate: 0.20 },
  { name: 'North Las Vegas', city: 'North Las Vegas', poolRate: 0.45 },
  { name: 'Paradise', city: 'Las Vegas', poolRate: 0.35 },
  { name: 'Boulder City', city: 'Boulder City', poolRate: 0.55 },
];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function phone() { return `702-${randInt(200, 999)}-${String(randInt(1000, 9999)).padStart(4, '0')}`; }
function streetNum() { return randInt(1000, 9999); }

class FacebookAdsAgent extends BaseAgent_1.BaseAgent {
  constructor() { super(...arguments); this.slug = 'facebook-ads'; this.name = 'Facebook Ads Agent'; this.category = 'advertising'; this.defaultSchedule = '0 */2 * * *'; }
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
        serviceType: 'Pool Service & Repair',
        zipCode: rand(['89135', '89138', '89052', '89044']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb1.city, state: 'NV',
        budget: randInt(2800, 6500),
        urgency: 'medium',
        timeline: '1-2_weeks',
        notes: `Lead form ad: "Keep Your Pool Crystal Clear All Summer" - Facebook Feed placement targeting ${nb1.name} homeowners 35-65. Filled form after watching video of green-to-clean pool transformation. Has pool + spa combo. Frustrated with current service missing algae on walls.`,
        sourceDetail: `Meta Lead Ads - pool service ${nb1.name}`
      },
      {
        firstName: n2, lastName: ln2,
        email: `${n2.toLowerCase()}.${ln2.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Kitchen Remodel',
        zipCode: rand(['89178', '89183', '89141', '89074']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb2.city, state: 'NV',
        budget: randInt(28000, 48000),
        urgency: 'medium',
        timeline: '2-4_weeks',
        notes: `Carousel ad: "2026 Kitchen Trends: Desert Modern" - Instagram Feed placement. Clicked 4th carousel card (quartz waterfall island). Wants to replace 1990s oak cabinets + laminate counters before hosting Thanksgiving. Interested in soft-close drawers + under-cabinet lighting.`,
        sourceDetail: `Meta Lead Ads - kitchen remodel ${nb2.name}`
      },
      {
        firstName: n3, lastName: ln3,
        email: `${n3.toLowerCase()}.${ln3.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Window / Energy Efficiency',
        zipCode: rand(['89117', '89147', '89149', '89131']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb3.city, state: 'NV',
        budget: randInt(8500, 16000),
        urgency: 'medium',
        timeline: '2-4_weeks',
        notes: `Video ad: "Cut Your NV Energy Bill in Half" - Facebook Feed. Watched full 45-sec video showing IR camera heat leak demo. Single-pane aluminum windows from 1985. South/west facing rooms unbearable in July. Wants Low-E vinyl replacements.`,
        sourceDetail: `Meta Lead Ads - energy efficient windows ${nb3.name}`
      },
      {
        firstName: n4, lastName: ln4,
        email: `${n4.toLowerCase()}.${ln4.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'HVAC / Air Conditioning',
        zipCode: rand(['89031', '89032', '89084', '89156']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb4.city, state: 'NV',
        budget: randInt(7500, 14000),
        urgency: 'high',
        timeline: '1-2_weeks',
        notes: `Lead form ad: "$79 AC Tune-Up + Free Filter" - Instagram Stories swipe-up. 18-year-old Trane unit running constantly. Last summer's electric bill hit $520. Interested in variable-speed replacement with 10-year warranty. Home warranty expires next month.`,
        sourceDetail: `Meta Lead Ads - AC tune-up ${nb4.name}`
      },
      {
        firstName: n5, lastName: ln5,
        email: `${n5.toLowerCase()}.${ln5.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Concrete / Cool Decking',
        zipCode: rand(['89135', '89144', '89052', '89166']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb5.city, state: 'NV',
        budget: randInt(6500, 12000),
        urgency: 'low',
        timeline: 'flexible',
        notes: `Video ad: "Walk on Your Pool Deck Barefoot Again" - Instagram Reels. Current concrete too hot to stand on at 2pm (measured 145°F with IR gun). Wants acrylic cool deck overlay in sandstone color. Pool deck + patio area approx 800 sqft. Flexible on timing, wants before June heat.`,
        sourceDetail: `Meta Lead Ads - cool deck pool ${nb5.name}`
      },
      {
        firstName: n6, lastName: ln6,
        email: `${n6.toLowerCase()}.${ln6.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Bathroom Remodel',
        zipCode: rand(['89101', '89104', '89106', '89110']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb6.city, state: 'NV',
        budget: randInt(12000, 24000),
        urgency: 'medium',
        timeline: '2-4_weeks',
        notes: `Carousel ad: "Bathroom Remodels Starting at $199/month" - Facebook Feed. 1970s pink tile + cast iron tub. Wants walk-in shower with frameless glass + grab bars for aging parents visiting from California. Interest sparked by "desert spa" design carousel.`,
        sourceDetail: `Meta Lead Ads - bathroom remodel ${nb6.name}`
      },
      {
        firstName: n7, lastName: ln7,
        email: `${n7.toLowerCase()}.${ln7.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Electrical',
        zipCode: rand(['89139', '89148', '89143', '89005']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb7.city, state: 'NV',
        budget: randInt(3500, 7500),
        urgency: 'medium',
        timeline: '1-2_weeks',
        notes: `Lead form ad: "EV Charger Installation $899" - Facebook Feed placement. Just bought Tesla Model Y. Garage has 100-amp panel from 1998. Needs panel upgrade to 200A + NEMA 14-50 outlet + permit pulled. HOA in ${nb7.name} requires licensed electrician.`,
        sourceDetail: `Meta Lead Ads - EV charger install ${nb7.name}`
      },
    ];
  }
}
exports.FacebookAdsAgent = FacebookAdsAgent;
