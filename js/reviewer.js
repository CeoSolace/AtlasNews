/*
 * Simplified reviewer dashboard integrated with the API.
 *
 * Reviewers can approve articles or request edits by changing their
 * status via the API.  Only articles with status 'pending-review' are
 * displayed.
 */

document.addEventListener('DOMContentLoaded', () => {
  (async () => {
    const user = getCurrentUser();
    if (!user || user.role !== 'reviewer') {
      window.location.href = 'index.html';
      return;
    }
    populateHeader(user);
    await renderReviewQueue();
  })();
});

async function renderReviewQueue() {
  const container = document.getElementById('reviewer-queue');
  if (!container) return;
  container.innerHTML = '<h4>Pending Articles for Review</h4>';
  try {
    const articles = await apiGetArticles();
    const pending = articles.filter(a => a.status === 'pending-review');
    if (pending.length === 0) {
      container.innerHTML += '<p>No articles to review.</p>';
      return;
    }
    const table = document.createElement('table');
    table.className = 'table';
    table.innerHTML = '<thead><tr><th>Title</th><th>Author</th><th>Date</th><th>Actions</th></tr></thead>';
    const tbody = document.createElement('tbody');
    pending.forEach(article => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${article.title}</td><td>${article.author}</td><td>${formatDate(article.date)}</td>`;
      const actionsTd = document.createElement('td');
      const approveBtn = createActionButton('Approve', async () => {
        await apiUpdateArticle(article._id, { status: 'published' });
        await renderReviewQueue();
      });
      const requestBtn = createActionButton('Request edits', async () => {
        await apiUpdateArticle(article._id, { status: 'draft' });
        await renderReviewQueue();
      });
      actionsTd.appendChild(approveBtn);
      actionsTd.appendChild(requestBtn);
      tr.appendChild(actionsTd);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  } catch (err) {
    container.innerHTML += `<p>Error loading review queue: ${err.message}</p>`;
  }
}

function createActionButton(label, onClick) {
  const btn = document.createElement('button');
  btn.className = 'btn-small';
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}