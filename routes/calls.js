const express = require('express');
const router = express.Router();
const { CallSession } = require('../models/CallSession');
const { CustomerMemory } = require('../models/CustomerMemory');
const { Job } = require('../models/Job');
const { Proposal } = require('../models/Proposal');

// ============================================
// AI CALL ANSWERING API
// 24/7 Human-Sounding Phone Receptionist
// ============================================

/**
 * WEBHOOK: Incoming call received
 * Phone service (Twilio, etc.) calls this when a call comes in
 */
router.post('/incoming', async (req, res) => {
  try {
    const { callId, contractorId, callerPhone, calledNumber } = req.body;

    // Get contractor details
    const { Contractor } = require('../models/Contractor');
    const contractor = await Contractor.findById(contractorId);

    if (!contractor) {
      return res.json({
        success: false,
        action: 'reject',
        message: 'Contractor not found',
      });
    }

    // Check if contractor has AI answering enabled
    if (!contractor.aiCallAnsweringEnabled) {
      return res.json({
        success: true,
        action: 'forward',
        forwardTo: contractor.phone,
        message: 'AI answering disabled, forwarding to contractor',
      });
    }

    // Initialize call via CallAnsweringAgent
    const { CallAnsweringAgent } = require('../agents');
    const agent = new CallAnsweringAgent();

    const result = await agent.handleInboundCall({
      callId,
      contractorId,
      callerPhone,
      contractor,
    });

    res.json({
      success: true,
      action: 'answer',
      callSessionId: result.callSessionId,
      greeting: result.greeting,
      voice: result.voice,
      isExistingCustomer: result.isExistingCustomer,
      customerName: result.customerName,
      nextPrompt: result.nextPrompt,
    });
  } catch (error) {
    console.error('[CallAPI] Incoming error:', error);
    res.json({
      success: false,
      action: 'voicemail',
      message: 'Please leave a message after the tone.',
    });
  }
});

/**
 * WEBHOOK: Speech transcribed from caller
 * Phone service sends transcribed speech, AI responds
 */
router.post('/speech', async (req, res) => {
  try {
    const { callSessionId, transcript, confidence } = req.body;

    const { CallAnsweringAgent } = require('../agents');
    const agent = new CallAnsweringAgent();

    const result = await agent.processUserSpeech({
      callSessionId,
      transcript,
      confidence: confidence || 0.9,
    });

    res.json({
      success: true,
      aiResponse: result.aiResponse,
      voice: result.voice,
      shouldTransfer: result.shouldTransfer,
      transferReason: result.transferReason,
      callEnded: result.callEnded,
      action: result.action,
    });
  } catch (error) {
    console.error('[CallAPI] Speech error:', error);
    res.json({
      success: false,
      aiResponse: "I'm sorry, I didn't catch that. Could you please repeat?",
      voice: 'sarah',
    });
  }
});

/**
 * WEBHOOK: Call ended
 */
