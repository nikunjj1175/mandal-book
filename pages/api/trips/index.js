const applyCors = require('../../../lib/cors');
const connectDB = require('../../../lib/mongodb');
const SplitTrip = require('../../../models/SplitTrip');
const SplitExpense = require('../../../models/SplitExpense');
const { authenticate, requireApprovedMember } = require('../../../middleware/auth');
const { handleApiError } = require('../../../lib/utils');

export default async function handler(req, res) {
  if (await applyCors(req, res)) return;

  try {
    await connectDB();

    if (req.method === 'GET') {
      await authenticate(req, res);
      if (req.user.role !== 'admin') {
        requireApprovedMember(req);
      }

      const trips = await SplitTrip.find({})
        .select('title notes startDate endDate createdAt members')
        .sort({ updatedAt: -1 })
        .lean();

      const withCounts = await Promise.all(
        trips.map(async (t) => {
          const expenseCount = await SplitExpense.countDocuments({ tripId: t._id });
          return {
            ...t,
            id: t._id,
            memberCount: (t.members || []).length,
            expenseCount,
          };
        })
      );

      return res.status(200).json({ success: true, data: { trips: withCounts } });
    }

    if (req.method === 'POST') {
      await authenticate(req, res);
      if (req.user.role !== 'admin') {
        requireApprovedMember(req);
      }

      const { title, notes, startDate, endDate } = req.body;
      if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ success: false, error: 'Trip title is required' });
      }

      const trip = await SplitTrip.create({
        title: title.trim(),
        notes: typeof notes === 'string' ? notes.trim() : '',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdBy: req.user._id,
        members: [],
      });

      return res.status(201).json({
        success: true,
        data: { trip: { ...trip.toObject(), id: trip._id, memberCount: 0, expenseCount: 0 } },
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    return handleApiError(res, error, 'Trips list/create failed');
  }
}
