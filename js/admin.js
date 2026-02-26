/*
 * Simplified admin dashboard integrated with the API.
 *
 * Displays a list of articles and allows admins to publish,
 * archive, and toggle featured status via API calls.  Other
 * sections (review queue, applications, users, ads, featured, analytics)
 * are omitted for brevity but can be built similarly by consuming
 * appropriate API endpoints.
 */

document.addEventListener('DOMContentLoaded', () => {
  (async () => {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
      window.location.href = 'index.html';
      return;
    }
    populateHeader(user);
    await renderArticlesSection();
  })();
});

async function renderArticlesSection() {
  const container = document.getElementById('section-articles');
  if (!container) return;
  container.innerHTML = '<h4>All Articles</h4>';
  try {
    const articles = await apiGetArticles();
    if (!articles || articles.length === 0) {
      container.innerHTML += '<p>No articles found.</p>';
      return;
    }
    const table = document.createElement('table');
    table.className = 'table';
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Title</th><th>Region</th><th>Category</th><th>Status</th><th>Featured</th><th>Actions</th></tr>';
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    articles.forEach(article => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${article.title}</td><td>${article.region}</td><td>${article.category}</td><td>${article.status}</td><td>${article.isFeatured ? 'Yes' : 'No'}</td>`;
      const actionsTd = document.createElement('td');
      // Publish/unpublish actions
      if (article.status === 'draft' || article.status === 'pending-review') {
        const publishBtn = createActionButton('Publish', async () => {
          await apiUpdateArticle(article._id, { status: 'published' });
          await renderArticlesSection();
        });
        actionsTd.appendChild(publishBtn);
      }
      if (article.status === 'published') {
        const archiveBtn = createActionButton('Archive', async () => {
          await apiUpdateArticle(article._id, { status: 'archived' });
          await renderArticlesSection();
        });
        actionsTd.appendChild(archiveBtn);
      }
      if (article.status === 'archived') {
        const restoreBtn = createActionButton('Restore', async () => {
          await apiUpdateArticle(article._id, { status: 'published' });
          await renderArticlesSection();
        });
        actionsTd.appendChild(restoreBtn);
      }
      // Toggle featured
      if (article.status === 'published') {
        const featureBtn = createActionButton(article.isFeatured ? 'Unfeature' : 'Feature', async () => {
          await apiUpdateArticle(article._id, { isFeatured: !article.isFeatured });
          await renderArticlesSection();
        });
        actionsTd.appendChild(featureBtn);
      }
      tr.appendChild(actionsTd);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  } catch (err) {
    container.innerHTML += `<p>Error loading articles: ${err.message}</p>`;
  }
}

function createActionButton(label, onClick) {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}