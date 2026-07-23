'use strict';

const CONFIG = Object.freeze({
  feedUrl: 'https://poesiadovenancio.blogspot.com/feeds/posts/default',
  maxPosts: 500,
});

const root = document.documentElement;
const themeToggle = document.querySelector('[data-theme-toggle]');
const themeColor = document.querySelector('meta[name="theme-color"]');
const drawer = document.querySelector('[data-drawer]');
const drawerBackdrop = document.querySelector('[data-drawer-backdrop]');
const menuButton = document.querySelector('[data-open-menu]');
const closeMenuButton = document.querySelector('[data-close-menu]');
const archiveList = document.querySelector('[data-archive-list]');
const shareButton = document.querySelector('[data-share-book]');
const shareDialog = document.querySelector('[data-share-dialog]');
const closeShareButton = document.querySelector('[data-close-share]');
const shareWhatsApp = document.querySelector('[data-share-whatsapp]');
const shareEmail = document.querySelector('[data-share-email]');
const shareFacebook = document.querySelector('[data-share-facebook]');
const shareTelegram = document.querySelector('[data-share-telegram]');
const nativeShareButton = document.querySelector('[data-native-share]');
const copyShareButton = document.querySelector('[data-copy-share]');
const shareFeedback = document.querySelector('[data-share-feedback]');

function applyTheme(theme, persist = true) {
  const normalized = theme === 'dark' ? 'dark' : 'light';
  root.dataset.theme = normalized;
  themeToggle?.setAttribute(
    'aria-label',
    normalized === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro',
  );
  themeColor?.setAttribute('content', normalized === 'dark' ? '#232530' : '#cccccc');
  if (persist) localStorage.setItem('poesia-theme', normalized);
}

function toggleTheme() {
  applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
}

function openMenu() {
  drawer?.classList.add('is-open');
  drawer?.setAttribute('aria-hidden', 'false');
  drawerBackdrop.hidden = false;
  requestAnimationFrame(() => drawerBackdrop.classList.add('is-visible'));
  document.body.classList.add('is-locked');
  menuButton?.setAttribute('aria-expanded', 'true');
  closeMenuButton?.focus();
}

function closeMenu() {
  if (!drawer?.classList.contains('is-open')) return;
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  drawerBackdrop.classList.remove('is-visible');
  document.body.classList.remove('is-locked');
  menuButton?.setAttribute('aria-expanded', 'false');
  window.setTimeout(() => {
    drawerBackdrop.hidden = true;
  }, 230);
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

function escapeHtml(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderArchive(feed) {
  const entries = feed?.feed?.entry || [];
  const markup = entries.map((entry, index) => {
    const title = entry.title?.$t?.trim() || `Texto ${index + 1}`;
    const originalUrl = entry.link?.find((link) => link.rel === 'alternate')?.href || '';
    const slug = getSlug(originalUrl, `texto-${index + 1}`);
    return `<li><a href="../#/texto/${encodeURIComponent(slug)}">${escapeHtml(title)}</a></li>`;
  }).join('');

  archiveList.innerHTML = markup || '<li><span class="archive-loading">Ainda não existem textos publicados.</span></li>';
}

function loadArchive() {
  return new Promise((resolve, reject) => {
    const callbackName = `poesiaBookFeed_${Date.now()}_${Math.random().toString(36).slice(2)}`;
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
      reject(new Error('Não foi possível carregar os títulos.'));
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


const BOOK_SHARE = Object.freeze({
  title: 'Livro disponível exclusivamente online',
  text: 'Conheça o livro de Gonçalo Venâncio.',
  url: 'https://venancio.dev/poesia/livro/',
});

function buildShareMessage({ title, text, url }) {
  return `${title}

${text}

${url}`;
}

function openShareDialog() {
  if (!shareDialog) return;
  const message = buildShareMessage(BOOK_SHARE);
  shareFeedback.textContent = '';
  shareWhatsApp.href = `https://wa.me/?text=${encodeURIComponent(message)}`;
  shareEmail.href = `mailto:?subject=${encodeURIComponent(BOOK_SHARE.title)}&body=${encodeURIComponent(message)}`;
  shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(BOOK_SHARE.url)}`;
  shareTelegram.href = `https://t.me/share/url?url=${encodeURIComponent(BOOK_SHARE.url)}&text=${encodeURIComponent(`${BOOK_SHARE.title}

${BOOK_SHARE.text}`)}`;

  if (typeof shareDialog.showModal === 'function') {
    shareDialog.showModal();
  } else {
    shareDialog.setAttribute('open', '');
  }
  document.body.classList.add('is-locked');
  closeShareButton?.focus();
}

function closeShareDialog() {
  if (!shareDialog?.open) return;
  if (typeof shareDialog.close === 'function') {
    shareDialog.close();
  } else {
    shareDialog.removeAttribute('open');
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

async function copyShareLink() {
  try {
    await copyText(BOOK_SHARE.url);
    shareFeedback.textContent = 'Ligação copiada.';
  } catch {
    shareFeedback.textContent = 'Não foi possível copiar a ligação.';
  }
}

async function openNativeShare() {
  if (!navigator.share) return;
  try {
    await navigator.share(BOOK_SHARE);
    closeShareDialog();
  } catch (error) {
    if (error?.name !== 'AbortError') {
      shareFeedback.textContent = 'Não foi possível abrir as aplicações de partilha.';
    }
  }
}

function activateRevealAnimations() {
  const items = [...document.querySelectorAll('[data-reveal]')];
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }
  requestAnimationFrame(() => items.forEach((item) => item.classList.add('is-visible')));
}

themeToggle?.addEventListener('click', toggleTheme);
menuButton?.addEventListener('click', openMenu);
closeMenuButton?.addEventListener('click', closeMenu);
drawerBackdrop?.addEventListener('click', closeMenu);
shareButton?.addEventListener('click', openShareDialog);
closeShareButton?.addEventListener('click', closeShareDialog);
copyShareButton?.addEventListener('click', copyShareLink);
if (nativeShareButton && navigator.share) {
  nativeShareButton.hidden = false;
  nativeShareButton.addEventListener('click', openNativeShare);
}
shareDialog?.addEventListener('close', () => {
  document.body.classList.remove('is-locked');
  shareFeedback.textContent = '';
});
shareDialog?.addEventListener('click', (event) => {
  if (event.target === shareDialog) closeShareDialog();
});
shareDialog?.querySelectorAll('a.share-option').forEach((link) => {
  link.addEventListener('click', () => window.setTimeout(closeShareDialog, 80));
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMenu();
    closeShareDialog();
  }
});
archiveList?.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});

applyTheme(root.dataset.theme, false);
activateRevealAnimations();
loadArchive()
  .then(renderArchive)
  .catch(() => {
    archiveList.innerHTML = '<li><span class="archive-loading">Não foi possível carregar os títulos.</span></li>';
  });
