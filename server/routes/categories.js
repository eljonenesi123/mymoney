import { Router } from 'express';
import Category from '../models/Category.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.find({
      $or: [{ isDefault: true }, { userId: req.userId }],
    }).sort({ isDefault: -1, name: 1 });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, icon, color } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const category = await Category.create({
      name: name.trim(),
      icon: icon || '🏷️',
      color: color || '#60a5fa',
      userId: req.userId,
      isDefault: false,
    });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, userId: req.userId, isDefault: false });
    if (!category) {
      return res.status(404).json({ error: 'Category not found or cannot be deleted' });
    }
    await category.deleteOne();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
