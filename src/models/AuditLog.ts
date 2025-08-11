import { Schema, model, models } from 'mongoose';

const AuditLogSchema = new Schema(
  {
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    targetType: String,
    targetId: String,
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
    meta: Schema.Types.Mixed
  },
  { timestamps: true }
);

export const AuditLogModel = models.AuditLog || model('AuditLog', AuditLogSchema);