import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  dueDate: { type: Date, required: true },
  recurrence: { type: String, enum: ['one-time', 'weekly', 'monthly'], default: 'one-time' },
  paid: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model('Bill', billSchema);
