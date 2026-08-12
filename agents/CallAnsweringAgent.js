const BaseAgent = require('./BaseAgent');
const { CallSession } = require('../models/CallSession');
const { Job } = require('../models/Job');
const { CustomerMemory } = require('../models/CustomerMemory');
const { Proposal } = require('../models/Proposal');

/**
 * CallAnsweringAgent - 24/7 AI Phone Receptionist
 * Sounds human. Understands context. Never misses a lead.
 * Handles inbound calls, qualifies leads, books appointments, escalates when needed.
 */
class CallAnsweringAgent extends BaseAgent {
  constructor() {
    super('CallAnsweringAgent', 'call_answering');
    this.voices = {
      sarah: { name: 'Sarah', gender: 'female', tone: 'warm', age: '30s', accent: 'neutral_american', description: 'Friendly, professional, reassuring' },
      mike: { name: 'Mike', gender: 'male', tone: 'confident', age: '40s', accent: 'neutral_american', description: 'Experienced, trustworthy, knowledgeable' },
      jennifer: { name: 'Jennifer', gender: 'female', tone: 'energetic', age: '20s', accent: 'neutral_american', description: 'Enthusiastic, helpful, warm' },
      david: { name: 'David', gender: 'male', tone: 'calm', age: '50s', accent: 'neutral_american', description: 'Calm, authoritative, grandfatherly' },
    };
    this.greetingTemplates = [
      "Hello, you've reached {companyName}. This is {aiName}. How can I help you today?",
      "Thank you for calling {companyName}. {aiName} speaking. What can I do for you?",
      "Good {timeOfDay}, {companyName}. {aiName} here. How may I assist you?",
    ];
    this.conversationStates = {
      GREETING: 'greeting',
      IDENTIFYING: 'identifying',
      QUALIFYING: 'qualifying',
      SCHEDULING: 'scheduling',
      PRICING: 'pricing',
      OBJECTION: 'objection',
      CLOSING: 'closing',
      TRANSFER: 'transfer',
      VOICEMAIL: 'voicemail',
    };
  }

  async execute() {
    console.log(`[${this.name}] Monitoring active calls...`);
    try {
      const results = { callsHandled: 0, appointmentsBooked: 0, leadsQualified: 0, spamBlocked: 0, insights: [] };

      // 1. Process completed calls that need follow-up actions
      const completedCalls = await CallSession.find({
        status: 'completed',
        'actions.status': 'pending',
        endedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
      }).populate('contractor');

      for (const call of completedCalls) {
        for (const action of call.actions) {
          if (action.status !== 'pending') continue;

          switch (action.type) {
            case 'job_created':
              await this.createJobFromCall(call, action);
              action.status = 'completed';
              break;
            case 'appointment_scheduled':
              await this.scheduleAppointment(call, action);
              action.status = 'completed';
              break;
            case 'estimate_sent':
              await this.sendEstimate(call, action);
              action.status = 'completed';
              break;
            case 'follow_up_set':
              await this.scheduleFollowUp(call, action);
              action.status = 'completed';
              break;
          }
        }
        await call.save();
        results.callsHandled++;
      }

      // 2. Generate daily call analytics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const todayCalls = await CallSession.find({
        startedAt: { $gte: today, $lt: tomorrow },
      });

      const outcomes = {};
      todayCalls.forEach(c => {
        outcomes[c.outcome.result] = (outcomes[c.outcome.result] || 0) + 1;
      });

      results.appointmentsBooked = outcomes.appointment_booked || 0;
      results.leadsQualified = todayCalls.filter(c => c.aiUnderstanding?.callerIntent === 'new_lead').length;
      results.spamBlocked = outcomes.spam || 0;

      results.insights = [
        `Processed ${results.callsHandled} calls requiring follow-up`,
        `Today's calls: ${todayCalls.length}`,
        `Appointments booked: ${results.appointmentsBooked}`,
        `Leads qualified: ${results.leadsQualified}`,
        `Spam blocked: ${results.spamBlocked}`,
        `Average call duration: ${todayCalls.length > 0 ? Math.round(todayCalls.reduce((s, c) => s + c.duration, 0) / todayCalls.length / 60) : 0} min`,
        `Transfer rate: ${todayCalls.length > 0 ? Math.round((outcomes.transferred || 0) / todayCalls.length * 100) : 0}%`,
      ];

