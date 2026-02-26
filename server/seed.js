/*
 * Seed script for AtlasRegion7
 *
 * This script populates the MongoDB database with sample data for users,
 * articles, comments and ads using the JSON files from the data folder.
 * Passwords are generated using bcrypt for each user.  Emails are
 * constructed based on the username.  Comment relationships are set up
 * by resolving article slugs to their ObjectIds and user IDs to user
 * documents.  Removed comments and removedBy relationships are handled
 * similarly.
 *
 * Usage:
 *   node seed.js
 *
 * Ensure that the environment variable MONGODB_URI is set in your
 * .env file or environment prior to running this script.  The
 * JWT_SECRET is not required here.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

const User = require('./models/User');
const Article = require('./models/Article');
const Comment = require('./models/Comment');
const Ad = require('./models/Ad');

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI must be set in your .env file');
      process.exit(1);
    }
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Clear existing collections
    await User.deleteMany({});
    await Article.deleteMany({});
    await Comment.deleteMany({});
    await Ad.deleteMany({});
    console.log('Cleared existing data');

    // Load JSON data
    const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/users.json'), 'utf8'));
    const articlesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/articles.json'), 'utf8'));
    const commentsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/comments.json'), 'utf8'));
    const adsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/ads.json'), 'utf8'));

    // Create users
    const users = [];
    for (const u of usersData) {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash('password', salt);
      const email = `${u.username.toLowerCase()}@atlasregion7.com`;
      const user = new User({
        username: u.username,
        email,
        password: hashed,
        role: u.role,
        plan: u.plan,
        subscriptionStart: u.subscriptionStart || null,
        subscriptionExpires: u.subscriptionExpires || null,
        isEmailVerified: true
      });
      await user.save();
      users.push(user);
    }
    console.log(`Inserted ${users.length} users`);

    // Helper to pick trendingScore if missing
    function calcTrending(article) {
      // Use random trending scores if not provided
      return article.trendingScore || Math.floor(Math.random() * 100);
    }

    // Create articles
    const articles = [];
    for (const a of articlesData) {
      const author = users.find(u => u.username === a.author) || users[0];
      const article = new Article({
        slug: a.slug,
        region: a.region,
        title: a.title,
        subtitle: a.subtitle,
        excerpt: a.excerpt,
        content: a.content,
        image: a.image,
        category: a.category,
        date: a.date,
        author: author.username,
        trendingScore: a.trendingScore || calcTrending(a),
        isFeatured: a.isFeatured || false,
        status: a.status || 'published'
      });
      await article.save();
      articles.push(article);
    }
    console.log(`Inserted ${articles.length} articles`);

    // Map article slug to id and user id mapping
    const articleMap = {};
    for (const art of articles) {
      articleMap[art.slug] = art;
    }
    const userMap = {};
    for (const user of users) {
      userMap[user.username] = user;
    }

    // Create comments
    const comments = [];
    for (const c of commentsData) {
      const article = articleMap[c.articleSlug];
      if (!article) continue;
      const user = users.find(u => u.username === getUsernameById(usersData, c.userId));
      if (!user) continue;
      // Determine parent comment (optional)
      let parent = null;
      if (c.parentId) {
        // We'll create a stub comment first then update parent references after insertion
      }
      const comment = new Comment({
        article: article._id,
        user: user._id,
        parent: null, // will fix after all comments inserted
        content: c.content,
        timestamp: c.timestamp,
        likes: c.likes || 0,
        removed: c.removed || false,
        removedBy: null
      });
      await comment.save();
      comments.push({ originalId: c.id, doc: comment, parentId: c.parentId, removedById: c.removedBy });
    }
    console.log(`Inserted ${comments.length} comments (initial pass)`);
    // Fix parent and removedBy references
    for (const item of comments) {
      const { doc, parentId, removedById } = item;
      if (parentId) {
        const parent = comments.find(c => c.originalId === parentId);
        if (parent) doc.parent = parent.doc._id;
      }
      if (removedById) {
        // find user by ID from usersData
        const removedByUsername = getUsernameById(usersData, removedById);
        const removedByUser = users.find(u => u.username === removedByUsername);
        if (removedByUser) doc.removedBy = removedByUser._id;
      }
      await doc.save();
    }
    console.log('Updated comment parent and removedBy references');

    // Create ads
    const ads = [];
    for (const adData of adsData) {
      const ad = new Ad({
        name: adData.name,
        image: adData.image,
        link: adData.link,
        location: adData.location,
        regions: adData.regions,
        startDate: adData.startDate,
        endDate: adData.endDate
      });
      await ad.save();
      ads.push(ad);
    }
    console.log(`Inserted ${ads.length} ads`);

    console.log('Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// Helper to get username by userId from original users JSON
function getUsernameById(usersJson, id) {
  const user = usersJson.find(u => u.id === id);
  return user ? user.username : null;
}

seed();