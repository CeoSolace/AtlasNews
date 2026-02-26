/*
 * Main script for the AtlasRegion7 homepage (API-driven).
 *
 * This script fetches articles and ads from the backend API and
 * dynamically renders the hero section, top stories, trending global
 * stories, latest reviews and regional highlights.  It also manages
 * region switching and populates the header with the current user.
 */

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  if (!user) {
    // Not logged in; redirect to login page
    window.location.href = 'login.html';
    return;
  }
  // Populate username or role in header
  populateHeader(user);

  const region = getRegionPreference();
  setHomeMetaTags(region);
  buildRegionStrip(region);

  // Fetch and render content asynchronously
  (async () => {
    try {
      // Fetch articles for the selected region
      const regionArticles = await apiGetArticles({ region });

      // Fetch global trending articles
      const globalTrending = await apiGetArticles({ trending: 'true', limit: 8 });

      // Fetch latest reviews
      const latestReviews = await apiGetArticles({ category: 'review', limit: 8 });

      // Render hero section: featured articles (isFeatured=true) then fallback to top trending
      const heroArticles = getHeroArticles(regionArticles);
      renderHeroSection(heroArticles);

      // Render top stories: exclude featured; sort by trendingScore descending
      const topStories = getTopStories(regionArticles, heroArticles);
      renderTopStories(topStories);

      // Render trending global: top 4 from globalTrending
      renderTrendingGlobal(globalTrending.slice(0, 4));

      // Render latest reviews: sort by date descending and take top 4
      latestReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
      renderLatestReviews(latestReviews.slice(0, 4));

      // Render regional highlights: take articles sorted by trendingScore and skip top 3 trending
      const highlights = getRegionalHighlights(regionArticles, heroArticles);
      renderRegionalHighlights(highlights);

      // Render ads for free users
      if (user.plan === 'free') {
        await renderAds(region);
      } else {
        // Remove any existing ad elements
        const adContainers = document.querySelectorAll('.ad');
        adContainers.forEach(el => el.remove());
      }
    } catch (err) {
      console.error('Error loading homepage:', err.message);
    }
  })();
});

function buildRegionStrip(activeRegion) {
  const regions = [
    'north-america',
    'south-america',
    'western-europe',
    'eastern-europe',
    'asia',
    'africa',
    'oceania'
  ];
  const strip = document.getElementById('region-strip');
  if (!strip) return;
  strip.innerHTML = '';
  regions.forEach(region => {
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = region.replace('-', ' ');
    if (region === activeRegion) {
      link.classList.add('active');
    }
    link.addEventListener('click', (e) => {
      e.preventDefault();
      setRegionPreference(region);
      window.location.reload();
    });
    strip.appendChild(link);
  });
}

// Determine featured and fallback articles for hero section
function getHeroArticles(articles) {
  const featured = articles.filter(a => a.isFeatured);
  if (featured.length >= 3) {
    // sort featured by trendingScore descending
    return featured.sort((a, b) => b.trendingScore - a.trendingScore).slice(0, 3);
  }
  // Otherwise, take top trending from all articles
  const sorted = [...articles].sort((a, b) => b.trendingScore - a.trendingScore);
  return sorted.slice(0, 3);
}

// Determine top stories (excluding hero articles)
function getTopStories(articles, heroArticles) {
  const heroIds = new Set(heroArticles.map(a => a._id || a.slug));
  const nonHero = articles.filter(a => !heroIds.has(a._id || a.slug));
  nonHero.sort((a, b) => b.trendingScore - a.trendingScore);
  return nonHero.slice(0, 6);
}

// Determine regional highlights: skip top trending (hero + top stories) and take next 4
function getRegionalHighlights(articles, heroArticles) {
  // Skip the hero articles and top trending (top 6 stories).  We'll skip first 9 items.
  const sorted = [...articles].sort((a, b) => b.trendingScore - a.trendingScore);
  const highlights = sorted.slice(9); // skip top 9 (3 hero + 6 top stories)
  return highlights.slice(0, 4);
}

