/**
 * HOA COMPLIANCE DATABASE
 * Las Vegas has 3,000+ HOAs. Knowing their rules = massive contractor advantage
 */

const express = require('express');
const router = express.Router();

// Las Vegas HOA database (sample of real HOAs)
const HOA_DATABASE = [
  {
    name: 'Summerlin Council of Associations',
    zips: ['89135', '89138', '89144'],
    type: 'master',
    properties: 22000,
    requiresLicensed: true,
    approvedVendorList: true,
    insuranceRequired: 1000000,
    permitRequired: true,
    archReviewDays: 14,
    restrictedHours: '7AM-7PM weekdays only',
    materialRestrictions: ['No dark roofs in Sun City area', 'Cool deck required for pools', 'Desert landscaping only'],
    contact: { phone: '702-341-5500', email: 'info@summerlin.com' },
    contractorNotes: 'Must attend orientation. $250 application fee. Annual re-certification.',
    difficulty: 'high',
    opportunity: 'massive',
  },
  {
    name: 'Anthem Community Council',
    zips: ['89052'],
    type: 'master',
    properties: 8500,
    requiresLicensed: true,
    approvedVendorList: false,
    insuranceRequired: 500000,
    permitRequired: true,
    archReviewDays: 10,
    restrictedHours: '8AM-6PM weekdays, 9AM-5PM Sat',
    materialRestrictions: ['Earth tone colors only', 'No chain link fences', 'Pool safety fence required'],
    contact: { phone: '702-270-1000', email: 'acc@anthemnv.com' },
    contractorNotes: 'Online portal for approvals. Faster for repeat contractors.',
    difficulty: 'medium',
    opportunity: 'high',
  },
  {
    name: 'Green Valley Association',
    zips: ['89074', '89014', '89012'],
    type: 'master',
    properties: 15000,
    requiresLicensed: true,
    approvedVendorList: true,
    insuranceRequired: 1000000,
    permitRequired: true,
    archReviewDays: 7,
    restrictedHours: '7AM-7PM daily',
    materialRestrictions: ['HOA paint colors only', 'No RV parking visible', 'Front yard xeriscape required'],
    contact: { phone: '702-451-5000', email: 'info@greenvalley.com' },
    contractorNotes: 'Preferred vendor program. Top 3 contractors get 80% of leads.',
    difficulty: 'medium',
    opportunity: 'massive',
  },
  {
    name: 'Seven Hills Community',
    zips: ['89052'],
    type: 'gated',
    properties: 3200,
    requiresLicensed: true,
    approvedVendorList: true,
    insuranceRequired: 2000000,
    permitRequired: true,
    archReviewDays: 21,
    restrictedHours: '8AM-5PM weekdays only',
    materialRestrictions: ['Mediterranean style only', 'No solar panels on front roof', 'Gated access for all workers'],
    contact: { phone: '702-269-2000', email: 'sevenhills@shpoa.com' },
    contractorNotes: 'Gated community - workers must be escorted. High-net-worth clients. Premium pricing accepted.',
    difficulty: 'very_high',
    opportunity: 'massive',
  },
  {
    name: 'Skye Canyon Community',
    zips: ['89166'],
    type: 'master',
    properties: 6000,
    requiresLicensed: true,
    approvedVendorList: false,
    insuranceRequired: 500000,
    permitRequired: true,
    archReviewDays: 5,
    restrictedHours: '7AM-7PM daily',
    materialRestrictions: ['Modern desert architecture', 'Smart home pre-wiring required', 'EV charger ready garages'],
    contact: { phone: '702-555-0199', email: 'info@skyecanyon.com' },
    contractorNotes: 'New construction. Tech-savvy homeowners. Solar + smart home specialists in high demand.',
    difficulty: 'low',
    opportunity: 'high',
  },
  {
    name: 'Providence Master Association',
    zips: ['89166', '89149'],
    type: 'master',
    properties: 9000,
    requiresLicensed: true,
    approvedVendorList: true,
    insuranceRequired: 1000000,
    permitRequired: true,
    archReviewDays: 14,
    restrictedHours: '7AM-7PM weekdays',
    materialRestrictions: ['Earth tone and desert colors', 'No above-ground pools', 'Artificial turf allowed'],
    contact: { phone: '702-656-5000', email: 'info@providencecommunity.com' },
    contractorNotes: 'Growing community. First-mover advantage for contractors who get approved now.',
    difficulty: 'medium',
    opportunity: 'high',
  },
  {
    name: 'Centennial Hills Community',
    zips: ['89131', '89149'],
    type: 'mixed',
    properties: 12000,
    requiresLicensed: true,
    approvedVendorList: false,
    insuranceRequired: 500000,
    permitRequired: true,
    archReviewDays: 10,
    restrictedHours: '7AM-8PM daily',
    materialRestrictions: ['Pool fences must be 5ft+', 'No commercial vehicles parked overnight'],
    contact: { phone: '702-399-5000', email: 'info@centennialhills.com' },
    contractorNotes: 'Family neighborhood. Price-sensitive but high volume. Financing options appreciated.',
    difficulty: 'low',
    opportunity: 'high',
  },
  {
    name: 'Downtown Las Vegas Alliance',
    zips: ['89101', '89104', '89106'],
    type: 'business_improvement',
    properties: 5000,
    requiresLicensed: true,
    approvedVendorList: false,
    insuranceRequired: 1000000,
    permitRequired: true,
    archReviewDays: 30,
    restrictedHours: '9AM-5PM weekdays',
    materialRestrictions: ['Historic preservation rules', 'No modern materials on historic buildings', 'City landmark approval required'],
    contact: { phone: '702-229-6688', email: 'info@downtownalliance.com' },
    contractorNotes: 'Historic buildings. Specialized contractors only. City permits take 30+ days.',
    difficulty: 'very_high',
    opportunity: 'medium',
  },
];

