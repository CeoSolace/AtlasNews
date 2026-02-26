/*
 * Simplified writer dashboard integrated with the API.
 *
 * Writers can view their articles and create new drafts.  Drafts are
 * created via the API and saved with status 'draft'.  Publishing is
 * handled by admins.  Editing existing drafts is not implemented
 * here for brevity.
 */

document.addEventListener('DOMContentLoaded', () => {
  (async () => {
    const user = getCurrentUser();
    if (!user || user.role !== 'writer') {
      window.location.href = 'index.html';
      return;
    }
    populateHeader(user);
    await renderWriterArticles(user);
    initDraftForm(user);
  })();
});

async function renderWriterArticles(user) {
  const container = document.getElementById('writer-articles');
  if (!container) return;
  container.innerHTML = '<h4>Your Articles</h4>';
  try {
    const articles = await apiGetArticles();
    const list = articles.filter(a => a.author === user.username);
    if (list.length === 0) {
      container.innerHTML += '<p>You have not created any articles yet.</p>';
      return;
    }
    const table = document.createElement('table');
    table.className = 'table';
    table.innerHTML = '<thead><tr><th>Title</th><th>Status</th><th>Date</th></tr></thead>';
    const tbody = document.createElement('tbody');
    list.forEach(article => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${article.title}</td><td>${article.status}</td><td>${formatDate(article.date)}</td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  } catch (err) {
    container.innerHTML += `<p>Error loading articles: ${err.message}</p>`;
  }
}

function initDraftForm(user) {
  const form = document.getElementById('draft-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('draft-title').value.trim();
    const subtitle = document.getElementById('draft-subtitle').value.trim();
    const region = document.getElementById('draft-region').value;
    const category = document.getElementById('draft-category').value;
    const content = document.getElementById('draft-content').value.trim();
    if (!title || !content) return;
    const slug = slugify(title);
    const article = {
      slug,
      region,
      title,
      subtitle,
      excerpt: content.substring(0, 120) + '…',
      content: content.split(/\n+/),
      image: 'assets/hero-controller.png',
      category,
      // date will be set by backend; author is derived from JWT
    };
    try {
      await apiCreateArticle(article);
      form.reset();
      await renderWriterArticles(user);
    } catch (err) {
      alert(err.message);
    }
  });
}

// Slugify function to create URL-friendly slugs from titles
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}