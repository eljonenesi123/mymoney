import mongoose from 'mongoose';

// Holds a signup or guest-upgrade until its emailed code is verified. Never
// becomes a real User until then, so an unverified/fake email can't create
// an account. TTL-indexed so abandoned attempts clean themselves up.
const pendingRegistrationSchema = new mongoose.Schema({
  username: { type: String, required: true, lowercase: true },
  email: { type: String, required: true, lowercase: true },
  passwordHash: { type: String, required: true },
  code: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  // Set only for a guest claiming a username/password — verifying updates
  // this existing user instead of creating a new one.
  upgradeForUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

pendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('PendingRegistration', pendingRegistrationSchema);
