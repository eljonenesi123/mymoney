import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  targetAmount: { type: Number, required: true, min: 1 },
  currentAmount: { type: Number, default: 0, min: 0 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  achievedAt: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model('Goal', goalSchema);
