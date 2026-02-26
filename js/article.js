/*
 * Article page script (API-driven).
 *
 * Fetches an article by slug from the API, renders its content, loads
 * comments, and handles posting, liking and deleting comments.  Ads
 * within the article are loaded via the ads API.  Comment TTL rules
 * apply for free users, hiding older comments.  Moderators and
 * admins can remove comments.
 */

document.addEventListener('DOMContentLoaded', () => {
  (async () => {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    populateHeader(user);
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    if (!slug) {
      window.location.href = 'index.html';
      return;
    }
    try {
      // Fetch article details
      const article = await apiGetArticle(slug);
      setMetaTags(article);
      renderArticle(article);
      // Ads
      if (user.plan === 'free') {
        await renderArticleAds(article.region);
      }
      // Load comments
      await loadAndRenderComments(article, user);
      // Comment form submission (top-level comments)
      const form = document.getElementById('comment-form');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const textarea = form.querySelector('textarea');
          const content = textarea.value.trim();
          if (!content) return;
          try {
            await apiPostComment(slug, content, null);
            textarea.value = '';
            await loadAndRenderComments(article, user);
          } catch (err) {
            alert(err.message);
          }
        });
      }
    } catch (err) {
      console.error('Failed to load article:', err.message);
      window.location.href = 'index.html';
    }
  })();
});

function renderArticle(article) {
  const titleEl = document.getElementById('article-title');
  const subtitleEl = document.getElementById('article-subtitle');
  const metaEl = document.getElementById('article-meta');
  const imageEl = document.getElementById('article-image');
  const contentEl = document.getElementById('article-content');
  titleEl.textContent = article.title;
  subtitleEl.textContent = article.subtitle || '';
  metaEl.textContent = `${formatDate(article.date)} • ${article.author} • ${article.region.replace('-', ' ')}`;
  imageEl.src = article.image;
  imageEl.alt = article.title;
  contentEl.innerHTML = '';
  // Support both string and array content; if string, split by paragraph breaks
  const paragraphs = Array.isArray(article.content) ? article.content : (article.content || '').split('\n');
  paragraphs.forEach(par => {
    const p = document.createElement('p');
    p.textContent = par;
    contentEl.appendChild(p);
  });
  document.title = `${article.title} – AtlasRegion7`;
}

function setMetaTags(article) {
  const head = document.head;
  if (!head) return;
  // Remove previous dynamic meta tags
  const previous = head.querySelectorAll('meta[data-dynamic-meta], script[data-dynamic-meta]');
  previous.forEach(el => el.remove());
  const metaDefs = [
    { attr: 'property', name: 'og:title', content: `${article.title} – AtlasRegion7` },
    { attr: 'property', name: 'og:description', content: article.subtitle || article.excerpt || '' },
    { attr: 'property', name: 'og:image', content: article.image },
    { attr: 'property', name: 'og:url', content: window.location.href },
    { attr: 'property', name: 'og:type', content: 'article' },
    { attr: 'name',     name: 'twitter:card', content: 'summary_large_image' },
    { attr: 'name',     name: 'twitter:title', content: article.title },
    { attr: 'name',     name: 'twitter:description', content: article.subtitle || article.excerpt || '' },
    { attr: 'name',     name: 'twitter:image', content: article.image }
  ];
  metaDefs.forEach(def => {
    const meta = document.createElement('meta');
    meta.setAttribute(def.attr, def.name);
    meta.setAttribute('content', def.content);
    meta.setAttribute('data-dynamic-meta', 'true');
    head.appendChild(meta);
  });
  const ldScript = document.createElement('script');
  ldScript.type = 'application/ld+json';
  ldScript.setAttribute('data-dynamic-meta', 'true');
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.subtitle || article.excerpt || '',
    datePublished: article.date,
    dateModified: article.date,
    image: [article.image],
    author: {
      '@type': 'Person',
      name: article.author
    },
    publisher: {
      '@type': 'Organization',
      name: 'AtlasRegion7',
      logo: {
        '@type': 'ImageObject',
        url: `${window.location.origin}/assets/logo.png`
      }
    },
    mainEntityOfPage: window.location.href
  };
  ldScript.textContent = JSON.stringify(ld);
  head.appendChild(ldScript);
}

async function renderArticleAds(region) {
  const topContainer = document.getElementById('article-ad-top');
  if (topContainer) {
    try {
      const ads = await apiGetAds({ location: 'top-banner', region });
      if (ads.length > 0) {
        const el = createAdElement(ads[0]);
        topContainer.appendChild(el);
      }
    } catch (err) {
      console.error('Failed to load article top ad:', err.message);
    }
  }
  const midContainer = document.getElementById('article-ad-mid');
  if (midContainer) {
    try {
      const ads = await apiGetAds({ location: 'mid-article', region });
      if (ads.length > 0) {
        const el = createAdElement(ads[0]);
        midContainer.appendChild(el);
      }
    } catch (err) {
      console.error('Failed to load article mid ad:', err.message);
    }
  }
}