router.post('/end', async (req, res) => {
  try {
    const { callSessionId, reason, recordingUrl } = req.body;

    const { CallAnsweringAgent } = require('../agents');
    const agent = new CallAnsweringAgent();

    const result = await agent.endCall({ callSessionId, reason });

    // Save recording URL if provided
    if (recordingUrl) {
      await CallSession.findByIdAndUpdate(callSessionId, {
        'recording.url': recordingUrl,
      });
    }

    res.json({
      success: true,
      callId: result.callId,
      duration: result.duration,
      outcome: result.outcome,
      transcript: result.transcript,
    });
  } catch (error) {
    console.error('[CallAPI] End call error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * WEBHOOK: Voicemail received
 */
router.post('/voicemail', async (req, res) => {
  try {
    const { callSessionId, transcript, audioUrl, duration } = req.body;

    const call = await CallSession.findByIdAndUpdate(callSessionId, {
      status: 'voicemail',
      'recording.url': audioUrl,
      'recording.duration': duration,
      transcript: [{ speaker: 'human', text: transcript, timestamp: new Date() }],
      transcriptText: transcript,
      'outcome.result': 'message_taken',
    }, { new: true });

    // Create action for follow-up
    call.actions.push({
      type: 'message_left',
      details: { transcript, audioUrl, duration },
      status: 'pending',
    });
    await call.save();

    res.json({
      success: true,
      message: 'Voicemail recorded and transcribed',
      summary: this.summarizeVoicemail(transcript),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// CALL DASHBOARD & ANALYTICS
// ============================================

// Get all calls for contractor
router.get('/', async (req, res) => {
  try {
    const { contractorId, status, limit = 50, offset = 0 } = req.query;
    const filter = { contractor: contractorId };
    if (status) filter.status = status;

    const calls = await CallSession.find(filter)
      .sort({ startedAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    const total = await CallSession.countDocuments(filter);

    res.json({
      success: true,
      total,
      count: calls.length,
      calls: calls.map(c => ({
        id: c._id,
        callId: c.callId,
        callerPhone: c.callerPhone,
        callerName: c.callerName,
        status: c.status,
        duration: c.duration,
        outcome: c.outcome.result,
        startedAt: c.startedAt,
        serviceNeeded: c.aiUnderstanding?.serviceNeeded,
        urgency: c.aiUnderstanding?.urgency,
        isExistingCustomer: c.isExistingCustomer,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single call with full details
router.get('/:callId', async (req, res) => {
  try {
    const call = await CallSession.findById(req.params.callId);
    if (!call) return res.status(404).json({ success: false, message: 'Call not found' });

    res.json({
      success: true,
      call: {
        id: call._id,
        callId: call.callId,
        callerPhone: call.callerPhone,
        callerName: call.callerName,
        isExistingCustomer: call.isExistingCustomer,
        status: call.status,
        startedAt: call.startedAt,
        answeredAt: call.answeredAt,
        endedAt: call.endedAt,
        duration: call.duration,
        transcript: call.transcript,
        aiUnderstanding: call.aiUnderstanding,
        outcome: call.outcome,
        actions: call.actions,
        transfer: call.transfer,
        voiceMetrics: call.voiceMetrics,
        recording: call.recording,
        cost: call.cost,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get call analytics for contractor
router.get('/analytics/:contractorId', async (req, res) => {
  try {
    const { contractorId } = req.params;
    const { period = '7d' } = req.query;

    const now = new Date();
    let startDate;
    switch (period) {
      case '24h': startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const calls = await CallSession.find({
      contractor: contractorId,
      startedAt: { $gte: startDate },
    });

    // Calculate metrics
    const totalCalls = calls.length;
    const answeredCalls = calls.filter(c => c.status !== 'missed').length;
    const missedCalls = calls.filter(c => c.status === 'missed').length;
    const avgDuration = totalCalls > 0 ? calls.reduce((s, c) => s + c.duration, 0) / totalCalls : 0;

    const outcomes = {};
    calls.forEach(c => {
      outcomes[c.outcome.result] = (outcomes[c.outcome.result] || 0) + 1;
    });

    const services = {};
    calls.forEach(c => {
      if (c.aiUnderstanding?.serviceNeeded) {
        services[c.aiUnderstanding.serviceNeeded] = (services[c.aiUnderstanding.serviceNeeded] || 0) + 1;
      }
    });

    const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      calls: calls.filter(c => c.startedAt.getHours() === i).length,
    }));

    // Conversion rate
    const leads = calls.filter(c => c.aiUnderstanding?.callerIntent === 'new_lead').length;
    const booked = outcomes.appointment_booked || 0;
    const conversionRate = leads > 0 ? Math.round((booked / leads) * 100) : 0;

    // AI performance
    const avgNaturalness = calls.length > 0
      ? Math.round(calls.reduce((s, c) => s + (c.voiceMetrics?.naturalnessScore || 0), 0) / calls.length)
      : 0;

    res.json({
      success: true,
      period,
      summary: {
        totalCalls,
        answeredCalls,
        missedCalls,
        avgDuration: Math.round(avgDuration / 60), // minutes
        conversionRate,
        aiNaturalnessScore: avgNaturalness,
      },
      outcomes,
      services,
      hourlyDistribution,
      calls: calls.slice(0, 20).map(c => ({
        id: c._id,
        callerPhone: c.callerPhone,
        duration: c.duration,
        outcome: c.outcome.result,
        serviceNeeded: c.aiUnderstanding?.serviceNeeded,
        startedAt: c.startedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get missed calls requiring callback
router.get('/alerts/missed/:contractorId', async (req, res) => {
  try {
    const { contractorId } = req.params;
    const missed = await CallSession.find({
      contractor: contractorId,
      status: 'missed',
      'outcome.result': 'no_action',
      startedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).sort({ startedAt: -1 });

    res.json({
      success: true,
      count: missed.length,
      calls: missed.map(c => ({
        id: c._id,
        callerPhone: c.callerPhone,
        startedAt: c.startedAt,
        aiUnderstanding: c.aiUnderstanding,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get voicemail messages
router.get('/voicemails/:contractorId', async (req, res) => {
  try {
    const { contractorId } = req.params;
    const voicemails = await CallSession.find({
      contractor: contractorId,
      status: 'voicemail',
    }).sort({ startedAt: -1 }).limit(50);

    res.json({
      success: true,
      count: voicemails.length,
      voicemails: voicemails.map(v => ({
        id: v._id,
        callerPhone: v.callerPhone,
        callerName: v.callerName,
        transcript: v.transcriptText,
        audioUrl: v.recording?.url,
        duration: v.recording?.duration,
        startedAt: v.startedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// AI VOICE & PERSONALITY SETTINGS
// ============================================

// Get available AI voices
router.get('/voices', async (req, res) => {
  const voices = {
    sarah: { name: 'Sarah', gender: 'female', tone: 'warm', age: '30s', description: 'Friendly, professional, reassuring. Best for residential services.' },
    mike: { name: 'Mike', gender: 'male', tone: 'confident', age: '40s', description: 'Experienced, trustworthy, knowledgeable. Best for commercial services.' },
    jennifer: { name: 'Jennifer', gender: 'female', tone: 'energetic', age: '20s', description: 'Enthusiastic, helpful, warm. Best for younger demographics.' },
    david: { name: 'David', gender: 'male', tone: 'calm', age: '50s', description: 'Calm, authoritative, grandfatherly. Best for luxury/high-end services.' },
  };

  res.json({ success: true, voices });
});

// Update contractor AI voice settings
router.post('/settings/:contractorId', async (req, res) => {
  try {
    const { voiceId, personality, enabled, greeting, afterHoursOnly } = req.body;
    const { Contractor } = require('../models/Contractor');

    const contractor = await Contractor.findByIdAndUpdate(
      req.params.contractorId,
      {
        aiCallAnsweringEnabled: enabled,
        aiVoice: voiceId,
        aiPersonality: personality,
        aiGreeting: greeting,
        aiAfterHoursOnly: afterHoursOnly,
      },
      { new: true }
    );

    res.json({
      success: true,
      settings: {
        enabled: contractor.aiCallAnsweringEnabled,
        voice: contractor.aiVoice,
        personality: contractor.aiPersonality,
        greeting: contractor.aiGreeting,
        afterHoursOnly: contractor.aiAfterHoursOnly,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// SIMULATION / TESTING
// ============================================

// Simulate an inbound call (for testing)
router.post('/simulate/inbound', async (req, res) => {
  try {
    const { contractorId, callerPhone, callerName, scenario } = req.body;

    const { CallAnsweringAgent } = require('../agents');
    const agent = new CallAnsweringAgent();

    // Create mock contractor
    const mockContractor = {
      _id: contractorId,
      companyName: 'Test HVAC Services',
      phone: '702-555-0199',
      aiVoice: 'sarah',
      aiPersonality: 'friendly_professional',
      aiCallAnsweringEnabled: true,
    };

    const callResult = await agent.handleInboundCall({
      callId: `SIM-${Date.now()}`,
      contractorId,
      callerPhone: callerPhone || '702-555-0100',
      contractor: mockContractor,
    });

    res.json({
      success: true,
      simulation: true,
      callSessionId: callResult.callSessionId,
      greeting: callResult.greeting,
      voice: callResult.voice,
      scenario,
      nextSteps: [
        'POST /api/calls/speech with transcript to simulate conversation',
        'POST /api/calls/end to end the call',
      ],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Simulate caller speech (for testing)
router.post('/simulate/speech', async (req, res) => {
  try {
    const { callSessionId, transcript } = req.body;

    const { CallAnsweringAgent } = require('../agents');
    const agent = new CallAnsweringAgent();

    const result = await agent.processUserSpeech({
      callSessionId,
      transcript,
      confidence: 0.95,
    });

    res.json({
      success: true,
      simulation: true,
      aiResponse: result.aiResponse,
      shouldTransfer: result.shouldTransfer,
      callEnded: result.callEnded,
      understanding: result.understanding,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper: Summarize voicemail
function summarizeVoicemail(transcript) {
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return 'No transcript available';

  // Extract key info
  const hasPhone = /\d{3}[-.]?\d{3}[-.]?\d{4}/.test(transcript);
  const hasName = sentences[0].length < 50;
  const hasRequest = sentences.some(s =>
    /need|help|repair|fix|broken|leak|emergency/.test(s.toLowerCase())
  );

  return {
    summary: sentences.slice(0, 2).join('. ') + '.',
    hasPhone,
    hasName,
    hasRequest,
    urgency: /emergency|urgent|asap|today/.test(transcript.toLowerCase()) ? 'high' : 'normal',
  };
}

module.exports = router;
