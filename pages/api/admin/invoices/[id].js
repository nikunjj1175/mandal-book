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

    const { id } = req.query;
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    if (req.method === 'GET') {
      return res.status(200).json({ success: true, data: { invoice } });
    }

    if (req.method === 'PUT') {
      const { investmentName, purchaseAmount, purchaseDate, vendorName, notes, document } = req.body;
      if (investmentName !== undefined) invoice.investmentName = String(investmentName).trim();
      if (purchaseAmount !== undefined) {
        const amountNum = Number(purchaseAmount);
        if (Number.isNaN(amountNum) || amountNum < 0) {
          return res.status(400).json({ success: false, error: 'Invalid purchaseAmount' });
        }
        invoice.purchaseAmount = amountNum;
      }
      if (purchaseDate !== undefined) invoice.purchaseDate = purchaseDate ? new Date(purchaseDate) : undefined;
      if (vendorName !== undefined) invoice.vendorName = vendorName ? String(vendorName).trim() : undefined;
      if (notes !== undefined) invoice.notes = notes ? String(notes).trim() : undefined;

      if (document) {
        // Replace document in Cloudinary
        const folderInvestment = slugifyFolderName(invoice.investmentName);
        const folder = `mandal/investments/${folderInvestment}`;
        const upload = await uploadToCloudinary(document, folder, `invoice-${Date.now()}`, {
          resource_type: 'auto',
          format: undefined,
          quality: undefined,
          fetch_format: undefined,
          width: undefined,
          height: undefined,
          crop: undefined,
        });

        // Best effort delete old asset
        if (invoice.documentPublicId) {
          deleteFromCloudinary(invoice.documentPublicId).catch(() => {});
        }
        invoice.documentUrl = upload.secure_url;
        invoice.documentPublicId = upload.public_id;
      }

      invoice.updatedBy = req.user._id;
      await invoice.save();

      return res.status(200).json({ success: true, data: { invoice }, message: 'Invoice updated' });
    }

    if (req.method === 'DELETE') {
      const publicId = invoice.documentPublicId;
      await Invoice.deleteOne({ _id: invoice._id });
      if (publicId) {
        deleteFromCloudinary(publicId).catch(() => {});
      }
      return res.status(200).json({ success: true, message: 'Invoice deleted' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    return handleApiError(res, error, 'Failed to handle invoice');
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