function renderHeroSection(articles) {
  const heroContainer = document.getElementById('hero-section');
  if (!heroContainer) return;
  heroContainer.innerHTML = '';
  if (!articles || articles.length === 0) return;
  // Primary card
  const primary = articles[0];
  const primaryCard = createHeroCard(primary, true);
  heroContainer.appendChild(primaryCard);
  // Secondary cards
  const sideContainer = document.createElement('div');
  sideContainer.style.display = 'flex';
  sideContainer.style.flexDirection = 'column';
  sideContainer.style.gap = '1rem';
  for (let i = 1; i < articles.length; i++) {
    const sec = createHeroCard(articles[i], false);
    sec.style.height = '145px';
    sideContainer.appendChild(sec);
  }
  heroContainer.appendChild(sideContainer);
}

function renderTopStories(stories) {
  const container = document.getElementById('top-stories');
  if (!container) return;
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'article-grid';
  stories.forEach(article => {
    const card = createArticleCard(article);
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

function renderTrendingGlobal(stories) {
  const container = document.getElementById('trending-global');
  if (!container) return;
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'article-grid';
  stories.forEach(article => {
    const card = createArticleCard(article);
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

function renderLatestReviews(stories) {
  const container = document.getElementById('latest-reviews');
  if (!container) return;
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'article-grid';
  stories.forEach(article => {
    const card = createArticleCard(article);
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

function renderRegionalHighlights(stories) {
  const container = document.getElementById('regional-highlights');
  if (!container) return;
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'article-grid';
  stories.forEach(article => {
    const card = createArticleCard(article);
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

function createHeroCard(article, large) {
  const card = document.createElement('div');
  card.className = 'hero-card';
  card.style.height = large ? '300px' : '145px';
  const img = document.createElement('img');
  img.src = article.image;
  img.alt = article.title;
  const content = document.createElement('div');
  content.className = 'hero-content';
  const title = document.createElement('h2');
  title.textContent = article.title;
  const subtitle = document.createElement('p');
  subtitle.textContent = article.subtitle || '';
  content.appendChild(title);
  content.appendChild(subtitle);
  card.appendChild(img);
  card.appendChild(content);
  card.addEventListener('click', () => {
    window.location.href = `article.html?slug=${article.slug}`;
  });
  return card;
}

function createArticleCard(article) {
  const card = document.createElement('div');
  card.className = 'article-card';
  const img = document.createElement('img');
  img.src = article.image;
  img.alt = article.title;
  const content = document.createElement('div');
  content.className = 'article-card-content';
  const title = document.createElement('h4');
  title.textContent = article.title;
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = `${formatDate(article.date)} • ${article.region.replace('-', ' ')}`;
  content.appendChild(title);
  content.appendChild(meta);
  card.appendChild(img);
  card.appendChild(content);
  card.addEventListener('click', () => {
    window.location.href = `article.html?slug=${article.slug}`;
  });
  return card;
}

async function renderAds(region) {
  // Top banner
  const topContainer = document.getElementById('ad-top');
  if (topContainer) {
    try {
      const ads = await apiGetAds({ location: 'top-banner', region });
      if (ads.length > 0) {
        const adEl = createAdElement(ads[0]);
        topContainer.appendChild(adEl);
      }
    } catch (err) {
      console.error('Failed to load top ad:', err.message);
    }
  }
  // Sidebar
  const sidebarContainer = document.getElementById('ad-sidebar');
  if (sidebarContainer) {
    try {
      const ads = await apiGetAds({ location: 'sidebar', region });
      if (ads.length > 0) {
        const adEl = createAdElement(ads[0]);
        sidebarContainer.appendChild(adEl);
      }
    } catch (err) {
      console.error('Failed to load sidebar ad:', err.message);
    }
  }
}

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