import { Router } from 'express';
import Notification from '../models/Notification.js';
import Expense from '../models/Expense.js';

const router = Router();

const SPIKE_THRESHOLD = 0.3; // 30% increase week-over-week triggers a warning
const MIN_BASELINE = 10; // ignore tiny categories where % swings are noisy

function startOfDay(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function generateForUser(userId) {
  const created = [];
  const now = new Date();
  const thisWeekStart = startOfDay(7);
  const lastWeekStart = startOfDay(14);

  const [thisWeekExpenses, lastWeekExpenses] = await Promise.all([
    Expense.find({ userId, date: { $gte: thisWeekStart } }).populate('category'),
    Expense.find({ userId, date: { $gte: lastWeekStart, $lt: thisWeekStart } }).populate('category'),
  ]);

  const sumByCategory = (list) => {
    const map = new Map();
    for (const e of list) {
      const key = e.category?.name || 'Other';
      map.set(key, (map.get(key) || 0) + e.amount);
    }
    return map;
  };

  const thisWeekByCat = sumByCategory(thisWeekExpenses);
  const lastWeekByCat = sumByCategory(lastWeekExpenses);

  for (const [category, thisAmount] of thisWeekByCat) {
    const lastAmount = lastWeekByCat.get(category) || 0;
    if (lastAmount < MIN_BASELINE) continue;

    const increase = (thisAmount - lastAmount) / lastAmount;
    if (increase >= SPIKE_THRESHOLD) {
      const pct = Math.round(increase * 100);
      const message = `You've spent ${pct}% more on ${category} this week than last week.`;

      const alreadyExists = await Notification.exists({
        userId,
        type: 'budget_warning',
        message,
        createdAt: { $gte: startOfDay(1) },
      });
      if (!alreadyExists) {
        const notif = await Notification.create({ userId, type: 'budget_warning', message });
        created.push(notif);
      }
    }
  }

  const isSunday = now.getDay() === 0;
  if (isSunday && thisWeekExpenses.length > 0) {
    const weekTotal = thisWeekExpenses.reduce((sum, e) => sum + e.amount, 0);
    const message = `Weekly summary: you spent $${weekTotal.toFixed(2)} across ${thisWeekExpenses.length} expenses this week.`;

    const alreadyExists = await Notification.exists({
      userId,
      type: 'weekly_summary',
      createdAt: { $gte: startOfDay(1) },
    });
    if (!alreadyExists) {
      const notif = await Notification.create({ userId, type: 'weekly_summary', message });
      created.push(notif);
    }
  }

  return created;
}

router.get('/', async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

router.post('/generate', async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const created = await generateForUser(userId);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true },
    );
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(notification);
  } catch (err) {
    next(err);
  }
});

export default router;
