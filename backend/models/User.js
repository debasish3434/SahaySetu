import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * User Schema — SahaySetu
 * Supports role-based access control (citizen, volunteer, coordinator, admin)
 * and password reset via hashed token.
 *
 * Super Admin additions:
 *  - isSuperAdmin : Only ONE account ever. Set by initSuperAdmin.js on startup.
 *  - approvalStatus: Controls dashboard access for volunteers/coordinators.
 *  - approvedBy / approvedAt / rejectionReason: approval audit trail.
 *  - invitedBy: for admin accounts created via Super Admin invitation.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[1-9]\d{9}$/, 'Please provide a valid 10-digit phone number'],
    },
    role: {
      type: String,
      enum: {
        values: ['citizen', 'volunteer', 'coordinator', 'admin'],
        message: '{VALUE} is not a supported role',
      },
      default: 'citizen',
    },
    // Email is verified by a one-time email token. Undefined preserves access
    // for pre-feature accounts; new registrations explicitly set false.
    emailVerified: { type: Boolean, default: undefined, index: true },
    emailVerifiedAt: Date,
    administratorId: { type: String, uppercase: true, trim: true, unique: true, sparse: true },
    adminPermissions: {
      type: [String],
      enum: ['user_management', 'volunteer_management', 'incident_management', 'request_management', 'shelter_management', 'resource_management', 'analytics', 'system_settings', 'announcements'],
      default: [],
    },
    mustChangePassword: { type: Boolean, default: false },
    sessionVersion: { type: Number, default: 0 },

    // ── Super Admin flag ──────────────────────────────────────────────────────
    // Only ONE account can ever have isSuperAdmin = true.
    // Set exclusively by initSuperAdmin.js via SUPER_ADMIN_EMAIL env var.
    // NEVER set by any registration endpoint, role-change API, or user action.
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },

    // ── Approval workflow ─────────────────────────────────────────────────────
    // 'not_required' → citizens (access immediately after registration)
    // 'pending'      → new volunteers / coordinators (blocked until Super Admin approves)
    // 'approved'     → Super Admin approved; full dashboard access granted
    // 'rejected'     → Super Admin rejected; blocked from all role-specific APIs
    approvalStatus: {
      type: String,
      enum: ['not_required', 'pending', 'approved', 'rejected'],
      default: 'not_required',
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: { type: Date },
    rejectionReason: { type: String, maxlength: 500, trim: true },

    // For admin accounts created via Super Admin invitation
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    invitationStatus: {
      type: String,
      enum: ['pending', 'accepted', 'revoked', 'expired'],
    },

    // ── Volunteer workflow (existing — preserved) ─────────────────────────────
    volunteerProfile: {
      skills: [String],
      availability: String,
      verificationStatus: {
        type: String,
        enum: ['unverified', 'pending', 'verified', 'rejected'],
        default: 'unverified',
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      verifiedAt: Date,
    },

    settings: {
      notificationsEnabled: {
        type: Boolean,
        default: true,
      },
    },
    profilePhoto: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters'],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: { type: Date },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// Prevent concurrent initializers from creating more than one owner.
userSchema.index({ isSuperAdmin: 1 }, { unique: true, partialFilterExpression: { isSuperAdmin: true } });

// Hash password before saving, only if it was modified
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generatePasswordResetToken = function generatePasswordResetToken() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpire;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

export default User;
