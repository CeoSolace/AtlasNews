/*
 * Common utility functions for AtlasRegion7
 *
 * These helpers handle user sessions, region preferences, date parsing and
 * advertisement selection. Storing state in localStorage allows the site to
 * behave like a basic single‑page application while remaining completely
 * static. If a backend is later introduced these functions can be replaced
 * with API calls.
 */

// Retrieve the active user from localStorage. If no user is logged in, null is returned.
function getCurrentUser() {
  // If a serialized user object exists in localStorage, return it
  const storedUser = localStorage.getItem('ar7_user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return user;
    } catch (e) {
      console.warn('Failed to parse stored user');
    }
  }
  return null;
}

// Legacy loginUser function removed; login is handled via API.

// Log out the user
function logoutUser() {
  // Clear session information
  localStorage.removeItem('ar7_user');
  localStorage.removeItem('ar7_token');
}

// Get the preferred region; defaults to 'north-america'
function getRegionPreference() {
  return localStorage.getItem('ar7_region') || 'north-america';
}

// Set the preferred region
function setRegionPreference(region) {
  localStorage.setItem('ar7_region', region);
}

// Parse ISO date strings into Date objects
function parseDate(str) {
  return new Date(str);
}

// Advertisement helpers are now fetched via API; isAdActive and getAdForLocation removed.

// Article helper functions removed; articles are fetched and processed via API in page scripts.

// Format date for display (DD MMM YYYY)
function formatDate(dateStr) {
  const date = parseDate(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// User lookup by id removed; users are resolved via API or local session.

/**
 * Populate the header with the logged‑in user's name and plan.  Many
 * pages share a common header structure which includes an element
 * with ID `header-user`.  Clicking the username will log the user
 * out and redirect to the login page.
 *
 * @param {Object} user The user object returned by getCurrentUser().
 */
function populateHeader(user) {
  const userEl = document.getElementById('header-user');
  if (!userEl || !user) return;
  userEl.textContent = `${user.username} (${user.plan})`;
  userEl.addEventListener('click', () => {
    logoutUser();
    window.location.href = 'login.html';
  });
}

// Comment retrieval helpers removed; comments are fetched from the API.

// TTL in days for free users (comments older than this will be hidden)
const COMMENT_TTL_DAYS = 30;

// Determine if comment is expired for free users
function isCommentExpired(comment) {
  const ttlMs = COMMENT_TTL_DAYS * 24 * 60 * 60 * 1000;
  const now = new Date();
  const time = new Date(comment.timestamp);
  return now - time > ttlMs;
}

// Client-side comment creation and persistence removed; comments are managed via API.

// Utility to slugify strings (for generating slugs from titles)
function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}
