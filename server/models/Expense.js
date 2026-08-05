import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  merchant: { type: String, trim: true },
  date: { type: Date, required: true, default: Date.now },
  note: { type: String, trim: true },
  receiptImageUrl: { type: String, default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model('Expense', expenseSchema);
