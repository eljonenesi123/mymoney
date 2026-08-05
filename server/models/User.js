import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  monthlyIncome: { type: Number, default: 0, min: 0 },
}, { timestamps: { createdAt: true, updatedAt: false } });

export default mongoose.model('User', userSchema);
