'use strict';

const CONFIG = Object.freeze({
  siteTitle: 'Acervo de Fé',
  baseUrl: 'https://venancio.dev/acervo/',
  // Depois de criares o Blogger do Acervo, coloca aqui o endereço do blogue.
  // Exemplo: https://acervodefe.blogspot.com/
  blogHome: 'https://acervodefeven.blogspot.com/',
  feedUrl: 'https://acervodefeven.blogspot.com/feeds/posts/default',
  contactEmail: 'goncalo@venancio.dev',
  maxPosts: 500,
  categories: ['Pregação', 'Mensagem', 'Artigo', 'Reflexão'],
});

const CATEGORY_ALIASES = Object.freeze({
  'Pregação': ['pregação', 'pregações', 'sermon', 'sermons'],
  'Mensagem': ['mensagem', 'mensagens', 'message', 'messages'],
  'Artigo': ['artigo', 'artigos', 'article', 'articles'],
  'Reflexão': ['reflexão', 'reflexões', 'reflection', 'reflections'],
});

function categoryFromLabel(label='') {
  const normalized = normalizeText(label);
  return CONFIG.categories.find(category =>
    (CATEGORY_ALIASES[category] || [category]).some(alias => normalizeText(alias) === normalized)
  ) || null;
}

const I18N = Object.freeze({
  pt: {
    siteTitle: 'Acervo de Fé',
    skipContent: 'Avançar para o conteúdo', openAllTexts: 'Abrir todos os textos', allTexts: 'Todos os textos', homepage: 'Página inicial', sharePage: 'Partilhar esta página', share: 'Partilhar', searchTexts: 'Pesquisar textos', search: 'Pesquisar', loadingTexts: 'A carregar o acervo…', closeMenu: 'Fechar o menu', textsIndex: 'Índice de textos', backTop: 'Voltar ao topo', findText: 'Encontrar um texto', closeSearch: 'Fechar a pesquisa', searchByContent: 'Pesquisar por título ou conteúdo', searchPlaceholder: 'Pesquisar por título, conteúdo ou autor', searchHelp: 'Comece a escrever para pesquisar.', chooseOption: 'Escolher uma opção', closeShare: 'Fechar as opções de partilha', shareHow: 'Escolha como pretende partilhar esta página.', shareOptions: 'Opções de partilha', copyLink: 'Copiar a ligação', language: 'Idioma', preferencesNote: 'As preferências de idioma e tema ficam guardadas apenas neste navegador.', themeLight: 'Ativar o modo claro', themeDark: 'Ativar o modo escuro', siteDescription: 'Pregações, mensagens, reflexões e artigos sobre a fé cristã e os diversos aspectos da vida do cristão.', siteIntro: 'Pregações, mensagens, reflexões e artigos sobre a fé cristã e os diversos aspectos da vida do cristão.', textFallback: 'Texto', readText: 'Abrir', backHome: 'Voltar ao Acervo', backAllTexts: 'Voltar a todos os textos', previousText: 'Texto anterior', nextText: 'Texto seguinte', textNavigation: 'Navegação entre textos', notFoundTitle: 'Texto não encontrado', notFoundText: 'O endereço pode estar incompleto ou o texto pode já não estar disponível.', loadErrorTitle: 'Não foi possível carregar o Acervo', retry: 'Tentar novamente', openBlog: 'Abrir o blogue', noSearchResults: 'Não encontrei nenhum texto com esses termos.', bloggerTimeout: 'A resposta do Blogger demorou demasiado tempo.', bloggerConnection: 'Não foi possível ligar ao Blogger.', noPosts: 'Ainda não existem textos publicados no Acervo.', notConfigured: 'O Acervo está criado, mas ainda falta ligá-lo ao Blogger.', openPdf: 'Abrir PDF', pdfLabel: 'Mensagem em PDF', noPdf: 'Esta publicação ainda não tem um PDF associado.', author: 'Autor', date: 'Primeira publicação', category: 'Categoria', allCategories: 'Todos os textos', categoryLabel: 'Categoria', categories: 'Categorias', authors: 'Autores', opinion: 'Contactar o autor', opinionSubject: title => `Sobre “${title}”`, opinionBody: title => `Olá,\n\nGostaria de entrar em contacto acerca do texto “${title}”.\n\n`, copied: 'Ligação copiada.', rssCopied: 'Ligação RSS copiada.', copyFailed: 'Não foi possível copiar a ligação.'
  },
  en: {
    siteTitle: 'Faith Archive',
    skipContent: 'Skip to content', openAllTexts: 'Open all texts', allTexts: 'All texts', homepage: 'Homepage', sharePage: 'Share this page', share: 'Share', searchTexts: 'Search texts', search: 'Search', loadingTexts: 'Loading the archive…', closeMenu: 'Close menu', textsIndex: 'Text index', backTop: 'Back to top', findText: 'Find a text', closeSearch: 'Close search', searchByContent: 'Search by title or content', searchPlaceholder: 'Search by title, content or author', searchHelp: 'Start typing to search.', chooseOption: 'Choose an option', closeShare: 'Close sharing options', shareHow: 'Choose how you would like to share this page.', shareOptions: 'Sharing options', copyLink: 'Copy link', language: 'Language', preferencesNote: 'Language and theme preferences are stored only in this browser.', themeLight: 'Use light mode', themeDark: 'Use dark mode', siteDescription: 'Sermons, messages, reflections and articles about Christian faith and the different aspects of Christian life.', siteIntro: 'Sermons, messages, reflections and articles about Christian faith and the different aspects of Christian life.', textFallback: 'Text', readText: 'Open', backHome: 'Back to the archive', backAllTexts: 'Back to all texts', previousText: 'Previous text', nextText: 'Next text', textNavigation: 'Text navigation', notFoundTitle: 'Text not found', notFoundText: 'The address may be incomplete, or the text may no longer be available.', loadErrorTitle: 'The archive could not be loaded', retry: 'Try again', openBlog: 'Open the blog', noSearchResults: 'No text matched those terms.', bloggerTimeout: 'The Blogger response took too long.', bloggerConnection: 'Blogger could not be reached.', noPosts: 'There are no published texts in the archive yet.', notConfigured: 'The archive is ready, but it is not connected to Blogger yet.', openPdf: 'Open PDF', pdfLabel: 'Message in PDF', noPdf: 'This publication does not have an associated PDF yet.', author: 'Author', date: 'First published', category: 'Category', allCategories: 'All texts', categoryLabel: 'Category', categories: 'Categories', authors: 'Authors', opinion: 'Contact the author', opinionSubject: title => `About “${title}”`, opinionBody: title => `Hello,\n\nI would like to get in touch about the text “${title}”.\n\n`, copied: 'Link copied.', rssCopied: 'RSS feed link copied.', copyFailed: 'The link could not be copied.'
  },
});

