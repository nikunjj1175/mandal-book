const mongoose = require('mongoose');

const ChatTypingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null = group chat
    mode: { type: String, enum: ['group', 'personal'], required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Consider a user typing if record is younger than ~10s; TTL cleans up old docs
ChatTypingSchema.index({ updatedAt: 1 }, { expires: '10s' });

module.exports = mongoose.models.ChatTyping || mongoose.model('ChatTyping', ChatTypingSchema);

