const mongoose = require('mongoose');

/**
 * Comment schema stores threaded comments for articles.  Each comment can
 * reference a parent comment to enable simple one‑level threading.  Removal
 * flags allow moderators or administrators to soft‑delete comments without
 * permanently erasing them.  Likes are counted as numbers rather than
 * storing user references for simplicity.
 */
const commentSchema = new mongoose.Schema(
  {
    article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    likes: { type: Number, default: 0 },
    removed: { type: Boolean, default: false },
    removedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);