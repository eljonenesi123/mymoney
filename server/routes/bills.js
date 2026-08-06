import { Router } from 'express';
import Bill from '../models/Bill.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

function nextDueDate(date, recurrence) {
  const d = new Date(date);
  if (recurrence === 'weekly') d.setDate(d.getDate() + 7);
  else if (recurrence === 'monthly') d.setMonth(d.getMonth() + 1);
  return d;
}

router.get('/', async (req, res, next) => {
  try {
    const bills = await Bill.find({ userId: req.userId }).sort({ dueDate: 1 });
    res.json(bills);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, amount, dueDate, recurrence } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt < 0) {
      return res.status(400).json({ error: 'Amount must be 0 or greater' });
    }
    if (!dueDate || Number.isNaN(new Date(dueDate).getTime())) {
      return res.status(400).json({ error: 'A valid due date is required' });
    }
    if (recurrence && !['one-time', 'weekly', 'monthly'].includes(recurrence)) {
      return res.status(400).json({ error: 'Invalid recurrence' });
    }

    const bill = await Bill.create({
      name: name.trim(),
      amount: amt,
      dueDate: new Date(dueDate),
      recurrence: recurrence || 'one-time',
      userId: req.userId,
    });
    res.status(201).json(bill);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { name, amount, dueDate, recurrence } = req.body;
    const update = {};
    if (name != null && name.trim()) update.name = name.trim();
    if (amount != null) {
      const amt = Number(amount);
      if (Number.isNaN(amt) || amt < 0) {
        return res.status(400).json({ error: 'Amount must be 0 or greater' });
      }
      update.amount = amt;
    }
    if (dueDate != null) {
      const d = new Date(dueDate);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ error: 'Invalid due date' });
      }
      update.dueDate = d;
    }
    if (recurrence != null) {
      if (!['one-time', 'weekly', 'monthly'].includes(recurrence)) {
        return res.status(400).json({ error: 'Invalid recurrence' });
      }
      update.recurrence = recurrence;
    }

    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      update,
      { new: true, runValidators: true },
    );
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    res.json(bill);
  } catch (err) {
    next(err);
  }
});

// Marks a bill paid. Recurring bills roll forward to their next due date
// and reset to unpaid so the reminder cycle continues automatically;
// one-time bills just stay marked paid.
router.post('/:id/pay', async (req, res, next) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, userId: req.userId });
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    if (bill.recurrence === 'one-time') {
      bill.paid = true;
    } else {
      bill.dueDate = nextDueDate(bill.dueDate, bill.recurrence);
      bill.paid = false;
    }
    await bill.save();
    res.json(bill);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const bill = await Bill.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
