import applyCors from '@/lib/cors';
const connectDB = require('../../../../lib/mongodb');
const { authenticate, requireAdmin } = require('../../../../middleware/auth');
const { handleApiError } = require('../../../../lib/utils');
const mongoose = require('mongoose');

async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectDB();
    await authenticate(req, res);
    requireAdmin(req);

    const collection = mongoose.connection.db.collection('contributions');

    // 1) Clean existing docs where transactionId is explicitly null
    const unsetResult = await collection.updateMany(
      { 'ocrData.transactionId': null },
      { $unset: { 'ocrData.transactionId': '' } }
    );

    // 2) Drop legacy index (ignore if missing)
    const legacyIndexName = 'userId_1_ocrData.transactionId_1';
    try {
      await collection.dropIndex(legacyIndexName);
    } catch (e) {
      // ignore "index not found"
    }

    // 3) Recreate correct partial unique index (only for real txn strings)
    const createdName = await collection.createIndex(
      { userId: 1, 'ocrData.transactionId': 1 },
      {
        unique: true,
        partialFilterExpression: {
          'ocrData.transactionId': { $type: 'string', $exists: true, $ne: '' },
        },
      }
    );

    return res.status(200).json({
      success: true,
      data: {
        unsetMatched: unsetResult.matchedCount,
        unsetModified: unsetResult.modifiedCount,
        indexCreated: createdName,
      },
      message: 'Contribution index repaired successfully',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to repair contribution index');
  }
}

export default handler;