const state = { posts: [], searchIndex: [], filter: null };
const elements = {
  view: document.querySelector('[data-view]'), homeOnly: document.querySelector('[data-home-only]'), archiveLists: [...document.querySelectorAll('[data-archive-list]')], categoryList: document.querySelector('[data-category-list]'), authorList: document.querySelector('[data-author-list]'), filterList: document.querySelector('[data-filter-list]'), drawer: document.querySelector('[data-drawer]'), drawerBackdrop: document.querySelector('[data-drawer-backdrop]'), closeMenuButton: document.querySelector('[data-close-menu]'), themeToggle: document.querySelector('[data-theme-toggle]'), languageButtons: [...document.querySelectorAll('button[data-language]')], searchDialog: document.querySelector('[data-search-dialog]'), searchInput: document.querySelector('[data-search-input]'), searchResults: document.querySelector('[data-search-results]'), searchButtons: [...document.querySelectorAll('[data-open-search]')], homeShareButton: document.querySelector('[data-share-home]'), shareDialog: document.querySelector('[data-share-dialog]'), closeShareButton: document.querySelector('[data-close-share]'), sharePreviewTitle: document.querySelector('[data-share-preview-title]'), shareWhatsApp: document.querySelector('[data-share-whatsapp]'), shareEmail: document.querySelector('[data-share-email]'), shareFacebook: document.querySelector('[data-share-facebook]'), shareTelegram: document.querySelector('[data-share-telegram]'), nativeShareButton: document.querySelector('[data-native-share]'), copyShareButton: document.querySelector('[data-copy-share]'), toast: document.querySelector('[data-toast]'), backToTopButton: document.querySelector('[data-back-to-top]'), rssToast: document.querySelector('[data-rss-toast]'), rssLinks: [...document.querySelectorAll('[data-rss-link]')], canonical: document.querySelector('link[rel="canonical"]'), metaDescription: document.querySelector('meta[name="description"]'),
};

