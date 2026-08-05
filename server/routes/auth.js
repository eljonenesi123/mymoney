import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { sendWelcomeEmail } from '../lib/mailer.js';

const router = Router();

const USERNAME_RE = /^[a-z0-9_]{3,20}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.passwordHash;
  return obj;
}

async function validateNewAccountFields({ username, email, password }) {
  if (!username || !USERNAME_RE.test(username)) {
    return 'Username must be 3-20 letters, numbers, or underscores';
  }
  if (!email || !EMAIL_RE.test(email)) {
    return 'Enter a valid email address';
  }
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters';
  }

  const existing = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
  });
  if (existing?.username === username.toLowerCase()) {
    return 'That username is taken';
  }
  if (existing?.email === email.toLowerCase()) {
    return 'That email is already registered';
  }

  return null;
}

router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const validationError = await validateNewAccountFields({ username, email, password });
    if (validationError) {
      return res.status(validationError.includes('taken') || validationError.includes('registered') ? 409 : 400)
        .json({ error: validationError });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: username,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
      isGuest: false,
    });

    sendWelcomeEmail(user.email, user.name);

    const token = signToken(user._id);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username: username.toLowerCase() }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Incorrect username or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect username or password' });
    }

    const token = signToken(user._id);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/guest', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const user = await User.create({ name: name.trim(), isGuest: true });
    const token = signToken(user._id);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(sanitizeUser(user));
  } catch (err) {
    next(err);
  }
});

// Lets a guest claim a username/email/password on their existing account, so
// their data carries over instead of starting fresh on a real signup.
router.post('/upgrade', requireAuth, async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const validationError = await validateNewAccountFields({ username, email, password });
    if (validationError) {
      return res.status(validationError.includes('taken') || validationError.includes('registered') ? 409 : 400)
        .json({ error: validationError });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.findByIdAndUpdate(
      req.userId,
      { username: username.toLowerCase(), email: email.toLowerCase(), passwordHash, isGuest: false, name: username },
      { new: true, runValidators: true },
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    sendWelcomeEmail(user.email, user.name);

    res.json(sanitizeUser(user));
  } catch (err) {
    next(err);
  }
});

export default router;
