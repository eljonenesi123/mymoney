import { Router } from 'express';
import Category from '../models/Category.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const categories = await Category.find({
      $or: [{ isDefault: true }, { userId }],
    }).sort({ isDefault: -1, name: 1 });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, icon, color, userId } = req.body;
    if (!name || !userId) {
      return res.status(400).json({ error: 'name and userId are required' });
    }
    const category = await Category.create({
      name: name.trim(),
      icon: icon || '🏷️',
      color: color || '#6366f1',
      userId,
      isDefault: false,
    });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, isDefault: false });
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
