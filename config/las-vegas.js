/**
 * LAS VEGAS MARKET CONFIGURATION
 * Hyper-local data for GetOnlyPros Las Vegas launch
 */

// Core Las Vegas zip codes by neighborhood tier
const LAS_VEGAS_ZIPS = {
  luxury: ['89135', '89138', '89144', '89052', '89044'], // Summerlin, Anthem, Seven Hills ($620K-$1.2M)
  premium: ['89178', '89183', '89141', '89074', '89012', '89166'], // Enterprise, Southern Highlands, Green Valley, Skye Canyon ($480K-$780K)
  midMarket: ['89117', '89147', '89149', '89131', '89014', '89011', '89128'], // Spring Valley, Centennial Hills, Green Valley core, Providence ($440K-$620K)
  value: ['89101', '89104', '89106', '89110', '89121', '89032', '89031', '89084'], // Downtown, East LV, North Las Vegas ($290K-$470K)
  emerging: ['89139', '89148', '89143', '89156', '89005', '89006'], // Southwest edge, Boulder City ($420K-$580K)
  strip: ['89109', '89169', '89119'], // Paradise/Strip corridor ($310K-$480K)
};

// All zip codes flattened
const ALL_ZIPS = Object.values(LAS_VEGAS_ZIPS).flat();

// Las Vegas-specific services (ranked by demand)
const LV_SERVICES = [
  { name: 'HVAC / Air Conditioning', demand: 'extreme', season: 'year-round', avgTicket: 8500, keywords: ['AC repair', 'air conditioning', 'HVAC install', 'cooling'] },
  { name: 'Pool Service & Repair', demand: 'extreme', season: 'year-round', avgTicket: 4200, keywords: ['pool cleaning', 'pool repair', 'pool pump', 'pool heater'] },
  { name: 'Roofing', demand: 'high', season: 'mar-nov', avgTicket: 15000, keywords: ['roof repair', 'roof replacement', 'shingle repair', 'tile roof'] },
  { name: 'Landscaping / Xeriscape', demand: 'high', season: 'feb-oct', avgTicket: 6500, keywords: ['landscaping', 'xeriscape', 'desert landscaping', 'artificial turf', 'drip irrigation'] },
  { name: 'Plumbing', demand: 'high', season: 'year-round', avgTicket: 3200, keywords: ['plumber', 'water heater', 'leak repair', 'repipe', 'hard water'] },
  { name: 'Electrical', demand: 'high', season: 'year-round', avgTicket: 4800, keywords: ['electrician', 'panel upgrade', 'EV charger', 'rewire', 'outlet install'] },
  { name: 'Solar Installation', demand: 'high', season: 'feb-oct', avgTicket: 28000, keywords: ['solar panels', 'solar install', 'battery backup', 'Tesla Powerwall'] },
  { name: 'Garage Door', demand: 'medium', season: 'year-round', avgTicket: 1800, keywords: ['garage door repair', 'garage door opener', 'spring replacement'] },
  { name: 'Pest Control', demand: 'medium', season: 'year-round', avgTicket: 1200, keywords: ['pest control', 'scorpion', 'termite', 'desert pest'] },
  { name: 'Window / Energy Efficiency', demand: 'medium', season: 'feb-sep', avgTicket: 9500, keywords: ['window replacement', 'window tint', 'energy efficient windows'] },
  { name: 'Concrete / Cool Decking', demand: 'medium', season: 'mar-oct', avgTicket: 7500, keywords: ['concrete repair', 'cool deck', 'pool deck', 'stamped concrete'] },
  { name: 'Water Damage Restoration', demand: 'emergency', season: 'jul-sep', avgTicket: 8500, keywords: ['water damage', 'flood restoration', 'mold remediation', 'dry out'] },
  { name: 'Fence Installation', demand: 'medium', season: 'feb-nov', avgTicket: 5500, keywords: ['fence install', 'block wall', 'iron fence', 'privacy fence'] },
  { name: 'Kitchen Remodel', demand: 'medium', season: 'year-round', avgTicket: 35000, keywords: ['kitchen remodel', 'cabinet install', 'countertop', 'backsplash'] },
  { name: 'Bathroom Remodel', demand: 'medium', season: 'year-round', avgTicket: 18000, keywords: ['bathroom remodel', 'shower install', 'tub replacement', 'vanity'] },
];

