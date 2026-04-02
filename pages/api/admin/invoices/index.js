import applyCors from '@/lib/cors';
const connectDB = require('../../../../lib/mongodb');
const Invoice = require('../../../../models/Invoice');
const { authenticate, requireAdmin } = require('../../../../middleware/auth');
const { handleApiError } = require('../../../../lib/utils');
const { uploadToCloudinary, deleteFromCloudinary } = require('../../../../lib/cloudinary');

function slugifyFolderName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'investment';
}

async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  try {
    await connectDB();
    await authenticate(req, res);
    requireAdmin(req);

    if (req.method === 'GET') {
      const { q } = req.query;
      const filter = {};
      if (q) {
        filter.investmentName = { $regex: String(q), $options: 'i' };
      }

      const invoices = await Invoice.find(filter)
        .sort({ purchaseDate: -1, createdAt: -1 })
        .lean();

      return res.status(200).json({ success: true, data: { invoices } });
    }

    if (req.method === 'POST') {
      const { investmentName, purchaseAmount, purchaseDate, vendorName, notes, document } = req.body;

      if (!investmentName || purchaseAmount === undefined || purchaseAmount === null || !document) {
        return res.status(400).json({
          success: false,
          error: 'investmentName, purchaseAmount and document are required',
        });
      }

      const amountNum = Number(purchaseAmount);
      if (Number.isNaN(amountNum) || amountNum < 0) {
        return res.status(400).json({ success: false, error: 'Invalid purchaseAmount' });
      }

      const folderInvestment = slugifyFolderName(investmentName);
      const folder = `mandal/investments/${folderInvestment}`;

      const upload = await uploadToCloudinary(document, folder, `invoice-${Date.now()}`, {
        resource_type: 'auto',
        // Avoid forcing image transforms for PDFs/docs
        format: undefined,
        quality: undefined,
        fetch_format: undefined,
        width: undefined,
        height: undefined,
        crop: undefined,
      });

      const invoice = await Invoice.create({
        investmentName: String(investmentName).trim(),
        purchaseAmount: amountNum,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        vendorName: vendorName ? String(vendorName).trim() : undefined,
        notes: notes ? String(notes).trim() : undefined,
        documentUrl: upload.secure_url,
        documentPublicId: upload.public_id,
        createdBy: req.user._id,
      });

      return res.status(201).json({ success: true, data: { invoice }, message: 'Invoice created' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    return handleApiError(res, error, 'Failed to handle invoices');
  }
}

export default handler;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb',
    },
  },
};

