const { createWorker } = require('tesseract.js');

async function extractTextFromImage(imageUrl) {
  let worker;
  try {
    worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(imageUrl);
    
    // Extract reference ID (common patterns: UPI ref, UTR, Transaction ID)
    const referenceIdPatterns = [
      /(?:UPI|UTR|Ref|Reference|Transaction ID|Txn ID)[\s:]*([A-Z0-9]{8,40})/gi,
      /([A-Z0-9]{12,40})/g,
    ];

    let referenceId;
    for (const pattern of referenceIdPatterns) {
      const match = text.match(pattern);
      if (match && match[0]) {
        referenceId = match[0].replace(/^(?:UPI|UTR|Ref|Reference|Transaction ID|Txn ID)[\s:]*/gi, '').trim();
        if (referenceId && referenceId.length >= 8) {
          break;
        }
      }
    }

    // Extract amount
    const amountPattern = /(?:₹|Rs|INR|Amount)[\s:]*(\d+(?:\.\d{2})?)/gi;
    const amountMatch = text.match(amountPattern);
    let amount;
    if (amountMatch) {
      const amountStr = amountMatch[0].replace(/[₹RsINRAmount:\s]/gi, '');
      amount = parseFloat(amountStr);
      if (isNaN(amount)) amount = undefined;
    }

    // Extract date
    const datePattern = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/g;
    const dateMatch = text.match(datePattern);
    const date = dateMatch ? dateMatch[0] : undefined;

    // Extract time
    const timePattern = /(\d{1,2}:\d{2}(?::\d{2})?(?:\s?(?:AM|PM))?)/gi;
    const timeMatch = text.match(timePattern);
    const time = timeMatch ? timeMatch[0] : undefined;

    return {
      referenceId,
      amount,
      date,
      time,
      text: text.substring(0, 500), // Limit text length
    };
  } catch (error) {
    console.error('OCR Error:', error);
    return {
      text: '',
    };
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (err) {
        console.error('Worker termination error:', err);
      }
    }
  }
}

module.exports = {
  extractTextFromImage,
};

