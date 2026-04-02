const applyCors = require('../../../lib/cors');
const connectDB = require('../../../lib/mongodb');
const SplitTrip = require('../../../models/SplitTrip');
const SplitExpense = require('../../../models/SplitExpense');
const { authenticate, requireApprovedMember } = require('../../../middleware/auth');
const { handleApiError } = require('../../../lib/utils');
const { computeBalancesTrip, simplifyDebts, round2 } = require('../../../lib/splitBalances');

async function gate(req, res) {
  await authenticate(req, res);
  if (req.user.role !== 'admin') {
    requireApprovedMember(req);
  }
}

function nameMapFromTrip(trip) {
  const m = {};
  (trip.members || []).forEach((mem) => {
    m[mem.key] = mem.displayName || 'Member';
  });
  return m;
}

export default async function handler(req, res) {
  if (await applyCors(req, res)) return;

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ success: false, error: 'Missing trip id' });
  }

  try {
    await connectDB();
    await gate(req, res);

    const trip = await SplitTrip.findById(id).populate('createdBy', 'name email').lean();
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    if (req.method === 'GET') {
      const detail = req.query.detail === '1' || req.query.detail === 'true';
      const expenses = detail
        ? await SplitExpense.find({ tripId: id })
            .populate('createdBy', 'name email')
            .sort({ incurredOn: -1, createdAt: -1 })
            .lean()
        : [];

      const nameByKey = nameMapFromTrip(trip);
      let balances = [];
      let settlements = [];

      if (detail) {
        if (expenses.length) {
          const net = computeBalancesTrip(expenses);
          const allKeys = new Set();
          (trip.members || []).forEach((m) => {
            if (m.key) allKeys.add(m.key);
          });
          Object.keys(net).forEach((k) => allKeys.add(k));
          balances = Array.from(allKeys).map((memberKey) => ({
            memberKey,
            name: nameByKey[memberKey] || memberKey,
            balance: round2(net[memberKey] ?? 0),
          }));
          balances.sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { sensitivity: 'base' }));
          const raw = simplifyDebts(net);
          settlements = raw
            .filter((s) => round2(s.amount) > 0.005)
            .map((s) => ({
              ...s,
              amount: round2(s.amount),
              fromName: nameByKey[s.from] || s.from,
              toName: nameByKey[s.to] || s.to,
            }));
        } else {
          balances = (trip.members || []).map((m) => ({
            memberKey: m.key,
            name: nameByKey[m.key] || m.displayName || 'Member',
            balance: 0,
          }));
          settlements = [];
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          trip: { ...trip, id: trip._id },
          expenses: detail ? expenses : undefined,
          balances: detail ? balances : undefined,
          settlements: detail ? settlements : undefined,
          nameByKey: detail ? nameByKey : undefined,
        },
      });
    }

    if (req.method === 'PATCH') {
      const isOwner = String(trip.createdBy?._id || trip.createdBy) === String(req.user._id);
      if (!isOwner && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Only creator or admin can edit' });
      }

      const { title, notes, startDate, endDate } = req.body;
      const $set = {};
      if (title !== undefined) $set.title = String(title).trim().slice(0, 200);
      if (notes !== undefined) $set.notes = String(notes || '').trim().slice(0, 2000);
      if (startDate !== undefined) $set.startDate = startDate ? new Date(startDate) : null;
      if (endDate !== undefined) $set.endDate = endDate ? new Date(endDate) : null;

      if (Object.keys($set).length === 0) {
        return res.status(400).json({ success: false, error: 'No fields to update' });
      }
      await SplitTrip.updateOne({ _id: id }, { $set });
      const updated = await SplitTrip.findById(id).lean();
      return res.status(200).json({ success: true, data: { trip: { ...updated, id: updated._id } } });
    }

    if (req.method === 'DELETE') {
      const isOwner = String(trip.createdBy?._id || trip.createdBy) === String(req.user._id);
      if (!isOwner && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Only creator or admin can delete' });
      }
      await SplitExpense.deleteMany({ tripId: id });
      await SplitTrip.deleteOne({ _id: id });
      return res.status(200).json({ success: true, message: 'Trip deleted' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    return handleApiError(res, error, 'Trip operation failed');
  }
}
