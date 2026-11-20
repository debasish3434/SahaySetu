import mongoose from 'mongoose';

const shelterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shelter name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
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
    },
    totalCapacity: {
      type: Number,
      required: [true, 'Total capacity is required'],
      min: 0,
    },
    occupiedCapacity: {
      type: Number,
      default: 0,
      min: 0,
    },
    contactPhone: String,
    facilities: [String],
    status: {
      type: String,
      enum: ['open', 'full', 'closed'],
      default: 'open',
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

shelterSchema.index({ location: '2dsphere' });

const Shelter = mongoose.model('Shelter', shelterSchema);
export default Shelter;