// Las Vegas neighborhoods with demographics
const LV_NEIGHBORHOODS = [
  { name: 'Summerlin', zips: ['89135', '89138', '89144'], type: 'luxury_master', homeAge: '5-15', income: '150K+', poolRate: 0.85 },
  { name: 'Henderson (Anthem/Seven Hills)', zips: ['89052', '89044'], type: 'luxury_master', homeAge: '10-20', income: '140K+', poolRate: 0.80 },
  { name: 'Henderson (Green Valley)', zips: ['89074', '89014', '89012'], type: 'established', homeAge: '20-30', income: '95K+', poolRate: 0.70 },
  { name: 'Enterprise / Southwest', zips: ['89178', '89183', '89141'], type: 'new_growth', homeAge: '0-10', income: '105K+', poolRate: 0.75 },
  { name: 'Spring Valley', zips: ['89117', '89147', '89146'], type: 'established', homeAge: '25-35', income: '85K+', poolRate: 0.65 },
  { name: 'Centennial Hills', zips: ['89149', '89166', '89131'], type: 'family', homeAge: '5-20', income: '90K+', poolRate: 0.60 },
  { name: 'Downtown / Arts District', zips: ['89101', '89104', '89106'], type: 'urban', homeAge: '40-70', income: '55K+', poolRate: 0.20 },
  { name: 'North Las Vegas', zips: ['89031', '89032', '89084', '89085'], type: 'value', homeAge: '10-25', income: '70K+', poolRate: 0.45 },
  { name: 'Paradise / Strip Corridor', zips: ['89109', '89169', '89119'], type: 'mixed', homeAge: '30-50', income: '65K+', poolRate: 0.35 },
  { name: 'Boulder City', zips: ['89005', '89006'], type: 'small_town', homeAge: '20-40', income: '80K+', poolRate: 0.55 },
];

// Weather triggers specific to Las Vegas
const LV_WEATHER_TRIGGERS = [
  { event: 'Extreme Heat Wave', temp: '110°F+', months: [6, 7, 8, 9], services: ['HVAC', 'Pool Service', 'Electrical'], urgency: 'emergency' },
  { event: 'Monsoon Flash Flood', rainfall: '1+ inch/hour', months: [7, 8, 9], services: ['Water Damage Restoration', 'Roofing', 'Plumbing'], urgency: 'emergency' },
  { event: 'Haboob Dust Storm', wind: '50+ mph', months: [6, 7, 8], services: ['HVAC', 'Pool Service', 'Window'], urgency: 'high' },
  { event: 'Hail Storm', size: '1+ inch', months: [7, 8], services: ['Roofing', 'Window', 'Pool Service'], urgency: 'high' },
  { event: 'First 100°F Day', temp: '100°F+', months: [5, 6], services: ['HVAC', 'Pool Service'], urgency: 'high' },
  { event: 'Sustained Heat (7+ days)', temp: '105°F+', months: [7, 8], services: ['HVAC', 'Electrical', 'Solar'], urgency: 'high' },
];

// Building permit data (real 2026 data)
const LV_PERMIT_DATA = {
  totalResidential: 368, // YTD through May 2026 (down 56% from 2025)
  totalValue: 40700000, // $40.7M
  topCities: ['Henderson', 'Summerlin', 'Enterprise', 'North Las Vegas'],
  slowdownFactor: 0.56, // 56% decrease = massive renovation opportunity
};

// Real Las Vegas first names (diverse demographics)
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

// Las Vegas street names
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

module.exports = {
  LAS_VEGAS_ZIPS,
  ALL_ZIPS,
  LV_SERVICES,
  LV_NEIGHBORHOODS,
  LV_WEATHER_TRIGGERS,
  LV_PERMIT_DATA,
  LV_FIRST_NAMES,
  LV_LAST_NAMES,
  LV_STREETS,
};
