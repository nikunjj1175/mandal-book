const applyCors = require('../../../../lib/cors');
const crypto = require('crypto');
const connectDB = require('../../../../lib/mongodb');
const SplitTrip = require('../../../../models/SplitTrip');
const SplitExpense = require('../../../../models/SplitExpense');
const User = require('../../../../models/User');
const { authenticate, requireApprovedMember } = require('../../../../middleware/auth');
const { handleApiError } = require('../../../../lib/utils');

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

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const trip = await SplitTrip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    const isOwner = String(trip.createdBy) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only creator or admin can edit members' });
    }

    const { action } = req.body;

    if (action === 'add') {
      const { displayName, linkedUserId } = req.body;
      if (!displayName || typeof displayName !== 'string' || !displayName.trim()) {
        return res.status(400).json({ success: false, error: 'Name is required' });
      }
      if (linkedUserId) {
        const u = await User.findById(linkedUserId).select('_id');
        if (!u) {
          return res.status(400).json({ success: false, error: 'Linked user not found' });
        }
        const dup = trip.members.find((m) => m.linkedUserId && String(m.linkedUserId) === String(linkedUserId));
        if (dup) {
          return res.status(400).json({ success: false, error: 'This user is already on the trip' });
        }
      }

      const key = crypto.randomUUID();
      trip.members.push({
        key,
        displayName: displayName.trim().slice(0, 120),
        linkedUserId: linkedUserId || null,
      });
      await trip.save();
      return res.status(201).json({
        success: true,
        data: { member: trip.members[trip.members.length - 1] },
      });
    }

    if (action === 'remove') {
      const { memberKey } = req.body;
      if (!memberKey) {
        return res.status(400).json({ success: false, error: 'memberKey required' });
      }

      const used = await SplitExpense.exists({
        tripId,
        $or: [{ paidByMemberKey: memberKey }, { 'splits.memberKey': memberKey }],
      });
      if (used) {
        return res.status(400).json({
          success: false,
          error: 'This person appears in an expense. Remove or edit expenses first.',
        });
      }

      trip.members = trip.members.filter((m) => m.key !== memberKey);
      await trip.save();
      return res.status(200).json({ success: true, message: 'Member removed' });
    }

    return res.status(400).json({ success: false, error: 'Invalid action' });
  } catch (error) {
    return handleApiError(res, error, 'Trip members update failed');
  }
}
