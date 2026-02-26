const mongoose = require('mongoose');

/**
 * Article schema stores the core news and review content for AtlasRegion7.  It
 * includes regional targeting fields, categorization and metadata such as
 * trending score and featured status.  Articles can be in various
 * publication states allowing for writer, reviewer and admin workflows.
 */
const articleSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    region: {
      type: String,
      enum: [
        'north-america',
        'south-america',
        'western-europe',
        'eastern-europe',
        'asia',
        'africa',
        'oceania'
      ],
      required: true
    },
    title: { type: String, required: true },
    subtitle: { type: String },
    excerpt: { type: String },
    content: { type: [String], required: true },
    image: { type: String },
    category: { type: String, enum: ['news', 'review', 'esports', 'other'], default: 'news' },
    date: { type: Date, default: Date.now },
    author: { type: String, required: true },
    trendingScore: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'pending-review', 'published', 'archived'], default: 'draft' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Article', articleSchema);