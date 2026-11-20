import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['emergency_alert', 'volunteer_assignment', 'incident_status', 'resource_alert', 'announcement'],
    required: true,
  },
  title: { type: String, required: true, maxlength: 200 },
  message: { type: String, required: true, maxlength: 500 },
  isRead: { type: Boolean, default: false, index: true },
  relatedId: { type: mongoose.Schema.Types.ObjectId },        // incident/request/resource ID
  relatedModel: { type: String, enum: ['Incident', 'EmergencyRequest', 'Resource', 'Shelter'] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: mongoose.Schema.Types.Mixed },            // extra data like priority
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
