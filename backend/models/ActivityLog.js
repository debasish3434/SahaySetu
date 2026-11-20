import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  action: { type: String, required: true, index: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  target: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetEmail: { type: String, lowercase: true, trim: true },
  details: { type: String, maxlength: 500 },
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

activityLogSchema.index({ createdAt: -1 });

export default mongoose.model('ActivityLog', activityLogSchema);
