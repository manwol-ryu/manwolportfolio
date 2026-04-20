const jsonPath = '../data/site.json';
const githubJsonPath = 'data/site.json';
const githubDefaultBranch = 'main';

const TYPE_LABELS = { long: '롱폼', short: '숏폼' };

const DEFAULT_DATA = {
  site: {
    title: '만월의 포트폴리오',
    logo: '🌕 만월',
    tag: 'YOUTUBE EDITOR',
    sections: {
      types: '── 분류 ──',
      streamers: '── 스트리머 별 분류 ──',
      links: '── 개인 채널 및 링크 ──',
    },
    homeLabel: '홈',
    costLabel: '💰 비용 안내',
    footer: {
      logo: '🌕 만월',
      copy: '© 2026 만월의 포트폴리오',
      links: [],
    },
  },
  freeContent: '',
  hero: {
    eyebrow: 'YOUTUBE EDITOR ✦',
    greeting: '안녕하세요 👋',
    titleText: '영상 편집가 만월입니다',
    titleAccent: '만월',
    sub: '유튜브 콘텐츠 전문 · 컷편집 · 모션그래픽',
    deco: '🌕',
    contact: {
      discord: 'rurimiru.',
      email: 'manwol1578@gmail.com',
    },
    career: [],
    tools: [],
    actions: [
      { label: '작업물 보기', href: '#works', style: 'blue' },
      { label: '채널 방문', href: 'channel', style: 'mint' },
    ],
  },
  channel: {
    handle: '',
    url: '',
    moreWorks: {
      title: '더 많은 작업물',
      sub: '유튜브 채널에서 전체 작업물 보기 →',
      icon: '📺',
    },
  },
  featured: {
    id: '',
    title: '',
    sectionTitle: '대표 작업물',
    sectionDesc: '최근 업로드된 대표 편집 영상입니다',
  },
  gallery: {
    sectionTitle: '작업물 갤러리',
    sectionDesc: '전체 작업물 — 타입과 카테고리로 필터링 가능',
    emptyText: '해당 조건의 영상이 없습니다',
  },
  worklog: {
    sectionTitle: '작업 로그',
    sectionDesc: '최근 납품한 작업 타임라인 — 시간순 정렬',
  },
  categories: [],
  links: [],
  pricing: {
    sectionTitle: '비용 안내',
    sectionDesc: '* 영상 길이 / 복잡도에 따라 협의 가능',
    cards: [],
    notes: {
      title: '추가 안내',
      items: [],
    },
  },
  videos: [],
};

const state = {
  data: clone(DEFAULT_DATA),
  activeTab: 'videos',
  search: '',
  typeFilter: 'all',
  metadataTimer: null,
  metadataRequestId: 0,
  lastMetadataVideoId: '',
  draggingCategoryIndex: null,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function clampLevel(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 70;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function uniqueByName(items) {
  const seen = new Set();
  return items.filter(item => {
    const name = String(item?.name || '').trim();
    if (!name || seen.has(name)) return false;
    seen.add(name);
    return true;
  });
}

function normalizeCareerItems(items) {
  return (Array.isArray(items) ? items : []).map(item => ({
    text: String(item?.text || '').trim(),
    period: String(item?.period || '').trim(),
  }));
}

function normalizeToolItems(items) {
  return (Array.isArray(items) ? items : []).map(item => ({
    name: String(item?.name || '').trim(),
    emoji: String(item?.emoji || '🛠').trim() || '🛠',
    enabled: item?.enabled !== false,
    level: clampLevel(item?.level),
  }));
}

function normalizeGitHubRepo(value) {
  let repo = String(value || '').trim();
  if (!repo) return '';

  repo = repo
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/^git@github\.com:/i, '')
    .replace(/\.git$/i, '')
    .replace(/^\/+|\/+$/g, '');

  const parts = repo.split('/').filter(Boolean);
  if (parts.length < 2) return '';
  return `${parts[0]}/${parts[1]}`;
}

function resolveGitHubSiteJsonUrl(locationRef = window.location) {
  const configuredRepo = normalizeGitHubRepo(state.data.site?.githubRepo);
  if (configuredRepo) {
    return `https://github.com/${configuredRepo}/blob/${githubDefaultBranch}/${githubJsonPath}`;
  }

  const hostname = String(locationRef.hostname || '').toLowerCase();
  const suffix = '.github.io';
  if (!hostname.endsWith(suffix) || hostname === suffix.slice(1)) return '';

  const owner = hostname.slice(0, -suffix.length);
  if (!owner) return '';

  const pathParts = String(locationRef.pathname || '')
    .split('/')
    .filter(Boolean)
    .map(part => {
      try {
        return decodeURIComponent(part);
      } catch (error) {
        return part;
      }
    });

  const firstPath = pathParts[0] || '';
  const repoName = !firstPath || firstPath === 'admin' || firstPath === 'index.html'
    ? `${owner}.github.io`
    : firstPath;

  return `https://github.com/${owner}/${repoName}/blob/${githubDefaultBranch}/${githubJsonPath}`;
}

function normalizeData(input) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const base = clone(DEFAULT_DATA);

  const data = {
    ...base,
    ...source,
    freeContent: String(source.freeContent || base.freeContent || ''),
    site: {
      ...base.site,
      ...(source.site || {}),
      sections: {
        ...base.site.sections,
        ...(source.site?.sections || {}),
      },
      footer: {
        ...base.site.footer,
        ...(source.site?.footer || {}),
        links: Array.isArray(source.site?.footer?.links) ? source.site.footer.links : base.site.footer.links,
      },
    },
    hero: {
      ...base.hero,
      ...(source.hero || {}),
      contact: {
        ...base.hero.contact,
        ...(source.hero?.contact || {}),
      },
      career: normalizeCareerItems(source.hero?.career || base.hero.career),
      tools: normalizeToolItems(source.hero?.tools || base.hero.tools),
      actions: Array.isArray(source.hero?.actions) ? source.hero.actions : base.hero.actions,
    },
    channel: {
      ...base.channel,
      ...(source.channel || {}),
      moreWorks: {
        ...base.channel.moreWorks,
        ...(source.channel?.moreWorks || {}),
      },
    },
    featured: {
      ...base.featured,
      ...(source.featured || {}),
    },
    gallery: {
      ...base.gallery,
      ...(source.gallery || {}),
    },
    worklog: {
      ...base.worklog,
      ...(source.worklog || {}),
    },
    pricing: {
      ...base.pricing,
      ...(source.pricing || {}),
      cards: Array.isArray(source.pricing?.cards) ? source.pricing.cards : base.pricing.cards,
      notes: {
        ...base.pricing.notes,
        ...(source.pricing?.notes || {}),
        items: Array.isArray(source.pricing?.notes?.items) ? source.pricing.notes.items : base.pricing.notes.items,
      },
    },
    categories: uniqueByName(Array.isArray(source.categories) ? source.categories.map(category => ({
      name: String(category?.name || '').trim(),
    })) : base.categories),
    links: Array.isArray(source.links) ? source.links.map(link => ({
      label: String(link?.label || '').trim(),
      url: String(link?.url || '').trim(),
      emoji: String(link?.emoji || '🔗').trim() || '🔗',
    })).filter(link => link.label || link.url) : base.links,
    videos: Array.isArray(source.videos) ? source.videos.map(video => ({
      id: String(video?.id || '').trim(),
      title: String(video?.title || '').trim(),
      date: String(video?.date || '').trim(),
      type: video?.type === 'short' ? 'short' : 'long',
      category: String(video?.category || '').trim(),
    })).filter(video => video.id || video.title) : base.videos,
  };

  data.videos.forEach(video => {
    if (video.category && !data.categories.some(category => category.name === video.category)) {
      data.categories.push({ name: video.category });
    }
  });

  delete data.site.description;

  return data;
}

