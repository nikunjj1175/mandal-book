const { createWorker } = require('tesseract.js');

const LABEL_SETS = {
  payeeName: ['to', 'pay to', 'receiver', 'recipient', 'paid to', 'beneficiary', 'credited to', 'banking name'],
};

const UPI_APP_KEYWORDS = [
  { key: 'gpay', matches: ['google pay', 'gpay', 'google transaction id'] },
  { key: 'phonepe', matches: ['phonepe', 'contact phonepe', 'powered by phonepe'] },
];

function normalizeText(text) {
  return text.replace(/\r/g, '');
}

function sanitizeValue(value) {
  if (!value) return undefined;
  return value.replace(/\s+/g, ' ').trim();
}

function sanitizeIdentifier(value) {
  if (!value) return undefined;
  return value.replace(/[\s\-:.]/g, '').trim();
}

function extractLabelValue(lines, labels) {
  for (const line of lines) {
    for (const label of labels) {
      const regex = new RegExp(`^${label}[\\s:-]+(.+)$`, 'i');
      const match = line.match(regex);
      if (match && match[1]) {
        return sanitizeValue(match[1]);
      }
    }
  }
  return undefined;
}

function extractReference(text) {
  const referenceIdPatterns = [
    /(?:Transaction ID|UPI transaction ID)[\s#:]*([A-Z0-9\-]{6,50})/gi,
    /(CIC[A-Z0-9]{6,18})/gi,
    /([A-Z]{1}[0-9]{6,20})/g,
  ];

  let referenceId;
  for (const pattern of referenceIdPatterns) {
    const match = pattern.exec(text);
    if (match && match[1]) {
      const cleaned = sanitizeIdentifier(match[1]);
      if (cleaned && cleaned.length >= 6) {
        referenceId = cleaned;
        break;
      }
    }
  }
  return referenceId;
}


function extractAmount(text) {
  const amountPattern = /(?:₹|Rs|INR|Amount|Paid)[\s:₹RsINR]*([0-9,]+(?:\.\d{1,2})?)/gi;
  const match = amountPattern.exec(text);
  if (!match || !match[1]) return undefined;

  const numeric = match[1].replace(/,/g, '');
  const amount = parseFloat(numeric);
  if (Number.isNaN(amount)) return undefined;
  return amount;
}

function extractDate(text) {
  const datePattern = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/g;
  const match = datePattern.exec(text);
  return match ? sanitizeValue(match[1]) : undefined;
}

function extractTime(text) {
  const timePattern = /(\d{1,2}:\d{2}(?::\d{2})?\s?(?:AM|PM|am|pm)?)/g;
  const match = timePattern.exec(text);
  return match ? sanitizeValue(match[1]) : undefined;
}

function extractParticipants(lines) {
  return {
    payeeName: extractLabelValue(lines, LABEL_SETS.payeeName),
  };
}

function detectUpiProvider(text) {
  const lower = text.toLowerCase();
  for (const app of UPI_APP_KEYWORDS) {
    if (app.matches.some((term) => lower.includes(term))) {
      return app.key;
    }
  }
  return null;
}

async function extractTextFromImage(imageUrl) {
  let worker;
  try {
    worker = await createWorker('eng');
    const {
      data: { text },
    } = await worker.recognize(imageUrl);

    const normalizedText = normalizeText(text || '');
    const lines = normalizedText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const referenceId = extractReference(normalizedText);
    const amount = extractAmount(normalizedText);
    const date = extractDate(normalizedText);
    const time = extractTime(normalizedText);
    const participantData = extractParticipants(lines);
    const upiProvider = detectUpiProvider(normalizedText);

    return {
      transactionId: referenceId,
      amount,
      date,
      time,
      ...participantData,
      upiProvider,
      text: normalizedText.substring(0, 1000),
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
