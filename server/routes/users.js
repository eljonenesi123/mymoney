import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const { monthlyIncome, name, currency } = req.body;
    const update = {};
    if (monthlyIncome != null) update.monthlyIncome = Number(monthlyIncome);
    if (name != null && name.trim()) update.name = name.trim();
    if (currency != null) update.currency = currency;

    const user = await User.findByIdAndUpdate(req.userId, update, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
