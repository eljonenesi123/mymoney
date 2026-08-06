import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  icon: { type: String, default: '🏷️' },
  color: { type: String, default: '#6E8CA0' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);
