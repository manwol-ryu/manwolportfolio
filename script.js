/* ──────────────────────────────────────────
   만월 포트폴리오 — data-driven renderer
   ────────────────────────────────────────── */

const toggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const scrim = document.getElementById('sidebar-scrim');

function setOpen(open) {
  sidebar.classList.toggle('open', open);
  scrim.classList.toggle('show', open);
  toggle.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  document.body.style.overflow = open ? 'hidden' : '';
}

toggle.addEventListener('click', () => setOpen(!sidebar.classList.contains('open')));
scrim.addEventListener('click', () => setOpen(false));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sidebar.classList.contains('open')) setOpen(false);
});

/* ── filter state ── */
const state = {
  type: 'all',       // 'all' | 'long' | 'short'
  category: 'all',   // 'all' | categoryId
};

const TYPE_LABELS = { long: '롱폼', short: '숏폼' };
const TYPE_ICONS  = { long: '🎬', short: '⚡' };

let DATA = null;

/* ── util ── */
function fmtDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${y}. ${m}. ${d}`;
}
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
function videoHref(v) {
  return v.type === 'short'
    ? `https://www.youtube.com/shorts/${v.id}`
    : `https://youtu.be/${v.id}`;
}
function videoThumb(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
function categoryById(id) {
  return DATA.categories.find(c => c.id === id);
}

/* ── render: sidebar 분류 (전체/롱폼/숏폼 — type filter, category:all) ── */
function renderSidebarTypes() {
  const el = document.getElementById('sidebar-types');
  const items = [
    { key: 'all',   emoji: '🎞', name: '전체' },
    { key: 'long',  emoji: TYPE_ICONS.long,  name: TYPE_LABELS.long },
    { key: 'short', emoji: TYPE_ICONS.short, name: TYPE_LABELS.short },
  ];
  el.innerHTML = items.map(it => `
    <a href="#works" class="sidebar-item"
       data-filter-type="${escapeHTML(it.key)}" data-filter-category="all">
      <span class="si-emoji" aria-hidden="true">${escapeHTML(it.emoji)}</span>
      <span class="si-label">${escapeHTML(it.name)}</span>
    </a>
  `).join('');
}

/* ── render: sidebar 스트리머 별 분류 (sets type:all + category:id) ── */
function renderSidebarStreamers() {
  const el = document.getElementById('sidebar-streamers');
  if (!DATA.categories?.length) {
    el.innerHTML = '<div class="sidebar-empty">등록된 스트리머가 없습니다</div>';
    return;
  }
  el.innerHTML = DATA.categories.map(c => `
    <a href="#works" class="sidebar-item"
       data-filter-type="all" data-filter-category="${escapeHTML(c.id)}">
      <span class="si-emoji" aria-hidden="true">${escapeHTML(c.emoji || '📁')}</span>
      <span class="si-label">${escapeHTML(c.name)}</span>
    </a>
  `).join('');
}

/* ── render: sidebar 개인 채널 및 링크 (external links, new tab) ── */
function renderSidebarLinks() {
  const el = document.getElementById('sidebar-links');
  if (!DATA.links?.length) {
    el.innerHTML = '<div class="sidebar-empty">등록된 링크가 없습니다</div>';
    return;
  }
  el.innerHTML = DATA.links.map(l => `
    <a href="${escapeHTML(l.url)}" target="_blank" rel="noopener" class="sidebar-item sidebar-link">
      <span class="si-emoji" aria-hidden="true">${escapeHTML(l.emoji || '🔗')}</span>
      <span class="si-label">${escapeHTML(l.label)}</span>
      <span class="si-ext" aria-hidden="true">↗</span>
    </a>
  `).join('');
}

/* ── render: hero career list ── */
function renderCareer() {
  const el = document.getElementById('hero-career');
  if (!el) return;
  if (!DATA.career?.length) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <div class="career-head">경력</div>
    <ul class="career-list">
      ${DATA.career.map(c => `
        <li class="career-item">
          <span class="career-bullet" aria-hidden="true">✦</span>
          <span class="career-text">${escapeHTML(c.text)}</span>
          ${c.period ? `<span class="career-period">${escapeHTML(c.period)}</span>` : ''}
        </li>
      `).join('')}
    </ul>
  `;
}

/* ── render: gallery filters ── */
function renderGalleryFilters() {
  const el = document.getElementById('gallery-filters');
  const typeBtns = [
    { key: 'all',   label: '전체' },
    { key: 'long',  label: '롱폼' },
    { key: 'short', label: '숏폼' },
  ].map(t => `
    <button class="filter-btn filter-type ${state.type === t.key ? 'on' : ''}"
            data-filter-type="${t.key}">${t.label}</button>
  `).join('');

  const catBtns = [
    { key: 'all', label: '전체 카테고리', emoji: '' },
    ...DATA.categories.map(c => ({ key: c.id, label: c.name, emoji: c.emoji })),
  ].map(c => `
    <button class="filter-btn filter-cat ${state.category === c.key ? 'on' : ''}"
            data-filter-category="${escapeHTML(c.key)}">
      ${c.emoji ? escapeHTML(c.emoji) + ' ' : ''}${escapeHTML(c.label)}
    </button>
  `).join('');

  el.innerHTML = `
    <div class="filter-group" role="group" aria-label="타입">${typeBtns}</div>
    <div class="filter-divider" aria-hidden="true"></div>
    <div class="filter-group" role="group" aria-label="카테고리">${catBtns}</div>
  `;
}

/* ── render: gallery grid ── */
function renderGalleryGrid() {
  const el = document.getElementById('gallery-grid');
  const empty = document.getElementById('gallery-empty');

  const filtered = DATA.videos
    .filter(v => state.type === 'all' || v.type === state.type)
    .filter(v => state.category === 'all' || v.category === state.category)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  if (filtered.length === 0) {
    el.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  el.innerHTML = filtered.map(v => {
    const cat = categoryById(v.category);
    const metaParts = [];
    if (cat) metaParts.push(`${cat.emoji} ${cat.name}`);
    metaParts.push(fmtDate(v.date));

    return `
      <a class="video-card" href="${escapeHTML(videoHref(v))}" target="_blank" rel="noopener">
        <div class="video-thumb">
          <img src="${videoThumb(v.id)}" alt="" loading="lazy" referrerpolicy="no-referrer">
          <span class="type-badge type-${v.type}">${TYPE_LABELS[v.type] || ''}</span>
        </div>
        <div class="video-body">
          <div class="video-title">${escapeHTML(v.title)}</div>
          <div class="video-meta">${escapeHTML(metaParts.join(' · '))}</div>
        </div>
      </a>
    `;
  }).join('');
}

/* ── render: work log (all videos, date desc) ── */
function renderLog() {
  const el = document.getElementById('log-list');
  const sorted = DATA.videos.slice().sort((a, b) => b.date.localeCompare(a.date));

  el.innerHTML = sorted.map(v => {
    const cat = categoryById(v.category);
    const chLabel = cat ? cat.name : (DATA.channel?.handle || '');
    const chEmoji = cat ? (cat.emoji || '📁') : '📺';
    return `
      <div class="log-row">
        <div class="log-date">${escapeHTML(fmtDate(v.date))}</div>
        <div class="log-line">
          <div class="log-body">
            <div class="log-ch"><span class="log-ch-emoji" aria-hidden="true">${escapeHTML(chEmoji)}</span>${escapeHTML(chLabel)}</div>
            <div class="log-name">
              <a href="${escapeHTML(videoHref(v))}" target="_blank" rel="noopener">${escapeHTML(v.title)}</a>
            </div>
            <div class="log-tags">
              <span class="type-badge type-${v.type}">${TYPE_LABELS[v.type] || ''}</span>
            </div>
          </div>
          <a class="log-thumb" href="${escapeHTML(videoHref(v))}" target="_blank" rel="noopener" aria-label="${escapeHTML(v.title)}">
            <img src="${videoThumb(v.id)}" alt="" loading="lazy" referrerpolicy="no-referrer">
          </a>
        </div>
      </div>
    `;
  }).join('');
}

/* ── apply channel/featured from data ── */
function applyChannelAndFeatured() {
  const url = DATA.channel?.url;
  const handle = DATA.channel?.handle;
  if (url) {
    document.querySelectorAll('a[href="https://www.youtube.com/@kojjilmung"]').forEach(a => {
      a.href = url;
    });
  }
  const channelNameEl = document.querySelector('#channel-card .channel-name');
  if (channelNameEl && handle) channelNameEl.textContent = handle;

  const iframe = document.getElementById('featured-iframe');
  if (iframe && DATA.featured?.id) {
    iframe.src = `https://www.youtube.com/embed/${DATA.featured.id}`;
    if (DATA.featured.title) iframe.title = DATA.featured.title;
  }
}

