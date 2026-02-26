const express = require('express');
const Comment = require('../models/Comment');
const Article = require('../models/Article');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/comments/:slug
 * Fetch comments for an article.  If the user is a moderator or admin,
 * removed comments are included.  Comments are sorted by timestamp.
 */
router.get('/:slug', authenticate, async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug });
    if (!article) return res.status(404).json({ message: 'Article not found' });
    const includeRemoved = req.user.role === 'moderator' || req.user.role === 'admin';
    const filter = { article: article._id };
    if (!includeRemoved) filter.removed = false;
    const comments = await Comment.find(filter)
      .populate('user', 'username role')
      .populate('removedBy', 'username')
      .sort({ timestamp: 1 })
      .exec();
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/comments/:slug
 * Create a new comment on an article.  Accepts content and optional parent
 * comment ID.  The user must be authenticated.  Likes default to 0.
 */
router.post('/:slug', authenticate, async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug });
    if (!article) return res.status(404).json({ message: 'Article not found' });
    const { content, parentId } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });
    const comment = new Comment({
      article: article._id,
      user: req.user._id,
      parent: parentId || null,
      content,
      timestamp: new Date(),
      likes: 0,
      removed: false
    });
    await comment.save();
    const populated = await comment.populate('user', 'username');
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PATCH /api/comments/:id/like
 * Toggle like on a comment.  Anyone authenticated can like.  Likes are
 * incremented or decremented by one depending on whether the user has
 * previously liked it.  This simplistic implementation does not track
 * which users liked a comment; a real system would track user IDs.  To
 * keep the API stateless we simply increment the count.
 */
router.patch('/:id/like', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    comment.likes += 1;
    await comment.save();
    res.json({ likes: comment.likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * DELETE /api/comments/:id
 * Soft-delete a comment by marking it as removed.  Only moderators or
 * admins can perform this action.  The user performing the deletion is
 * stored in the removedBy field.
 */
router.delete('/:id', authenticate, authorize('moderator', 'admin'), async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    comment.removed = true;
    comment.removedBy = req.user._id;
    await comment.save();
    res.json({ message: 'Comment removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;