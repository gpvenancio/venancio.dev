'use strict';

const BOOK_URL = 'https://venancio.dev/poesia/livro/';

const I18N = Object.freeze({
  pt: {
    documentTitle: 'Livro · Poesia do Venâncio',
    description: 'Livro de Gonçalo Venâncio disponível exclusivamente online.',
    skipContent: 'Avançar para o conteúdo',
    backHome: 'Voltar ao início',
    backPoetry: 'Voltar à Poesia do Venâncio',
    sharePage: 'Partilhar esta página',
    share: 'Partilhar',
    bookTitleLine1: 'Livro disponível',
    bookTitleLine2: 'exclusivamente online',
    bookIntroLine1: 'Escolha onde prefere comprar o livro',
    bookIntroLine2: 'ou apoie diretamente o autor.',
    whereToBuy: 'Onde comprar o livro',
    buyBook: 'Comprar o livro',
    buyPublisher: 'Comprar na editora',
    supportWork: 'Apoiar o meu trabalho',
    language: 'Idioma',
    preferences: 'Preferências',
    preferencesNote: 'As preferências de idioma e tema ficam guardadas apenas neste navegador.',
    themeLight: 'Ativar o modo claro',
    themeDark: 'Ativar o modo escuro',
    chooseOption: 'Escolher uma opção',
    closeShare: 'Fechar as opções de partilha',
    bookShareTitle: 'Livro disponível exclusivamente online',
    bookShareText: 'Conhecer o livro de Gonçalo Venâncio.',
    shareHow: 'Escolha como pretende partilhar esta página.',
    shareOptions: 'Opções de partilha',
    moreApps: 'Mais aplicações',
    copyLink: 'Copiar a ligação',
    copied: 'Ligação copiada.',
    copyFailed: 'Não foi possível copiar a ligação.',
    shareFailed: 'Não foi possível abrir as aplicações de partilha.',
  },
  en: {
    documentTitle: 'Book · Poesia do Venâncio',
    description: 'Gonçalo Venâncio’s book, available exclusively online.',
    skipContent: 'Skip to content',
    backHome: 'Back to the homepage',
    backPoetry: 'Back to Poesia do Venâncio',
    sharePage: 'Share this page',
    share: 'Share',
    bookTitleLine1: 'Book available',
    bookTitleLine2: 'exclusively online',
    bookIntroLine1: 'Choose where you would like to buy the book',
    bookIntroLine2: 'or support the author directly.',
    whereToBuy: 'Where to buy the book',
    buyBook: 'Buy the book',
    buyPublisher: 'Buy from the publisher',
    supportWork: 'Support my work',
    language: 'Language',
    preferences: 'Preferences',
    preferencesNote: 'Language and theme preferences are stored only in this browser.',
    themeLight: 'Use light mode',
    themeDark: 'Use dark mode',
    chooseOption: 'Choose an option',
    closeShare: 'Close sharing options',
    bookShareTitle: 'Book available exclusively online',
    bookShareText: 'Discover the book by Gonçalo Venâncio.',
    shareHow: 'Choose how you would like to share this page.',
    shareOptions: 'Sharing options',
    moreApps: 'More apps',
    copyLink: 'Copy link',
    copied: 'Link copied.',
    copyFailed: 'The link could not be copied.',
    shareFailed: 'The sharing apps could not be opened.',
  },
});

const root = document.documentElement;
const themeToggle = document.querySelector('[data-theme-toggle]');
const themeColor = document.querySelector('meta[name="theme-color"]');
const metaDescription = document.querySelector('meta[name="description"]');
const languageButtons = [...document.querySelectorAll('button[data-language]')];
const shareButton = document.querySelector('[data-share-book]');
const shareDialog = document.querySelector('[data-share-dialog]');
const closeShareButton = document.querySelector('[data-close-share]');
const sharePreviewTitle = document.querySelector('[data-share-preview-title]');
const shareWhatsApp = document.querySelector('[data-share-whatsapp]');
const shareEmail = document.querySelector('[data-share-email]');
const shareFacebook = document.querySelector('[data-share-facebook]');
const shareTelegram = document.querySelector('[data-share-telegram]');
const nativeShareButton = document.querySelector('[data-native-share]');
const copyShareButton = document.querySelector('[data-copy-share]');
const shareFeedback = document.querySelector('[data-share-feedback]');

function language() {
  return root.dataset.language === 'en' ? 'en' : 'pt';
}

function t(key) {
  return I18N[language()][key];
}

function applyStaticTranslations() {
  const translations = I18N[language()];
  root.lang = language() === 'en' ? 'en' : 'pt-PT';

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

  languageButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.language === language()));
  });

  document.title = translations.documentTitle;
  metaDescription?.setAttribute('content', translations.description);
}

function applyLanguage(nextLanguage, persist = true) {
  root.dataset.language = nextLanguage === 'en' ? 'en' : 'pt';
  applyStaticTranslations();
  applyTheme(root.dataset.theme, false);
  if (persist) localStorage.setItem('venancio-language', language());
}

function applyTheme(theme, persist = true) {
  const normalized = theme === 'dark' ? 'dark' : 'light';
  root.dataset.theme = normalized;
  const label = normalized === 'dark' ? t('themeLight') : t('themeDark');
  themeToggle?.setAttribute('aria-label', label);
  themeToggle?.setAttribute('title', label);
  themeColor?.setAttribute('content', normalized === 'dark' ? '#232530' : '#cccccc');
  if (persist) localStorage.setItem('venancio-theme', normalized);
}

function toggleTheme() {
  applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
}

function currentShareData() {
  return {
    title: t('bookShareTitle'),
    text: t('bookShareText'),
    url: BOOK_URL,
  };
}

function buildShareMessage({ title, text, url }) {
  return `${title}\n\n${text}\n\n${url}`;
}

function openShareDialog() {
  if (!shareDialog) return;

  const shareData = currentShareData();
  const message = buildShareMessage(shareData);

  sharePreviewTitle.textContent = shareData.title;
  shareFeedback.textContent = '';
  shareWhatsApp.href = `https://wa.me/?text=${encodeURIComponent(message)}`;
  shareEmail.href = `mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(message)}`;
  shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`;
  shareTelegram.href = `https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(`${shareData.title}\n\n${shareData.text}`)}`;

  if (typeof shareDialog.showModal === 'function') shareDialog.showModal();
  else shareDialog.setAttribute('open', '');

  document.body.classList.add('is-locked');
  closeShareButton?.focus();
}

function closeShareDialog() {
  if (!shareDialog?.open) return;
  if (typeof shareDialog.close === 'function') shareDialog.close();
  else shareDialog.removeAttribute('open');
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

async function copyShareLink() {
  try {
    await copyText(BOOK_URL);
    shareFeedback.textContent = t('copied');
  } catch {
    shareFeedback.textContent = t('copyFailed');
  }
}

async function openNativeShare() {
  if (!navigator.share) return;

  try {
    await navigator.share(currentShareData());
    closeShareDialog();
  } catch (error) {
    if (error?.name !== 'AbortError') shareFeedback.textContent = t('shareFailed');
  }
}

themeToggle?.addEventListener('click', toggleTheme);
languageButtons.forEach((button) => {
  button.addEventListener('click', () => applyLanguage(button.dataset.language));
});
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
  if (event.key === 'Escape') closeShareDialog();
});

applyStaticTranslations();
applyTheme(root.dataset.theme, false);