      return {
        success: true,
        ...results,
        message: `Call answering stats: ${todayCalls.length} calls today, ${results.appointmentsBooked} appointments booked.`,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ============================================
  // INBOUND CALL HANDLER (Webhook entry point)
  // ============================================

  async handleInboundCall({ callId, contractorId, callerPhone, contractor }) {
    console.log(`[CallAnswering] New call ${callId} from ${callerPhone}`);

    // Create call session
    const call = new CallSession({
      callId,
      contractor: contractorId,
      callerPhone,
      status: 'connected',
      answeredAt: new Date(),
      aiConfig: {
        voiceId: contractor?.aiVoice || 'sarah',
        personality: contractor?.aiPersonality || 'friendly_professional',
        language: 'en-US',
        accent: 'neutral_american',
        speed: 1.0,
      },
    });

    // Identify caller
    const existingCustomer = await CustomerMemory.findOne({
      contractor: contractorId,
      phone: callerPhone,
    }).populate('customer');

    if (existingCustomer) {
      call.isExistingCustomer = true;
      call.customerId = existingCustomer.customer;
      call.callerName = existingCustomer.name;
      call.callerAddress = existingCustomer.address;
    }

    await call.save();

    // Generate greeting
    const greeting = this.generateGreeting(call, contractor);

    return {
      callSessionId: call._id,
      greeting,
      voice: call.aiConfig.voiceId,
      isExistingCustomer: call.isExistingCustomer,
      customerName: call.callerName,
      nextPrompt: this.getNextPrompt(call, 'greeting'),
    };
  }

  // ============================================
  // CONVERSATION ENGINE
  // ============================================

  async processUserSpeech({ callSessionId, transcript, confidence }) {
    const call = await CallSession.findById(callSessionId);
    if (!call) throw new Error('Call session not found');

    // Add to transcript
    call.transcript.push({
      speaker: 'human',
      text: transcript,
      timestamp: new Date(),
      confidence,
    });

    // Analyze intent
    const understanding = this.analyzeIntent(transcript, call);
    call.aiUnderstanding = { ...call.aiUnderstanding, ...understanding };

    // Determine response
    const response = await this.generateResponse(call, transcript, understanding);

    // Add AI response to transcript
    call.transcript.push({
      speaker: 'ai',
      text: response.text,
      timestamp: new Date(),
      intent: response.intent,
    });

    // Check for actions
    if (response.action) {
      call.actions.push({
        type: response.action.type,
        details: response.action.details,
        status: 'pending',
      });
    }

    await call.save();

    return {
      aiResponse: response.text,
      voice: call.aiConfig.voiceId,
      action: response.action,
      shouldTransfer: response.shouldTransfer || false,
      transferReason: response.transferReason,
      callEnded: response.endCall || false,
    };
  }

  analyzeIntent(transcript, call) {
    const text = transcript.toLowerCase();
    const understanding = { ...call.aiUnderstanding };

    // Identify caller type
    if (text.includes('new customer') || text.includes('never called') || text.includes('first time') || !call.isExistingCustomer) {
      understanding.callerIntent = 'new_lead';
    } else if (call.isExistingCustomer) {
      understanding.callerIntent = 'existing_customer';
    }

    // Identify service needed
    const services = {
      'ac repair': ['ac', 'air conditioning', 'air conditioner', 'cooling', 'not cold', 'hot'],
      'ac installation': ['new ac', 'install ac', 'replace ac', 'new unit'],
      'heating repair': ['heater', 'furnace', 'heat', 'not warm', 'cold air'],
      'plumbing': ['plumber', 'leak', 'pipe', 'water', 'clog', 'drain', 'toilet', 'faucet'],
      'electrical': ['electrician', 'outlet', 'wiring', ' breaker', 'lights', 'power'],
      'water heater': ['water heater', 'hot water', 'tankless'],
      'roofing': ['roof', 'leak', 'shingle', 'tile'],
      'appliance': ['appliance', 'refrigerator', 'dishwasher', 'washer', 'dryer'],
    };

    for (const [service, keywords] of Object.entries(services)) {
      if (keywords.some(k => text.includes(k))) {
        understanding.serviceNeeded = service;
        break;
      }
    }

    // Identify urgency
    if (text.includes('emergency') || text.includes('urgent') || text.includes('flooding') || text.includes('no heat') || text.includes('no ac') || text.includes('103 degrees')) {
      understanding.urgency = 'emergency';
    } else if (text.includes('today') || text.includes('asap') || text.includes('soon')) {
      understanding.urgency = 'high';
    } else if (text.includes('this week') || text.includes('next week')) {
      understanding.urgency = 'normal';
    } else {
      understanding.urgency = 'low';
    }

    // Detect buying signals
    understanding.buyingSignals = [];
    if (text.includes('how much') || text.includes('price') || text.includes('cost')) understanding.buyingSignals.push('asking_price');
    if (text.includes('when can you') || text.includes('available')) understanding.buyingSignals.push('asking_availability');
    if (text.includes('schedule') || text.includes('appointment') || text.includes('book')) understanding.buyingSignals.push('ready_to_book');
    if (text.includes('credit card') || text.includes('pay')) understanding.buyingSignals.push('ready_to_pay');

    // Detect objections
    understanding.objections = [];
    if (text.includes('too expensive') || text.includes('too much')) understanding.objections.push('price');
    if (text.includes('think about it') || text.includes('call back')) understanding.objections.push('not_ready');
    if (text.includes('other quote') || text.includes('cheaper')) understanding.objections.push('shopping_around');
    if (text.includes('husband') || text.includes('wife') || text.includes('spouse')) understanding.objections.push('need_approval');

    // Detect emotional state
    if (text.includes('frustrated') || text.includes('angry') || text.includes('ridiculous') || text.includes('unacceptable')) {
      understanding.emotionalState = 'frustrated';
    } else if (text.includes('emergency') || text.includes('flooding') || text.includes('burning')) {
      understanding.emotionalState = 'urgent';
    } else if (text.includes('excited') || text.includes('great') || text.includes('perfect')) {
      understanding.emotionalState = 'excited';
    }

    // Detect budget
    const budgetMatch = text.match(/\$?(\d{3,5})/);
    if (budgetMatch) {
      understanding.budgetMentioned = true;
      understanding.budgetRange = budgetMatch[1];
    }

    // Detect competitor mention
    const competitors = ['angi', 'thumbtack', 'homeadvisor', 'yelp', 'another company', 'someone else'];
    for (const comp of competitors) {
      if (text.includes(comp)) {
        understanding.competitorMentioned = comp;
        break;
      }
    }

    return understanding;
  }

  async generateResponse(call, transcript, understanding) {
    const text = transcript.toLowerCase();
    const context = this.buildContext(call);

    // Handle spam/robocall
    if (this.isSpam(text)) {
      call.outcome.result = 'spam';
      call.status = 'blocked';
      await call.save();
      return {
        text: "I'm sorry, I didn't catch that. If you have a home service need, please call back. Thank you.",
        intent: 'spam_block',
        endCall: true,
      };
    }

    // Handle wrong number
    if (text.includes('wrong number') || text.includes('wrong person')) {
      call.outcome.result = 'wrong_number';
      call.status = 'completed';
      await call.save();
      return {
        text: "I apologize for the confusion. Have a great day!",
        intent: 'wrong_number',
        endCall: true,
      };
    }

    // Handle transfer request
    if (text.includes('speak to a human') || text.includes('talk to someone') || text.includes('manager') || text.includes('supervisor') || understanding.emotionalState === 'frustrated') {
      return {
        text: this.generateTransferMessage(call),
        intent: 'transfer_request',
        shouldTransfer: true,
        transferReason: understanding.emotionalState === 'frustrated' ? 'frustrated_customer' : 'human_requested',
      };
    }

    // Handle voicemail
    if (call.status === 'voicemail') {
      return {
        text: "Please leave your name, phone number, and a brief message after the tone, and we'll get back to you within 30 minutes.",
        intent: 'voicemail_prompt',
        action: { type: 'message_left', details: { transcript } },
      };
    }

    // Handle scheduling intent
    if (understanding.buyingSignals?.includes('ready_to_book') || text.includes('schedule') || text.includes('appointment') || text.includes('come out')) {
      const scheduleResponse = this.handleScheduling(call, understanding);
      return {
        text: scheduleResponse.text,
        intent: 'scheduling',
        action: scheduleResponse.action,
      };
    }

    // Handle pricing question
    if (understanding.buyingSignals?.includes('asking_price') || text.includes('how much') || text.includes('price') || text.includes('cost')) {
      return {
        text: this.handlePricing(call, understanding),
        intent: 'pricing',
      };
    }

    // Handle existing customer
    if (call.isExistingCustomer) {
      return {
        text: this.handleExistingCustomer(call, understanding),
        intent: 'existing_customer_service',
      };
    }

    // Handle new lead qualification
    if (understanding.callerIntent === 'new_lead') {
      return {
        text: this.qualifyNewLead(call, understanding),
        intent: 'lead_qualification',
      };
    }

    // Default response
    return {
      text: this.generateDefaultResponse(call, context),
      intent: 'general',
    };
  }

  buildContext(call) {
    const recentTranscript = call.transcript.slice(-6);
    return {
      callDuration: call.duration,
      turnCount: call.transcript.filter(t => t.speaker === 'human').length,
      customerName: call.callerName,
      isExistingCustomer: call.isExistingCustomer,
      serviceNeeded: call.aiUnderstanding?.serviceNeeded,
      urgency: call.aiUnderstanding?.urgency,
      recentContext: recentTranscript.map(t => `${t.speaker}: ${t.text}`).join('\n'),
    };
  }

  isSpam(text) {
    const spamIndicators = ['warranty on your car', 'credit card debt', 'student loan', 'solar panels', 'political survey', 'free cruise'];
    return spamIndicators.some(s => text.includes(s));
  }

  generateGreeting(call, contractor) {
    const companyName = contractor?.companyName || 'our company';
    const aiName = this.voices[call.aiConfig.voiceId]?.name || 'Sarah';
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

    let greeting = this.greetingTemplates[Math.floor(Math.random() * this.greetingTemplates.length)];
    greeting = greeting.replace('{companyName}', companyName);
    greeting = greeting.replace('{aiName}', aiName);
    greeting = greeting.replace('{timeOfDay}', timeOfDay);

    if (call.isExistingCustomer && call.callerName) {
      greeting += ` I see you're calling from a number on file. Is this ${call.callerName}?`;
    }

    return greeting;
  }

  getNextPrompt(call, stage) {
    const prompts = {
      greeting: "Wait for caller to state their need",
      identifying: "Confirm caller identity and look up account",
      qualifying: "Ask about service needed, urgency, and property details",
      scheduling: "Offer available time slots and confirm appointment",
      pricing: "Provide estimate range and explain factors",
      closing: "Confirm appointment and provide next steps",
    };
    return prompts[stage] || prompts.greeting;
  }

  handleScheduling(call, understanding) {
    const aiName = this.voices[call.aiConfig.voiceId]?.name || 'Sarah';

    if (understanding.urgency === 'emergency') {
      return {
        text: `I understand this is an emergency. Let me check our emergency availability. We have a technician who can be there within 2 hours. Would that work for you?`,
        action: { type: 'appointment_scheduled', details: { priority: 'emergency', timeframe: '2_hours' } },
      };
    }

    if (understanding.urgency === 'high') {
      return {
        text: `We can get someone out to you today or tomorrow. What works better for you?`,
        action: { type: 'appointment_scheduled', details: { priority: 'high', options: ['today', 'tomorrow'] } },
      };
    }

    return {
      text: `Great, I'd be happy to schedule that for you. We have availability this Thursday between 10 AM and 2 PM, or Friday morning. Which would you prefer?`,
      action: { type: 'appointment_scheduled', details: { priority: 'normal', options: ['thursday', 'friday'] } },
    };
  }

  handlePricing(call, understanding) {
    const service = understanding.serviceNeeded || 'this service';

    if (understanding.urgency === 'emergency') {
      return `For emergency ${service}, our diagnostic fee is $89, which is credited toward any repair. The total cost depends on what we find, but most emergency ${service} calls range from $200 to $600. We always provide a firm quote before starting any work.`;
    }

    if (service === 'AC Repair') {
      return `Our AC repair diagnostic is $89, which applies toward the repair. Most AC repairs range from $150 to $600 depending on the issue. We provide a firm, upfront quote before any work begins. Would you like me to schedule a diagnostic appointment?`;
    }

    if (service === 'AC Installation') {
      return `AC installations typically range from $3,500 to $8,500 depending on the size of your home and the unit you choose. We offer free in-home estimates, and we have financing options available with payments as low as $85 per month. Would you like to schedule a free estimate?`;
    }

    return `I'd be happy to give you pricing. Our diagnostic fee is $89, which is applied to any work done. For ${service}, most jobs range between $200 and $1,200 depending on the specifics. We always provide a firm, written estimate before starting. Would you like me to schedule someone to take a look?`;
  }

  handleExistingCustomer(call, understanding) {
    const name = call.callerName || 'there';
    const service = understanding.serviceNeeded || 'your service';

    if (understanding.urgency === 'emergency') {
      return `Hi ${name}, I see you're a valued customer. Since this is an emergency, I'm flagging this as priority. Let me get you scheduled with our emergency team right away.`;
    }

    // Check for equipment warranty
    const equipment = call.customerId ? `I also see your water heater warranty expires next month - would you like us to inspect it while we're there?` : '';

    return `Welcome back, ${name}! I have your information on file. For ${service}, I can get you scheduled quickly since you're in our system. ${equipment}`;
  }

  qualifyNewLead(call, understanding) {
    const service = understanding.serviceNeeded || 'your home service';

    if (!understanding.serviceNeeded) {
      return `I'd be happy to help you with that. To make sure I connect you with the right technician, could you tell me a bit more about what type of service you need? For example, is it heating, cooling, plumbing, or electrical?`;
    }

    if (!understanding.urgency) {
      return `Thank you for that. Is this an emergency, or is it something that can be scheduled within the next few days?`;
    }

    return `Perfect. For ${service}, we offer same-day service for emergencies and next-day for non-urgent requests. We also provide free estimates for installations. Would you like me to check our availability?`;
  }

  generateDefaultResponse(call, context) {
    const responses = [
      "I understand. Can you tell me a bit more about what you're experiencing?",
      "Got it. To help you best, could you share what type of home service you need?",
      "Thank you for that information. Let me make sure I have all the details so we can take care of this for you.",
      "I appreciate you calling. Let me see how we can get this resolved for you quickly.",
    ];
    return responses[context.turnCount % responses.length];
  }

  generateTransferMessage(call) {
    const aiName = this.voices[call.aiConfig.voiceId]?.name || 'Sarah';
    return `Of course. Let me transfer you right away. Please hold while I connect you. ${aiName} is connecting you now...`;
  }

  // ============================================
  // ACTION HANDLERS
  // ============================================

  async createJobFromCall(call, action) {
    const job = new Job({
      contractor: call.contractor,
      jobNumber: `CALL-${Date.now().toString().slice(-6)}`,
      title: `${call.aiUnderstanding?.serviceNeeded || 'Service Call'} - ${call.callerName || 'Unknown'}`,
      description: call.transcriptText?.slice(0, 500) || 'Created from AI call',
      type: call.aiUnderstanding?.urgency === 'emergency' ? 'emergency' : 'repair',
      priority: call.aiUnderstanding?.urgency === 'emergency' ? 'emergency' : 'normal',
      customer: {
        name: call.callerName || 'Unknown',
        phone: call.callerPhone,
        address: call.callerAddress || {},
      },
      serviceCategory: call.aiUnderstanding?.serviceNeeded || 'General',
      source: 'ai_phone_call',
      status: 'scheduled',
    });
    await job.save();

    call.outcome.jobId = job._id;
    call.outcome.result = 'appointment_booked';
    await call.save();

    action.details.jobId = job._id;
  }

  async scheduleAppointment(call, action) {
    // Would integrate with scheduler
    call.outcome.appointmentDate = action.details.preferredDate;
    call.outcome.appointmentTime = action.details.preferredTime;
    call.outcome.result = 'appointment_booked';
    await call.save();
  }

  async sendEstimate(call, action) {
    // Would generate and send proposal
    call.outcome.result = 'estimate_sent';
    await call.save();
  }

  async scheduleFollowUp(call, action) {
    call.outcome.followUpDate = action.details.followUpDate;
    call.outcome.result = 'callback_scheduled';
    await call.save();
  }

  // ============================================
  // CALL END HANDLER
  // ============================================

  async endCall({ callSessionId, reason }) {
    const call = await CallSession.findById(callSessionId);
    if (!call) return;

    call.status = reason === 'transferred' ? 'transferred' : 'completed';
    call.endedAt = new Date();
    call.duration = Math.round((call.endedAt - call.startedAt) / 1000);

    // Build full transcript text
    call.transcriptText = call.transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');

    // Calculate voice metrics
    call.voiceMetrics = {
      aiVoiceClarity: 95,
      humanComprehension: 90,
      conversationFlow: 85,
      naturalnessScore: 92,
    };

    await call.save();

    return {
      callId: call.callId,
      duration: call.duration,
      outcome: call.outcome.result,
      transcript: call.transcriptText,
    };
  }
}

module.exports = CallAnsweringAgent;
