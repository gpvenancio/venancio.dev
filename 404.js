'use strict';

const root = document.documentElement;
const themeToggle = document.querySelector('[data-theme-toggle]');
const themeColor = document.querySelector('meta[name="theme-color"]');
const languageButtons = [...document.querySelectorAll('button[data-language]')];

const TRANSLATIONS = Object.freeze({
  pt: {
    documentTitle: 'Página não encontrada · venancio.dev',
    metaDescription: 'A página procurada não foi encontrada em venancio.dev.',
    homeLabel: 'Página inicial',
    siteHeader: 'Cabeçalho do site',
    sitePreferences: 'Preferências do site',
    languageLabel: 'Idioma',
    availablePages: 'Páginas disponíveis',
    themeLight: 'Ativar o tema claro',
    themeDark: 'Ativar o tema escuro',
    title: 'Página não encontrada',
    description: 'O endereço pode estar incorreto ou a página pode ter sido movida. Escolha um dos caminhos abaixo.',
    home: 'Página inicial',
    poetry: 'Poesia',
  },
  en: {
    documentTitle: 'Page not found · venancio.dev',
    metaDescription: 'The requested page could not be found on venancio.dev.',
    homeLabel: 'Homepage',
    siteHeader: 'Site header',
    sitePreferences: 'Site preferences',
    languageLabel: 'Language',
    availablePages: 'Available pages',
    themeLight: 'Use light theme',
    themeDark: 'Use dark theme',
    title: 'Page not found',
    description: 'The address may be incorrect, or the page may have moved. Choose one of the paths below.',
    home: 'Homepage',
    poetry: 'Poetry',
  },
});

function language() {
  return root.dataset.language === 'en' ? 'en' : 'pt';
}

function applyTheme(theme, persist = true) {
  const normalized = theme === 'dark' ? 'dark' : 'light';
  const translations = TRANSLATIONS[language()];
  root.dataset.theme = normalized;
  const label = normalized === 'dark' ? translations.themeLight : translations.themeDark;
  themeToggle?.setAttribute('aria-label', label);
  themeToggle?.setAttribute('title', label);
  themeColor?.setAttribute('content', normalized === 'dark' ? '#232530' : '#eef1f3');
  if (persist) localStorage.setItem('venancio-theme', normalized);
}

function applyLanguage(nextLanguage, persist = true) {
  const normalized = nextLanguage === 'en' ? 'en' : 'pt';
  const translations = TRANSLATIONS[normalized];
  root.dataset.language = normalized;
  root.lang = normalized === 'en' ? 'en' : 'pt-PT';

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const value = translations[element.dataset.i18n];
    if (value) element.textContent = value;
  });

  document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    const value = translations[element.dataset.i18nAriaLabel];
    if (value) element.setAttribute('aria-label', value);
  });

  document.title = translations.documentTitle;
  document.querySelector('meta[name="description"]')?.setAttribute('content', translations.metaDescription);

  languageButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.language === normalized));
  });

  applyTheme(root.dataset.theme, false);
  if (persist) localStorage.setItem('venancio-language', normalized);
}

themeToggle?.addEventListener('click', () => {
  applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
});

languageButtons.forEach((button) => {
  button.addEventListener('click', () => applyLanguage(button.dataset.language));
});

applyLanguage(root.dataset.language || 'pt', false);
applyTheme(root.dataset.theme || 'light', false);