/* ── filter wiring (delegated) ── */
function setFilter(type, category) {
  if (type !== undefined && type !== null) state.type = type;
  if (category !== undefined && category !== null) state.category = category;
  renderGalleryFilters();
  renderGalleryGrid();
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-filter-type], [data-filter-category]');
  if (!el) return;
  const type = el.dataset.filterType;
  const cat  = el.dataset.filterCategory;

  /* sidebar "작업물 전체" resets both */
  if (type === 'all' && cat === 'all') {
    setFilter('all', 'all');
  } else if (type !== undefined && cat !== undefined) {
    setFilter(type, cat);
  } else if (type !== undefined) {
    setFilter(type, null);
  } else if (cat !== undefined) {
    setFilter(null, cat);
  }

  if (window.matchMedia('(max-width: 820px)').matches) setOpen(false);
});

/* ── auto-close sidebar on mobile nav click ── */
sidebar.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) return;
  if (window.matchMedia('(max-width: 820px)').matches) setOpen(false);
});

/* ── scroll spy (home/works/pricing) ── */
function wireScrollSpy() {
  const navLinks = sidebar.querySelectorAll('.sidebar-nav > a[href^="#"]');
  const sections = [...navLinks]
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  if (!('IntersectionObserver' in window) || !sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(a => {
          a.classList.toggle('on', a.getAttribute('href') === '#' + entry.target.id);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
  sections.forEach(s => observer.observe(s));
}

/* ── boot ── */
async function boot() {
  try {
    const res = await fetch('data/videos.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    DATA = await res.json();
  } catch (err) {
    console.error('videos.json load failed:', err);
    document.getElementById('gallery-grid').innerHTML =
      '<div class="gallery-empty" style="grid-column:1/-1;">데이터를 불러오지 못했습니다 (data/videos.json).</div>';
    return;
  }

  applyChannelAndFeatured();
  renderCareer();
  renderSidebarTypes();
  renderSidebarStreamers();
  renderSidebarLinks();
  renderGalleryFilters();
  renderGalleryGrid();
  renderLog();
  wireScrollSpy();
}
boot();
