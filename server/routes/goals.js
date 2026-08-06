import { Router } from 'express';
import Goal from '../models/Goal.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const goals = await Goal.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, targetAmount } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const target = Number(targetAmount);
    if (!target || target <= 0) {
      return res.status(400).json({ error: 'Target amount must be greater than 0' });
    }

    const goal = await Goal.create({ name: name.trim(), targetAmount: target, userId: req.userId });
    res.status(201).json(goal);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { name, targetAmount } = req.body;
    const update = {};
    if (name != null && name.trim()) update.name = name.trim();
    if (targetAmount != null) {
      const target = Number(targetAmount);
      if (!target || target <= 0) {
        return res.status(400).json({ error: 'Target amount must be greater than 0' });
      }
      update.targetAmount = target;
    }

    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      update,
      { new: true, runValidators: true },
    );
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(goal);
  } catch (err) {
    next(err);
  }
});

// Logs a manual contribution toward the goal. Automatic tracking isn't
// feasible yet — the app only records expenses, not separate
// savings/income entries — so the user logs what they've set aside.
router.post('/:id/contribute', async (req, res, next) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    goal.currentAmount += amount;
    if (goal.currentAmount >= goal.targetAmount && !goal.achievedAt) {
      goal.achievedAt = new Date();
    }
    await goal.save();
    res.json(goal);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
