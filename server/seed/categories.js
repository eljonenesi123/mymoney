import Category from '../models/Category.js';

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', icon: '🍔', color: '#C98A52' },
  { name: 'Groceries', icon: '🛒', color: '#7FA37F' },
  { name: 'Transport', icon: '🚗', color: '#6E8CA0' },
  { name: 'Shopping', icon: '🛍️', color: '#C98FA0' },
  { name: 'Bills & Utilities', icon: '🧾', color: '#C9A857' },
  { name: 'Entertainment', icon: '🎬', color: '#8B7398' },
  { name: 'Health', icon: '💊', color: '#B5654B' },
  { name: 'Other', icon: '🏷️', color: '#8B8378' },
];

export async function ensureDefaultCategories() {
  const existingCount = await Category.countDocuments({ isDefault: true });
  if (existingCount > 0) return;

  await Category.insertMany(
    DEFAULT_CATEGORIES.map((c) => ({ ...c, isDefault: true, userId: null })),
  );
  console.log('Seeded default categories');
}
