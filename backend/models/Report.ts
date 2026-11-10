import { Schema, model } from 'mongoose';

export const REASONS = ['spam', 'abuse', 'harassment', 'other'] as const;
export const STATUSES = ['pending', 'resolved', 'dismissed'] as const;

const reportSchema = new Schema(
  {
    commentId: { type: String, required: true },
    commentSnapshot: {
      text: { type: String, required: true },
      authorId: String,
      authorName: String,
    },
    reportedBy: { userId: { type: String, required: true }, userName: { type: String, required: true } },
    reason: { type: String, enum: REASONS, required: true },
    details: { type: String, trim: true, maxlength: 300 },
    status: { type: String, enum: STATUSES, default: 'pending' },
    resolvedAt: Date,
    resolvedBy: String,
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true, versionKey: false, transform: (_d, ret) => { delete ret._id; } } }
);
reportSchema.index({ commentId: 1, 'reportedBy.userId': 1 }, { unique: true });
reportSchema.index({ status: 1, createdAt: -1 });

export default model('Report', reportSchema);
