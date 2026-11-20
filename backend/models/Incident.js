import mongoose from 'mongoose';

/**
 * Incident Schema
 * Represents a disaster/incident report submitted by a citizen or volunteer.
 * Location is stored as GeoJSON Point to support geospatial queries later (e.g. nearby incidents).
 */
const incidentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Incident title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Incident description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Incident category is required'],
      enum: {
        values: [
          'flood',
          'fire',
          'earthquake',
          'cyclone',
          'landslide',
          'medical',
          'accident',
          'building-collapse',
          'other',
        ],
        message: '{VALUE} is not a supported incident category',
      },
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['reported', 'verified', 'in-progress', 'resolved', 'rejected'],
      default: 'reported',
    },
    media: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        type: { type: String, enum: ['image', 'video'], default: 'image' },
      },
    ],
    assignedVolunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    taskStatus: {
      type: String,
      enum: ['unassigned', 'assigned', 'accepted', 'in-progress', 'completed'],
      default: 'unassigned',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        // [longitude, latitude] — GeoJSON order
        type: [Number],
        required: [true, 'Location coordinates are required'],
        validate: {
          validator: (coords) =>
            Array.isArray(coords) &&
            coords.length === 2 &&
            coords[0] >= -180 &&
            coords[0] <= 180 &&
            coords[1] >= -90 &&
            coords[1] <= 90,
          message: 'Invalid coordinates. Expected [longitude, latitude]',
        },
      },
      address: {
        type: String,
        trim: true,
        default: '',
      },
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contactPhone: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian phone number'],
    },
    peopleAffected: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index enables "find incidents near me" style queries in future sprints
incidentSchema.index({ location: '2dsphere' });
// Speeds up dashboard queries filtering by status/category and sorting by recency
incidentSchema.index({ status: 1, category: 1, createdAt: -1 });

const Incident = mongoose.model('Incident', incidentSchema);

export default Incident;