function setStatus(message, type = 'info') {
  const status = $('#editor-status');
  if (!status) {
    if (type === 'error') console.warn(`[admin] ${message}`);
    return;
  }
  status.textContent = message;
  status.className = `status ${type}`;
}

function fmtDate(iso) {
  if (!iso) return '-';
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return iso;
  return `${year}. ${month}. ${day}`;
}

function videoThumb(id) {
  return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
}

function videoHref(video) {
  if (!video.id) return '#';
  return video.type === 'short'
    ? `https://www.youtube.com/shorts/${video.id}`
    : `https://youtu.be/${video.id}`;
}

function watchUrlFromVideoId(id) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
}

function parseYouTubeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const plainId = raw.match(/^[a-zA-Z0-9_-]{11}$/);
  if (plainId) return { id: raw, type: 'long' };

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, '');
    const segments = url.pathname.split('/').filter(Boolean);
    let id = '';
    let type = 'long';

    if (host === 'youtu.be') {
      id = segments[0] || '';
    } else if (host.endsWith('youtube.com')) {
      if (url.searchParams.get('v')) {
        id = url.searchParams.get('v') || '';
      } else if (segments[0] === 'shorts') {
        id = segments[1] || '';
        type = 'short';
      } else if (segments[0] === 'embed') {
        id = segments[1] || '';
      }
    }

    id = id.split('?')[0].split('&')[0].trim();
    if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) return null;
    return { id, type };
  } catch (error) {
    return null;
  }
}

function getCategory(name) {
  return state.data.categories.find(category => category.name === name) || null;
}

function ensureCategory(name) {
  const categoryName = String(name || '').trim();
  if (!categoryName) return null;

  const existing = getCategory(categoryName);
  if (existing) return existing;

  const category = {
    name: categoryName,
  };
  state.data.categories.push(category);
  return category;
}

function buildJson() {
  return JSON.stringify(state.data, null, 2);
}

function refreshJsonOutput() {
  const output = $('#json-output');
  if (output) output.value = buildJson();
}

function renderStats() {
  const videos = state.data.videos;
  const latest = videos
    .map(video => video.date)
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a))[0];

  $('#stat-total').textContent = videos.length;
  $('#stat-categories').textContent = state.data.categories.length;
  $('#stat-long').textContent = videos.filter(video => video.type === 'long').length;
  $('#stat-short').textContent = videos.filter(video => video.type === 'short').length;
  $('#stat-latest').textContent = fmtDate(latest);
}

function renderCategoryOptions(selected = '') {
  const selects = [$('#video-category')].filter(Boolean);

  selects.forEach(select => {
    const value = selected || select.value;
    const options = state.data.categories.map(category => (
      `<option value="${escapeHTML(category.name)}">${escapeHTML(category.name)}</option>`
    )).join('');

    select.innerHTML = `<option value="__new__">새 카테고리 작성</option>${options}`;
    select.disabled = false;
    if (value && state.data.categories.some(category => category.name === value)) {
      select.value = value;
    } else {
      select.value = '__new__';
    }
  });

  toggleNewCategoryField();
}

function toggleVideoFields() {
  const parsed = parseYouTubeUrl($('#video-url').value);
  $('#video-fields').hidden = !parsed;
  $('#new-video-preview').hidden = !parsed;
  $('#video-submit').hidden = !parsed;
  $('#video-form-footer').hidden = !parsed;
  $('#video-url-hint').textContent = parsed
    ? `영상 ID: ${parsed.id}`
    : '링크를 입력하면 작성칸이 열립니다.';
  if (parsed) $('#video-type').value = parsed.type;
  return parsed;
}

