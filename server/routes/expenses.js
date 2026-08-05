import { Router } from 'express';
import Expense from '../models/Expense.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { category, startDate, endDate } = req.query;

    const filter = { userId: req.userId };
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter)
      .populate('category')
      .sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { amount, category, merchant, date, note, receiptImageUrl } = req.body;
    if (!amount || !category) {
      return res.status(400).json({ error: 'amount and category are required' });
    }

    const expense = await Expense.create({
      amount,
      category,
      merchant,
      date: date || Date.now(),
      note,
      receiptImageUrl,
      userId: req.userId,
    });
    const populated = await expense.populate('category');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { amount, category, merchant, date, note, receiptImageUrl } = req.body;
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { amount, category, merchant, date, note, receiptImageUrl },
      { new: true, runValidators: true },
    ).populate('category');
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(expense);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
