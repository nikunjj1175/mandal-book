const applyCors = require('../../../../../lib/cors');
const connectDB = require('../../../../../lib/mongodb');
const SplitTrip = require('../../../../../models/SplitTrip');
const SplitExpense = require('../../../../../models/SplitExpense');
const { authenticate, requireApprovedMember } = require('../../../../../middleware/auth');
const { handleApiError } = require('../../../../../lib/utils');
const { equalSharesFromTotalKeys, round2 } = require('../../../../../lib/splitBalances');

async function gate(req, res) {
  await authenticate(req, res);
  if (req.user.role !== 'admin') {
    requireApprovedMember(req);
  }
}

export default async function handler(req, res) {
  if (await applyCors(req, res)) return;

  const { id: tripId } = req.query;
  if (!tripId) {
    return res.status(400).json({ success: false, error: 'Missing trip id' });
  }

  try {
    await connectDB();
    await gate(req, res);

    const trip = await SplitTrip.findById(tripId).lean();
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    const validKeys = new Set((trip.members || []).map((m) => m.key));

    if (req.method === 'GET') {
      const expenses = await SplitExpense.find({ tripId })
        .populate('createdBy', 'name email')
        .sort({ incurredOn: -1, createdAt: -1 })
        .lean();
      return res.status(200).json({ success: true, data: { expenses } });
    }

    if (req.method === 'POST') {
      if ((trip.members || []).length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Add at least two people to this trip before logging expenses.',
        });
      }

      const { description, amount, paidByMemberKey, participantKeys, incurredOn, notes } = req.body;

      if (!description || typeof description !== 'string' || !description.trim()) {
        return res.status(400).json({ success: false, error: 'Description is required' });
      }
      const total = round2(Number(amount));
      if (!Number.isFinite(total) || total < 0.01) {
        return res.status(400).json({ success: false, error: 'Valid amount is required' });
      }
      if (!paidByMemberKey || !Array.isArray(participantKeys)) {
        return res.status(400).json({ success: false, error: 'paidByMemberKey and participantKeys[] are required' });
      }

      const keys = [...new Set(participantKeys.map(String))];
      if (!keys.includes(String(paidByMemberKey))) {
        keys.push(String(paidByMemberKey));
      }

      for (const k of keys) {
        if (!validKeys.has(k)) {
          return res.status(400).json({ success: false, error: `Unknown member key: ${k}` });
        }
      }
      if (keys.length < 2) {
        return res.status(400).json({ success: false, error: 'Select at least two people for the split' });
      }

      let splits;
      try {
        splits = equalSharesFromTotalKeys(total, keys);
      } catch (e) {
        return res.status(400).json({ success: false, error: e.message || 'Invalid split' });
      }

      const sumShares = round2(splits.reduce((s, p) => s + p.shareAmount, 0));
      if (Math.abs(sumShares - total) > 0.02) {
        return res.status(400).json({ success: false, error: 'Share total does not match amount' });
      }

      const doc = await SplitExpense.create({
        tripId,
        description: description.trim(),
        amount: total,
        paidByMemberKey: String(paidByMemberKey),
        splits,
        incurredOn: incurredOn ? new Date(incurredOn) : new Date(),
        notes: typeof notes === 'string' ? notes.trim().slice(0, 500) : '',
        createdBy: req.user._id,
      });

      const populated = await SplitExpense.findById(doc._id).populate('createdBy', 'name email').lean();

      return res.status(201).json({ success: true, data: { expense: populated } });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    return handleApiError(res, error, 'Trip expenses failed');
  }
}