function fetchVideoMetadata(videoId) {
  return new Promise((resolve, reject) => {
    const callbackName = `__noembedVideoMeta${Date.now()}${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('메타데이터 조회 시간이 초과되었습니다.'));
    }, 9000);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (payload) => {
      cleanup();
      if (!payload || payload.error || (!payload.title && !payload.author_name)) {
        reject(new Error(payload?.error || '제목과 채널명을 찾지 못했습니다.'));
        return;
      }
      resolve(payload);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Noembed 요청에 실패했습니다.'));
    };

    const embedUrl = `https://noembed.com/embed?url=${encodeURIComponent(watchUrlFromVideoId(videoId))}&callback=${encodeURIComponent(callbackName)}`;
    script.src = embedUrl;
    document.head.appendChild(script);
  });
}

function applyVideoMetadata(meta) {
  const title = String(meta?.title || '').trim();
  const authorName = String(meta?.author_name || '').trim();
  let changed = false;

  if (title && !$('#video-title').value.trim()) {
    $('#video-title').value = title;
    changed = true;
  }

  if (authorName) {
    const select = $('#video-category');
    const newCategoryInput = $('#new-category-name');
    const existing = state.data.categories.find(category => category.name.trim() === authorName);
    const categoryUntouched = select.value === '__new__' && !newCategoryInput.value.trim();

    if (existing && categoryUntouched) {
      select.value = existing.name;
      newCategoryInput.value = '';
      changed = true;
    } else if (!existing && categoryUntouched) {
      select.value = '__new__';
      newCategoryInput.value = authorName;
      changed = true;
    }
  }

  if (changed) {
    toggleNewCategoryField();
    renderNewVideoPreview();
  }

  return changed;
}

function scheduleVideoMetadataLookup(parsed) {
  if (state.metadataTimer) {
    window.clearTimeout(state.metadataTimer);
    state.metadataTimer = null;
  }

  if (!parsed) return;
  if (state.lastMetadataVideoId === parsed.id) return;

  state.metadataTimer = window.setTimeout(async () => {
    const requestId = state.metadataRequestId + 1;
    state.metadataRequestId = requestId;
    state.lastMetadataVideoId = parsed.id;

    try {
      setStatus('영상 제목과 채널명을 확인하는 중입니다...', 'info');
      const meta = await fetchVideoMetadata(parsed.id);
      if (requestId !== state.metadataRequestId) return;
      const changed = applyVideoMetadata(meta);
      setStatus(changed ? '영상 제목과 채널명을 자동으로 채웠습니다.' : '영상 정보를 확인했습니다.', 'success');
    } catch (error) {
      if (requestId !== state.metadataRequestId) return;
      setStatus(`자동 입력 실패: ${error.message} 수동으로 입력해도 됩니다.`, 'error');
    }
  }, 600);
}

function toggleNewCategoryField() {
  const select = $('#video-category');
  const field = $('#new-category-field');
  if (!select || !field) return;
  field.hidden = select.value !== '__new__';
}

function renderNewVideoPreview() {
  const parsed = toggleVideoFields();
  const title = $('#video-title').value.trim() || '영상 제목 미입력';
  const date = $('#video-date').value;
  const type = $('#video-type').value;
  const categoryName = $('#video-category').value === '__new__'
    ? $('#new-category-name').value.trim()
    : $('#video-category').value;
  const preview = $('#new-video-preview');

  if (!parsed) {
    preview.innerHTML = '';
    return;
  }

  preview.innerHTML = `
    <div class="mini-video-card">
      <div class="mini-thumb">
        <img src="${videoThumb(parsed.id)}" alt="" referrerpolicy="no-referrer">
        <span class="type-badge type-${escapeHTML(type)}">${TYPE_LABELS[type]}</span>
      </div>
      <div class="mini-body">
        <strong>${escapeHTML(title)}</strong>
        <span>${escapeHTML(categoryName || '카테고리 미입력')}${date ? ` · ${escapeHTML(fmtDate(date))}` : ''}</span>
        <code>${escapeHTML(parsed.id)}</code>
      </div>
    </div>
  `;
}

