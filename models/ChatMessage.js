const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null = group chat
    message: { type: String, required: true, trim: true },
    editedAt: { type: Date },
  },
  { timestamps: true }
);

// Index for fast fetch by created order
ChatMessageSchema.index({ createdAt: -1 });

module.exports = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
