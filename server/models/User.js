const mongoose = require('mongoose');

/**
 * User schema defines the structure for storing registered users in the
 * database.  Passwords are hashed before storage using bcrypt (see
 * authentication middleware).  Roles determine which actions the user is
 * permitted to perform.  Email verification is intentionally left
 * unimplemented in this prototype but the field is included for future
 * enhancement.  Subscription fields support paid plans but are optional.
 */
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['user', 'writer', 'reviewer', 'moderator', 'admin'],
      default: 'user'
    },
    plan: {
      type: String,
      enum: ['free', 'paid'],
      default: 'free'
    },
    subscriptionStart: { type: Date },
    subscriptionExpires: { type: Date },
    isEmailVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);