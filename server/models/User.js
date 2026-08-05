import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
  email: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
  passwordHash: { type: String, select: false },
  isGuest: { type: Boolean, default: false },
  monthlyIncome: { type: Number, default: 0, min: 0 },
  currency: { type: String, enum: ['ALL', 'EUR'], default: 'ALL' },
}, { timestamps: { createdAt: true, updatedAt: false } });

export default mongoose.model('User', userSchema);
