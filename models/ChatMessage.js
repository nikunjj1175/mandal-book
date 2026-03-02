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

// Auto-delete messages after 3 days and optimize fetch order
ChatMessageSchema.index({ createdAt: -1 });
ChatMessageSchema.index({ createdAt: 1 }, { expires: '3d' });

module.exports = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
