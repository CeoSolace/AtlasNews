const express = require('express');
const Article = require('../models/Article');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/articles
 * Retrieve a list of published articles.  Optional query parameters:
 *  - region: filter by region slug
 *  - category: filter by category (news, review, esports, etc.)
 *  - limit: maximum number of articles to return
 *  - trending: if "true", sort by trendingScore descending
 *  - featured: if "true", return only featured articles
 */
router.get('/', async (req, res) => {
  try {
    const { region, category, limit, trending, featured } = req.query;
    const filter = { status: 'published' };
    if (region) filter.region = region;
    if (category) filter.category = category;
    if (featured === 'true') filter.isFeatured = true;
    let query = Article.find(filter);
    if (trending === 'true') {
      query = query.sort({ trendingScore: -1 });
    } else {
      // Default sort by date descending
      query = query.sort({ date: -1 });
    }
    const max = limit ? parseInt(limit, 10) : null;
    if (max) query = query.limit(max);
    const articles = await query.exec();
    res.json(articles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/articles/:slug
 * Retrieve a single article by its slug.  Returns 404 if not found.
 */
router.get('/:slug', async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug });
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/articles
 * Create a new article.  Requires authentication and writer or admin role.
 * The request body should include slug, region, title, content and other
 * fields.  Status is set to draft by default, pending review if specified.
 */
router.post('/', authenticate, authorize('writer', 'admin'), async (req, res) => {
  try {
    const {
      slug,
      region,
      title,
      subtitle,
      excerpt,
      content,
      image,
      category
    } = req.body;
    if (!slug || !region || !title || !content) {
      return res.status(400).json({ message: 'Slug, region, title and content are required' });
    }
    const exists = await Article.findOne({ slug });
    if (exists) {
      return res.status(400).json({ message: 'Slug already exists' });
    }
    const article = new Article({
      slug,
      region,
      title,
      subtitle,
      excerpt,
      content,
      image,
      category,
      author: req.user.username,
      status: req.user.role === 'writer' ? 'draft' : 'published'
    });
    await article.save();
    res.status(201).json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /api/articles/:id
 * Update an existing article.  Writers can edit their own drafts; admins
 * can edit any article.  The body can include any updatable fields.  If
 * status transitions are attempted, authorization is enforced: writers
 * cannot publish articles directly.
 */
router.put('/:id', authenticate, authorize('writer', 'admin'), async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });
    // Writers can only edit drafts they authored
    if (req.user.role === 'writer' && article.author !== req.user.username) {
      return res.status(403).json({ message: 'You can only edit your own articles' });
    }
    // Writers cannot change status from draft to published
    if (req.user.role === 'writer' && req.body.status && req.body.status !== 'draft') {
      return res.status(403).json({ message: 'Writers cannot publish articles' });
    }
    Object.assign(article, req.body);
    await article.save();
    res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;