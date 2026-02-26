const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user.  Expects username, email and password in the body.
 * A role may optionally be specified but defaults to 'user'.  Passwords
 * are hashed using bcrypt prior to storage.  Email verification is
 * intentionally not implemented; isEmailVerified remains false until
 * implemented in a future feature.
 */
router.post('/register', async (req, res) => {
  const { username, email, password, role, plan } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email and password are required' });
  }
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const user = new User({
        username,
        email,
        password: hashed,
        role: role || 'user',
        plan: plan || 'free'
      });
      await user.save();
      res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate a user.  Expects email and password in the body.  If
 * successful, returns a signed JWT along with basic user details.  The
 * client should store this token (e.g., in localStorage) and include it
 * in subsequent requests via the Authorization header.
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    // Build JWT payload
    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    // Return user info excluding password
    const { password: pwd, ...userData } = user.toObject();
    res.json({ token, user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;