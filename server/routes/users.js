import { Router } from 'express';
import User from '../models/User.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { name, monthlyIncome } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const user = await User.create({
      name: name.trim(),
      monthlyIncome: monthlyIncome != null ? Number(monthlyIncome) : 0,
    });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { monthlyIncome, name } = req.body;
    const update = {};
    if (monthlyIncome != null) update.monthlyIncome = Number(monthlyIncome);
    if (name != null && name.trim()) update.name = name.trim();

    const user = await User.findByIdAndUpdate(req.params.id, update, {
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
