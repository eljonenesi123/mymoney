import Category from '../models/Category.js';

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', icon: '🍔', color: '#fb923c' },
  { name: 'Groceries', icon: '🛒', color: '#34d399' },
  { name: 'Transport', icon: '🚗', color: '#60a5fa' },
  { name: 'Shopping', icon: '🛍️', color: '#f472b6' },
  { name: 'Bills & Utilities', icon: '🧾', color: '#fbbf24' },
  { name: 'Entertainment', icon: '🎬', color: '#a78bfa' },
  { name: 'Health', icon: '💊', color: '#f87171' },
  { name: 'Other', icon: '🏷️', color: '#9ca3af' },
];

export async function ensureDefaultCategories() {
  const existingCount = await Category.countDocuments({ isDefault: true });
  if (existingCount > 0) return;

  await Category.insertMany(
    DEFAULT_CATEGORIES.map((c) => ({ ...c, isDefault: true, userId: null })),
  );
  console.log('Seeded default categories');
}
