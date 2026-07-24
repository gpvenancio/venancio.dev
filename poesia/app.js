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

const I18N = Object.freeze({
  pt: {
    skipContent: 'Avançar para o conteúdo',
    openAllTexts: 'Abrir todos os textos',
    allTexts: 'Todos os textos',
    homepage: 'Página inicial',
    sharePage: 'Partilhar esta página',
    share: 'Partilhar',
    searchTexts: 'Pesquisar textos',
    search: 'Pesquisar',
    contactAuthor: 'Contactar o autor',
    contactSubject: 'Contacto através de Poesia do Venâncio',
    discoverBook: 'Conhecer o livro',
    supportWork: 'Apoiar o meu trabalho',
    loadingTexts: 'A carregar os textos…',
    closeMenu: 'Fechar o menu',
    textsIndex: 'Índice de textos',
    backTop: 'Voltar ao topo',
    findText: 'Encontrar um texto',
    closeSearch: 'Fechar a pesquisa',
    searchByContent: 'Pesquisar por título ou conteúdo',
    searchPlaceholder: 'Pesquisar por título ou palavras do texto',
    searchHelp: 'Comece a escrever para pesquisar.',
    chooseOption: 'Escolher uma opção',
    closeShare: 'Fechar as opções de partilha',
    shareHow: 'Escolha como pretende partilhar esta página.',
    shareOptions: 'Opções de partilha',
    moreApps: 'Mais aplicações',
    copyLink: 'Copiar a ligação',
    noscript: 'Este site precisa de JavaScript para carregar os textos e utilizar a pesquisa.',
    language: 'Idioma',
    preferencesNote: 'As preferências de idioma e tema ficam guardadas apenas neste navegador.',
    themeLight: 'Ativar o modo claro',
    themeDark: 'Ativar o modo escuro',
    siteDescription: 'Textos e poesia de Gonçalo Venâncio.',
    textFallback: 'Texto',
    readText: 'Ler o texto',
    textsAria: 'Textos',
    backHome: 'Voltar ao início',
    rssFeed: 'RSS',
    textNavigation: 'Navegação entre textos',
    previousText: 'Texto anterior',
    nextText: 'Texto seguinte',
    shareThisText: 'Partilhar este texto',
    shareOpinion: 'Partilhar a sua opinião',
    returnHomepage: 'Voltar à página inicial',
    opinionSubject: (title) => `Opinião sobre “${title}”`,
    opinionBody: (title) => `Olá,\n\nGostaria de partilhar a minha opinião sobre o texto “${title}”:\n\n`,
    notFoundTitle: 'Texto não encontrado',
    notFoundText: 'O endereço pode estar incompleto ou o texto pode já não estar disponível.',
    backAllTexts: 'Voltar a todos os textos',
    loadErrorTitle: 'Não foi possível carregar os textos',
    retry: 'Tentar novamente',
    openBlog: 'Abrir o blogue',
    noSearchResults: 'Não encontrei nenhum texto com esses termos.',
    copied: 'Ligação copiada.',
    copyFailed: 'Não foi possível copiar a ligação.',
    shareFailed: 'Não foi possível abrir as aplicações de partilha.',
    bloggerTimeout: 'A resposta do Blogger demorou demasiado tempo.',
    bloggerConnection: 'Não foi possível ligar ao Blogger.',
    noPosts: 'O blogue não devolveu nenhum texto.',
    unexpectedError: 'Ocorreu um erro inesperado.',
  },
  en: {
    skipContent: 'Skip to content',
    openAllTexts: 'Open all texts',
    allTexts: 'All texts',
    homepage: 'Homepage',
    sharePage: 'Share this page',
    share: 'Share',
    searchTexts: 'Search texts',
    search: 'Search',
    contactAuthor: 'Contact the author',
    contactSubject: 'Contact through Poesia do Venâncio',
    discoverBook: 'Discover the book',
    supportWork: 'Support my work',
    loadingTexts: 'Loading texts…',
    closeMenu: 'Close menu',
    textsIndex: 'Text index',
    backTop: 'Back to top',
    findText: 'Find a text',
    closeSearch: 'Close search',
    searchByContent: 'Search by title or content',
    searchPlaceholder: 'Search by title or words in the text',
    searchHelp: 'Start typing to search.',
    chooseOption: 'Choose an option',
    closeShare: 'Close sharing options',
    shareHow: 'Choose how you would like to share this page.',
    shareOptions: 'Sharing options',
    moreApps: 'More apps',
    copyLink: 'Copy link',
    noscript: 'This site needs JavaScript to load the texts and use search.',
    language: 'Language',
    preferencesNote: 'Language and theme preferences are stored only in this browser.',
    themeLight: 'Use light mode',
    themeDark: 'Use dark mode',
    siteDescription: 'Texts and poetry by Gonçalo Venâncio.',
    textFallback: 'Text',
    readText: 'Read text',
    textsAria: 'Texts',
    backHome: 'Back to the homepage',
    rssFeed: 'Subscribe via RSS',
    textNavigation: 'Text navigation',
    previousText: 'Previous text',
    nextText: 'Next text',
    shareThisText: 'Share this text',
    shareOpinion: 'Share your thoughts',
    returnHomepage: 'Return to the homepage',
    opinionSubject: (title) => `Thoughts on “${title}”`,
    opinionBody: (title) => `Hello,\n\nI would like to share my thoughts on the text “${title}”:\n\n`,
    notFoundTitle: 'Text not found',
    notFoundText: 'The address may be incomplete, or the text may no longer be available.',
    backAllTexts: 'Return to all texts',
    loadErrorTitle: 'The texts could not be loaded',
    retry: 'Try again',
    openBlog: 'Open the blog',
    noSearchResults: 'No text matched those terms.',
    copied: 'Link copied.',
    copyFailed: 'The link could not be copied.',
    shareFailed: 'The sharing apps could not be opened.',
    bloggerTimeout: 'The Blogger response took too long.',
    bloggerConnection: 'Blogger could not be reached.',
    noPosts: 'The blog did not return any texts.',
    unexpectedError: 'An unexpected error occurred.',
  },
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
  languageButtons: [...document.querySelectorAll('button[data-language]')],
  searchDialog: document.querySelector('[data-search-dialog]'),
  searchInput: document.querySelector('[data-search-input]'),
  searchResults: document.querySelector('[data-search-results]'),
  searchButtons: [...document.querySelectorAll('[data-open-search]')],
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
  rssLink: document.querySelector('[data-rss-link]'),
  contactAuthorLink: document.querySelector('[data-contact-author]'),
  themeColor: document.querySelector('meta[name="theme-color"]'),
  canonical: document.querySelector('link[rel="canonical"]'),
  metaDescription: document.querySelector('meta[name="description"]'),
};

function language() {
  return document.documentElement.dataset.language === 'en' ? 'en' : 'pt';
}

function t(key, ...args) {
  const value = I18N[language()][key];
  return typeof value === 'function' ? value(...args) : value;
}

function normalizeText(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase(language() === 'pt' ? 'pt-PT' : 'en')
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
    const title = entry.title?.$t?.trim() || `${t('textFallback')} ${index + 1}`;
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
      reject(new Error(t('bloggerTimeout')));
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
      reject(new Error(t('bloggerConnection')));
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
  elements.metaDescription?.setAttribute('content', t('siteDescription'));
  elements.canonical?.setAttribute('href', CONFIG.baseUrl);
  elements.homeOnly.hidden = false;
  if (elements.homeShareButton) elements.homeShareButton.hidden = false;
  elements.searchButtons.forEach((button) => { button.hidden = false; });
  if (elements.rssLink) elements.rssLink.hidden = false;
  hideBackToTop();

  const cards = state.posts
    .map((post, index) => `
      <article class="post-card reveal-card" style="animation-delay: ${920 + Math.min(index * 70, 420)}ms">
        <h2><a href="${postUrl(post)}">${escapeHtml(post.title)}</a></h2>
        ${post.excerpt ? `<p class="post-excerpt">${escapeHtml(post.excerpt)}</p>` : ''}
        <span class="read-label">${t('readText')}</span>
      </article>
    `)
    .join('');

  elements.view.innerHTML = `<section class="posts-grid" aria-label="${t('textsAria')}">${cards}</section>`;
  setActiveArchiveItem(null);
}

function renderArticleNavigation(post) {
  const currentIndex = state.posts.findIndex((item) => item.slug === post.slug);
  const previousPost = currentIndex >= 0 ? state.posts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? state.posts[currentIndex - 1] : null;

  if (!previousPost && !nextPost) return '';

  const previousLink = previousPost
    ? `
      <a class="article-navigation-link article-navigation-previous reveal-card" href="${postUrl(previousPost)}" style="animation-delay: 1260ms">
        <span class="article-navigation-label">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m10.53 5.47-1.06-1.06L1.88 12l7.59 7.59 1.06-1.06-5.78-5.78H22v-1.5H4.75z" />
          </svg>
          ${t('previousText')}
        </span>
        <strong>${escapeHtml(previousPost.title)}</strong>
      </a>`
    : '<span class="article-navigation-spacer" aria-hidden="true"></span>';

  const nextLink = nextPost
    ? `
      <a class="article-navigation-link article-navigation-next reveal-card" href="${postUrl(nextPost)}" style="animation-delay: 1340ms">
        <span class="article-navigation-label">
          ${t('nextText')}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m13.47 5.47 1.06-1.06L22.12 12l-7.59 7.59-1.06-1.06 5.78-5.78H2v-1.5h17.25z" />
          </svg>
        </span>
        <strong>${escapeHtml(nextPost.title)}</strong>
      </a>`
    : '<span class="article-navigation-spacer" aria-hidden="true"></span>';

  return `
    <nav class="article-navigation" aria-label="${t('textNavigation')}">
      ${previousLink}
      ${nextLink}
    </nav>
  `;
}

function renderArticle(post) {
  document.title = `${post.title} · ${CONFIG.siteTitle}`;
  elements.metaDescription?.setAttribute('content', post.excerpt || `${t('textFallback')} ${post.title}.`);
  elements.canonical?.setAttribute('href', post.originalUrl);
  elements.homeOnly.hidden = true;
  if (elements.homeShareButton) elements.homeShareButton.hidden = true;
  elements.searchButtons.forEach((button) => { button.hidden = true; });
  if (elements.rssLink) elements.rssLink.hidden = true;
  hideBackToTop();

  const subject = encodeURIComponent(t('opinionSubject', post.title));
  const body = encodeURIComponent(t('opinionBody', post.title));

  elements.view.innerHTML = `
    <article class="article-view">
      <div class="article-toolbar reveal-card" style="animation-delay: 320ms">
        <a class="back-link reveal-icon" href="#/" style="animation-delay: 400ms">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m10.53 5.47-1.06-1.06L1.88 12l7.59 7.59 1.06-1.06-5.78-5.78H22v-1.5H4.75z" />
          </svg>
          <span style="animation-delay: 500ms">${t('backHome')}</span>
        </a>
        <button class="icon-button reveal-icon" type="button" aria-label="${t('shareThisText')}" data-share style="animation-delay: 460ms">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 16.25a3.24 3.24 0 0 0-2.55 1.24l-7.09-4.1a3.38 3.38 0 0 0 0-2.78l7.09-4.1A3.25 3.25 0 1 0 14.75 4c0 .35.06.69.16 1L7.8 9.11A3.25 3.25 0 1 0 7.8 14.9L14.91 19c-.1.31-.16.65-.16 1A3.25 3.25 0 1 0 18 16.25Z" />
          </svg>
        </button>
      </div>

      <div class="article-card reveal-card" style="animation-delay: 460ms">
        <h1 class="article-title reveal"><span style="animation-delay: 600ms">${escapeHtml(post.title)}</span></h1>
        <div class="article-body reveal-card" style="animation-delay: 740ms">${post.content}</div>

        <footer class="article-footer">
          <div class="article-actions">
            <a
              class="pill secondary-action reveal-icon"
              href="mailto:${CONFIG.contactEmail}?subject=${subject}&body=${body}"
              style="animation-delay: 880ms"
            >
              <span style="animation-delay: 980ms">${t('shareOpinion')}</span>
            </a>
            <a class="pill primary-action article-book-link reveal-icon" href="${CONFIG.bookUrl}" style="animation-delay: 1000ms"><span style="animation-delay: 1100ms">${t('discoverBook')}</span></a>
            <a class="pill secondary-action reveal-icon" href="#/" style="animation-delay: 1120ms"><span style="animation-delay: 1220ms">${t('returnHomepage')}</span></a>
          </div>
        </footer>

        ${renderArticleNavigation(post)}
      </div>
    </article>
  `;

  setActiveArchiveItem(post.slug);
  document.querySelector('#conteudo')?.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  window.requestAnimationFrame(updateBackToTopVisibility);
}

function renderNotFound() {
  elements.homeOnly.hidden = true;
  if (elements.homeShareButton) elements.homeShareButton.hidden = true;
  elements.searchButtons.forEach((button) => { button.hidden = true; });
  if (elements.rssLink) elements.rssLink.hidden = true;
  hideBackToTop();
  elements.view.innerHTML = `
    <section class="empty-state reveal-card" style="animation-delay: 360ms">
      <h1>${t('notFoundTitle')}</h1>
      <p>${t('notFoundText')}</p>
      <a class="pill" href="#/">${t('backAllTexts')}</a>
    </section>
  `;
}

function renderError(error) {
  elements.homeOnly.hidden = false;
  if (elements.homeShareButton) elements.homeShareButton.hidden = false;
  elements.searchButtons.forEach((button) => { button.hidden = false; });
  if (elements.rssLink) elements.rssLink.hidden = false;
  hideBackToTop();
  elements.view.innerHTML = `
    <section class="error-card reveal-card" style="animation-delay: 360ms">
      <h2>${t('loadErrorTitle')}</h2>
      <p>${escapeHtml(error.message)}</p>
      <div class="hero-actions">
        <button class="pill" type="button" data-retry>${t('retry')}</button>
        <a class="pill" href="${CONFIG.blogHome}" target="_blank" rel="noopener noreferrer">${t('openBlog')}</a>
      </div>
    </section>
  `;
  elements.view.querySelector('[data-retry]')?.addEventListener('click', initializePosts);
}

function getRoute() {
  const rawHash = window.location.hash || '#/';
  const match = rawHash.match(/^#\/texto\/(.+)$/);

  if (!match) return { name: 'home', slug: null };

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
    if (post) renderArticle(post);
    else renderNotFound();
    return;
  }

  renderNotFound();
}

function setActiveArchiveItem(slug) {
  document.querySelectorAll('.archive-list a').forEach((link) => {
    const isCurrent = slug && link.getAttribute('href') === postUrl({ slug });
    if (isCurrent) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function hideBackToTop() {
  if (elements.backToTopButton) elements.backToTopButton.hidden = true;
}

function articleIsLong() {
  if (getRoute().name !== 'article') return false;
  const article = document.querySelector('.article-card');
  if (!article) return false;

  const remainingDocumentHeight = document.documentElement.scrollHeight - window.innerHeight;
  return remainingDocumentHeight > 850 && article.scrollHeight > window.innerHeight * 1.15;
}

function updateBackToTopVisibility() {
  if (!elements.backToTopButton) return;
  const shouldShow = articleIsLong() && window.scrollY > 560;
  elements.backToTopButton.hidden = !shouldShow;
}

function scrollBackToTop() {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

function openMenu() {
  elements.drawer?.classList.add('is-open');
  elements.drawer?.setAttribute('aria-hidden', 'false');
  if (elements.drawerBackdrop) {
    elements.drawerBackdrop.hidden = false;
    requestAnimationFrame(() => elements.drawerBackdrop.classList.add('is-visible'));
  }
  document.body.classList.add('is-locked');
  document.querySelectorAll('[data-open-menu]').forEach((button) => button.setAttribute('aria-expanded', 'true'));
  elements.closeMenuButton?.focus();
}

function closeMenu() {
  if (!elements.drawer?.classList.contains('is-open')) return;
  elements.drawer.classList.remove('is-open');
  elements.drawer.setAttribute('aria-hidden', 'true');
  elements.drawerBackdrop?.classList.remove('is-visible');
  document.body.classList.remove('is-locked');
  document.querySelectorAll('[data-open-menu]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
  window.setTimeout(() => {
    if (elements.drawerBackdrop) elements.drawerBackdrop.hidden = true;
  }, 230);
}

function openSearch() {
  if (typeof elements.searchDialog?.showModal === 'function') {
    elements.searchDialog.showModal();
    document.body.classList.add('is-locked');
    window.setTimeout(() => elements.searchInput?.focus(), 20);
  }
}

function closeSearch() {
  if (elements.searchDialog?.open) elements.searchDialog.close();
  document.body.classList.remove('is-locked');
}

function renderSearchResults(query) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    elements.searchResults.innerHTML = `<p class="search-help">${t('searchHelp')}</p>`;
    return;
  }

  const terms = normalizedQuery.split(' ').filter(Boolean);
  const matches = state.searchIndex
    .filter(({ haystack }) => terms.every((term) => haystack.includes(term)))
    .slice(0, 30);

  if (!matches.length) {
    elements.searchResults.innerHTML = `<p class="search-no-results">${t('noSearchResults')}</p>`;
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

function applyStaticTranslations() {
  const translations = I18N[language()];

  document.documentElement.lang = language() === 'en' ? 'en' : 'pt-PT';

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const value = translations[element.dataset.i18n];
    if (typeof value === 'string') element.textContent = value;
  });

  document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    const value = translations[element.dataset.i18nAriaLabel];
    if (typeof value === 'string') element.setAttribute('aria-label', value);
  });

  document.querySelectorAll('[data-i18n-title]').forEach((element) => {
    const value = translations[element.dataset.i18nTitle];
    if (typeof value === 'string') element.setAttribute('title', value);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    const value = translations[element.dataset.i18nPlaceholder];
    if (typeof value === 'string') element.setAttribute('placeholder', value);
  });

  elements.languageButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.language === language()));
  });

  if (elements.contactAuthorLink) {
    elements.contactAuthorLink.href = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(translations.contactSubject)}`;
  }
}

function applyLanguage(nextLanguage, persist = true) {
  document.documentElement.dataset.language = nextLanguage === 'en' ? 'en' : 'pt';
  applyStaticTranslations();
  applyTheme(document.documentElement.dataset.theme, false);
  buildSearchIndex();

  if (state.posts.length) renderRoute();
  else {
    const loadingText = document.querySelector('[data-loading] p');
    if (loadingText) loadingText.textContent = t('loadingTexts');
  }

  if (persist) localStorage.setItem('venancio-language', language());
}

function applyTheme(theme, persist = true) {
  const normalized = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = normalized;
  elements.themeToggle?.setAttribute('aria-label', normalized === 'dark' ? t('themeLight') : t('themeDark'));
  elements.themeToggle?.setAttribute('title', normalized === 'dark' ? t('themeLight') : t('themeDark'));
  elements.themeColor?.setAttribute('content', normalized === 'dark' ? '#232530' : '#cccccc');

  if (persist) localStorage.setItem('venancio-theme', normalized);
}

function toggleTheme() {
  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
}

function buildShareMessage({ title, text, url }) {
  const cleanText = text?.trim();
  return cleanText ? `${title}\n\n${cleanText}\n\n${url}` : `${title}\n\n${url}`;
}

function openDialog(dialog) {
  if (!dialog) return false;
  if (dialog.open) return true;

  try {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  } catch {
    dialog.setAttribute('open', '');
  }

  return dialog.open || dialog.hasAttribute('open');
}

function openShareDialog(shareData = {}) {
  if (!elements.shareDialog) return;

  const title = shareData.title || CONFIG.siteTitle;
  const text = shareData.text || t('siteDescription');
  const url = shareData.url || CONFIG.baseUrl;
  const message = buildShareMessage({ title, text, url });

  if (elements.sharePreviewTitle) elements.sharePreviewTitle.textContent = title;
  if (elements.shareFeedback) elements.shareFeedback.textContent = '';
  elements.shareDialog.dataset.shareUrl = url;
  elements.shareDialog.dataset.shareTitle = title;
  elements.shareDialog.dataset.shareText = text;

  if (elements.shareWhatsApp) {
    elements.shareWhatsApp.href = `https://wa.me/?text=${encodeURIComponent(message)}`;
  }
  if (elements.shareEmail) {
    elements.shareEmail.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`;
  }
  if (elements.shareFacebook) {
    elements.shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  }
  if (elements.shareTelegram) {
    elements.shareTelegram.href = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${title}\n\n${text}`)}`;
  }

  if (!openDialog(elements.shareDialog)) return;

  document.body.classList.add('is-locked');
  window.requestAnimationFrame(() => elements.closeShareButton?.focus());
}

function closeShareDialog() {
  if (!elements.shareDialog?.hasAttribute('open')) return;

  try {
    if (typeof elements.shareDialog.close === 'function') elements.shareDialog.close();
    else elements.shareDialog.removeAttribute('open');
  } catch {
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
  if (!copied) throw new Error(t('copyFailed'));
}

async function openNativeShare() {
  if (!navigator.share) return;

  const url = elements.shareDialog?.dataset.shareUrl || window.location.href;
  const title = elements.shareDialog?.dataset.shareTitle || CONFIG.siteTitle;
  const text = elements.shareDialog?.dataset.shareText || t('siteDescription');

  try {
    await navigator.share({ title, text, url });
    closeShareDialog();
  } catch (error) {
    if (error?.name !== 'AbortError' && elements.shareFeedback) elements.shareFeedback.textContent = t('shareFailed');
  }
}

async function copyShareLink() {
  const url = elements.shareDialog?.dataset.shareUrl || window.location.href;
  try {
    await copyText(url);
    if (elements.shareFeedback) elements.shareFeedback.textContent = t('copied');
  } catch {
    if (elements.shareFeedback) elements.shareFeedback.textContent = t('copyFailed');
  }
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

async function initializePosts() {
  elements.view.innerHTML = `
    <div class="loading-card" data-loading>
      <span class="loading-dot" aria-hidden="true"></span>
      <p>${t('loadingTexts')}</p>
    </div>
  `;

  try {
    const feed = await loadBloggerFeed();
    state.posts = parseFeed(feed);

    if (!state.posts.length) throw new Error(t('noPosts'));

    buildSearchIndex();
    renderArchive();
    renderRoute();
  } catch (error) {
    console.error(error);
    renderError(error instanceof Error ? error : new Error(t('unexpectedError')));
  }
}

function bindEvents() {
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const menuTrigger = target.closest('[data-open-menu]');
    if (menuTrigger) {
      openMenu();
      return;
    }

    const homeShareTrigger = target.closest('[data-share-home]');
    if (homeShareTrigger) {
      event.preventDefault();
      openShareDialog({
        title: CONFIG.siteTitle,
        text: t('siteDescription'),
        url: CONFIG.baseUrl,
      });
      return;
    }

    const articleShareTrigger = target.closest('[data-share]');
    if (articleShareTrigger) {
      event.preventDefault();
      const route = getRoute();
      const post = state.posts.find((item) => item.slug === route.slug);
      if (!post) return;

      openShareDialog({
        title: post.title,
        text: post.excerpt || `${t('textFallback')} ${post.title}.`,
        url: window.location.href,
      });
    }
  });
  elements.closeMenuButton?.addEventListener('click', closeMenu);
  elements.drawerBackdrop?.addEventListener('click', closeMenu);
  elements.themeToggle?.addEventListener('click', toggleTheme);
  elements.languageButtons.forEach((button) => {
    button.addEventListener('click', () => applyLanguage(button.dataset.language));
  });
  elements.backToTopButton?.addEventListener('click', scrollBackToTop);
  window.addEventListener('scroll', updateBackToTopVisibility, { passive: true });
  window.addEventListener('resize', updateBackToTopVisibility, { passive: true });
  elements.closeShareButton?.addEventListener('click', closeShareDialog);
  if (elements.nativeShareButton && navigator.share) {
    elements.nativeShareButton.hidden = false;
    elements.nativeShareButton.addEventListener('click', openNativeShare);
  }
  elements.copyShareButton?.addEventListener('click', copyShareLink);
  elements.shareDialog?.addEventListener('close', () => {
    document.body.classList.remove('is-locked');
    if (elements.shareFeedback) elements.shareFeedback.textContent = '';
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
    if (
      getRoute().name === 'home' &&
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === 'k'
    ) {
      event.preventDefault();
      openSearch();
    }
  });

  window.addEventListener('hashchange', renderRoute);
}

function start() {
  applyStaticTranslations();
  applyTheme(document.documentElement.dataset.theme, false);
  bindEvents();
  initializePosts();
}

start();
