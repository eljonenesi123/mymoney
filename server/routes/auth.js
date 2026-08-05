import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import PendingRegistration from '../models/PendingRegistration.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { sendVerificationCode } from '../lib/mailer.js';

const router = Router();

const USERNAME_RE = /^[a-z0-9_]{3,20}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.passwordHash;
  return obj;
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function validateNewAccountFields({ username, email, password }, excludeUserId = null) {
  if (!username || !USERNAME_RE.test(username)) {
    return { status: 400, error: 'Username must be 3-20 letters, numbers, or underscores' };
  }
  if (!email || !EMAIL_RE.test(email)) {
    return { status: 400, error: 'Enter a valid email address' };
  }
  if (!password || password.length < 6) {
    return { status: 400, error: 'Password must be at least 6 characters' };
  }

  const existing = await User.findOne({
    _id: { $ne: excludeUserId },
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
  });
  if (existing?.username === username.toLowerCase()) {
    return { status: 409, error: 'That username is taken' };
  }
  if (existing?.email === email.toLowerCase()) {
    return { status: 409, error: 'That email is already registered' };
  }

  return null;
}

async function startVerification(res, { username, email, password, upgradeForUserId = null }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const code = generateCode();

  // Replace any prior pending attempt for this email/user so retrying
  // (or asking for a new code) just works instead of colliding.
  await PendingRegistration.deleteMany(
    upgradeForUserId ? { upgradeForUserId } : { email: email.toLowerCase(), upgradeForUserId: null },
  );

  await PendingRegistration.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    passwordHash,
    code,
    upgradeForUserId,
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });

  try {
    await sendVerificationCode(email, code);
  } catch {
    return res.status(502).json({ error: "Couldn't send the verification email. Try again shortly." });
  }

  res.json({ message: 'Verification code sent' });
}

router.post('/register/start', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const validationError = await validateNewAccountFields({ username, email, password });
    if (validationError) {
      return res.status(validationError.status).json({ error: validationError.error });
    }

    await startVerification(res, { username, email, password });
  } catch (err) {
    next(err);
  }
});

router.post('/register/verify', async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const pending = await PendingRegistration.findOne({
      email: email.toLowerCase(),
      upgradeForUserId: null,
    });
    if (!pending || pending.expiresAt < new Date()) {
      return res.status(400).json({ error: 'That code has expired — request a new one' });
    }

    if (pending.code !== String(code).trim()) {
      pending.attempts += 1;
      if (pending.attempts >= MAX_ATTEMPTS) {
        await pending.deleteOne();
        return res.status(400).json({ error: 'Too many incorrect attempts — request a new code' });
      }
      await pending.save();
      return res.status(400).json({ error: 'Incorrect code' });
    }

    // Re-check uniqueness in case it was taken while this code was pending.
    const conflict = await User.findOne({
      $or: [{ username: pending.username }, { email: pending.email }],
    });
    if (conflict) {
      await pending.deleteOne();
      return res.status(409).json({ error: 'That username or email was just taken — start again' });
    }

    const user = await User.create({
      name: pending.username,
      username: pending.username,
      email: pending.email,
      passwordHash: pending.passwordHash,
      isGuest: false,
    });
    await pending.deleteOne();

    const token = signToken(user._id);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/register/resend', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const pending = await PendingRegistration.findOne({ email: email.toLowerCase(), upgradeForUserId: null });
    if (!pending) {
      return res.status(404).json({ error: 'No pending signup for that email — start again' });
    }

    pending.code = generateCode();
    pending.attempts = 0;
    pending.expiresAt = new Date(Date.now() + CODE_TTL_MS);
    await pending.save();

    try {
      await sendVerificationCode(pending.email, pending.code);
    } catch {
      return res.status(502).json({ error: "Couldn't send the verification email. Try again shortly." });
    }

    res.json({ message: 'Verification code resent' });
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

// Lets a guest claim a username/email/password on their existing account —
// same email-verification gate as a fresh signup, so their data carries
// over instead of starting fresh.
router.post('/upgrade/start', requireAuth, async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const validationError = await validateNewAccountFields({ username, email, password }, req.userId);
    if (validationError) {
      return res.status(validationError.status).json({ error: validationError.error });
    }

    await startVerification(res, { username, email, password, upgradeForUserId: req.userId });
  } catch (err) {
    next(err);
  }
});

router.post('/upgrade/verify', requireAuth, async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const pending = await PendingRegistration.findOne({ upgradeForUserId: req.userId });
    if (!pending || pending.expiresAt < new Date()) {
      return res.status(400).json({ error: 'That code has expired — request a new one' });
    }

    if (pending.code !== String(code).trim()) {
      pending.attempts += 1;
      if (pending.attempts >= MAX_ATTEMPTS) {
        await pending.deleteOne();
        return res.status(400).json({ error: 'Too many incorrect attempts — request a new code' });
      }
      await pending.save();
      return res.status(400).json({ error: 'Incorrect code' });
    }

    const conflict = await User.findOne({
      _id: { $ne: req.userId },
      $or: [{ username: pending.username }, { email: pending.email }],
    });
    if (conflict) {
      await pending.deleteOne();
      return res.status(409).json({ error: 'That username or email was just taken — start again' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        username: pending.username,
        email: pending.email,
        passwordHash: pending.passwordHash,
        isGuest: false,
        name: pending.username,
      },
      { new: true, runValidators: true },
    );
    await pending.deleteOne();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(sanitizeUser(user));
  } catch (err) {
    next(err);
  }
});

router.post('/upgrade/resend', requireAuth, async (req, res, next) => {
  try {
    const pending = await PendingRegistration.findOne({ upgradeForUserId: req.userId });
    if (!pending) {
      return res.status(404).json({ error: 'No pending upgrade — start again' });
    }

    pending.code = generateCode();
    pending.attempts = 0;
    pending.expiresAt = new Date(Date.now() + CODE_TTL_MS);
    await pending.save();

    try {
      await sendVerificationCode(pending.email, pending.code);
    } catch {
      return res.status(502).json({ error: "Couldn't send the verification email. Try again shortly." });
    }

    res.json({ message: 'Verification code resent' });
  } catch (err) {
    next(err);
  }
});

export default router;