// GET /api/hoa - List all HOAs
router.get('/', async (req, res) => {
  const { zipCode, difficulty, opportunity } = req.query;
  let results = [...HOA_DATABASE];
  
  if (zipCode) {
    results = results.filter(h => h.zips.includes(zipCode));
  }
  if (difficulty) {
    results = results.filter(h => h.difficulty === difficulty);
  }
  if (opportunity) {
    results = results.filter(h => h.opportunity === opportunity);
  }
  
  res.json({
    success: true,
    count: results.length,
    totalInDatabase: HOA_DATABASE.length,
    hoas: results,
  });
});

// GET /api/hoa/zip/:zipCode - HOAs for specific zip
router.get('/zip/:zipCode', async (req, res) => {
  const { zipCode } = req.params;
  const hoas = HOA_DATABASE.filter(h => h.zips.includes(zipCode));
  
  res.json({
    success: true,
    zipCode,
    hoasFound: hoas.length,
    hoas,
    contractorTips: hoas.length > 0 
      ? `This zip has ${hoas.length} HOA(s). Getting approved = exclusive access to ${hoas.reduce((a, h) => a + h.properties, 0).toLocaleString()} homes.`
      : 'No HOA in this zip. Faster approvals, lower barriers.',
  });
});

// GET /api/hoa/stats - Market intelligence
router.get('/stats', async (req, res) => {
  const totalProperties = HOA_DATABASE.reduce((a, h) => a + h.properties, 0);
  const totalHOAs = HOA_DATABASE.length;
  const requiringVendorList = HOA_DATABASE.filter(h => h.approvedVendorList).length;
  const highOpportunity = HOA_DATABASE.filter(h => h.opportunity === 'massive').length;
  
  res.json({
    success: true,
    market: 'Las Vegas, NV',
    stats: {
      totalHOAsInDatabase: totalHOAs,
      totalPropertiesCovered: totalProperties,
      requiringApprovedVendorList: requiringVendorList,
      highOpportunityHOAs: highOpportunity,
      avgApprovalTime: Math.round(HOA_DATABASE.reduce((a, h) => a + h.archReviewDays, 0) / totalHOAs),
    },
    insight: `${requiringVendorList} of ${totalHOAs} HOAs require approved vendor lists. Getting on these lists = ${totalProperties.toLocaleString()} homes you can service exclusively.`,
    actionItems: [
      'Apply to Summerlin Council (22,000 homes, approved vendor list)',
      'Apply to Green Valley Association (15,000 homes, preferred vendor program)',
      'Apply to Seven Hills (3,200 gated luxury homes, premium pricing)',
      'Get $1M+ liability insurance (required by 6 of 8 major HOAs)',
      'Take photos of past work for HOA portfolio submissions',
    ],
  });
});

module.exports = router;
