"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const router = express.Router();
const bcryptjs = require("bcryptjs");
const User = require("../models/User").User;
const Contractor = require("../models/Contractor").Contractor;
const Agent = require("../models/Agent").Agent;

// Las Vegas service areas (all 60 zip codes)
const LV_ZIPS = [
  '89135','89138','89144','89052','89044','89178','89183','89141',
  '89074','89012','89117','89147','89149','89131','89014','89011',
  '89128','89101','89104','89106','89110','89121','89032','89031',
  '89084','89085','89109','89169','89119','89139','89148','89143',
  '89156','89005','89006','89142','89122','89146','89134','89145',
  '89129','89130','89133','89115','89120','89123','89124','89158',
  '89161','89163','89164','89180','89181','89185','89191','89193',
  '89195','89199'
];

// POST /api/seed/demo - Creates Las Vegas demo contractors and triggers agents
router.post('/demo', async (req, res) => {
  try {
    const results = { users: [], contractors: [], agentsTriggered: 0, errors: [] };

    // Create 5 Las Vegas demo contractors covering different specialties
    const demoContractors = [
      {
        email: 'acpro@lvpros.com',
        password: 'demo123456',
        firstName: 'Mike',
        lastName: 'Ramirez',
        phone: '702-555-0101',
        companyName: 'Desert Cool HVAC Pros',
        services: ['HVAC / Air Conditioning', 'Electrical', 'Solar Installation'],
        specialties: ['AC repair', 'AC install', 'heat pump', 'ductless mini-split', 'solar panel install', 'EV charger install'],
        serviceAreas: ['89135','89138','89144','89052','89044','89178','89183','89141','89149','89131'],
        yearsInBusiness: 12,
        rating: 4.9,
        reviewCount: 287,
        description: 'Las Vegas HVAC specialists. 12 years keeping Vegas cool. Certified Trane, Carrier, Lennox dealer. Emergency service 24/7. NV Energy rebate partner.',
      },
      {
        email: 'poolking@lvpros.com',
        password: 'demo123456',
        firstName: 'Jason',
        lastName: 'Wong',
        phone: '702-555-0102',
        companyName: 'Vegas Pool Masters',
        services: ['Pool Service & Repair', 'Concrete / Cool Decking', 'Landscaping / Xeriscape'],
        specialties: ['pool cleaning', 'pool repair', 'salt system', 'pool heater', 'cool deck', 'pool remodel', 'artificial turf'],
        serviceAreas: ['89052','89044','89074','89012','89178','89183','89147','89141','89014','89011'],
        yearsInBusiness: 8,
        rating: 4.8,
        reviewCount: 156,
        description: 'Summerlin & Henderson pool experts. Weekly service, repairs, remodels. Pentair & Hayward certified. HOA compliance specialists.',
      },
      {
        email: 'roofmaster@lvpros.com',
        password: 'demo123456',
        firstName: 'Carlos',
        lastName: 'Mendez',
        phone: '702-555-0103',
        companyName: 'Monsoon Roofing LV',
        services: ['Roofing', 'Water Damage Restoration', 'Window / Energy Efficiency'],
        specialties: ['tile roof repair', 'shingle replacement', 'flat roof', 'storm damage', 'water damage restoration', 'window replacement'],
        serviceAreas: ['89117','89147','89149','89131','89128','89101','89104','89106','89110','89121','89032','89031'],
        yearsInBusiness: 15,
        rating: 4.7,
        reviewCount: 203,
        description: '15 years protecting Las Vegas homes from monsoon damage. Tile, shingle, flat roof specialists. Insurance claim experts. Emergency tarp service.',
      },
      {
        email: 'plumbpro@lvpros.com',
        password: 'demo123456',
        firstName: 'Dave',
        lastName: 'Johnson',
        phone: '702-555-0104',
        companyName: 'Hard Water Plumbing LV',
        services: ['Plumbing', 'Bathroom Remodel', 'Kitchen Remodel'],
        specialties: ['repipe', 'water heater', 'water softener', 'leak detection', 'bathroom remodel', 'kitchen remodel', 'tankless water heater'],
        serviceAreas: ['89135','89138','89144','89178','89183','89141','89147','89149','89131','89128','89117'],
        yearsInBusiness: 10,
        rating: 4.9,
        reviewCount: 178,
        description: 'Las Vegas hard water specialists. Whole-house repipe, water softeners, tankless heaters. Lifetime warranty on repipes. Financing available.',
      },
      {
        email: 'green@lvpros.com',
        password: 'demo123456',
        firstName: 'Lisa',
        lastName: 'Chen',
        phone: '702-555-0105',
        companyName: 'Desert Green Landscaping',
        services: ['Landscaping / Xeriscape', 'Pest Control', 'Fence Installation'],
        specialties: ['xeriscape', 'artificial turf', 'drip irrigation', 'desert landscaping', 'scorpion barrier', 'pest control', 'block wall'],
        serviceAreas: ['89178','89183','89141','89139','89148','89143','89156','89005','89006','89147','89149'],
        yearsInBusiness: 6,
        rating: 4.8,
        reviewCount: 134,
        description: 'SNWA rebate partner. Water-wise landscaping, artificial turf, scorpion barriers. Save $300+/month on water bills. Free design consultation.',
      },
    ];

    for (const dc of demoContractors) {
      // 1. Create user if not exists
      let user = await User.findOne({ email: dc.email });
      if (!user) {
        const hashedPassword = await bcryptjs.hash(dc.password, 10);
        user = await User.create({
          email: dc.email,
          password: hashedPassword,
          firstName: dc.firstName,
          lastName: dc.lastName,
          phone: dc.phone,
          role: 'contractor',
          zipCode: dc.serviceAreas[0],
          isVerified: true,
        });
        results.users.push({ id: user._id.toString(), email: user.email, name: `${dc.firstName} ${dc.lastName}` });
      } else {
        results.users.push({ id: user._id.toString(), email: user.email, existing: true });
      }

      // 2. Create contractor if not exists
      let contractor = await Contractor.findOne({ userId: user._id });
      if (!contractor) {
        contractor = await Contractor.create({
          userId: user._id,
          companyName: dc.companyName,
          services: dc.services,
          serviceAreas: dc.serviceAreas,
          yearsInBusiness: dc.yearsInBusiness,
          rating: dc.rating,
          reviewCount: dc.reviewCount,
          status: 'active',
          isAvailable: true,
          description: dc.description,
        });
        results.contractors.push({ id: contractor._id.toString(), companyName: dc.companyName });
      } else {
        results.contractors.push({ id: contractor._id.toString(), companyName: dc.companyName, existing: true });
      }
    }

    // 3. Enable all agents and trigger them
    const agents = await Agent.find({});
    for (const agent of agents) {
      if (!agent.enabled) {
        agent.enabled = true;
        await agent.save();
      }
    }

    // Trigger all agents via registry if available
    const registry = req.app.locals.agentRegistry;
    const scheduler = req.app.locals.scheduler;
    if (registry && scheduler) {
      const enabledAgents = await Agent.find({ enabled: true });
      for (const agent of enabledAgents) {
        try {
          await scheduler.executeAgent(agent.slug);
          results.agentsTriggered++;
        } catch (e) {
          results.errors.push(`${agent.slug}: ${e.message}`);
        }
      }
    }

    res.json({
      success: true,
      message: 'Las Vegas demo setup complete - 5 contractors created, 15 agents triggered',
      market: 'Las Vegas, NV',
      loginCredentials: demoContractors.map(dc => ({ email: dc.email, password: dc.password })),
      results,
    });
  } catch (error) {
    console.error('[Seed] Demo setup failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/seed/status - Check system status
router.get('/status', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const contractorCount = await Contractor.countDocuments();
    const agentCount = await Agent.countDocuments();
    const enabledAgentCount = await Agent.countDocuments({ enabled: true });

    res.json({
      success: true,
      status: 'operational',
      market: 'Las Vegas, NV',
      counts: { users: userCount, contractors: contractorCount, agents: agentCount, enabledAgents: enabledAgentCount },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
