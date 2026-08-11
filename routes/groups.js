/**
 * NEIGHBORHOOD GROUP BUYING
 * Viral loop: neighbors book together, save money
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// Active group buys (in-memory for now, would be MongoDB in production)
let activeGroups = [];

// POST /api/groups/create - Create a group buy
router.post('/create', async (req, res) => {
  try {
    const { serviceType, zipCode, neighborhood, minPeople, discount, description, deadline } = req.body;
    
    const group = {
      id: `grp_${Date.now()}`,
      serviceType,
      zipCode,
      neighborhood: neighborhood || `Community in ${zipCode}`,
      minPeople: minPeople || 5,
      currentPeople: 1,
      discount: discount || 20,
      description: description || `Group ${serviceType} service - save ${discount || 20}% when ${minPeople || 5} neighbors book together`,
      deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'active',
      createdAt: new Date(),
      participants: [],
      estimatedSavings: calculateSavings(serviceType, discount || 20),
    };
    
    activeGroups.push(group);
    
    res.json({
      success: true,
      message: 'Group buy created!',
      group,
      shareLink: `https://getonlypros.com/group/${group.id}`,
      viralMessage: `I'm organizing a group ${serviceType} service in ${zipCode}. Join me and save ${group.discount}%! ${group.minPeople - group.currentPeople} more neighbors needed.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/groups/join - Join a group buy
router.post('/join', async (req, res) => {
  try {
    const { groupId, name, email, phone, address } = req.body;
    
    const group = activeGroups.find(g => g.id === groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    
    if (group.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This group is no longer active' });
    }
    
    group.participants.push({ name, email, phone, address, joinedAt: new Date() });
    group.currentPeople++;
    
    // Check if minimum reached
    const isComplete = group.currentPeople >= group.minPeople;
    if (isComplete) {
      group.status = 'ready_to_book';
    }
    
    res.json({
      success: true,
      message: isComplete 
        ? `Group complete! ${group.minPeople} neighbors joined. Ready to book ${group.serviceType}.`
        : `Joined! ${group.minPeople - group.currentPeople} more neighbor${group.minPeople - group.currentPeople > 1 ? 's' : ''} needed.`,
      group: {
        ...group,
        progress: `${group.currentPeople}/${group.minPeople}`,
        percentComplete: Math.round((group.currentPeople / group.minPeople) * 100),
      },
      nextSteps: isComplete 
        ? ['Contractors will be notified', 'You will receive booking options within 24 hours', 'Discount applied automatically']
        : [`Share with neighbors in ${group.zipCode}`, 'Post on Nextdoor/Facebook', 'Text the link to friends'],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/groups/active - List active group buys
router.get('/active', async (req, res) => {
  try {
    const { zipCode, serviceType } = req.query;
    
    let groups = activeGroups.filter(g => g.status === 'active');
    if (zipCode) groups = groups.filter(g => g.zipCode === zipCode);
    if (serviceType) groups = groups.filter(g => g.serviceType === serviceType);
    
    res.json({
      success: true,
      count: groups.length,
      groups: groups.map(g => ({
        id: g.id,
        serviceType: g.serviceType,
        zipCode: g.zipCode,
        neighborhood: g.neighborhood,
        progress: `${g.currentPeople}/${g.minPeople}`,
        discount: g.discount,
        estimatedSavings: g.estimatedSavings,
        deadline: g.deadline,
        spotsRemaining: g.minPeople - g.currentPeople,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/groups/stats - Group buying stats
router.get('/stats', async (req, res) => {
  try {
    const totalGroups = activeGroups.length;
    const completedGroups = activeGroups.filter(g => g.status === 'completed').length;
    const totalParticipants = activeGroups.reduce((a, g) => a + g.currentPeople, 0);
    const totalSavings = activeGroups.reduce((a, g) => a + (g.estimatedSavings * g.currentPeople), 0);
    
    res.json({
      success: true,
      stats: {
        totalGroups,
        completedGroups,
        activeGroups: totalGroups - completedGroups,
        totalParticipants,
        totalSavings,
        avgGroupSize: totalGroups > 0 ? Math.round(totalParticipants / totalGroups) : 0,
      },
      topServices: [
        { service: 'AC Tune-Up', avgGroupSize: 7, avgDiscount: 25 },
        { service: 'Pool Cleaning', avgGroupSize: 5, avgDiscount: 20 },
        { service: 'Roof Inspection', avgGroupSize: 4, avgDiscount: 15 },
        { service: 'Solar Panel Cleaning', avgGroupSize: 8, avgDiscount: 30 },
        { service: 'Pest Control', avgGroupSize: 6, avgDiscount: 20 },
      ],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

function calculateSavings(serviceType, discount) {
  const avgPrices = {
    'HVAC / Air Conditioning': 8500,
    'Pool Service & Repair': 4200,
    'Roofing': 15000,
    'Plumbing': 3200,
    'Solar Installation': 28000,
    'Landscaping / Xeriscape': 6500,
    'Electrical': 4800,
    'Window / Energy Efficiency': 9500,
    'Pest Control': 1200,
    'Garage Door': 1800,
  };
  
  const base = avgPrices[serviceType] || 5000;
  return Math.round(base * (discount / 100));
}

module.exports = router;