// Create an advertisement element for article pages
function createAdElement(ad) {
  const wrapper = document.createElement('div');
  wrapper.className = 'ad';
  const label = document.createElement('span');
  label.className = 'sponsored';
  label.textContent = 'Sponsored';
  wrapper.appendChild(label);
  if (ad.image) {
    const img = document.createElement('img');
    img.src = ad.image;
    img.alt = ad.name;
    wrapper.appendChild(img);
  } else {
    const message = document.createElement('p');
    message.style.color = 'var(--color-gold)';
    message.style.fontSize = '0.9rem';
    message.style.padding = '0.5rem 0';
    message.textContent = ad.name;
    wrapper.appendChild(message);
  }
  wrapper.addEventListener('click', () => {
    if (ad.link) {
      window.open(ad.link, '_blank');
    }
  });
  return wrapper;
}

async function loadAndRenderComments(article, user) {
  try {
    const comments = await apiGetComments(article.slug);
    // Build tree structure: map parentId to children
    const byParent = {};
    comments.forEach(c => {
      const pid = c.parent ? c.parent.toString() : null;
      if (!byParent[pid]) byParent[pid] = [];
      byParent[pid].push(c);
    });
    const container = document.getElementById('comments-container');
    if (!container) return;
    container.innerHTML = '';
    // Render top-level comments
    const parents = byParent[null] || [];
    // Sort by timestamp ascending
    parents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    parents.forEach(parent => {
      renderCommentElement(parent, byParent, container, user, 0, article);
    });
  } catch (err) {
    console.error('Failed to load comments:', err.message);
  }
}

function renderCommentElement(comment, byParent, container, user, depth, article) {
  // TTL filtering for free users
  if (user.plan === 'free' && isCommentExpired(comment)) {
    return;
  }
  const wrapper = document.createElement('div');
  wrapper.className = 'comment';
  wrapper.style.marginLeft = depth * 1 + 'rem';
  // Store comment id on element for reply positioning
  wrapper.dataset.commentId = comment._id;
  // Apply removed style
  if (comment.removed) {
    wrapper.style.opacity = '0.5';
    wrapper.style.fontStyle = 'italic';
  }
  const header = document.createElement('div');
  header.className = 'comment-header';
  const author = document.createElement('span');
  author.className = 'author';
  // comment.user may be populated by API with username and role
  author.textContent = comment.user && comment.user.username ? comment.user.username : 'Unknown';
  const timestamp = document.createElement('span');
  timestamp.className = 'timestamp';
  timestamp.textContent = formatDate(comment.timestamp);
  header.appendChild(author);
  header.appendChild(timestamp);
  const body = document.createElement('div');
  body.className = 'comment-body';
  body.textContent = comment.content;
  const actions = document.createElement('div');
  actions.className = 'comment-actions';
  // Like button
  const likeBtn = document.createElement('button');
  likeBtn.textContent = `👍 ${comment.likes}`;
  likeBtn.addEventListener('click', async () => {
    try {
      const result = await apiLikeComment(comment._id);
      likeBtn.textContent = `👍 ${result.likes}`;
    } catch (err) {
      alert(err.message);
    }
  });
  actions.appendChild(likeBtn);
  // Reply button
  const replyBtn = document.createElement('button');
  replyBtn.textContent = 'Reply';
  replyBtn.addEventListener('click', () => {
    showReplyForm(comment._id, article, user);
  });
  actions.appendChild(replyBtn);
  // Remove button for moderators/admins
  if ((user.role === 'moderator' || user.role === 'admin') && !comment.removed) {
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', async () => {
      try {
        await apiDeleteComment(comment._id);
        await loadAndRenderComments(article, user);
      } catch (err) {
        alert(err.message);
      }
    });
    actions.appendChild(removeBtn);
  }
  wrapper.appendChild(header);
  wrapper.appendChild(body);
  wrapper.appendChild(actions);
  container.appendChild(wrapper);
  // Render replies
  const replies = byParent[comment._id.toString()] || [];
  // Sort by timestamp ascending
  replies.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  replies.forEach(reply => {
    renderCommentElement(reply, byParent, container, user, depth + 1, article);
  });
}

// Show reply form below a comment
function showReplyForm(parentId, article, user) {
  const container = document.getElementById('comments-container');
  if (!container) return;
  // Remove any existing reply forms
  const existing = document.querySelectorAll('.reply-form');
  existing.forEach(el => el.remove());
  const form = document.createElement('form');
  form.className = 'reply-form comment-form';
  const textarea = document.createElement('textarea');
  textarea.required = true;
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.textContent = 'Post Reply';
  form.appendChild(textarea);
  form.appendChild(submit);
  // Insert after the parent comment element if found
  const parentEl = container.querySelector(`[data-comment-id="${parentId}"]`);
  if (parentEl) {
    parentEl.after(form);
  } else {
    container.appendChild(form);
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = textarea.value.trim();
    if (!content) return;
    try {
      await apiPostComment(article.slug, content, parentId);
      await loadAndRenderComments(article, user);
    } catch (err) {
      alert(err.message);
    }
  });
}