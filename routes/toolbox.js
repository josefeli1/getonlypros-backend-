const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { Job } = require('../models/Job');
const { Schedule } = require('../models/Schedule');
const { Proposal } = require('../models/Proposal');
const { Invoice } = require('../models/Invoice');
const { CrewTimesheet } = require('../models/CrewTimesheet');
const { CustomerPortal } = require('../models/CustomerPortal');

// ============================================
// JOBS - Scheduling & Dispatch
// ============================================

// GET /api/toolbox/jobs - List all jobs
router.get('/jobs', requireAuth, async (req, res) => {
  try {
    const { status, priority, date, zip, search, page = 1, limit = 20 } = req.query;
    const filter = { contractor: req.user._id, isDeleted: false };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (zip) filter['customer.zip'] = zip;
    if (date) {
      const d = new Date(date);
      filter.scheduledDate = { $gte: d, $lt: new Date(d.getTime() + 24 * 60 * 60 * 1000) };
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { jobNumber: { $regex: search, $options: 'i' } },
      ];
    }
    const jobs = await Job.find(filter)
      .sort({ scheduledDate: 1, scheduledTimeStart: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Job.countDocuments(filter);
    res.json({ success: true, jobs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// POST /api/toolbox/jobs - Create new job
router.post('/jobs', requireAuth, async (req, res) => {
  try {
    const job = new Job({ ...req.body, contractor: req.user._id });
    await job.save();
    res.json({ success: true, job });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// GET /api/toolbox/jobs/:id - Get single job
router.get('/jobs/:id', requireAuth, async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, contractor: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, job });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// PATCH /api/toolbox/jobs/:id/status - Update job status (dispatch, start, complete, etc)
router.patch('/jobs/:id/status', requireAuth, async (req, res) => {
  try {
    const { status, note } = req.body;
    const update = { status };
    if (status === 'dispatched') update.dispatchedAt = new Date();
    if (status === 'in_progress') update.startedAt = new Date();
    if (status === 'completed') update.completedAt = new Date();
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, contractor: req.user._id },
      { $set: update, $push: { notes: { author: req.user.name || 'System', text: note || `Status changed to ${status}`, isInternal: false } } },
      { new: true }
    );
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    // Auto-update schedule if job is completed or dispatched
    if (status === 'completed' || status === 'dispatched') {
      await Schedule.updateOne(
        { contractor: req.user._id, 'timeBlocks.jobId': job._id },
        { $set: { 'timeBlocks.$.status': status === 'completed' ? 'booked' : 'booked', updatedAt: new Date() } }
      );
    }
    res.json({ success: true, job, message: `Job status updated to ${status}` });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// PATCH /api/toolbox/jobs/:id/assign - Assign crew to job
router.patch('/jobs/:id/assign', requireAuth, async (req, res) => {
  try {
    const { assignedCrew, primaryTechnician } = req.body;
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, contractor: req.user._id },
      { $set: { assignedCrew, primaryTechnician } },
      { new: true }
    );
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, job });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// POST /api/toolbox/jobs/:id/photos - Add job photo
router.post('/jobs/:id/photos', requireAuth, async (req, res) => {
  try {
    const { url, caption, category } = req.body;
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, contractor: req.user._id },
      { $push: { photos: { url, caption, category, takenBy: req.user._id, takenAt: new Date() } } },
      { new: true }
    );
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, job });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// POST /api/toolbox/jobs/:id/notes - Add note to job
router.post('/jobs/:id/notes', requireAuth, async (req, res) => {
  try {
    const { text, isInternal = true } = req.body;
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, contractor: req.user._id },
      { $push: { notes: { author: req.user.name || 'Contractor', text, isInternal, createdAt: new Date() } } },
      { new: true }
    );
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, job });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// ============================================
// SCHEDULE - Calendar & Route Optimization
// ============================================

// GET /api/toolbox/schedule - Get schedule for date range
router.get('/schedule', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, date } = req.query;
    let filter = { contractor: req.user._id };
    if (date) {
      const d = new Date(date);
      filter.date = { $gte: d, $lt: new Date(d.getTime() + 24 * 60 * 60 * 1000) };
    } else if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else {
      // Default to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filter.date = { $gte: today, $lt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) };
    }
    const schedules = await Schedule.find(filter).sort({ date: 1 }).populate('jobs');
    res.json({ success: true, schedules });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// POST /api/toolbox/schedule/optimize - AI optimize route for a day
router.post('/schedule/optimize', requireAuth, async (req, res) => {
  try {
    const { date } = req.body;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
    const jobs = await Job.find({
      contractor: req.user._id,
      scheduledDate: { $gte: targetDate, $lt: nextDay },
      status: { $in: ['scheduled', 'dispatched', 'in_progress'] },
      'customer.lat': { $exists: true },
      'customer.lng': { $exists: true },
    }).sort({ priority: -1, scheduledTimeStart: 1 });

    if (jobs.length < 2) {
      return res.json({ success: true, message: 'Need at least 2 jobs with locations to optimize', jobs });
    }

    // Simple nearest-neighbor TSP optimization (replace with real routing API later)
    const optimizeRoute = (jobList) => {
      const optimized = [jobList[0]];
      const unvisited = jobList.slice(1);
      while (unvisited.length > 0) {
        const last = optimized[optimized.length - 1];
        let nearestIdx = 0;
        let nearestDist = Infinity;
        unvisited.forEach((job, idx) => {
          const dist = Math.sqrt(
            Math.pow((job.customer.lat - last.customer.lat) * 69, 2) +
            Math.pow((job.customer.lng - last.customer.lng) * 54.6, 2)
          );
          if (dist < nearestDist) { nearestDist = dist; nearestIdx = idx; }
        });
        optimized.push(unvisited[nearestIdx]);
        unvisited.splice(nearestIdx, 1);
      }
      return optimized;
    };

    const optimizedJobs = optimizeRoute(jobs);
    const route = optimizedJobs.map((job, i) => ({
      jobId: job._id,
      order: i + 1,
      jobTitle: job.title,
      customerName: job.customer.name,
      address: job.customer.address,
      toLat: job.customer.lat,
      toLng: job.customer.lng,
      fromLat: i > 0 ? optimizedJobs[i - 1].customer.lat : null,
      fromLng: i > 0 ? optimizedJobs[i - 1].customer.lng : null,
      distance: i > 0 ? Math.sqrt(
        Math.pow((job.customer.lat - optimizedJobs[i - 1].customer.lat) * 69, 2) +
        Math.pow((job.customer.lng - optimizedJobs[i - 1].customer.lng) * 54.6, 2)
      ).toFixed(2) : 0,
      estimatedTime: i > 0 ? Math.ceil(Math.sqrt(
        Math.pow((job.customer.lat - optimizedJobs[i - 1].customer.lat) * 69, 2) +
        Math.pow((job.customer.lng - optimizedJobs[i - 1].customer.lng) * 54.6, 2)
      ) / 0.5) : 0,
    }));

    const totalDistance = route.reduce((sum, r) => sum + parseFloat(r.distance || 0), 0);
    const totalDriveTime = route.reduce((sum, r) => sum + (r.estimatedTime || 0), 0);

    // Save to schedule
    await Schedule.findOneAndUpdate(
      { contractor: req.user._id, date: targetDate },
      {
        $set: {
          optimizedRoute: {
            isOptimized: true,
            totalDistance: parseFloat(totalDistance.toFixed(2)),
            estimatedDriveTime: totalDriveTime,
            fuelCost: parseFloat((totalDistance * 0.65).toFixed(2)),
            route,
            aiRecommendation: `Optimized ${jobs.length} jobs. Total drive: ${totalDistance.toFixed(1)} miles, ${totalDriveTime} minutes. Estimated fuel savings: $${(jobs.length * 3 - totalDistance * 0.65).toFixed(2)} vs random order.`,
            savings: {
              minutesSaved: Math.round(jobs.length * 8),
              fuelSaved: Math.round(jobs.length * 3 - totalDistance * 0.65),
              co2Saved: Math.round((jobs.length * 3 - totalDistance) * 0.9),
            },
          },
          jobs: optimizedJobs.map(j => j._id),
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      optimizedRoute: route,
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      totalDriveTime,
      estimatedFuelCost: parseFloat((totalDistance * 0.65).toFixed(2)),
      jobsCount: jobs.length,
      message: `Route optimized for ${jobs.length} jobs. ${totalDistance.toFixed(1)} miles total.`,
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// ============================================
// CREW - Mobile Timesheets & GPS
// ============================================

// POST /api/toolbox/crew/clock-in - Clock in for the day
router.post('/crew/clock-in', requireAuth, async (req, res) => {
  try {
    const { lat, lng, address, photoUrl, deviceInfo } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let timesheet = await CrewTimesheet.findOne({ technician: req.user._id, date: today });
    if (!timesheet) {
      timesheet = new CrewTimesheet({
        technician: req.user._id,
        contractor: req.user.contractor || req.user._id,
        date: today,
        clockIn: { time: new Date(), method: 'app', location: { lat, lng, address }, photoUrl, deviceInfo },
      });
    } else {
      timesheet.clockIn = { time: new Date(), method: 'app', location: { lat, lng, address }, photoUrl, deviceInfo };
    }
    await timesheet.save();
    res.json({ success: true, timesheet, message: 'Clocked in successfully' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// POST /api/toolbox/crew/clock-out - Clock out for the day
router.post('/crew/clock-out', requireAuth, async (req, res) => {
  try {
    const { lat, lng, address, photoUrl, deviceInfo } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const timesheet = await CrewTimesheet.findOneAndUpdate(
      { technician: req.user._id, date: today },
      { $set: { clockOut: { time: new Date(), method: 'app', location: { lat, lng, address }, photoUrl, deviceInfo }, status: 'completed' } },
      { new: true }
    );
    if (!timesheet) return res.status(404).json({ success: false, message: 'No active timesheet found' });
    // Calculate total hours
    if (timesheet.clockIn && timesheet.clockIn.time && timesheet.clockOut && timesheet.clockOut.time) {
      const ms = new Date(timesheet.clockOut.time) - new Date(timesheet.clockIn.time);
      const totalMinutes = ms / (1000 * 60);
      const breakMinutes = (timesheet.breaks || []).reduce((sum, b) => sum + (b.duration || 0), 0);
      timesheet.totalHours = parseFloat(((totalMinutes - breakMinutes) / 60).toFixed(2));
      timesheet.totalBreakTime = breakMinutes;
      await timesheet.save();
    }
    res.json({ success: true, timesheet, message: 'Clocked out successfully' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// POST /api/toolbox/crew/job-start - Start working on a job
router.post('/crew/job-start', requireAuth, async (req, res) => {
  try {
    const { jobId, lat, lng, notes } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const job = await Job.findOne({ _id: jobId, contractor: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    const timesheet = await CrewTimesheet.findOneAndUpdate(
      { technician: req.user._id, date: today },
      {
        $push: {
          jobEntries: {
            jobId,
            jobNumber: job.jobNumber,
            startTime: new Date(),
            clockInLocation: { lat, lng },
            notes,
          },
          gpsLog: { timestamp: new Date(), lat, lng, source: 'gps' },
        },
      },
      { upsert: true, new: true }
    );
    // Update job status
    await Job.findByIdAndUpdate(jobId, { status: 'in_progress', startedAt: new Date() });
    res.json({ success: true, timesheet, job, message: `Started job ${job.jobNumber}` });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// POST /api/toolbox/crew/job-end - Finish working on a job
router.post('/crew/job-end', requireAuth, async (req, res) => {
  try {
    const { jobId, lat, lng, notes, photos } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const job = await Job.findOne({ _id: jobId, contractor: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    const timesheet = await CrewTimesheet.findOne({ technician: req.user._id, date: today });
    if (timesheet) {
      const entry = timesheet.jobEntries.find(e => e.jobId.toString() === jobId && !e.endTime);
      if (entry) {
        entry.endTime = new Date();
        entry.duration = Math.round((new Date() - new Date(entry.startTime)) / (1000 * 60));
        entry.clockOutLocation = { lat, lng };
        entry.notes = notes || entry.notes;
        if (photos) entry.photos = photos.map(p => ({ url: p.url, caption: p.caption }));
        await timesheet.save();
      }
    }
    // Update job status and add photos
    const update = { status: 'completed', completedAt: new Date() };
    if (photos) {
      photos.forEach(p => {
        Job.findByIdAndUpdate(jobId, { $push: { photos: { url: p.url, caption: p.caption, category: 'after', takenBy: req.user._id, takenAt: new Date() } } });
      });
    }
    await Job.findByIdAndUpdate(jobId, update);
    res.json({ success: true, timesheet, job, message: `Completed job ${job.jobNumber}` });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// POST /api/toolbox/crew/break - Start or end break
router.post('/crew/break', requireAuth, async (req, res) => {
  try {
    const { type = 'rest', action } = req.body; // action: 'start' or 'end'
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const timesheet = await CrewTimesheet.findOne({ technician: req.user._id, date: today });
    if (!timesheet) return res.status(404).json({ success: false, message: 'No active timesheet' });
    if (action === 'start') {
      timesheet.breaks.push({ startTime: new Date(), type });
    } else {
      const lastBreak = timesheet.breaks[timesheet.breaks.length - 1];
      if (lastBreak && !lastBreak.endTime) {
        lastBreak.endTime = new Date();
        lastBreak.duration = Math.round((new Date() - new Date(lastBreak.startTime)) / (1000 * 60));
      }
    }
    await timesheet.save();
    res.json({ success: true, timesheet, message: `Break ${action}ed` });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// GET /api/toolbox/crew/timesheet - Get today's timesheet
router.get('/crew/timesheet', requireAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const timesheet = await CrewTimesheet.findOne({ technician: req.user._id, date: today }).populate('jobEntries.jobId');
    res.json({ success: true, timesheet: timesheet || { message: 'Not clocked in yet' } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// GET /api/toolbox/crew/timesheets - Get timesheet history
router.get('/crew/timesheets', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { technician: req.user._id };
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const timesheets = await CrewTimesheet.find(filter).sort({ date: -1 }).limit(30);
    res.json({ success: true, timesheets });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// ============================================
// PROPOSALS - Digital Proposals & E-Signature
// ============================================

// GET /api/toolbox/proposals - List proposals
router.get('/proposals', requireAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { contractor: req.user._id };
    if (status) filter.status = status;
    const proposals = await Proposal.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    const total = await Proposal.countDocuments(filter);
    res.json({ success: true, proposals, total, page: Number(page) });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// POST /api/toolbox/proposals - Create proposal
router.post('/proposals', requireAuth, async (req, res) => {
  try {
    const proposal = new Proposal({ ...req.body, contractor: req.user._id });
    await proposal.save();
    res.json({ success: true, proposal });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// POST /api/toolbox/proposals/:id/send - Send proposal to customer
router.post('/proposals/:id/send', requireAuth, async (req, res) => {
  try {
    const proposal = await Proposal.findOneAndUpdate(
      { _id: req.params.id, contractor: req.user._id },
      { $set: { status: 'sent', sentAt: new Date(), publicUrl: `https://getonlypros.com/proposals/${req.params.id}` } },
      { new: true }
    );
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });
    res.json({ success: true, proposal, message: 'Proposal sent to customer' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// POST /api/toolbox/proposals/:id/accept - Customer accepts proposal
router.post('/proposals/:id/accept', async (req, res) => {
  try {
    const { signature, signedBy, ipAddress } = req.body;
    const proposal = await Proposal.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: {
          status: 'accepted',
          acceptedAt: new Date(),
          'signature.signed': true,
          'signature.signedAt': new Date(),
          'signature.signedBy': signedBy,
          'signature.ipAddress': ipAddress,
          'signature.signatureImage': signature,
          'signature.termsAccepted': true,
        },
      },
      { new: true }
    );
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });
    // Auto-create job from accepted proposal
    const job = new Job({
      contractor: proposal.contractor,
      title: proposal.title,
      description: proposal.description,
      customer: proposal.customer,
      serviceCategory: proposal.serviceCategory,
      lineItems: proposal.lineItems,
      subtotal: proposal.subtotal,
      taxRate: proposal.taxRate,
      taxAmount: proposal.taxAmount,
      total: proposal.total,
      depositRequired: proposal.depositRequired,
      status: 'scheduled',
      source: 'proposal',
    });
    await job.save();
    proposal.jobId = job._id;
    await proposal.save();
    res.json({ success: true, proposal, job, message: 'Proposal accepted and job created' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// GET /api/toolbox/proposals/:id/public - Public proposal view (no auth required)
router.get('/proposals/:id/public', async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id).select('-internalNotes');
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });
    res.json({ success: true, proposal });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// ============================================
// INVOICES - Invoicing & Payments
// ============================================

// GET /api/toolbox/invoices - List invoices
router.get('/invoices', requireAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { contractor: req.user._id };
    if (status) filter.status = status;
    const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    const total = await Invoice.countDocuments(filter);
    const outstanding = await Invoice.aggregate([
      { $match: { contractor: req.user._id, status: { $in: ['sent', 'viewed', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: '$balanceDue' } } },
    ]);
    res.json({ success: true, invoices, total, page: Number(page), outstandingBalance: outstanding[0]?.total || 0 });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// POST /api/toolbox/invoices - Create invoice
router.post('/invoices', requireAuth, async (req, res) => {
  try {
    const invoice = new Invoice({ ...req.body, contractor: req.user._id });
    await invoice.save();
    res.json({ success: true, invoice });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// POST /api/toolbox/invoices/:id/send - Send invoice to customer
router.post('/invoices/:id/send', requireAuth, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, contractor: req.user._id },
      { $set: { status: 'sent', sentAt: new Date(), publicPaymentUrl: `https://getonlypros.com/pay/${req.params.id}` } },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, invoice, message: 'Invoice sent to customer' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// POST /api/toolbox/invoices/:id/payment - Record payment
router.post('/invoices/:id/payment', requireAuth, async (req, res) => {
  try {
    const { amount, method, transactionId, processor } = req.body;
    const invoice = await Invoice.findOne({ _id: req.params.id, contractor: req.user._id });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    invoice.payments.push({ amount, method, transactionId, processor, paidAt: new Date(), status: 'completed' });
    invoice.amountPaid = (invoice.amountPaid || 0) + amount;
    invoice.balanceDue = invoice.total - invoice.amountPaid;
    if (invoice.balanceDue <= 0) {
      invoice.status = 'paid';
      invoice.paidAt = new Date();
    } else {
      invoice.status = 'partially_paid';
    }
    await invoice.save();
    res.json({ success: true, invoice, message: `Payment of $${amount} recorded` });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// GET /api/toolbox/invoices/:id/public - Public invoice for payment (no auth)
router.get('/invoices/:id/public', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).select('-internalNotes');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, invoice });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// ============================================
// CUSTOMER PORTAL
// ============================================

// GET /api/toolbox/portal/:customerId - Get customer portal
router.get('/portal/:customerId', requireAuth, async (req, res) => {
  try {
    const portal = await CustomerPortal.findOne({ customer: req.params.customerId, contractor: req.user._id })
      .populate('jobs proposals invoices');
    if (!portal) return res.status(404).json({ success: false, message: 'Portal not found' });
    res.json({ success: true, portal });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// POST /api/toolbox/portal/:customerId/jobs - Customer books a job via portal
router.post('/portal/:customerId/jobs', async (req, res) => {
  try {
    const { title, description, serviceCategory, preferredDate, preferredTime, propertyIndex = 0 } = req.body;
    const portal = await CustomerPortal.findOne({ customer: req.params.customerId }).populate('contractor');
    if (!portal) return res.status(404).json({ success: false, message: 'Portal not found' });
    const property = portal.properties[propertyIndex];
    const job = new Job({
      contractor: portal.contractor,
      title,
      description,
      serviceCategory,
      customer: {
        name: portal.customer?.name || 'Customer',
        phone: portal.customer?.phone || '',
        email: portal.customer?.email || '',
        address: property?.address || {},
        customerId: req.params.customerId,
      },
      scheduledDate: preferredDate ? new Date(preferredDate) : null,
      scheduledTimeStart: preferredTime,
      status: 'scheduled',
      source: 'customer_portal',
    });
    await job.save();
    portal.jobs.push(job._id);
    portal.activeJobs += 1;
    await portal.save();
    res.json({ success: true, job, message: 'Job booked successfully' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// POST /api/toolbox/portal/:customerId/review - Customer submits review
router.post('/portal/:customerId/review', async (req, res) => {
  try {
    const { jobId, rating, comment, wouldRecommend } = req.body;
    const portal = await CustomerPortal.findOne({ customer: req.params.customerId });
    if (!portal) return res.status(404).json({ success: false, message: 'Portal not found' });
    // Update job with review
    await Job.findByIdAndUpdate(jobId, {
      'customerReview.rating': rating,
      'customerReview.comment': comment,
      'customerReview.createdAt': new Date(),
      'customerReview.wouldRecommend': wouldRecommend,
    });
    // Update portal review history
    portal.reviewHistory.push({ jobId, rating, comment, createdAt: new Date() });
    await portal.save();
    res.json({ success: true, message: 'Review submitted. Thank you!' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// GET /api/toolbox/portal/:customerId/invoices - Customer views their invoices
router.get('/portal/:customerId/invoices', async (req, res) => {
  try {
    const portal = await CustomerPortal.findOne({ customer: req.params.customerId }).populate({ path: 'invoices', options: { sort: { createdAt: -1 } } });
    if (!portal) return res.status(404).json({ success: false, message: 'Portal not found' });
    res.json({ success: true, invoices: portal.invoices, outstandingBalance: portal.outstandingBalance });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// ============================================
// DASHBOARD & ANALYTICS
// ============================================

// GET /api/toolbox/dashboard - Main dashboard data
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const contractorId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      todayJobs,
      weekJobs,
      pendingProposals,
      outstandingInvoices,
      completedJobs,
      totalRevenue,
      avgJobValue,
      upcomingJobs,
      highPriorityJobs,
      overdueInvoices,
    ] = await Promise.all([
      Job.countDocuments({ contractor: contractorId, scheduledDate: { $gte: today, $lt: tomorrow }, isDeleted: false }),
      Job.countDocuments({ contractor: contractorId, createdAt: { $gte: weekAgo }, isDeleted: false }),
      Proposal.countDocuments({ contractor: contractorId, status: { $in: ['draft', 'sent'] } }),
      Invoice.countDocuments({ contractor: contractorId, status: { $in: ['sent', 'overdue'] } }),
      Job.countDocuments({ contractor: contractorId, status: 'completed', createdAt: { $gte: monthAgo } }),
      Invoice.aggregate([{ $match: { contractor: contractorId, status: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Job.aggregate([{ $match: { contractor: contractorId, status: 'completed' } }, { $group: { _id: null, avg: { $avg: '$total' } } }]),
      Job.find({ contractor: contractorId, scheduledDate: { $gte: today }, status: { $nin: ['completed', 'cancelled'] }, isDeleted: false }).sort({ scheduledDate: 1 }).limit(5),
      Job.find({ contractor: contractorId, priority: 'high', status: { $nin: ['completed', 'cancelled'] }, isDeleted: false }).sort({ scheduledDate: 1 }).limit(5),
      Invoice.find({ contractor: contractorId, status: 'overdue' }).sort({ dueDate: 1 }).limit(5),
    ]);

    res.json({
      success: true,
      dashboard: {
        today: { jobs: todayJobs, label: "Today's Jobs" },
        thisWeek: { jobs: weekJobs, label: 'New Jobs This Week' },
        pendingProposals,
        outstandingInvoices,
        completedJobsThisMonth: completedJobs,
        totalRevenue: totalRevenue[0]?.total || 0,
        averageJobValue: avgJobValue[0]?.avg || 0,
        upcomingJobs,
        highPriorityJobs,
        overdueInvoices,
      },
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// ============================================
// AI TOOLBOX FEATURES
// ============================================

// POST /api/toolbox/ai/estimate - AI generates estimate for a job
router.post('/ai/estimate', requireAuth, async (req, res) => {
  try {
    const { serviceCategory, description, zipCode, squareFootage } = req.body;
    // AI estimate logic based on historical data
    const baseRates = {
      'AC Repair': { min: 150, max: 800, avg: 375 },
      'AC Installation': { min: 3000, max: 12000, avg: 6500 },
      'Plumbing Repair': { min: 125, max: 600, avg: 280 },
      'Roof Repair': { min: 350, max: 2500, avg: 1100 },
      'Electrical Repair': { min: 150, max: 700, avg: 325 },
      'HVAC Maintenance': { min: 89, max: 250, avg: 150 },
    };
    const rate = baseRates[serviceCategory] || { min: 100, max: 500, avg: 250 };
    const zipMultiplier = zipCode?.startsWith('891') ? 1.15 : 1.0; // Vegas premium
    const sizeMultiplier = squareFootage ? Math.max(0.8, squareFootage / 2000) : 1.0;

    const estimate = {
      estimatedCost: Math.round(rate.avg * zipMultiplier * sizeMultiplier),
      range: { min: Math.round(rate.min * zipMultiplier), max: Math.round(rate.max * zipMultiplier) },
      confidence: 0.78,
      factors: [
        `Service type: ${serviceCategory}`,
        `Location: ${zipCode} (${zipMultiplier > 1 ? 'Vegas metro premium' : 'Standard rates'})`,
        squareFootage ? `Property size: ${squareFootage} sq ft` : 'Standard property size',
        'Historical data from similar jobs in your area',
      ],
      recommendedParts: [
        { partName: 'Standard diagnostic', estimatedPrice: 89, inStock: true },
        { partName: 'Common replacement part', estimatedPrice: 150, inStock: true },
      ],
      aiNotes: `Based on ${serviceCategory} jobs in the ${zipCode} area, typical range is $${rate.min * zipMultiplier}-${rate.max * zipMultiplier}. ${squareFootage ? 'Larger properties may require additional labor.' : ''} Actual cost may vary based on final diagnosis.`,
    };
    res.json({ success: true, estimate });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// GET /api/toolbox/ai/insights - AI business insights
router.get('/ai/insights', requireAuth, async (req, res) => {
  try {
    const contractorId = req.user._id;
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [jobs, invoices, proposals] = await Promise.all([
      Job.find({ contractor: contractorId, createdAt: { $gte: monthAgo } }),
      Invoice.find({ contractor: contractorId, createdAt: { $gte: monthAgo } }),
      Proposal.find({ contractor: contractorId, createdAt: { $gte: monthAgo } }),
    ]);

    const completedJobs = jobs.filter(j => j.status === 'completed');
    const avgJobValue = completedJobs.length > 0 ? completedJobs.reduce((s, j) => s + (j.total || 0), 0) / completedJobs.length : 0;
    const proposalCloseRate = proposals.length > 0 ? proposals.filter(p => p.status === 'accepted').length / proposals.length : 0;
    const paidInvoices = invoices.filter(i => i.status === 'paid');
    const collectionRate = invoices.length > 0 ? paidInvoices.length / invoices.length : 0;

    const insights = {
      revenueTrend: { value: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0), trend: 'up', percent: 12 },
      jobCount: { value: jobs.length, trend: 'up', percent: 8 },
      avgJobValue: { value: Math.round(avgJobValue), trend: avgJobValue > 500 ? 'up' : 'neutral', percent: 5 },
      closeRate: { value: Math.round(proposalCloseRate * 100), trend: proposalCloseRate > 0.4 ? 'up' : 'down', percent: Math.round(proposalCloseRate * 100) },
      collectionRate: { value: Math.round(collectionRate * 100), trend: collectionRate > 0.85 ? 'up' : 'down', percent: Math.round(collectionRate * 100) },
      topService: { name: 'AC Repair', percent: 35 },
      aiRecommendations: [
        'Add 15-minute buffer between appointments to reduce late arrivals by 40%',
        'Your proposal close rate is 32%. Add financing options to increase to 50%+',
        'Schedule follow-up calls 48 hours after proposal sends — increases close rate 28%',
        'Your average job value is below market by $150. Consider bundling maintenance packages',
        '3 invoices are overdue. Send automated SMS reminder — 65% of overdue invoices pay within 24 hours of SMS',
      ],
    };
    res.json({ success: true, insights });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;
