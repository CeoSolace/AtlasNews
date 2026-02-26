/*
 * API client for AtlasRegion7
 *
 * Provides helper functions to communicate with the backend API. Each
 * function returns a promise that resolves with the parsed JSON data
 * from the response or throws an error if the request fails.  The JWT
 * token stored in localStorage is automatically included in the
 * Authorization header when present.
 */

// Helper to build query strings from parameter objects
function buildQuery(params) {
  const query = Object.entries(params || {})
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return query ? `?${query}` : '';
}

// Internal function to perform API requests with token
async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('ar7_token');
  const headers = options.headers ? { ...options.headers } : {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Default to JSON content-type for POST/PUT/PATCH requests when body is an object
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  const response = await fetch(`/api${path}`, { ...options, headers });
  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }
  if (!response.ok) {
    const message = data && data.message ? data.message : `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return data;
}

// Authentication
async function apiLogin(email, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password }
  });
  // Save token and user data to localStorage
  localStorage.setItem('ar7_token', data.token);
  localStorage.setItem('ar7_user', JSON.stringify(data.user));
  return data;
}

async function apiRegister({ username, email, password, plan }) {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: { username, email, password, plan }
  });
  return data;
}

// Articles
async function apiGetArticles(params = {}) {
  const query = buildQuery(params);
  return apiRequest(`/articles${query}`, { method: 'GET' });
}

async function apiGetArticle(slug) {
  return apiRequest(`/articles/${slug}`, { method: 'GET' });
}

async function apiCreateArticle(article) {
  // article should include slug, region, title, content, etc.
  return apiRequest('/articles', { method: 'POST', body: article });
}

async function apiUpdateArticle(id, updates) {
  return apiRequest(`/articles/${id}`, { method: 'PUT', body: updates });
}

// Comments
async function apiGetComments(slug) {
  return apiRequest(`/comments/${slug}`, { method: 'GET' });
}

async function apiPostComment(slug, content, parentId = null) {
  return apiRequest(`/comments/${slug}`, {
    method: 'POST',
    body: { content, parentId }
  });
}

async function apiLikeComment(id) {
  return apiRequest(`/comments/${id}/like`, { method: 'PATCH' });
}

async function apiDeleteComment(id) {
  return apiRequest(`/comments/${id}`, { method: 'DELETE' });
}

// Ads
async function apiGetAds(params = {}) {
  const query = buildQuery(params);
  return apiRequest(`/ads${query}`, { method: 'GET' });
}

// Users (for future use)
async function apiGetUsers(params = {}) {
  const query = buildQuery(params);
  return apiRequest(`/users${query}`, { method: 'GET' });
}

// Expose functions globally
window.apiLogin = apiLogin;
window.apiRegister = apiRegister;
window.apiGetArticles = apiGetArticles;
window.apiGetArticle = apiGetArticle;
window.apiCreateArticle = apiCreateArticle;
window.apiUpdateArticle = apiUpdateArticle;
window.apiGetComments = apiGetComments;
window.apiPostComment = apiPostComment;
window.apiLikeComment = apiLikeComment;
window.apiDeleteComment = apiDeleteComment;
window.apiGetAds = apiGetAds;
window.apiGetUsers = apiGetUsers;