function renderVideoList() {
  const list = $('#video-list');
  const keyword = state.search.trim().toLowerCase();
  const filtered = state.data.videos
    .map((video, index) => ({ video, index }))
    .filter(({ video }) => state.typeFilter === 'all' || video.type === state.typeFilter)
    .filter(({ video }) => {
      if (!keyword) return true;
      return [video.title, video.category, video.id].some(value => String(value || '').toLowerCase().includes(keyword));
    })
    .sort((a, b) => b.video.date.localeCompare(a.video.date));

  if (!filtered.length) {
    list.innerHTML = '<div class="empty-state">표시할 영상이 없습니다.</div>';
    return;
  }

  list.innerHTML = filtered.map(({ video, index }) => {
    const category = getCategory(video.category);
    return `
      <article class="video-card" data-video-index="${index}">
        <a class="video-thumb" href="${escapeHTML(videoHref(video))}" target="_blank" rel="noopener">
          <img src="${videoThumb(video.id)}" alt="" loading="lazy" referrerpolicy="no-referrer">
          <span class="type-badge type-${escapeHTML(video.type)}">${TYPE_LABELS[video.type]}</span>
        </a>
        <div class="video-body">
          <label class="field">
            <span>제목</span>
            <input type="text" value="${escapeHTML(video.title)}" data-video-field="title">
          </label>
          <div class="card-grid">
            <label class="field">
              <span>날짜</span>
              <input type="date" value="${escapeHTML(video.date)}" data-video-field="date">
            </label>
            <label class="field">
              <span>타입</span>
              <select data-video-field="type">
                <option value="long" ${video.type === 'long' ? 'selected' : ''}>롱폼</option>
                <option value="short" ${video.type === 'short' ? 'selected' : ''}>숏폼</option>
              </select>
            </label>
          </div>
          <label class="field">
            <span>카테고리</span>
            <select data-video-field="category">
              ${state.data.categories.map(item => `
                <option value="${escapeHTML(item.name)}" ${item.name === video.category ? 'selected' : ''}>
                  ${escapeHTML(item.name)}
                </option>
              `).join('')}
            </select>
          </label>
          <div class="video-card-footer">
            <span class="category-chip">${escapeHTML(category?.name || video.category || '카테고리 없음')}</span>
            <button class="danger-action" type="button" data-delete-video="${index}">삭제</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderCategoryList() {
  const list = $('#category-list');
  if (!state.data.categories.length) {
    list.innerHTML = '<div class="empty-state">아직 카테고리가 없습니다. 첫 영상에 사용할 채널명을 추가하세요.</div>';
    return;
  }

  list.innerHTML = state.data.categories.map((category, index) => {
    const usedCount = state.data.videos.filter(video => video.category === category.name).length;
    return `
      <article class="category-card" data-category-index="${index}" draggable="true">
        <button class="category-drag-handle" type="button" draggable="true" aria-label="${escapeHTML(category.name)} 순서 드래그">↕</button>
        <label class="field">
          <span>이름</span>
          <input type="text" value="${escapeHTML(category.name)}" data-category-field="name">
        </label>
        <span class="category-count">${usedCount}개 영상</span>
        <div class="category-order-actions" aria-label="${escapeHTML(category.name)} 순서 변경">
          <button type="button" data-move-category="${index}" data-direction="-1" ${index === 0 ? 'disabled' : ''}>위로</button>
          <button type="button" data-move-category="${index}" data-direction="1" ${index === state.data.categories.length - 1 ? 'disabled' : ''}>아래로</button>
        </div>
        <button class="danger-action" type="button" data-delete-category="${index}">삭제</button>
      </article>
    `;
  }).join('');
}

function moveCategory(fromIndex, toIndex) {
  const categories = state.data.categories;
  if (
    !Number.isInteger(fromIndex) ||
    !Number.isInteger(toIndex) ||
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= categories.length ||
    toIndex >= categories.length
  ) {
    return false;
  }

  const [category] = categories.splice(fromIndex, 1);
  categories.splice(toIndex, 0, category);
  renderCategoryList();
  renderCategoryOptions();
  renderVideoList();
  refreshJsonOutput();
  setStatus('카테고리 순서가 변경되었습니다.', 'success');
  return true;
}

function clearCategoryDragState() {
  state.draggingCategoryIndex = null;
  $$('#category-list .category-card').forEach(card => {
    card.classList.remove('is-dragging', 'is-drag-over');
  });
}

function renderDetails() {
  $('#site-title').value = state.data.site.title || '';
  $('#site-logo').value = state.data.site.logo || '';
  $('#hero-eyebrow').value = state.data.hero.eyebrow || '';
  $('#hero-greeting').value = state.data.hero.greeting || '';
  $('#hero-title').value = state.data.hero.titleText || '';
  $('#hero-accent').value = state.data.hero.titleAccent || '';
  $('#hero-sub').value = state.data.hero.sub || '';
  $('#free-content-input').value = state.data.freeContent || '';
  $('#hero-discord').value = state.data.hero.contact?.discord || '';
  $('#hero-email').value = state.data.hero.contact?.email || '';
  $('#featured-url').value = state.data.featured.id ? `https://youtu.be/${state.data.featured.id}` : '';
  $('#featured-title-input').value = state.data.featured.title || '';
  $('#channel-handle').value = state.data.channel.handle || '';
  $('#channel-url').value = state.data.channel.url || '';
  $('#pricing-title').value = state.data.pricing.sectionTitle || '';
  $('#pricing-notes').value = (state.data.pricing.notes?.items || []).join('\n');
  renderCareerEditor();
  renderToolEditor();
  renderLinkList();
  renderPricingCards();
}

function renderCareerEditor() {
  const list = $('#career-editor-list');
  if (!list) return;
  const items = state.data.hero.career || [];
  if (!items.length) {
    list.innerHTML = '<div class="empty-state slim">등록된 경력이 없습니다.</div>';
    return;
  }

  list.innerHTML = items.map((career, index) => `
    <article class="career-editor-row" data-career-index="${index}">
      <label class="field">
        <span>내용</span>
        <input type="text" value="${escapeHTML(career.text || '')}" data-career-field="text">
      </label>
      <label class="field">
        <span>기간</span>
        <input type="text" value="${escapeHTML(career.period || '')}" data-career-field="period" placeholder="2026.01~">
      </label>
      <button class="danger-action" type="button" data-delete-career="${index}">삭제</button>
    </article>
  `).join('');
}

function renderToolEditor() {
  const list = $('#tool-editor-list');
  if (!list) return;
  const items = state.data.hero.tools || [];
  if (!items.length) {
    list.innerHTML = '<div class="empty-state slim">등록된 사용툴이 없습니다.</div>';
    return;
  }

  list.innerHTML = items.map((tool, index) => {
    const level = clampLevel(tool.level);
    return `
      <article class="tool-editor-row" data-tool-index="${index}">
        <div class="checkbox-field">
          <label>
            <input type="checkbox" ${tool.enabled !== false ? 'checked' : ''} data-tool-field="enabled">
            <span>사용</span>
          </label>
        </div>
        <label class="field">
          <span>툴 이름</span>
          <input type="text" value="${escapeHTML(tool.name || '')}" data-tool-field="name">
        </label>
        <label class="field emoji-field">
          <span>이모지</span>
          <input type="text" maxlength="4" value="${escapeHTML(tool.emoji || '🛠')}" data-tool-field="emoji">
        </label>
        <div class="tool-level-editor">
          <label class="field">
            <span>숙련도</span>
            <input type="range" min="0" max="100" value="${level}" data-tool-field="level">
          </label>
          <label class="field">
            <span>값</span>
            <input type="number" min="0" max="100" value="${level}" data-tool-field="level">
          </label>
          <span class="tool-level-preview" style="--tool-level:${level}%"><span></span></span>
        </div>
        <button class="danger-action" type="button" data-delete-tool="${index}">삭제</button>
      </article>
    `;
  }).join('');
}

function renderLinkList() {
  const list = $('#link-list');
  if (!state.data.links.length) {
    list.innerHTML = '<div class="empty-state slim">등록된 링크가 없습니다.</div>';
    return;
  }

  list.innerHTML = state.data.links.map((link, index) => `
    <article class="simple-row" data-link-index="${index}">
      <label class="field">
        <span>라벨</span>
        <input type="text" value="${escapeHTML(link.label)}" data-link-field="label">
      </label>
      <label class="field">
        <span>URL</span>
        <input type="url" value="${escapeHTML(link.url)}" data-link-field="url">
      </label>
      <label class="field emoji-field">
        <span>이모지</span>
        <input type="text" maxlength="4" value="${escapeHTML(link.emoji || '🔗')}" data-link-field="emoji">
      </label>
      <button class="danger-action" type="button" data-delete-link="${index}">삭제</button>
    </article>
  `).join('');
}

function renderPricingCards() {
  const list = $('#pricing-card-list');
  if (!list) return;

  const cards = state.data.pricing.cards || [];
  if (!cards.length) {
    list.innerHTML = '<div class="empty-state slim">등록된 비용 카드가 없습니다.</div>';
    return;
  }

  list.innerHTML = cards.map((card, cardIndex) => `
    <article class="pricing-editor-card" data-pricing-card="${cardIndex}">
      <div class="pricing-editor-head">
        <label class="field">
          <span>카드 제목</span>
          <input type="text" value="${escapeHTML(card.title || '')}" data-pricing-card-field="title">
        </label>
        <button type="button" data-add-price-item="${cardIndex}">항목 추가</button>
      </div>
      <div class="price-item-list">
        ${(card.items || []).map((item, itemIndex) => `
          <div class="price-item-row" data-price-item="${itemIndex}">
            <label class="field">
              <span>항목</span>
              <input type="text" value="${escapeHTML(item.label || '')}" data-price-item-field="label">
            </label>
            <label class="field">
              <span>가격</span>
              <input type="text" value="${escapeHTML(item.price || '')}" data-price-item-field="price" placeholder="선택">
            </label>
            <button class="danger-action" type="button" data-delete-price-item="${itemIndex}">삭제</button>
          </div>
        `).join('')}
      </div>
    </article>
  `).join('');
}

function renderAll() {
  renderStats();
  renderCategoryOptions();
  renderNewVideoPreview();
  renderVideoList();
  renderCategoryList();
  renderDetails();
  refreshJsonOutput();
}

function applyDataChange(message = '변경 사항이 반영되었습니다.') {
  renderAll();
  setStatus(message, 'success');
}

async function loadJson(confirmReload = false) {
  if (confirmReload && !window.confirm('현재 편집 중인 내용을 버리고 초기 JSON을 다시 불러올까요?')) {
    return;
  }

  try {
    setStatus('데이터를 불러오는 중입니다...', 'info');
    const response = await fetch(jsonPath, { cache: 'no-store' });
    if (!response.ok) throw new Error(`로드 실패: ${response.status}`);
    const text = await response.text();
    const parsed = text.trim() ? JSON.parse(text) : {};
    state.data = normalizeData(parsed);
    renderAll();
    setStatus('site.json을 불러왔습니다.', 'success');
  } catch (error) {
    state.data = normalizeData({});
    renderAll();
    setStatus(`불러오기 실패: ${error.message}. 빈 구조로 시작합니다.`, 'error');
  }
}

async function copyAllJson() {
  const json = buildJson();
  const githubUrl = resolveGitHubSiteJsonUrl();
  const githubTab = githubUrl ? window.open('', '_blank') : null;

  try {
    await navigator.clipboard.writeText(json);
    if (githubUrl) {
      if (githubTab) {
        githubTab.opener = null;
        githubTab.location.href = githubUrl;
        setStatus('JSON을 복사하고 GitHub 파일 페이지를 새 탭으로 열었습니다.', 'success');
      } else {
        const opened = window.open(githubUrl, '_blank', 'noopener');
        setStatus(
          opened
            ? 'JSON을 복사하고 GitHub 파일 페이지를 새 탭으로 열었습니다.'
            : 'JSON은 복사했지만 팝업 차단으로 GitHub 페이지를 열지 못했습니다.',
          opened ? 'success' : 'error',
        );
      }
    } else {
      setStatus('JSON을 복사했습니다. 현재 주소에서는 GitHub 저장소를 자동으로 알 수 없습니다.', 'success');
    }
  } catch (error) {
    if (githubTab && !githubTab.closed) githubTab.close();
    const output = $('#json-output');
    output.focus();
    output.select();
    setStatus('클립보드 복사가 막혔습니다. JSON 탭에서 직접 선택해 복사하세요.', 'error');
  }
}

function validateJson() {
  try {
    JSON.parse(buildJson());
    setStatus('JSON 형식이 올바릅니다.', 'success');
  } catch (error) {
    setStatus(`JSON 오류: ${error.message}`, 'error');
  }
}

function clearVideoForm() {
  $('#video-form').reset();
  $('#video-type').value = 'long';
  renderCategoryOptions();
  renderNewVideoPreview();
}

function addVideo(event) {
  event.preventDefault();
  const parsed = parseYouTubeUrl($('#video-url').value);
  if (!parsed) {
    setStatus('YouTube 링크에서 영상 ID를 찾지 못했습니다.', 'error');
    return;
  }

  if (state.data.videos.some(video => video.id === parsed.id)) {
    setStatus('이미 등록된 영상 ID입니다. 기존 카드에서 수정하세요.', 'error');
    return;
  }

  const title = $('#video-title').value.trim();
  const date = $('#video-date').value;
  const selectedCategory = $('#video-category').value;
  const newCategoryName = $('#new-category-name').value.trim();
  const categoryName = selectedCategory === '__new__' ? newCategoryName : selectedCategory;
  const type = $('#video-type').value;

  if (!title) {
    setStatus('영상 제목을 입력하세요.', 'error');
    return;
  }
  if (!categoryName) {
    setStatus('카테고리를 선택하거나 새 카테고리 이름을 입력하세요.', 'error');
    return;
  }

  const category = ensureCategory(categoryName);
  state.data.videos.unshift({
    id: parsed.id,
    title,
    date,
    type,
    category: category.name,
  });

  clearVideoForm();
  applyDataChange('영상이 추가되었습니다.');
}

function addCategory(event) {
  event.preventDefault();
  const name = $('#category-name').value.trim();

  if (!name) {
    setStatus('카테고리 이름을 입력하세요.', 'error');
    return;
  }
  if (getCategory(name)) {
    setStatus('이미 있는 카테고리입니다.', 'error');
    return;
  }

  ensureCategory(name);
  $('#category-form').reset();
  applyDataChange('카테고리가 추가되었습니다.');
}

function addLink(event) {
  event.preventDefault();
  const label = $('#link-label').value.trim();
  const url = $('#link-url').value.trim();
  const emoji = $('#link-emoji').value.trim() || '🔗';

  if (!label || !url) {
    setStatus('링크 라벨과 URL을 입력하세요.', 'error');
    return;
  }

  state.data.links.push({ label, url, emoji });
  $('#link-form').reset();
  applyDataChange('링크가 추가되었습니다.');
}

function switchTab(tab) {
  state.activeTab = tab;
  $$('.tab-button').forEach(button => {
    const isActive = button.dataset.tab === tab;
    button.classList.toggle('on', isActive);
    if (isActive) {
      button.setAttribute('aria-current', 'page');
    } else {
      button.removeAttribute('aria-current');
    }
  });
  $$('.tab-panel').forEach(panel => panel.classList.toggle('on', panel.dataset.panel === tab));
  if (tab === 'json') refreshJsonOutput();
}

function setFloatingActionsOpen(isOpen) {
  const actions = $('.floating-actions');
  const toggle = $('#floating-actions-toggle');
  const extraActions = $('#floating-extra-actions');
  if (!actions || !toggle || !extraActions) return;

  actions.classList.toggle('is-open', isOpen);
  toggle.setAttribute('aria-expanded', String(isOpen));
  toggle.setAttribute('aria-label', isOpen ? 'JSON 작업 접기' : 'JSON 작업 더 보기');
  extraActions.setAttribute('aria-hidden', String(!isOpen));
  extraActions.querySelectorAll('button').forEach(button => {
    button.tabIndex = isOpen ? 0 : -1;
  });
}

function bindEvents() {
  $('#video-form').addEventListener('submit', addVideo);
  $('#category-form').addEventListener('submit', addCategory);
  $('#link-form').addEventListener('submit', addLink);
  $('#reload-json').addEventListener('click', () => loadJson(true));
  $('#validate-json').addEventListener('click', validateJson);
  $('#copy-all-json').addEventListener('click', copyAllJson);
  $('#copy-json-panel').addEventListener('click', copyAllJson);
  $('#floating-actions-toggle').addEventListener('click', () => {
    setFloatingActionsOpen(!$('.floating-actions').classList.contains('is-open'));
  });
  setFloatingActionsOpen(false);

  $$('.tab-button').forEach(button => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
  });

  ['video-url', 'video-title', 'video-date', 'video-category', 'new-category-name', 'video-type']
    .forEach(id => {
      $(`#${id}`).addEventListener('input', () => {
        const parsed = parseYouTubeUrl($('#video-url').value);
        if (parsed && id === 'video-url') $('#video-type').value = parsed.type;
        if (id === 'video-category') toggleNewCategoryField();
        renderNewVideoPreview();
        if (id === 'video-url') scheduleVideoMetadataLookup(parsed);
      });
      $(`#${id}`).addEventListener('change', () => {
        const parsed = parseYouTubeUrl($('#video-url').value);
        if (parsed && id === 'video-url') $('#video-type').value = parsed.type;
        if (id === 'video-category') toggleNewCategoryField();
        renderNewVideoPreview();
        if (id === 'video-url') scheduleVideoMetadataLookup(parsed);
      });
    });

  $('#video-search').addEventListener('input', (event) => {
    state.search = event.target.value;
    renderVideoList();
  });

  $('#video-filter').addEventListener('change', (event) => {
    state.typeFilter = event.target.value;
    renderVideoList();
  });

  $('#video-list').addEventListener('input', (event) => {
    const card = event.target.closest('[data-video-index]');
    const field = event.target.dataset.videoField;
    if (!card || !field) return;

    const index = Number(card.dataset.videoIndex);
    state.data.videos[index][field] = event.target.value;
    renderStats();
    refreshJsonOutput();
    if (field === 'type' || field === 'category') renderVideoList();
  });

  $('#video-list').addEventListener('click', (event) => {
    const deleteButton = event.target.closest('[data-delete-video]');
    if (!deleteButton) return;
    const index = Number(deleteButton.dataset.deleteVideo);
    const title = state.data.videos[index]?.title || '이 영상';
    if (!window.confirm(`"${title}"을 삭제할까요?`)) return;
    state.data.videos.splice(index, 1);
    applyDataChange('영상이 삭제되었습니다.');
  });

  $('#category-list').addEventListener('input', (event) => {
    const card = event.target.closest('[data-category-index]');
    const field = event.target.dataset.categoryField;
    if (!card || !field) return;

    const index = Number(card.dataset.categoryIndex);
    const category = state.data.categories[index];
    const oldName = category.name;
    const value = event.target.value.trim();

    if (field === 'name') {
      if (!value) return;
      const duplicate = state.data.categories.some((item, itemIndex) => itemIndex !== index && item.name === value);
      if (duplicate) {
        setStatus('같은 이름의 카테고리가 이미 있습니다.', 'error');
        event.target.value = oldName;
        return;
      }
      category.name = value;
      state.data.videos.forEach(video => {
        if (video.category === oldName) video.category = value;
      });
    }

    renderStats();
    renderCategoryOptions();
    renderVideoList();
    refreshJsonOutput();
    setStatus('카테고리 변경 사항이 반영되었습니다.', 'success');
  });

  $('#category-list').addEventListener('click', (event) => {
    const moveButton = event.target.closest('[data-move-category]');
    if (moveButton) {
      const index = Number(moveButton.dataset.moveCategory);
      const direction = Number(moveButton.dataset.direction);
      moveCategory(index, index + direction);
      return;
    }

    const deleteButton = event.target.closest('[data-delete-category]');
    if (!deleteButton) return;
    const index = Number(deleteButton.dataset.deleteCategory);
    const category = state.data.categories[index];
    const usedCount = state.data.videos.filter(video => video.category === category.name).length;
    if (usedCount > 0) {
      setStatus(`"${category.name}" 카테고리를 사용하는 영상이 ${usedCount}개 있습니다. 먼저 영상 카테고리를 변경하세요.`, 'error');
      return;
    }
    if (!window.confirm(`"${category.name}" 카테고리를 삭제할까요?`)) return;
    state.data.categories.splice(index, 1);
    applyDataChange('카테고리가 삭제되었습니다.');
  });

  $('#category-list').addEventListener('dragstart', (event) => {
    const card = event.target.closest('[data-category-index]');
    if (!card || !event.target.closest('.category-drag-handle')) {
      event.preventDefault();
      return;
    }

    const index = Number(card.dataset.categoryIndex);
    state.draggingCategoryIndex = index;
    card.classList.add('is-dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  });

  $('#category-list').addEventListener('dragover', (event) => {
    if (state.draggingCategoryIndex === null) return;
    const card = event.target.closest('[data-category-index]');
    if (!card) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    $$('#category-list .category-card').forEach(item => item.classList.remove('is-drag-over'));
    card.classList.add('is-drag-over');
  });

  $('#category-list').addEventListener('dragleave', (event) => {
    const card = event.target.closest('[data-category-index]');
    if (!card || card.contains(event.relatedTarget)) return;
    card.classList.remove('is-drag-over');
  });

  $('#category-list').addEventListener('drop', (event) => {
    const card = event.target.closest('[data-category-index]');
    if (!card) return;

    event.preventDefault();
    const rawIndex = event.dataTransfer.getData('text/plain');
    const fromIndex = rawIndex === '' ? state.draggingCategoryIndex : Number(rawIndex);
    if (fromIndex === null) {
      clearCategoryDragState();
      return;
    }
    const toIndex = Number(card.dataset.categoryIndex);
    moveCategory(fromIndex, toIndex);
    clearCategoryDragState();
  });

  $('#category-list').addEventListener('dragend', clearCategoryDragState);

  $('#link-list').addEventListener('input', (event) => {
    const row = event.target.closest('[data-link-index]');
    const field = event.target.dataset.linkField;
    if (!row || !field) return;
    const index = Number(row.dataset.linkIndex);
    state.data.links[index][field] = event.target.value;
    refreshJsonOutput();
    setStatus('링크 변경 사항이 반영되었습니다.', 'success');
  });

  $('#link-list').addEventListener('click', (event) => {
    const deleteButton = event.target.closest('[data-delete-link]');
    if (!deleteButton) return;
    const index = Number(deleteButton.dataset.deleteLink);
    state.data.links.splice(index, 1);
    applyDataChange('링크가 삭제되었습니다.');
  });

  $('#add-career').addEventListener('click', () => {
    state.data.hero.career = Array.isArray(state.data.hero.career) ? state.data.hero.career : [];
    state.data.hero.career.push({ text: '', period: '' });
    renderCareerEditor();
    refreshJsonOutput();
    setStatus('경력 항목을 추가했습니다.', 'success');
  });

  $('#career-editor-list').addEventListener('input', (event) => {
    const row = event.target.closest('[data-career-index]');
    const field = event.target.dataset.careerField;
    if (!row || !field) return;
    const index = Number(row.dataset.careerIndex);
    state.data.hero.career[index][field] = event.target.value;
    refreshJsonOutput();
    setStatus('경력 변경 사항이 반영되었습니다.', 'success');
  });

  $('#career-editor-list').addEventListener('click', (event) => {
    const deleteButton = event.target.closest('[data-delete-career]');
    if (!deleteButton) return;
    const index = Number(deleteButton.dataset.deleteCareer);
    state.data.hero.career.splice(index, 1);
    renderCareerEditor();
    refreshJsonOutput();
    setStatus('경력 항목을 삭제했습니다.', 'success');
  });

  $('#add-tool').addEventListener('click', () => {
    state.data.hero.tools = Array.isArray(state.data.hero.tools) ? state.data.hero.tools : [];
    state.data.hero.tools.push({ name: '', emoji: '🛠', enabled: true, level: 70 });
    renderToolEditor();
    refreshJsonOutput();
    setStatus('사용툴을 추가했습니다.', 'success');
  });

  $('#tool-editor-list').addEventListener('input', (event) => {
    const row = event.target.closest('[data-tool-index]');
    const field = event.target.dataset.toolField;
    if (!row || !field) return;
    const index = Number(row.dataset.toolIndex);

    if (field === 'level') {
      const level = clampLevel(event.target.value);
      state.data.hero.tools[index].level = level;
      row.querySelectorAll('[data-tool-field="level"]').forEach(input => { input.value = level; });
      row.querySelector('.tool-level-preview')?.style.setProperty('--tool-level', `${level}%`);
    } else {
      state.data.hero.tools[index][field] = event.target.value;
    }

    refreshJsonOutput();
    setStatus('사용툴 변경 사항이 반영되었습니다.', 'success');
  });

  $('#tool-editor-list').addEventListener('change', (event) => {
    const row = event.target.closest('[data-tool-index]');
    const field = event.target.dataset.toolField;
    if (!row || field !== 'enabled') return;
    const index = Number(row.dataset.toolIndex);
    state.data.hero.tools[index].enabled = event.target.checked;
    refreshJsonOutput();
    setStatus('사용툴 사용 여부가 반영되었습니다.', 'success');
  });

  $('#tool-editor-list').addEventListener('click', (event) => {
    const deleteButton = event.target.closest('[data-delete-tool]');
    if (!deleteButton) return;
    const index = Number(deleteButton.dataset.deleteTool);
    state.data.hero.tools.splice(index, 1);
    renderToolEditor();
    refreshJsonOutput();
    setStatus('사용툴을 삭제했습니다.', 'success');
  });

  const detailBindings = {
    'site-title': ['site', 'title'],
    'site-logo': ['site', 'logo'],
    'hero-eyebrow': ['hero', 'eyebrow'],
    'hero-greeting': ['hero', 'greeting'],
    'hero-title': ['hero', 'titleText'],
    'hero-accent': ['hero', 'titleAccent'],
    'hero-sub': ['hero', 'sub'],
    'free-content-input': ['freeContent'],
    'hero-discord': ['hero', 'contact', 'discord'],
    'hero-email': ['hero', 'contact', 'email'],
    'featured-title-input': ['featured', 'title'],
    'channel-handle': ['channel', 'handle'],
    'channel-url': ['channel', 'url'],
    'pricing-title': ['pricing', 'sectionTitle'],
  };

  Object.entries(detailBindings).forEach(([id, path]) => {
    $(`#${id}`).addEventListener('input', (event) => {
      let target = state.data;
      path.slice(0, -1).forEach(key => {
        target[key] = target[key] || {};
        target = target[key];
      });
      target[path[path.length - 1]] = event.target.value;
      refreshJsonOutput();
      setStatus('기타 요소 변경 사항이 반영되었습니다.', 'success');
    });
  });

  $('#featured-url').addEventListener('input', (event) => {
    const parsed = parseYouTubeUrl(event.target.value);
    state.data.featured.id = parsed ? parsed.id : event.target.value.trim();
    refreshJsonOutput();
    setStatus('대표 영상 링크가 반영되었습니다.', 'success');
  });

  $('#pricing-notes').addEventListener('input', (event) => {
    state.data.pricing.notes.items = event.target.value
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean);
    refreshJsonOutput();
    setStatus('비용 안내가 반영되었습니다.', 'success');
  });

  $('#pricing-card-list').addEventListener('input', (event) => {
    const cardEl = event.target.closest('[data-pricing-card]');
    if (!cardEl) return;
    const cardIndex = Number(cardEl.dataset.pricingCard);
    const card = state.data.pricing.cards[cardIndex];
    if (!card) return;

    const cardField = event.target.dataset.pricingCardField;
    if (cardField) {
      card[cardField] = event.target.value;
      refreshJsonOutput();
      setStatus('비용 카드가 반영되었습니다.', 'success');
      return;
    }

    const itemEl = event.target.closest('[data-price-item]');
    const itemField = event.target.dataset.priceItemField;
    if (!itemEl || !itemField) return;
    const itemIndex = Number(itemEl.dataset.priceItem);
    card.items = Array.isArray(card.items) ? card.items : [];
    card.items[itemIndex][itemField] = event.target.value;
    refreshJsonOutput();
    setStatus('비용 항목이 반영되었습니다.', 'success');
  });

  $('#pricing-card-list').addEventListener('click', (event) => {
    const addButton = event.target.closest('[data-add-price-item]');
    if (addButton) {
      const cardIndex = Number(addButton.dataset.addPriceItem);
      const card = state.data.pricing.cards[cardIndex];
      card.items = Array.isArray(card.items) ? card.items : [];
      card.items.push({ label: '', price: '' });
      renderPricingCards();
      refreshJsonOutput();
      setStatus('비용 항목을 추가했습니다.', 'success');
      return;
    }

    const deleteButton = event.target.closest('[data-delete-price-item]');
    if (!deleteButton) return;
    const cardEl = deleteButton.closest('[data-pricing-card]');
    const cardIndex = Number(cardEl.dataset.pricingCard);
    const itemIndex = Number(deleteButton.dataset.deletePriceItem);
    state.data.pricing.cards[cardIndex].items.splice(itemIndex, 1);
    renderPricingCards();
    refreshJsonOutput();
    setStatus('비용 항목을 삭제했습니다.', 'success');
  });

  $('#json-output').addEventListener('input', (event) => {
    try {
      state.data = normalizeData(JSON.parse(event.target.value));
      renderAll();
      setStatus('JSON 원문 변경 사항이 적용되었습니다.', 'success');
    } catch (error) {
      setStatus(`JSON 원문 오류: ${error.message}`, 'error');
    }
  });
}

bindEvents();
loadJson();
