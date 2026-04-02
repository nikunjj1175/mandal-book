const applyCors = require('../../../../../lib/cors');
const connectDB = require('../../../../../lib/mongodb');
const SplitExpense = require('../../../../../models/SplitExpense');
const { authenticate, requireApprovedMember } = require('../../../../../middleware/auth');
const { handleApiError } = require('../../../../../lib/utils');

async function gate(req, res) {
  await authenticate(req, res);
  if (req.user.role !== 'admin') {
    requireApprovedMember(req);
  }
}

export default async function handler(req, res) {
  if (await applyCors(req, res)) return;

  const { id: tripId, expenseId } = req.query;
  if (!tripId || !expenseId) {
    return res.status(400).json({ success: false, error: 'Missing id' });
  }

  try {
    await connectDB();
    await gate(req, res);

    if (req.method !== 'DELETE') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const doc = await SplitExpense.findOne({ _id: expenseId, tripId });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    const isCreator = String(doc.createdBy) === String(req.user._id);
    if (!isCreator && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'You can only delete expenses you created' });
    }

    await doc.deleteOne();
    return res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) {
    return handleApiError(res, error, 'Delete expense failed');
  }
}