function language() { return document.documentElement.dataset.language === 'en' ? 'en' : 'pt'; }
function t(key, ...args) { const value = I18N[language()][key]; return typeof value === 'function' ? value(...args) : value; }
function normalizeText(value='') { return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase(language()==='pt'?'pt-PT':'en').replace(/\s+/g,' ').trim(); }
function htmlToText(html='') { const d = new DOMParser().parseFromString(html,'text/html'); return (d.body.textContent||'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim(); }
function escapeHtml(value='') { return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
function formatDate(value='') { if (!value) return ''; const date=new Date(value); if(Number.isNaN(date.getTime())) return ''; return new Intl.DateTimeFormat(language()==='pt'?'pt-PT':'en-GB',{day:'numeric',month:'long',year:'numeric'}).format(date); }
function getAlternateLink(entry) { return entry.link?.find(link=>link.rel==='alternate')?.href || CONFIG.blogHome || ''; }
function getSlug(url, fallback) { try { const pathname=new URL(url).pathname; const filename=pathname.split('/').filter(Boolean).at(-1)||fallback; return decodeURIComponent(filename.replace(/\.html$/i,'')); } catch { return fallback; } }

function sanitizePostHtml(html='') {
  const parsed=new DOMParser().parseFromString(html,'text/html');
  parsed.querySelectorAll('script,style,object,embed,link,meta').forEach(node=>node.remove());

  // Mantemos os marcadores EOP do Word no DOM. Em alguns conteúdos exportados pelo Word,
  // estes marcadores fazem parte da estrutura que preserva a separação visual entre parágrafos.
  // O CSS do Acervo trata a sua apresentação, sem os deixar visíveis.

  const normalizeColor=value=>value.trim().toLowerCase().replace(/\s+/g,'');
  const isWhiteBackground=value=>{
    const v=normalizeColor(value);
    return v==='transparent' || v==='white' || v==='#fff' || v==='#ffffff' || v==='rgb(255,255,255)' || v==='rgba(255,255,255,1)';
  };
  const isEopGray=value=>{
    const v=normalizeColor(value);
    return v==='#c6c6c6' || v==='rgb(198,198,198)' || v==='rgba(198,198,198,1)';
  };

  parsed.querySelectorAll('*').forEach(node=>{
    [...node.attributes].forEach(attribute=>{
      const name=attribute.name.toLowerCase();
      const value=attribute.value.trim().toLowerCase();
      if(name.startsWith('on') || value.startsWith('javascript:')) node.removeAttribute(attribute.name);
    });

    const style=node.getAttribute('style');
    if(!style) return;

    const bgMatch=style.match(/(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/i);
    const colorMatch=style.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
    const bg=bgMatch?.[1]?.trim() || '';
    const color=colorMatch?.[1]?.trim() || '';

    // Mantemos os destaques que fazem parte do design da mensagem,
    // mas removemos o fundo branco/transparente que o Word coloca em quase
    // todos os parágrafos.
    if(bg && !isWhiteBackground(bg) && !isEopGray(bg)) {
      const normalizedBg=normalizeColor(bg);
      if(normalizedBg==='#edf2f4' || normalizedBg==='rgb(237,242,244)') {
        node.classList.add('acervo-highlight');
      } else if(normalizedBg==='#f2f0e9' || normalizedBg==='rgb(242,240,233)') {
        node.classList.add('acervo-scripture');
      } else {
        // Qualquer outro fundo não branco usado pelo Word para um destaque
        // pertence ao mesmo género visual de destaque. A aparência final
        // deve ser uniforme, independentemente da cor de fundo original.
        node.classList.add('acervo-highlight');
      }
    }

    // Mantemos as cores de destaque do documento, mas cores de texto normais
    // como #222222/windowtext passam a seguir o tema claro/escuro do Acervo.
    if(color) {
      const normalizedColor=normalizeColor(color);
      if(normalizedColor==='#1f3b4d' || normalizedColor==='rgb(31,59,77)') {
        node.classList.add('acervo-accent-text');
      } else if(normalizedColor==='#8a6d1d' || normalizedColor==='rgb(138,109,29)') {
        node.classList.add('acervo-scripture-label');
      }
    }

    let cleaned=style
      .replace(/(?:^|;)\s*-webkit-[^:]+\s*:[^;]*/gi,'')
      .replace(/(?:^|;)\s*background(?:-color)?\s*:[^;]*/gi,'')
      .replace(/(?:^|;)\s*color\s*:\s*[^;]*/gi,'')
      .replace(/(?:^|;)\s*font-family\s*:[^;]*/gi,'')
      .replace(/(?:^|;)\s*font-size\s*:[^;]*/gi,'')
      .replace(/(?:^|;)\s*line-height\s*:[^;]*/gi,'')
      .replace(/(?:^|;)\s*font-kerning\s*:[^;]*/gi,'')
      .replace(/(?:^|;)\s*font-variant-ligatures\s*:[^;]*/gi,'')
      .replace(/(?:^|;)\s*user-select\s*:[^;]*/gi,'')
      .replace(/(?:^|;)\s*cursor\s*:[^;]*/gi,'')
      .replace(/;;+/g,';')
      .replace(/^\s*;|;\s*$/g,'')
      .trim();

    // Cores normais do Word não devem ficar fixas, porque ficam ilegíveis no
    // tema escuro. As classes acima preservam apenas as cores de destaque.
    if(color && /^(windowtext|black|#000|#000000|#222|#222222|rgb\(34,34,34\))$/i.test(normalizeColor(color))) {
      cleaned=cleaned.replace(/(?:^|;)\s*color\s*:\s*[^;]*/gi,'');
    }

    if(cleaned) node.setAttribute('style',cleaned);
    else node.removeAttribute('style');
  });

  // Versões anteriores do sanitizador podiam ter criado esta classe.
  // Normalizamos tudo para o mesmo tipo de destaque antes de agrupar.
  parsed.querySelectorAll('.acervo-preserved-block').forEach(node=>{
    node.classList.remove('acervo-preserved-block');
    node.classList.add('acervo-highlight');
  });

  // Alguns textos bíblicos colados a partir do Word têm o fundo aplicado
  // ao wrapper que envolve a passagem, e não ao próprio parágrafo. Quando
  // encontramos uma referência bíblica, o elemento imediatamente seguinte
  // pertence à passagem e deve receber o mesmo tratamento das restantes.
  const scriptureReference=/^(?:[1-3]\s*)?(?:Génesis|Genesis|Êxodo|Exodus|Levítico|Leviticus|Números|Numbers|Deuteronómio|Deuteronomy|Josué|Joshua|Juízes|Judges|Rute|Ruth|1 Samuel|2 Samuel|1 Reis|2 Reis|1 Kings|2 Kings|1 Crónicas|2 Crónicas|1 Chronicles|2 Chronicles|Esdras|Ezra|Neemias|Nehemiah|Ester|Esther|Job|Salmos?|Psalms?|Provérbios|Proverbs|Eclesiastes|Ecclesiastes|Cantares|Song of Songs|Isaías|Isaiah|Jeremias|Jeremiah|Lamentações|Lamentations|Ezequiel|Ezekiel|Daniel|Oseias|Hosea|Joel|Amós|Amos|Obadias|Obadiah|Jonas|Jonah|Miqueias|Micah|Naum|Nahum|Habacuque|Habakkuk|Sofonias|Zephaniah|Ageu|Haggai|Zacarias|Zechariah|Malaquias|Malachi|Mateus|Matthew|Marcos|Mark|Lucas|Luke|João|John|Atos|Acts|Romanos|Romans|1 Coríntios|2 Coríntios|1 Corinthians|2 Corinthians|Gálatas|Galatians|Efésios|Ephesians|Filipenses|Philippians|Colossenses|Colossians|1 Tessalonicenses|2 Tessalonicenses|1 Thessalonians|2 Thessalonians|1 Timóteo|2 Timóteo|1 Timothy|2 Timothy|Tito|Titus|Filemom|Philemon|Hebreus|Hebrews|Tiago|James|1 Pedro|2 Pedro|1 Peter|2 Peter|1 João|2 João|3 João|1 John|2 John|3 John|Judas|Jude|Apocalipse|Revelation)\s+\d+(?::|\.|-)\d+[\w:.,-]*\s+(?:ARC|NET)\b/i;
  [...parsed.body.querySelectorAll('*')].forEach(node=>{
    const directText=(node.textContent||'').replace(/\s+/g,' ').trim();
    if(!scriptureReference.test(directText) || node.children.length>0) return;
    const next=node.nextElementSibling || node.parentElement?.nextElementSibling;
    if(next && next.textContent?.trim()) next.classList.add('acervo-scripture');
  });

  parsed.querySelectorAll('img').forEach(image=>{
    image.loading='lazy';
    image.decoding='async';
    image.removeAttribute('width');
    image.removeAttribute('height');
  });

  // No HTML colado a partir do Word, cada Enter pode chegar ao Blogger como
  // um <p> destacado dentro do seu próprio <div>. Por isso, dois destaques
  // visualmente consecutivos nem sempre são irmãos diretos no DOM.
  // Aqui agrupamos os parágrafos consecutivos do mesmo género, retirando
  // apenas o wrapper técnico criado pelo Word/Blogger. Um Enter usado pelo
  // autor para dar impacto visual continua como uma nova linha dentro da
  // mesma caixa, e não como uma nova caixa.
  ['acervo-highlight', 'acervo-scripture'].forEach(className=>{
    const groupClass=`${className}-group`;
    const nodes=[...parsed.body.querySelectorAll(`.${className}`)];

    const getContainer=node=>{
      const parent=node.parentElement;
      if(!parent) return null;
      if(parent.tagName==='DIV' && parent.children.length===1 && parent.firstElementChild===node) return parent;
      return node;
    };

    let i=0;
    while(i<nodes.length){
      const first=nodes[i];
      const firstContainer=getContainer(first);
      const block=[first];
      let j=i+1;

      while(j<nodes.length){
        const previous=nodes[j-1];
        const current=nodes[j];
        const previousContainer=getContainer(previous);
        const currentContainer=getContainer(current);
        if(!previousContainer || !currentContainer) break;

        // Os parágrafos do Word estão normalmente em divs consecutivos.
        // Também aceitamos irmãos diretos, caso o Blogger já tenha removido
        // os wrappers.
        if(currentContainer.parentElement!==previousContainer.parentElement ||
           currentContainer.previousElementSibling!==previousContainer){
          break;
        }

        block.push(current);
        j++;
      }

      if(block.length>=1){
        const firstContainerForGroup=getContainer(block[0]);
        const parent=firstContainerForGroup.parentElement;
        const group=document.createElement('div');
        group.className=groupClass;
        parent.insertBefore(group,firstContainerForGroup);

        block.forEach(node=>{
          const container=getContainer(node);
          if(container!==node){
            group.appendChild(node);
            container.remove();
          } else {
            group.appendChild(node);
          }
        });
      }

      i=j;
    }
  });

  // O tipo visual de um destaque é determinado pelo alinhamento do texto,
  // e não pelo número de linhas nem pela cor que o Word lhe atribuiu.
  // Assim, uma pergunta centrada e uma pergunta centrada com várias linhas
  // continuam a ser exatamente o mesmo tipo de caixa.
  const hasCenteredText=node=>{
    const candidates=[node,...node.querySelectorAll('*')];
    return candidates.some(item=>{
      const align=item.getAttribute('align') || item.style?.textAlign || '';
      return /^(center|middle)$/i.test(align.trim());
    });
  };
  parsed.querySelectorAll('.acervo-highlight-group').forEach(group=>{
    group.classList.toggle('acervo-highlight-centered',hasCenteredText(group));
    group.classList.toggle('acervo-highlight-bar',!hasCenteredText(group));
  });
  parsed.querySelectorAll('.acervo-highlight:not(.acervo-highlight-group)').forEach(node=>{
    node.classList.toggle('acervo-highlight-centered',hasCenteredText(node));
    node.classList.toggle('acervo-highlight-bar',!hasCenteredText(node));
  });

  // Uma passagem bíblica deve ter sempre a mesma apresentação. Removemos
  // fundos, bordas e caixas herdadas do Word dos elementos internos, deixando
  // apenas a caixa tipográfica única do Acervo.
  parsed.querySelectorAll('.acervo-scripture-group, .acervo-scripture').forEach(node=>{
    node.querySelectorAll('*').forEach(child=>{
      child.style.removeProperty('background');
      child.style.removeProperty('background-color');
      child.style.removeProperty('border');
      child.style.removeProperty('border-left');
      child.style.removeProperty('border-right');
      child.style.removeProperty('border-top');
      child.style.removeProperty('border-bottom');
    });
  });

  parsed.querySelectorAll('a').forEach(link=>{
    const url=link.getAttribute('href');
    if(!url) return;
    try {
      const u=new URL(url,CONFIG.blogHome||window.location.href);
      if(u.origin!==window.location.origin){link.target='_blank';link.rel='noopener noreferrer';}
    } catch { link.removeAttribute('href'); }
  });

  parsed.querySelectorAll('iframe').forEach(frame=>{
    try {
      const u=new URL(frame.getAttribute('src')||'',window.location.href);
      const allowed=['drive.google.com','docs.google.com','www.google.com'].includes(u.hostname);
      if(!allowed) frame.remove();
      else {frame.loading='lazy';frame.referrerPolicy='no-referrer';}
    } catch { frame.remove(); }
  });

  return parsed.body.innerHTML;
}

function parsePdfUrl(content) {
  const parsed=new DOMParser().parseFromString(content,'text/html');
  const links=[...parsed.querySelectorAll('a[href]')];
  const direct=links.find(a=>/\.pdf(?:[?#].*)?$/i.test(a.href));
  if(direct) return {url:direct.href,label:direct.textContent.trim()||t('openPdf')};
  const drive=links.find(a=>/drive\.google\.com\/file\/d\//i.test(a.href));
  if(drive) { const match=drive.href.match(/drive\.google\.com\/file\/d\/([^/]+)/i); if(match) return {url:`https://drive.google.com/file/d/${match[1]}/preview`,label:drive.textContent.trim()||t('openPdf')}; }
  const iframe=parsed.querySelector('iframe[src]');
  if(iframe) { try { const u=new URL(iframe.src); if(u.hostname==='drive.google.com'||u.hostname==='docs.google.com') return {url:u.href,label:t('openPdf')}; } catch {} }
  return null;
}

function parseFeed(feed) {
  const entries=feed?.feed?.entry||[];
  const posts=entries.map((entry,index)=>{
    const title=entry.title?.$t?.trim()||`${t('textFallback')} ${index+1}`;
    const originalUrl=getAlternateLink(entry);
    const content=entry.content?.$t||'';
    const text=htmlToText(content);
    const slug=getSlug(originalUrl,`texto-${index+1}`);
    const labels=(entry.category||[]).map(item=>item.term).filter(Boolean);
    const synopsisLabel=labels.find(label=>/^(sinopse|synopsis)\s*:/i.test(label))||'';
    const synopsisFromLabel=synopsisLabel.replace(/^(sinopse|synopsis)\s*:\s*/i,'').trim();
    const contentLabels=labels.filter(label=>!/^(sinopse|synopsis)\s*:/i.test(label));
    const categories=[...new Set(contentLabels.map(categoryFromLabel).filter(Boolean))];
    const authors=contentLabels.filter(label=>!categoryFromLabel(label) && !/^(PT|EN)$/i.test(label) && !/^ID\s*:/i.test(label));
    const author=authors[0]||entry.author?.[0]?.name?.$t||'Gonçalo Venâncio';
    const languageLabel=contentLabels.find(label=>/^(PT|EN)$/i.test(label))||'PT';
    const postLanguage=/^EN$/i.test(languageLabel)?'en':'pt';
    const groupLabel=contentLabels.find(label=>/^ID\s*:/i.test(label))||'';
    const groupId=groupLabel.replace(/^ID\s*:\s*/i,'').trim().toLowerCase() || slug.toLowerCase();
    const summary=htmlToText(entry.summary?.$t||'').trim();
    const excerpt=text.length>310?`${text.slice(0,307).trim()}…`:text;
    const synopsis=synopsisFromLabel || (summary && summary.length<=180 ? summary : '');
    return {
      id:entry.id?.$t||slug,
      title,
      slug,
      groupId,
      language:postLanguage,
      content:sanitizePostHtml(content),
      text,
      excerpt,
      synopsis,
      originalUrl,
      published:entry.published?.$t||'',
      firstPublished:entry.published?.$t||'',
      author,
      categories,
      labels,
      pdf:parsePdfUrl(content)
    };
  });

  // Quando existem versões PT e EN da mesma publicação, a data apresentada
  // deve ser a data da primeira publicação, e não a data de uma tradução ou
  // de uma atualização posterior.
  const firstPublishedByGroup=new Map();
  posts.forEach(post=>{
    if(!post.published) return;
    const current=firstPublishedByGroup.get(post.groupId);
    if(!current || new Date(post.published)<new Date(current)) {
      firstPublishedByGroup.set(post.groupId,post.published);
    }
  });
  posts.forEach(post=>{
    post.firstPublished=firstPublishedByGroup.get(post.groupId)||post.published;
  });

  return posts;
}

function loadBloggerFeed() {
  if(!CONFIG.feedUrl) return Promise.reject(new Error(t('notConfigured')));
  return new Promise((resolve,reject)=>{
    const callbackName=`acervoFeed_${Date.now()}_${Math.random().toString(36).slice(2)}`; const script=document.createElement('script');
    const timeout=window.setTimeout(()=>{cleanup();reject(new Error(t('bloggerTimeout')))},15000);
    function cleanup(){window.clearTimeout(timeout);script.remove();try{delete window[callbackName]}catch{window[callbackName]=undefined}}
    window[callbackName]=data=>{cleanup();resolve(data)}; script.onerror=()=>{cleanup();reject(new Error(t('bloggerConnection')))};
    const params=new URLSearchParams({alt:'json-in-script','max-results':String(CONFIG.maxPosts),orderby:'published',callback:callbackName}); script.src=`${CONFIG.feedUrl}?${params.toString()}`; document.head.append(script);
  });
}

function postUrl(post){return `${CONFIG.baseUrl}#texto=${encodeURIComponent(post.slug)}`;}
function categoryUrl(category){return `${CONFIG.baseUrl}#categoria=${encodeURIComponent(category)}`;}
function authorUrl(author){return `${CONFIG.baseUrl}#autor=${encodeURIComponent(author)}`;}
function getRoute(){
  const path=window.location.pathname.replace(/\/+$/,'/');
  const base=new URL(CONFIG.baseUrl).pathname;
  const hashParams=new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const hashPost=hashParams.get('texto');
  const hashCategory=hashParams.get('categoria');
  const hashAuthor=hashParams.get('autor');

  if(path===base||path===base.slice(0,-1)) {
    if(hashPost) return {name:'article',slug:hashPost,filter:null,filterType:null};
    if(hashCategory) return {name:'home',slug:null,filter:hashCategory,filterType:'category'};
    if(hashAuthor) return {name:'home',slug:null,filter:hashAuthor,filterType:'author'};
    const params=new URLSearchParams(window.location.search);
    const category=params.get('categoria');
    const author=params.get('autor');
    const post=params.get('texto');
    if(post) return {name:'article',slug:post,filter:null,filterType:null};
    if(category) return {name:'home',slug:null,filter:category,filterType:'category'};
    if(author) return {name:'home',slug:null,filter:author,filterType:'author'};
    return {name:'home',slug:null,filter:null,filterType:null};
  }

  const relative=path.startsWith(base)?path.slice(base.length):'';
  const parts=relative.split('/').filter(Boolean).map(decodeURIComponent);
  if(parts[0]==='categoria'&&parts[1]) return {name:'home',slug:null,filter:parts[1],filterType:'category'};
  if(parts[0]==='autor'&&parts[1]) return {name:'home',slug:null,filter:parts[1],filterType:'author'};
  if(parts[0]) return {name:'article',slug:parts[0],filter:null,filterType:null};
  return {name:'home',slug:null,filter:null,filterType:null};
}

function visiblePosts(){
  const current=language();
  return state.posts.filter(post=>post.language===current);
}

function renderArchive(){
  const route=getRoute();
  const posts=visiblePosts();
  const markup=posts.map(post=>`<li><a href="${postUrl(post)}" ${route.slug===post.slug?'aria-current="page"':''}>${escapeHtml(post.title)}</a></li>`).join('');
  elements.archiveLists.forEach(list=>list.innerHTML=markup);
}

function categoryPlural(category){
  const map=language()==='pt'
    ? { 'Pregação':'Pregações', 'Mensagem':'Mensagens', 'Artigo':'Artigos', 'Reflexão':'Reflexões' }
    : { 'Pregação':'Sermons', 'Mensagem':'Messages', 'Artigo':'Articles', 'Reflexão':'Reflections' };
  return map[category]||category;
}

function renderDrawerFilters(){
  const route=getRoute();
  const categoryItems=[
    `<li><a href="${CONFIG.baseUrl}" ${!route.filter?'aria-current="page"':''}>${escapeHtml(t('allTexts'))}</a></li>`,
    ...CONFIG.categories.map(category=>{
      const active=route.filterType==='category'&&normalizeText(route.filter)===normalizeText(category);
      return `<li><a href="${categoryUrl(category)}" ${active?'aria-current="page"':''}>${escapeHtml(categoryPlural(category))}</a></li>`;
    })
  ].join('');
  if(elements.categoryList) elements.categoryList.innerHTML=categoryItems;

  const authors=[...new Map(visiblePosts().map(post=>[normalizeText(post.author),post.author])).values()]
    .sort((a,b)=>a.localeCompare(b,language()==='pt'?'pt-PT':'en'));
  const authorItems=authors.map(author=>{
    const active=route.filterType==='author'&&normalizeText(route.filter)===normalizeText(author);
    return `<li><a href="${authorUrl(author)}" ${active?'aria-current="page"':''}>${escapeHtml(author)}</a></li>`;
  }).join('');
  if(elements.authorList) elements.authorList.innerHTML=authorItems;
}

function allCategories(){
  return CONFIG.categories.filter(category=>visiblePosts().some(post=>post.categories.some(cat=>normalizeText(cat)===normalizeText(category))));
}

function renderFilters(){
  if(!elements.filterList) return;
  const route=getRoute();
  const cats=allCategories();
  const items=[
    `<a class="acervo-filter" href="${CONFIG.baseUrl}" ${!route.filter?'aria-current="page"':''}>${t('allCategories')}</a>`,
    ...cats.map(cat=>`<a class="acervo-filter" href="${categoryUrl(cat)}" ${route.filterType==='category'&&normalizeText(route.filter)===normalizeText(cat)?'aria-current="page"':''}>${escapeHtml(categoryPlural(cat))}</a>`)
  ];
  elements.filterList.innerHTML=items.join('');
}

function filteredPosts(){
  const route=getRoute();
  const posts=visiblePosts();
  if(!route.filter) return posts;
  const normalized=normalizeText(route.filter);
  if(route.filterType==='author') return posts.filter(post=>normalizeText(post.author)===normalized);
  return posts.filter(post=>post.categories.some(cat=>normalizeText(cat)===normalized));
}

function renderHome(){
  const route=getRoute();
  document.title=route.filter?`${route.filter} · ${CONFIG.siteTitle}`:CONFIG.siteTitle;
  elements.metaDescription?.setAttribute('content',t('siteDescription'));
  elements.canonical?.setAttribute('href',window.location.href.split('?')[0]);
  elements.homeOnly.hidden=false;
  elements.homeShareButton.hidden=false;
  elements.searchButtons.forEach(b=>b.hidden=false);
  renderFilters();
  renderDrawerFilters();
  requestAnimationFrame(updateBackToTopVisibility);

  const posts=filteredPosts();
  if(!posts.length){
    elements.view.innerHTML=`<section class="empty-state reveal-card"><h2>${t('noPosts')}</h2></section>`;
    return;
  }

  const cards=posts.map((post,index)=>{
    const category=post.categories[0]?categoryPlural(post.categories[0]):t('textFallback');
    const synopsis=post.synopsis||post.excerpt||'';
    return `<article class="post-card reveal-card" style="animation-delay:${920+Math.min(index*70,420)}ms">
      <div class="post-meta"><span>${escapeHtml(category)}</span><span>${escapeHtml(post.author)}</span></div>
      <h2><a href="${postUrl(post)}">${escapeHtml(post.title)}</a></h2>
      ${synopsis?`<p class="post-excerpt">${escapeHtml(synopsis)}</p>`:''}
      <span class="read-label">${t('readText')}</span>
    </article>`;
  }).join('');

  elements.view.innerHTML=`<section class="posts-grid" aria-label="${t('allTexts')}">${cards}</section>`;
  setActiveArchiveItem(null);
}

function renderArticleNavigation(post){const posts=visiblePosts(); const index=posts.findIndex(item=>item.slug===post.slug); const previous=index>=0?posts[index+1]:null; const next=index>0?posts[index-1]:null; if(!previous&&!next)return ''; const prev=previous?`<a class="article-navigation-link article-navigation-previous reveal-card" href="${postUrl(previous)}"><span class="article-navigation-label">${t('previousText')}</span><strong>${escapeHtml(previous.title)}</strong></a>`:'<span class="article-navigation-spacer"></span>'; const nxt=next?`<a class="article-navigation-link article-navigation-next reveal-card" href="${postUrl(next)}"><span class="article-navigation-label">${t('nextText')}</span><strong>${escapeHtml(next.title)}</strong></a>`:'<span class="article-navigation-spacer"></span>'; return `<nav class="article-navigation" aria-label="${t('textNavigation')}">${prev}${nxt}</nav>`; }
function renderPdf(post){ if(!post.pdf) return `<div class="pdf-card"><div class="pdf-placeholder"><p>${t('noPdf')}</p></div></div>`; return `<section class="pdf-card" aria-label="${t('pdfLabel')}"><div class="pdf-toolbar"><strong>${t('pdfLabel')}</strong><a class="pill" href="${post.pdf.url}" target="_blank" rel="noopener noreferrer">${t('openPdf')}</a></div><iframe class="pdf-frame" src="${post.pdf.url}" title="${escapeHtml(post.title)}"></iframe></section>`; }
function renderArticle(post){
  document.title=`${post.title} · ${CONFIG.siteTitle}`;
  elements.metaDescription?.setAttribute('content',post.synopsis||post.excerpt||`${t('textFallback')} ${post.title}.`);
  elements.canonical?.setAttribute('href',postUrl(post));
  elements.homeOnly.hidden=true;
  elements.homeShareButton.hidden=true;
  elements.searchButtons.forEach(b=>b.hidden=true);
  requestAnimationFrame(updateBackToTopVisibility);

  const documentContent=post.content
    ? `<section class="article-body" aria-label="${escapeHtml(post.title)}">${post.content}</section>`
    : `<section class="article-body article-body-empty"><p>${t('noPosts')}</p></section>`;

  elements.view.innerHTML=`<article class="article-view">
    <div class="article-toolbar reveal-card">
      <a class="back-link reveal-icon" href="${CONFIG.baseUrl}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10.53 5.47-1.06-1.06L1.88 12l7.59 7.59 1.06-1.06-5.78-5.78H22v-1.5H4.75z" /></svg>
        <span>${t('backHome')}</span>
      </a>
      <button class="icon-button reveal-icon" type="button" aria-label="${t('sharePage')}" data-share>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 16.25a3.24 3.24 0 0 0-2.55 1.24l-7.09-4.1a3.38 3.38 0 0 0 0-2.78l7.09-4.1A3.25 3.25 0 1 0 14.75 4c0 .35.06.69.16 1L7.8 9.11A3.25 3.25 0 1 0 7.8 14.9L14.91 19c-.1.31-.16.65-.16 1A3.25 3.25 0 1 0 18 16.25Z" /></svg>
      </button>
    </div>

    <div class="article-card reveal-card">
      <h1 class="article-title reveal"><span>${escapeHtml(post.title)}</span></h1>
      <div class="article-meta">
        ${[
          post.categories[0]?`<a class="article-meta-link" href="${categoryUrl(post.categories[0])}">${escapeHtml(categoryPlural(post.categories[0]))}</a>`:'',
          post.author?`<a class="article-meta-link" href="${authorUrl(post.author)}">${escapeHtml(post.author)}</a>`:'',
          post.firstPublished?`<span class="article-meta-date">${escapeHtml(t('date'))}: ${escapeHtml(formatDate(post.firstPublished))}</span>`:''
        ].filter(Boolean).join('<span class="article-meta-separator" aria-hidden="true">·</span>')}
      </div>
      ${post.synopsis?`<p class="article-synopsis">${escapeHtml(post.synopsis)}</p>`:''}
      ${documentContent}
      <footer class="article-footer">
        <div class="article-actions">
          <a class="pill secondary-action" href="mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(t('opinionSubject',post.title))}&body=${encodeURIComponent(t('opinionBody',post.title))}">${t('opinion')}</a>
          <a class="pill secondary-action" href="${CONFIG.baseUrl}">${t('backAllTexts')}</a>
        </div>
      </footer>
      ${renderArticleNavigation(post)}
    </div>
  </article>`;

  setActiveArchiveItem(post.slug);
  renderDrawerFilters();
  document.querySelector('#conteudo')?.focus({preventScroll:true});
  window.scrollTo({top:0,behavior:'smooth'});
  window.requestAnimationFrame(updateBackToTopVisibility);
  elements.view.querySelector('[data-share]')?.addEventListener('click',()=>openShare(post.title));
}

function renderNotFound(){elements.homeOnly.hidden=true;elements.homeShareButton.hidden=true;elements.searchButtons.forEach(b=>b.hidden=true);elements.view.innerHTML=`<section class="empty-state reveal-card"><h1>${t('notFoundTitle')}</h1><p>${t('notFoundText')}</p><a class="pill" href="${CONFIG.baseUrl}">${t('backAllTexts')}</a></section>`;}
function renderError(error){elements.homeOnly.hidden=false;elements.homeShareButton.hidden=false;elements.searchButtons.forEach(b=>b.hidden=false); elements.view.innerHTML=`<section class="error-card reveal-card"><h2>${t('loadErrorTitle')}</h2><p>${escapeHtml(error.message)}</p><div class="hero-actions"><button class="pill" type="button" data-retry>${t('retry')}</button>${CONFIG.blogHome?`<a class="pill" href="${CONFIG.blogHome}" target="_blank" rel="noopener noreferrer">${t('openBlog')}</a>`:''}</div></section>`;elements.view.querySelector('[data-retry]')?.addEventListener('click',initializePosts);}
function renderRoute(){
  const route=getRoute();
  closeMenu();
  closeSearch();
  renderArchive();
  renderFilters();
  renderDrawerFilters();
  if(route.name==='home'){renderHome();return;}
  let post=visiblePosts().find(item=>item.slug===route.slug);
  if(!post){
    const source=state.posts.find(item=>item.slug===route.slug);
    if(source) post=visiblePosts().find(item=>item.groupId===source.groupId);
  }
  if(post) renderArticle(post); else renderNotFound();
}
function setActiveArchiveItem(slug){document.querySelectorAll('.archive-list a').forEach(link=>{const current=slug&&link.getAttribute('href')===postUrl({slug}); if(current)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});}
function updateBackToTopVisibility(){if(elements.backToTopButton){const pageIsScrollable=document.documentElement.scrollHeight>window.innerHeight+160;elements.backToTopButton.hidden=!(pageIsScrollable&&window.scrollY>220);}}
function openMenu(){elements.drawer?.classList.add('is-open');elements.drawer?.setAttribute('aria-hidden','false');if(elements.drawerBackdrop){elements.drawerBackdrop.hidden=false;requestAnimationFrame(()=>elements.drawerBackdrop.classList.add('is-visible'));}document.body.classList.add('is-locked');document.querySelectorAll('[data-open-menu]').forEach(b=>b.setAttribute('aria-expanded','true'));elements.closeMenuButton?.focus();}
function closeMenu(){if(!elements.drawer?.classList.contains('is-open'))return;elements.drawer.classList.remove('is-open');elements.drawer.setAttribute('aria-hidden','true');elements.drawerBackdrop?.classList.remove('is-visible');document.body.classList.remove('is-locked');document.querySelectorAll('[data-open-menu]').forEach(b=>b.setAttribute('aria-expanded','false'));window.setTimeout(()=>{if(elements.drawerBackdrop)elements.drawerBackdrop.hidden=true},230);}
function openSearch(){if(typeof elements.searchDialog?.showModal==='function'){elements.searchDialog.showModal();document.body.classList.add('is-locked');window.setTimeout(()=>elements.searchInput?.focus(),20);}}
function closeSearch(){if(elements.searchDialog?.open)elements.searchDialog.close();document.body.classList.remove('is-locked');}
function renderSearchResults(query){const normalized=normalizeText(query);if(!normalized){elements.searchResults.innerHTML=`<p class="search-help">${t('searchHelp')}</p>`;return;}const terms=normalized.split(' ').filter(Boolean);const matches=state.searchIndex.filter(({haystack})=>terms.every(term=>haystack.includes(term))).slice(0,30);if(!matches.length){elements.searchResults.innerHTML=`<p class="search-no-results">${t('noSearchResults')}</p>`;return;}elements.searchResults.innerHTML=`<ul class="search-result-list">${matches.map(({post})=>`<li><a class="search-result-link" href="${postUrl(post)}"><strong>${escapeHtml(post.title)}</strong><span>${escapeHtml(post.excerpt.slice(0,150))}</span></a></li>`).join('')}</ul>`;}
function buildSearchIndex(){state.searchIndex=state.posts.map(post=>({post,haystack:normalizeText(`${post.title} ${post.text} ${post.synopsis} ${post.author} ${post.categories.join(' ')}`)}));}
function applyStaticTranslations(){const tr=I18N[language()];document.documentElement.lang=language()==='en'?'en':'pt-PT';document.querySelectorAll('[data-i18n]').forEach(el=>{const value=tr[el.dataset.i18n];if(typeof value==='string')el.textContent=value;});document.querySelectorAll('[data-i18n-aria-label]').forEach(el=>{const value=tr[el.dataset.i18nAriaLabel];if(typeof value==='string')el.setAttribute('aria-label',value);});document.querySelectorAll('[data-i18n-title]').forEach(el=>{const value=tr[el.dataset.i18nTitle];if(typeof value==='string')el.setAttribute('title',value);});document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{const value=tr[el.dataset.i18nPlaceholder];if(typeof value==='string')el.setAttribute('placeholder',value);});elements.languageButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.language===language())));}
function applyLanguage(next,persist=true){document.documentElement.dataset.language=next==='en'?'en':'pt';applyStaticTranslations();applyTheme(document.documentElement.dataset.theme,false);buildSearchIndex();if(state.posts.length)renderRoute();if(persist)localStorage.setItem('venancio-language',language());}
function applyTheme(theme,persist=true){const normalized=theme==='dark'?'dark':'light';document.documentElement.dataset.theme=normalized;elements.themeToggle?.setAttribute('aria-label',normalized==='dark'?t('themeLight'):t('themeDark'));elements.themeToggle?.setAttribute('title',normalized==='dark'?t('themeLight'):t('themeDark'));document.querySelector('meta[name="theme-color"]')?.setAttribute('content',normalized==='dark'?'#232530':'#cccccc');if(persist)localStorage.setItem('venancio-theme',normalized);}
async function openShare(title){const url=window.location.href;const text=title||CONFIG.siteTitle;elements.sharePreviewTitle.textContent=text;elements.shareWhatsApp.href=`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;elements.shareEmail.href=`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`;elements.shareFacebook.href=`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;elements.shareTelegram.href=`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;elements.nativeShareButton.hidden=!navigator.share;elements.copyShareButton.onclick=async()=>{try{await navigator.clipboard.writeText(url);elements.toast.textContent=t('copied')}catch{elements.toast.textContent=t('copyFailed')}};if(typeof elements.shareDialog?.showModal==='function')elements.shareDialog.showModal();}
async function setRssLinks(){elements.rssLinks.forEach(link=>{link.href=`${CONFIG.blogHome}feeds/posts/default`;});}
async function copyText(value){
  if(navigator.clipboard?.writeText && window.isSecureContext){await navigator.clipboard.writeText(value);return;}
  const textArea=document.createElement('textarea');textArea.value=value;textArea.setAttribute('readonly','');textArea.style.position='fixed';textArea.style.opacity='0';document.body.append(textArea);textArea.select();const copied=document.execCommand('copy');textArea.remove();if(!copied)throw new Error(t('copyFailed'));
}
let rssToastTimer;
function showRssToast(message){
  const toast=elements.rssToast;if(!toast)return;
  clearTimeout(rssToastTimer);toast.textContent=message;toast.hidden=false;requestAnimationFrame(()=>toast.classList.add('show'));
  rssToastTimer=setTimeout(()=>{toast.classList.remove('show');setTimeout(()=>{toast.hidden=true;},220);},2200);
}
async function initializePosts(){setRssLinks();elements.view.innerHTML=`<div class="loading-card"><span class="loading-dot" aria-hidden="true"></span><p>${t('loadingTexts')}</p></div>`;try{const feed=await loadBloggerFeed();state.posts=parseFeed(feed);buildSearchIndex();renderRoute();}catch(error){renderError(error);}}

elements.themeToggle?.addEventListener('click',()=>applyTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
elements.languageButtons.forEach(button=>button.addEventListener('click',()=>applyLanguage(button.dataset.language)));
document.querySelectorAll('[data-open-menu]').forEach(button=>button.addEventListener('click',openMenu)); elements.closeMenuButton?.addEventListener('click',closeMenu); elements.drawerBackdrop?.addEventListener('click',closeMenu);
document.querySelectorAll('[data-open-search]').forEach(button=>button.addEventListener('click',openSearch)); elements.searchInput?.addEventListener('input',event=>renderSearchResults(event.target.value)); elements.searchDialog?.addEventListener('close',()=>document.body.classList.remove('is-locked'));
elements.homeShareButton?.addEventListener('click',()=>openShare(CONFIG.siteTitle)); elements.closeShareButton?.addEventListener('click',()=>elements.shareDialog?.close()); elements.nativeShareButton?.addEventListener('click',async()=>{try{await navigator.share({title:elements.sharePreviewTitle.textContent,url:window.location.href})}catch{}}); elements.shareDialog?.addEventListener('click',event=>{if(event.target===elements.shareDialog)elements.shareDialog.close();});
elements.backToTopButton?.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
elements.rssLinks.forEach(link=>link.addEventListener('click',async event=>{
  event.preventDefault();
  const rssUrl=`${CONFIG.blogHome}feeds/posts/default?alt=rss`;
  try{await copyText(rssUrl);showRssToast(t('rssCopied'));}catch{window.open(rssUrl,'_blank','noopener,noreferrer');}
})); window.addEventListener('scroll',updateBackToTopVisibility,{passive:true}); window.addEventListener('popstate',renderRoute); window.addEventListener('hashchange',()=>{if(state.posts.length){renderRoute();window.scrollTo({top:0,behavior:'smooth'});}});
document.addEventListener('click',event=>{const link=event.target.closest('a[href]');if(!link)return;const href=link.getAttribute('href');if(!href||href.startsWith('#')||href.startsWith('mailto:')||href.startsWith('https://')||href.startsWith('http://')||link.target==='_blank')return;try{const url=new URL(href,window.location.href);const base=new URL(CONFIG.baseUrl);if(url.origin===base.origin&&url.pathname.startsWith(base.pathname)){event.preventDefault();history.pushState({},'',url.pathname);renderRoute();window.scrollTo({top:0,behavior:'smooth'});}}catch{}});

applyStaticTranslations(); applyTheme(document.documentElement.dataset.theme||'light',false); initializePosts();
