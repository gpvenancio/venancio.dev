'use strict';

const CONFIG = Object.freeze({
  siteTitle: 'Poesia do Venâncio',
  baseUrl: 'https://venancio.dev/poesia/',
  blogHome: 'https://poesiadovenancio.blogspot.com/',
  feedUrl: 'https://poesiadovenancio.blogspot.com/feeds/posts/default',
  bookUrl: './livro/',
  supportUrl: 'https://buymeacoffee.com/gvenancio',
  contactEmail: 'poesia@venancio.dev',
  maxPosts: 500,
});

const state = {
  posts: [],
  searchIndex: [],
};

const elements = {
  view: document.querySelector('[data-view]'),
  homeOnly: document.querySelector('[data-home-only]'),
  archiveLists: [...document.querySelectorAll('[data-archive-list]')],
  drawer: document.querySelector('[data-drawer]'),
  drawerBackdrop: document.querySelector('[data-drawer-backdrop]'),
  closeMenuButton: document.querySelector('[data-close-menu]'),
  themeToggle: document.querySelector('[data-theme-toggle]'),
  searchDialog: document.querySelector('[data-search-dialog]'),
  searchInput: document.querySelector('[data-search-input]'),
  searchResults: document.querySelector('[data-search-results]'),
  homeShareButton: document.querySelector('[data-share-home]'),
  shareDialog: document.querySelector('[data-share-dialog]'),
  closeShareButton: document.querySelector('[data-close-share]'),
  sharePreviewTitle: document.querySelector('[data-share-preview-title]'),
  shareWhatsApp: document.querySelector('[data-share-whatsapp]'),
  shareEmail: document.querySelector('[data-share-email]'),
  shareFacebook: document.querySelector('[data-share-facebook]'),
  shareTelegram: document.querySelector('[data-share-telegram]'),
  nativeShareButton: document.querySelector('[data-native-share]'),
  copyShareButton: document.querySelector('[data-copy-share]'),
  shareFeedback: document.querySelector('[data-share-feedback]'),
  backToTopButton: document.querySelector('[data-back-to-top]'),
  themeColor: document.querySelector('meta[name="theme-color"]'),
  canonical: document.querySelector('link[rel="canonical"]'),
  metaDescription: document.querySelector('meta[name="description"]'),
};

function normalizeText(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-PT')
    .replace(/\s+/g, ' ')
    .trim();
}

function htmlToText(html = '') {
  const documentFragment = new DOMParser().parseFromString(html, 'text/html');
  return (documentFragment.body.textContent || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizePostHtml(html = '') {
  const parsed = new DOMParser().parseFromString(html, 'text/html');

  parsed.querySelectorAll('script, style, iframe, object, embed, link, meta').forEach((node) => node.remove());
  parsed.querySelectorAll('*').forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith('on') || value.startsWith('javascript:')) {
        node.removeAttribute(attribute.name);
      }
    });
  });

  parsed.querySelectorAll('img').forEach((image) => {
    image.loading = 'lazy';
    image.decoding = 'async';
    image.removeAttribute('width');
    image.removeAttribute('height');
  });

  parsed.querySelectorAll('a').forEach((link) => {
    const url = link.getAttribute('href');
    if (!url) return;
    try {
      const parsedUrl = new URL(url, CONFIG.blogHome);
      if (parsedUrl.origin !== window.location.origin) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    } catch {
      link.removeAttribute('href');
    }
  });

  return parsed.body.innerHTML;
}

function getAlternateLink(entry) {
  return entry.link?.find((link) => link.rel === 'alternate')?.href || CONFIG.blogHome;
}

function getSlug(url, fallback) {
  try {
    const pathname = new URL(url).pathname;
    const filename = pathname.split('/').filter(Boolean).at(-1) || fallback;
    return decodeURIComponent(filename.replace(/\.html$/i, ''));
  } catch {
    return fallback;
  }
}

