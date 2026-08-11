"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewMoverAgent = void 0;
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
  { name: 'Summerlin', city: 'Las Vegas', type: 'luxury_master' },
  { name: 'Henderson', city: 'Henderson', type: 'luxury_master' },
  { name: 'Enterprise', city: 'Las Vegas', type: 'new_growth' },
  { name: 'Spring Valley', city: 'Las Vegas', type: 'established' },
  { name: 'Centennial Hills', city: 'Las Vegas', type: 'family' },
  { name: 'Downtown', city: 'Las Vegas', type: 'urban' },
  { name: 'North Las Vegas', city: 'North Las Vegas', type: 'value' },
  { name: 'Paradise', city: 'Las Vegas', type: 'mixed' },
  { name: 'Boulder City', city: 'Boulder City', type: 'small_town' },
];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function phone() { return `702-${randInt(200, 999)}-${String(randInt(1000, 9999)).padStart(4, '0')}`; }
function streetNum() { return randInt(1000, 9999); }

class NewMoverAgent extends BaseAgent_1.BaseAgent {
  constructor() { super(...arguments); this.slug = 'new-mover'; this.name = 'New Mover Agent'; this.category = 'outreach'; this.defaultSchedule = '0 7 * * *'; }
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
        zipCode: rand(['89135', '89138', '89144']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb1.city, state: 'NV',
        budget: randInt(8500, 16000),
        urgency: 'high',
        timeline: '1-2_weeks',
        notes: `New mover: Retired couple relocated from Sacramento, CA 2 weeks ago. Bought 4br home in ${nb1.name} (previously lived in CA for 32 years). AC unit is 14 years old and struggling with first 108°F day. Had heat pump in CA, unfamiliar with desert split systems. Needs trusted contractor + maintenance plan. Welcome discount offered.`,
        sourceDetail: `New mover - retiree from CA, 2 weeks, ${nb1.name} AC inspection`
      },
      {
        firstName: n2, lastName: ln2,
        email: `${n2.toLowerCase()}.${ln2.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Pool Service & Repair',
        zipCode: rand(['89052', '89044', '89074']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb2.city, state: 'NV',
        budget: randInt(4200, 8500),
        urgency: 'medium',
        timeline: '1-2_weeks',
        notes: `New mover: Remote tech worker moved from San Francisco 3 weeks ago. First pool ever - previously rented apartments. Bought 3br in ${nb2.name} with pool + spa. Pool is green and pump making noise. Needs full equipment check + weekly service + "Pool 101" education. Found via "new homeowner pool service" postcard.`,
        sourceDetail: `New mover - SF remote worker, 3 weeks, ${nb2.name} pool newbie`
      },
      {
        firstName: n3, lastName: ln3,
        email: `${n3.toLowerCase()}.${ln3.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Landscaping / Xeriscape',
        zipCode: rand(['89178', '89183', '89141']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb3.city, state: 'NV',
        budget: randInt(12000, 28000),
        urgency: 'low',
        timeline: 'flexible',
        notes: `New mover: Family of 4 relocated from Phoenix 1 month ago. Had desert landscaping in AZ but wants "upgraded" look for new ${nb3.name} home. 0.4-acre lot with dying grass from previous owner. Wants artificial turf play area for kids, desert plant palette, travertine paver walkway, drip irrigation. Budget flexible, wants design + install.`,
        sourceDetail: `New mover - Phoenix family, 1 month, ${nb3.name} full xeriscape`
      },
      {
        firstName: n4, lastName: ln4,
        email: `${n4.toLowerCase()}.${ln4.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Plumbing',
        zipCode: rand(['89117', '89147', '89149']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb4.city, state: 'NV',
        budget: randInt(3500, 7500),
        urgency: 'medium',
        timeline: '2-4_weeks',
        notes: `New mover: Couple from Orange County, CA moved 2 weeks ago. Bought 1987-built home in ${nb4.name}. Original copper pipes with multiple leak patches visible in garage. Hard water stains everywhere. Wants full repipe with PEX + whole-house water softener + RO system. Home inspector flagged pipes as "partially functional."`,
        sourceDetail: `New mover - OC couple, 2 weeks, ${nb4.name} repipe + softener`
      },
      {
        firstName: n5, lastName: ln5,
        email: `${n5.toLowerCase()}.${ln5.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Solar Installation',
        zipCode: rand(['89166', '89131', '89005']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb5.city, state: 'NV',
        budget: randInt(28000, 48000),
        urgency: 'medium',
        timeline: '2-4_weeks',
        notes: `New mover: Software engineer relocated from Seattle 3 weeks ago. Bought new-build in ${nb5.name} but builder didn't include solar. Shocked by first NV Energy bill ($310 for 2200 sqft). Wants 12kW system + 2 Powerwall 3s for backup during summer outages. Has HOA approval packet ready. Tesla owner, wants integrated ecosystem.`,
        sourceDetail: `New mover - Seattle tech worker, 3 weeks, ${nb5.name} solar + battery`
      },
      {
        firstName: n6, lastName: ln6,
        email: `${n6.toLowerCase()}.${ln6.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Electrical',
        zipCode: rand(['89139', '89148', '89143']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb6.city, state: 'NV',
        budget: randInt(4500, 9500),
        urgency: 'high',
        timeline: '1-2_weeks',
        notes: `New mover: Retired electrician from Chicago moved 1 week ago. Bought 1995 home in ${nb6.name}. DIY inspection found aluminum branch wiring + 100A Federal Pacific panel. Knows it's a fire hazard. Wants full rewire + 200A panel + EV charger rough-in for future Tesla. Doing due diligence before move-in.`,
        sourceDetail: `New mover - retired electrician, 1 week, ${nb6.name} panel upgrade`
      },
      {
        firstName: n7, lastName: ln7,
        email: `${n7.toLowerCase()}.${ln7.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Window / Energy Efficiency',
        zipCode: rand(['89109', '89169', '89119']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb7.city, state: 'NV',
        budget: randInt(9500, 18000),
        urgency: 'medium',
        timeline: '2-4_weeks',
        notes: `New mover: Young couple from Portland moved 2 weeks ago. Rented in Oregon, first home purchase. 1972 condo in ${nb7.name} with original single-pane windows. West-facing unit gets direct sun 2-8pm. Indoor temp hit 92°F yesterday with AC running. Wants Low-E vinyl replacements + solar screens. NV Energy rebate application needed.`,
        sourceDetail: `New mover - Portland first-timers, 2 weeks, ${nb7.name} window replacement`
      },
      {
        firstName: n8, lastName: ln8,
        email: `${n8.toLowerCase()}.${ln8.toLowerCase()}@gmail.com`,
        phone: phone(),
        serviceType: 'Kitchen Remodel',
        zipCode: rand(['89012', '89014', '89011']),
        address: `${streetNum()} ${rand(LV_STREETS)}`,
        city: nb8.city, state: 'NV',
        budget: randInt(32000, 55000),
        urgency: 'low',
        timeline: 'flexible',
        notes: `New mover: Empty nesters from Los Angeles moved 1 month ago. Sold $1.8M home in Pasadena, bought cash in ${nb8.name}. 1998 kitchen with oak cabinets, tile counters, white appliances. Wants full gut: custom cabinets, quartzite counters, Thermador appliances, wine fridge, pot filler. Planning to host Christmas for extended family.`,
        sourceDetail: `New mover - LA empty nesters, 1 month, ${nb8.name} luxury kitchen`
      },
    ];
  }
}
exports.NewMoverAgent = NewMoverAgent;
