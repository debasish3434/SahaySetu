import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Resource name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['food', 'water', 'medicine', 'clothing', 'emergency_kit', 'shelter_kit', 'other'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 0,
    },
    unit: {
      type: String,
      default: 'items', // e.g. packets, liters, boxes, items
    },
    location: {
      type: String,
      default: 'Central Relief Hub',
    },
    status: {
      type: String,
      enum: ['available', 'low', 'depleted'],
      default: 'available',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const Resource = mongoose.model('Resource', resourceSchema);
export default Resource;
