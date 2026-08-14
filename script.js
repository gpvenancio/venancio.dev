'use strict';

const root = document.documentElement;
const themeToggle = document.querySelector('[data-theme-toggle]');
const themeColor = document.querySelector('meta[name="theme-color"]');
const languageButtons = [...document.querySelectorAll('button[data-language]')];

const PAGE_TRANSLATIONS = Object.freeze({
  pt: {
    documentTitle: 'Gonçalo Venâncio · venancio.dev',
    description:
      'Página pessoal de Gonçalo Venâncio, com acesso aos seus projetos digitais e à sua escrita.',
    homeLabel: 'Página inicial',
    siteHeader: 'Cabeçalho do site',
    sitePreferences: 'Preferências do site',
    languageLabel: 'Idioma',
    mainPages: 'Páginas principais',
    themeLight: 'Ativar o tema claro',
    themeDark: 'Ativar o tema escuro',
    name: 'Gonçalo Venâncio',
    introduction:
      'Chamo-me Gonçalo Venâncio, nasci em Lisboa em 1988. Este espaço reúne os projetos a que me tenho dedicado, de desenvolvimento a poesia, e irá crescendo à medida que novos caminhos se forem definindo. Explore as secções abaixo.', 
    atlanticoDescription:
      'Um tema escuro sereno para Visual Studio Code e editores compatíveis.',
    poetryDescription: 'Poesia, textos e informação sobre o meu livro.',
    acervoDescription: 'Pregações, mensagens, reflexões e artigos sobre a fé cristã e os diversos aspectos da vida do cristão.',
    contactLead: 'Para questões gerais, propostas ou simplesmente para entrar em contacto.',
    contactTitle: 'Contacto',
    contactLabel: 'Contactar',
    preferencesNote:
      'As preferências de idioma e tema ficam guardadas apenas neste navegador.',
    atlanticoAria: 'Abrir a página do tema Atlantico',
    poetryAria: 'Abrir a página Poesia do Venâncio',
    acervoAria: 'Abrir o Acervo de Fé',
  },
  en: {
    documentTitle: 'Gonçalo Venâncio · venancio.dev',
    description:
      'Gonçalo Venâncio’s personal website, with access to his digital projects and writing.',
    homeLabel: 'Homepage',
    siteHeader: 'Site header',
    sitePreferences: 'Site preferences',
    languageLabel: 'Language',
    mainPages: 'Main pages',
    themeLight: 'Use light theme',
    themeDark: 'Use dark theme',
    name: 'Gonçalo Venâncio',
    introduction:
      'My name is Gonçalo Venâncio, and I was born in Lisbon in 1988. This space brings together the projects I have dedicated myself to, from development to poetry, and will keep growing as new paths take shape. Explore the sections below.', 
    atlanticoDescription:
      'A calm dark theme for Visual Studio Code and compatible editors.',
    poetryDescription: 'Poetry, texts, and information about my book.',
    acervoDescription: 'Sermons, messages, reflections, and articles about Christian faith and the different aspects of Christian life.',
    contactLead: 'For general enquiries, proposals, or simply to get in touch.',
    contactTitle: 'Contact',
    contactLabel: 'Contact me',
    preferencesNote:
      'Language and theme preferences are stored only in this browser.',
    atlanticoAria: 'Open the Atlantico theme page',
    poetryAria: 'Open the Poesia do Venâncio page',
    acervoAria: 'Open the Acervo de Fé',
  },
});

function getSavedTheme() {
  const saved = localStorage.getItem('venancio-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  const legacy = localStorage.getItem('poesia-theme');
  return legacy === 'light' || legacy === 'dark' ? legacy : null;
}

function getSavedLanguage() {
  const saved = localStorage.getItem('venancio-language');
  return saved === 'en' || saved === 'pt' ? saved : null;
}

function currentLanguage() {
  return root.dataset.language === 'en' || root.lang.toLowerCase().startsWith('en')
    ? 'en'
    : 'pt';
}

function applyTheme(theme, persist = true) {
  const normalized = theme === 'dark' ? 'dark' : 'light';
  root.dataset.theme = normalized;

  const language = currentLanguage();
  const translations = PAGE_TRANSLATIONS[language];
  const nextThemeLabel =
    normalized === 'dark' ? translations.themeLight : translations.themeDark;

  themeToggle?.setAttribute('aria-label', nextThemeLabel);
  themeToggle?.setAttribute('title', nextThemeLabel);
  themeColor?.setAttribute('content', normalized === 'dark' ? '#232530' : '#eef1f3');

  if (persist) localStorage.setItem('venancio-theme', normalized);
}

function applyLanguage(language, persist = true) {
  const normalized = language === 'en' ? 'en' : 'pt';
  const translations = PAGE_TRANSLATIONS[normalized];

  root.dataset.language = normalized;
  root.lang = normalized === 'pt' ? 'pt-PT' : 'en';

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n;
    if (translations[key]) element.textContent = translations[key];
  });

  document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    const key = element.dataset.i18nAriaLabel;
    if (translations[key]) element.setAttribute('aria-label', translations[key]);
  });

  document.title = translations.documentTitle;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', translations.description);

  languageButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.language === normalized));
  });

  applyTheme(root.dataset.theme, false);

  if (persist) localStorage.setItem('venancio-language', normalized);
}

function toggleTheme() {
  applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
}

themeToggle?.addEventListener('click', toggleTheme);
languageButtons.forEach((button) => {
  button.addEventListener('click', () => applyLanguage(button.dataset.language));
});

const initialTheme = root.dataset.theme || getSavedTheme() || 'light';

if (languageButtons.length) {
  const initialLanguage = root.dataset.language || getSavedLanguage() || 'pt';
  applyLanguage(initialLanguage, false);
}

applyTheme(initialTheme, false);