function parseFeed(feed) {
  const entries = feed?.feed?.entry || [];

  return entries.map((entry, index) => {
    const title = entry.title?.$t?.trim() || `Texto ${index + 1}`;
    const originalUrl = getAlternateLink(entry);
    const content = entry.content?.$t || entry.summary?.$t || '';
    const text = htmlToText(content);
    const slug = getSlug(originalUrl, `texto-${index + 1}`);

    return {
      id: entry.id?.$t || slug,
      title,
      slug,
      content: sanitizePostHtml(content),
      text,
      excerpt: text.length > 310 ? `${text.slice(0, 307).trim()}…` : text,
      originalUrl,
      published: entry.published?.$t || '',
    };
  });
}

function loadBloggerFeed() {
  return new Promise((resolve, reject) => {
    const callbackName = `poesiaFeed_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('A resposta do Blogger demorou demasiado tempo.'));
    }, 15000);

    function cleanup() {
      window.clearTimeout(timeout);
      script.remove();
      try {
        delete window[callbackName];
      } catch {
        window[callbackName] = undefined;
      }
    }

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Não foi possível ligar ao Blogger.'));
    };

    const params = new URLSearchParams({
      alt: 'json-in-script',
      'max-results': String(CONFIG.maxPosts),
      orderby: 'published',
      callback: callbackName,
    });

    script.src = `${CONFIG.feedUrl}?${params.toString()}`;
    document.head.append(script);
  });
}

function buildSearchIndex() {
  state.searchIndex = state.posts.map((post) => ({
    post,
    haystack: normalizeText(`${post.title} ${post.text}`),
  }));
}

function escapeHtml(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function postUrl(post) {
  return `#/texto/${encodeURIComponent(post.slug)}`;
}

function renderArchive() {
  const currentSlug = getRoute().slug;
  const markup = state.posts
    .map((post) => `
      <li>
        <a
          href="${postUrl(post)}"
          ${post.slug === currentSlug ? 'aria-current="page"' : ''}
        >${escapeHtml(post.title)}</a>
      </li>
    `)
    .join('');

  elements.archiveLists.forEach((list) => {
    list.innerHTML = markup;
  });
}

function renderHome() {
  document.title = CONFIG.siteTitle;
  elements.metaDescription?.setAttribute('content', 'Textos e poesia de Gonçalo Venâncio.');
  elements.canonical?.setAttribute('href', CONFIG.baseUrl);
  elements.homeOnly.hidden = false;
  if (elements.homeShareButton) elements.homeShareButton.hidden = false;
  updateBackToTopVisibility();

  const cards = state.posts
    .map((post, index) => `
      <article class="post-card" data-reveal style="--reveal-delay: ${Math.min(index * 35, 240)}ms">
        <h2><a href="${postUrl(post)}">${escapeHtml(post.title)}</a></h2>
        ${post.excerpt ? `<p class="post-excerpt">${escapeHtml(post.excerpt)}</p>` : ''}
        <span class="read-label">Ler texto</span>
      </article>
    `)
    .join('');

  elements.view.innerHTML = `<section class="posts-grid" aria-label="Textos">${cards}</section>`;
  setActiveArchiveItem(null);
  activateRevealAnimations();
}

function renderArticle(post) {
  document.title = `${post.title} · ${CONFIG.siteTitle}`;
  elements.metaDescription?.setAttribute('content', post.excerpt || `Texto ${post.title}.`);
  elements.canonical?.setAttribute('href', post.originalUrl);
  elements.homeOnly.hidden = true;
  if (elements.homeShareButton) elements.homeShareButton.hidden = true;
  hideBackToTop();

  elements.view.innerHTML = `
    <article class="article-view">
      <div class="article-toolbar" data-reveal>
        <a class="back-link" href="#/">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m10.53 5.47-1.06-1.06L1.88 12l7.59 7.59 1.06-1.06-5.78-5.78H22v-1.5H4.75z" />
          </svg>
          Voltar ao início
        </a>
        <button class="icon-button" type="button" aria-label="Partilhar este texto" data-share>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 16.25a3.24 3.24 0 0 0-2.55 1.24l-7.09-4.1a3.38 3.38 0 0 0 0-2.78l7.09-4.1A3.25 3.25 0 1 0 14.75 4c0 .35.06.69.16 1L7.8 9.11A3.25 3.25 0 1 0 7.8 14.9L14.91 19c-.1.31-.16.65-.16 1A3.25 3.25 0 1 0 18 16.25Z" />
          </svg>
        </button>
      </div>

      <div class="article-card" data-reveal style="--reveal-delay: 90ms">
        <h1 class="article-title">${escapeHtml(post.title)}</h1>
        <div class="article-body">${post.content}</div>

        <footer class="article-footer">
          <div class="article-actions">
            <a
              class="pill secondary-action"
              href="mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(`Opinião sobre “${post.title}”`)}&body=${encodeURIComponent(`Olá,

Gostaria de partilhar a minha opinião sobre o texto “${post.title}”:

`)}"
            >
              Partilhe a sua opinião
            </a>
            <a class="pill primary-action article-book-link" href="${CONFIG.bookUrl}">Conhecer o livro</a>
            <a class="pill secondary-action" href="#/">Voltar à página inicial</a>
          </div>
        </footer>
      </div>
    </article>
  `;

  elements.view.querySelector('[data-share]')?.addEventListener('click', () => {
    openShareDialog({
      title: post.title,
      text: post.excerpt || `Texto ${post.title}.`,
      url: window.location.href,
    });
  });
  setActiveArchiveItem(post.slug);
  activateRevealAnimations();
  document.querySelector('#conteudo')?.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

function renderNotFound() {
  elements.homeOnly.hidden = true;
  if (elements.homeShareButton) elements.homeShareButton.hidden = true;
  hideBackToTop();
  elements.view.innerHTML = `
    <section class="empty-state" data-reveal>
      <h1>Texto não encontrado</h1>
      <p>O endereço pode estar incompleto ou o texto pode já não estar disponível.</p>
      <a class="pill" href="#/">Voltar a todos os textos</a>
    </section>
  `;
  activateRevealAnimations();
}

function renderError(error) {
  elements.homeOnly.hidden = false;
  if (elements.homeShareButton) elements.homeShareButton.hidden = false;
  hideBackToTop();
  elements.view.innerHTML = `
    <section class="error-card" data-reveal>
      <h2>Não foi possível carregar os textos</h2>
      <p>${escapeHtml(error.message)}</p>
      <div class="hero-actions">
        <button class="pill" type="button" data-retry>Voltar a tentar</button>
        <a class="pill" href="${CONFIG.blogHome}" target="_blank" rel="noopener noreferrer">Abrir o blogue</a>
      </div>
    </section>
  `;
  elements.view.querySelector('[data-retry]')?.addEventListener('click', initializePosts);
  activateRevealAnimations();
}

function getRoute() {
  const rawHash = window.location.hash || '#/';
  const match = rawHash.match(/^#\/texto\/(.+)$/);

  if (!match) {
    return { name: 'home', slug: null };
  }

  try {
    return { name: 'article', slug: decodeURIComponent(match[1]) };
  } catch {
    return { name: 'not-found', slug: null };
  }
}

function renderRoute() {
  if (!state.posts.length) return;

  const route = getRoute();
  closeMenu();
  closeSearch();
  closeShareDialog();
  renderArchive();

  if (route.name === 'home') {
    renderHome();
    return;
  }

  if (route.name === 'article') {
    const post = state.posts.find((item) => item.slug === route.slug);
    if (post) {
      renderArticle(post);
    } else {
      renderNotFound();
    }
    return;
  }

  renderNotFound();
}

function setActiveArchiveItem(slug) {
  document.querySelectorAll('.archive-list a').forEach((link) => {
    const isCurrent = slug && link.getAttribute('href') === `#/texto/${encodeURIComponent(slug)}`;
    if (isCurrent) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function hideBackToTop() {
  if (!elements.backToTopButton) return;
  elements.backToTopButton.hidden = true;
}

function updateBackToTopVisibility() {
  if (!elements.backToTopButton) return;
  const isHome = getRoute().name === 'home';
  elements.backToTopButton.hidden = !isHome || window.scrollY < 520;
}

function scrollBackToTop() {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

function openMenu() {
  elements.drawer.classList.add('is-open');
  elements.drawer.setAttribute('aria-hidden', 'false');
  elements.drawerBackdrop.hidden = false;
  requestAnimationFrame(() => elements.drawerBackdrop.classList.add('is-visible'));
  document.body.classList.add('is-locked');
  document.querySelectorAll('[data-open-menu]').forEach((button) => button.setAttribute('aria-expanded', 'true'));
  elements.closeMenuButton?.focus();
}

function closeMenu() {
  if (!elements.drawer.classList.contains('is-open')) return;
  elements.drawer.classList.remove('is-open');
  elements.drawer.setAttribute('aria-hidden', 'true');
  elements.drawerBackdrop.classList.remove('is-visible');
  document.body.classList.remove('is-locked');
  document.querySelectorAll('[data-open-menu]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
  window.setTimeout(() => {
    elements.drawerBackdrop.hidden = true;
  }, 230);
}

function openSearch() {
  if (typeof elements.searchDialog.showModal === 'function') {
    elements.searchDialog.showModal();
    document.body.classList.add('is-locked');
    window.setTimeout(() => elements.searchInput.focus(), 20);
  }
}

function closeSearch() {
  if (elements.searchDialog.open) {
    elements.searchDialog.close();
  }
  document.body.classList.remove('is-locked');
}

function renderSearchResults(query) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    elements.searchResults.innerHTML = '<p class="search-help">Comece a escrever para pesquisar.</p>';
    return;
  }

  const terms = normalizedQuery.split(' ').filter(Boolean);
  const matches = state.searchIndex
    .filter(({ haystack }) => terms.every((term) => haystack.includes(term)))
    .slice(0, 30);

  if (!matches.length) {
    elements.searchResults.innerHTML = '<p class="search-no-results">Não encontrei nenhum texto com esses termos.</p>';
    return;
  }

  elements.searchResults.innerHTML = `
    <ul class="search-result-list">
      ${matches.map(({ post }) => `
        <li>
          <a class="search-result-link" href="${postUrl(post)}">
            <strong>${escapeHtml(post.title)}</strong>
            <span>${escapeHtml(post.excerpt.slice(0, 150))}</span>
          </a>
        </li>
      `).join('')}
    </ul>
  `;
}

function applyTheme(theme, persist = true) {
  const normalized = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = normalized;
  elements.themeToggle.setAttribute(
    'aria-label',
    normalized === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro',
  );
  elements.themeColor?.setAttribute('content', normalized === 'dark' ? '#232530' : '#cccccc');

  if (persist) {
    localStorage.setItem('poesia-theme', normalized);
  }
}

function toggleTheme() {
  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
}

function buildShareMessage({ title, text, url }) {
  const cleanText = text?.trim();
  return cleanText ? `${title}\n\n${cleanText}\n\n${url}` : `${title}\n\n${url}`;
}

function openShareDialog(shareData) {
  if (!elements.shareDialog) return;

  const title = shareData.title || CONFIG.siteTitle;
  const text = shareData.text || 'Textos e poesia de Gonçalo Venâncio.';
  const url = shareData.url || CONFIG.baseUrl;
  const message = buildShareMessage({ title, text, url });

  elements.sharePreviewTitle.textContent = title;
  elements.shareFeedback.textContent = '';
  elements.shareDialog.dataset.shareUrl = url;
  elements.shareDialog.dataset.shareTitle = title;
  elements.shareDialog.dataset.shareText = text;

  elements.shareWhatsApp.href = `https://wa.me/?text=${encodeURIComponent(message)}`;
  elements.shareEmail.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`;
  elements.shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  elements.shareTelegram.href = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${title}\n\n${text}`)}`;

  if (typeof elements.shareDialog.showModal === 'function') {
    elements.shareDialog.showModal();
  } else {
    elements.shareDialog.setAttribute('open', '');
  }

  document.body.classList.add('is-locked');
  elements.closeShareButton?.focus();
}

function closeShareDialog() {
  if (!elements.shareDialog?.open) return;
  if (typeof elements.shareDialog.close === 'function') {
    elements.shareDialog.close();
  } else {
    elements.shareDialog.removeAttribute('open');
  }
  document.body.classList.remove('is-locked');
}

async function copyText(value) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.append(textArea);
  textArea.select();
  const copied = document.execCommand('copy');
  textArea.remove();
  if (!copied) throw new Error('Não foi possível copiar a ligação.');
}

async function openNativeShare() {
  if (!navigator.share) return;

  const url = elements.shareDialog?.dataset.shareUrl || window.location.href;
  const title = elements.shareDialog?.dataset.shareTitle || CONFIG.siteTitle;
  const text = elements.shareDialog?.dataset.shareText || 'Textos e poesia de Gonçalo Venâncio.';

  try {
    await navigator.share({ title, text, url });
    closeShareDialog();
  } catch (error) {
    if (error?.name !== 'AbortError') {
      elements.shareFeedback.textContent = 'Não foi possível abrir as aplicações de partilha.';
    }
  }
}

async function copyShareLink() {
  const url = elements.shareDialog?.dataset.shareUrl || window.location.href;
  try {
    await copyText(url);
    elements.shareFeedback.textContent = 'Ligação copiada.';
  } catch {
    elements.shareFeedback.textContent = 'Não foi possível copiar a ligação.';
  }
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function activateRevealAnimations() {
  const items = [...document.querySelectorAll('[data-reveal]:not(.is-visible)')];
  if (!items.length) return;

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -5% 0px' },
  );

  items.forEach((item) => observer.observe(item));
}

async function initializePosts() {
  elements.view.innerHTML = `
    <div class="loading-card" data-loading>
      <span class="loading-dot" aria-hidden="true"></span>
      <p>A carregar os textos…</p>
    </div>
  `;

  try {
    const feed = await loadBloggerFeed();
    state.posts = parseFeed(feed);

    if (!state.posts.length) {
      throw new Error('O blogue não devolveu nenhum texto.');
    }

    buildSearchIndex();
    renderArchive();
    renderRoute();
  } catch (error) {
    console.error(error);
    renderError(error instanceof Error ? error : new Error('Ocorreu um erro inesperado.'));
  }
}

function bindEvents() {
  document.addEventListener('click', (event) => {
    const menuTrigger = event.target.closest('[data-open-menu]');
    if (menuTrigger) openMenu();
  });
  elements.closeMenuButton?.addEventListener('click', closeMenu);
  elements.drawerBackdrop?.addEventListener('click', closeMenu);
  elements.themeToggle?.addEventListener('click', toggleTheme);
  elements.backToTopButton?.addEventListener('click', scrollBackToTop);
  window.addEventListener('scroll', updateBackToTopVisibility, { passive: true });
  elements.homeShareButton?.addEventListener('click', () => {
    openShareDialog({
      title: CONFIG.siteTitle,
      text: 'Textos e poesia de Gonçalo Venâncio.',
      url: CONFIG.baseUrl,
    });
  });
  elements.closeShareButton?.addEventListener('click', closeShareDialog);
  if (elements.nativeShareButton && navigator.share) {
    elements.nativeShareButton.hidden = false;
    elements.nativeShareButton.addEventListener('click', openNativeShare);
  }
  elements.copyShareButton?.addEventListener('click', copyShareLink);
  elements.shareDialog?.addEventListener('close', () => {
    document.body.classList.remove('is-locked');
    elements.shareFeedback.textContent = '';
  });
  elements.shareDialog?.addEventListener('click', (event) => {
    if (event.target === elements.shareDialog) closeShareDialog();
  });
  elements.shareDialog?.querySelectorAll('a.share-option').forEach((link) => {
    link.addEventListener('click', () => window.setTimeout(closeShareDialog, 80));
  });

  document.querySelectorAll('[data-open-search]').forEach((button) => {
    button.addEventListener('click', openSearch);
  });

  elements.searchDialog?.addEventListener('close', () => {
    document.body.classList.remove('is-locked');
    elements.searchInput.value = '';
    renderSearchResults('');
  });

  elements.searchInput?.addEventListener('input', (event) => {
    renderSearchResults(event.currentTarget.value);
  });

  elements.searchResults?.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeSearch();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
      closeShareDialog();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openSearch();
    }
  });

  window.addEventListener('hashchange', renderRoute);
}

function start() {
  applyTheme(document.documentElement.dataset.theme, false);
  bindEvents();
  activateRevealAnimations();
  initializePosts();
}

start();
