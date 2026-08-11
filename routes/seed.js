"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const router = express.Router();
const bcryptjs = require("bcryptjs");
const User = require("../models/User").User;
const Contractor = require("../models/Contractor").Contractor;
const Agent = require("../models/Agent").Agent;

// POST /api/seed/demo - Creates demo contractor and triggers agents
router.post('/demo', async (req, res) => {
  try {
    const results = { user: null, contractor: null, agentsTriggered: 0, errors: [] };

    // 1. Create demo user if not exists
    let user = await User.findOne({ email: 'demo@getonlypros.com' });
    if (!user) {
      const hashedPassword = await bcryptjs.hash('demo123456', 10);
      user = await User.create({
        email: 'demo@getonlypros.com',
        password: hashedPassword,
        firstName: 'Demo',
        lastName: 'Contractor',
        phone: '555-0100',
        role: 'contractor',
        zipCode: '90210',
        isVerified: true,
      });
      results.user = { id: user._id.toString(), email: user.email };
    } else {
      results.user = { id: user._id.toString(), email: user.email, existing: true };
    }

    // 2. Create demo contractor if not exists
    let contractor = await Contractor.findOne({ userId: user._id });
    if (!contractor) {
      contractor = await Contractor.create({
        userId: user._id,
        companyName: 'Demo Pro Services',
        services: ['roofing', 'plumbing', 'hvac', 'electrical', 'landscaping'],
        serviceAreas: ['90210', '90211', '90212', '10001', '10002', '30301', '30302', '77001', '77002', '60601', '60602'],
        yearsInBusiness: 10,
        rating: 4.8,
        reviewCount: 124,
        status: 'active',
        isAvailable: true,
        description: 'Demo contractor for testing the GetOnlyPros platform.',
      });
      results.contractor = { id: contractor._id.toString(), companyName: contractor.companyName };
    } else {
      results.contractor = { id: contractor._id.toString(), companyName: contractor.companyName, existing: true };
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
      message: 'Demo setup complete',
      login: { email: 'demo@getonlypros.com', password: 'demo123456' },
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
      counts: { users: userCount, contractors: contractorCount, agents: agentCount, enabledAgents: enabledAgentCount },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
