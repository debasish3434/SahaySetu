import mongoose from 'mongoose';

const emergencyRequestSchema = new mongoose.Schema(
  {
    requestType: {
      type: String,
      required: [true, 'Request type is required'],
      enum: ['medical', 'rescue', 'food_water', 'shelter', 'evacuation', 'other'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['submitted', 'prioritized', 'assigned', 'in-progress', 'completed', 'closed'],
      default: 'submitted',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: [true, 'Coordinates are required'],
      },
      address: {
        type: String,
        default: '',
      },
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedVolunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    contactPhone: String,
    peopleCount: {
      type: Number,
      default: 1,
    },
    closedAt: Date,
  },
  { timestamps: true }
);

emergencyRequestSchema.index({ location: '2dsphere' });

const EmergencyRequest = mongoose.model('EmergencyRequest', emergencyRequestSchema);
export default EmergencyRequest;
