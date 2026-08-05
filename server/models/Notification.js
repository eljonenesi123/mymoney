import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String, enum: ['budget_warning', 'weekly_summary', 'info'], default: 'info' },
  read: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

export default mongoose.model('Notification', notificationSchema);
