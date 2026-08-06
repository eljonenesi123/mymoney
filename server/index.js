import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import notificationsRouter from './routes/notifications.js';
import expensesRouter from './routes/expenses.js';
import categoriesRouter from './routes/categories.js';
import { ensureDefaultCategories } from './seed/categories.js';
import uploadsRouter from './routes/uploads.js';
import goalsRouter from './routes/goals.js';

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((s) => s.trim()) : []),
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/goals', goalsRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not set in environment variables');
    }
    await connectDB();
    await ensureDefaultCategories();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
