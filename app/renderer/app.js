/* ============================================================
   SNDBRD — Renderer Logic
   Handles: data loading, Fuse.js search, keyboard nav,
            audio playback, playing state, theme toggle
   ============================================================ */

'use strict';

// ── State ──────────────────────────────────────────────────
let sounds = [];         // all sounds from sounds.json
let filtered = [];       // current search results
let selectedIndex = 0;   // keyboard cursor position
let playingId = null;    // id of currently playing sound
let currentAudio = null; // HTMLAudioElement
let effectsPath = '';    // absolute path to Effects/ dir
let soundsPath = '';     // path to sounds.json (for re-load)
let fuse = null;         // Fuse.js instance

// ── DOM refs ───────────────────────────────────────────────
const searchInput  = document.getElementById('search-input');
const resultsList  = document.getElementById('results-list');
const resultsEmpty = document.getElementById('results-empty');
const liveCount    = document.getElementById('live-count');
const themeToggle  = document.getElementById('theme-toggle');
const footerPlaying    = document.getElementById('footer-playing');
const footerPlayingName = document.getElementById('footer-playing-name');
const footerEditBtn    = document.getElementById('footer-edit-btn');

/** Load sounds.json in Electron (file://) or browser (http same-origin). */
function fetchUrlForSoundsJson(sp) {
  if (typeof sp === 'string' && (sp.startsWith('http://') || sp.startsWith('https://'))) {
    return sp;
  }
  if (typeof sp === 'string' && sp.startsWith('/')) {
    return `${window.location.origin}${sp}`;
  }
  return `file://${sp}`;
}

/** Audio file URL: Electron disk path vs browser static /Effects/... */
function audioSrcForSound(sound) {
  const rel = sound.path.replace(/^Effects\//, '');
  if (effectsPath === '__browser__') {
    const parts = rel.split('/').map(encodeURIComponent).join('/');
    return new URL(`Effects/${parts}`, `${window.location.origin}/`).href;
  }
  const filePath = `${effectsPath}/${rel}`;
  return encodeURI(`file://${filePath}`);
}

// ── Init ───────────────────────────────────────────────────
async function init() {
  // Load theme preference
  const savedTheme = localStorage.getItem('sndbts-theme');
  if (savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  // Get paths from main process
  const [sp, ep] = await Promise.all([
    window.sndbts.getSoundsPath(),
    window.sndbts.getEffectsPath(),
  ]);
  soundsPath = sp;
  effectsPath = ep;

  // Load sounds.json
  try {
    const resp = await fetch(fetchUrlForSoundsJson(soundsPath));
    sounds = await resp.json();
  } catch (err) {
    console.error('Could not load sounds.json. Run: npm run generate', err);
    resultsList.innerHTML = '';
    resultsEmpty.style.display = '';
    resultsEmpty.querySelector('span').textContent = 'Run "npm run generate" to build the sound library.';
    return;
  }

  // Initialize Fuse.js
  fuse = new Fuse(sounds, {
    keys: ['name', 'source', 'category', 'tags'],
    threshold: 0.4,
    minMatchCharLength: 1,
    includeScore: true,
  });

  window.sndbts.onSoundsUpdated(() => {
    fetch(fetchUrlForSoundsJson(soundsPath))
      .then(r => r.json())
      .then(data => {
        sounds = data;
        if (fuse) {
          fuse.setCollection(sounds);
          const query = searchInput.value.trim();
          filtered = query ? fuse.search(query).map(r => r.item) : sounds;
        } else {
          filtered = sounds;
        }
        renderResults();
        updateLiveBadge();
      })
      .catch(console.error);
  });

  // Initial render (show all)
  filtered = sounds;
  renderResults();
  updateLiveBadge();
}

// ── Search ─────────────────────────────────────────────────
let searchDebounce = null;

searchInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    const query = searchInput.value.trim();
    if (!query) {
      filtered = sounds;
    } else {
      filtered = fuse.search(query).map(r => r.item);
    }
    selectedIndex = 0;
    renderResults();
    updateLiveBadge();
  }, 50);
});

// ── Keyboard Navigation ────────────────────────────────────
document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      moveSelection(1);
      break;

    case 'ArrowUp':
      e.preventDefault();
      moveSelection(-1);
      break;

    case 'Enter':
      e.preventDefault();
      if (filtered.length > 0) {
        const sound = filtered[selectedIndex];
        if (sound) togglePlay(sound);
      }
      break;

    case 'Escape':
      e.preventDefault();
      window.sndbts.hideWindow();
      break;
  }

  // ⌘/ — theme toggle
  if ((e.metaKey || e.ctrlKey) && e.key === '/') {
    e.preventDefault();
    toggleTheme();
  }

  // ⌘E — library window
  if ((e.metaKey || e.ctrlKey) && (e.key === 'e' || e.key === 'E')) {
    e.preventDefault();
    window.sndbts.openLibraryWindow();
  }
});

function moveSelection(delta) {
  if (filtered.length === 0) return;
  selectedIndex = Math.max(0, Math.min(filtered.length - 1, selectedIndex + delta));
  renderResults();
  scrollSelectedIntoView();
}

function scrollSelectedIntoView() {
  const rows = resultsList.querySelectorAll('.sound-row');
  const row = rows[selectedIndex];
  if (row) row.scrollIntoView({ block: 'nearest' });
}

// ── Render Results ─────────────────────────────────────────
function renderResults() {
  const rows = resultsList.querySelectorAll('.sound-row');
  rows.forEach(r => r.remove());

  if (filtered.length === 0) {
    resultsEmpty.style.display = '';
    return;
  }

  resultsEmpty.style.display = 'none';

  const fragment = document.createDocumentFragment();

  filtered.forEach((sound, idx) => {
    const row = buildSoundRow(sound, idx);
    fragment.appendChild(row);
  });

  resultsList.appendChild(fragment);
}

function buildSoundRow(sound, idx) {
  const row = document.createElement('div');
  row.className = 'sound-row';
  if (sound.userAdded) row.classList.add('sound-row--user-added');
  row.dataset.id = sound.id;
  row.setAttribute('role', 'option');
  row.setAttribute('aria-label', sound.name);

  if (idx === selectedIndex) row.classList.add('is-selected');
  if (sound.id === playingId) row.classList.add('is-playing');

  row.innerHTML = `
    <div class="selected-bar" aria-hidden="true"></div>
    <div class="play-indicator" aria-hidden="true">
      <span class="pi-dot"></span>
      <span class="pi-triangle"></span>
      <div class="pi-waveform">
        <span class="wv-bar"></span>
        <span class="wv-bar"></span>
        <span class="wv-bar"></span>
        <span class="wv-bar"></span>
        <span class="wv-bar"></span>
      </div>
    </div>
    <span class="sound-name">${escapeHtml(sound.name)}</span>
    <div class="sound-meta">
      <span class="sound-category">${escapeHtml(sound.category || '')}</span>
      ${(sound.tags && sound.tags.length) ? sound.tags.map(t => `<span class="tag-badge">${escapeHtml(t)}</span>`).join('') : (sound.source ? `<span class="tag-badge">${escapeHtml(sound.source)}</span>` : '')}
      ${sound.duration ? `<span class="sound-duration">${escapeHtml(sound.duration)}</span>` : ''}
    </div>
  `;

  row.addEventListener('click', () => {
    selectedIndex = idx;
    renderResults();
    togglePlay(sound);
  });

  row.addEventListener('mouseenter', () => {
    selectedIndex = idx;
    updateSelectedRow();
  });

  return row;
}

// Lightweight selection update without full re-render
function updateSelectedRow() {
  const rows = resultsList.querySelectorAll('.sound-row');
  rows.forEach((row, idx) => {
    row.classList.toggle('is-selected', idx === selectedIndex && row.dataset.id !== playingId);
  });
}

// ── Audio Playback ─────────────────────────────────────────
function togglePlay(sound) {
  if (playingId === sound.id) {
    stopPlayback();
    return;
  }
  playSound(sound);
}

function playSound(sound) {
  stopPlayback();

  const src = audioSrcForSound(sound);
  const audio = new Audio(src);

  audio.addEventListener('ended', () => {
    if (playingId === sound.id) {
      stopPlayback();
    }
  });

  audio.addEventListener('error', (e) => {
    console.error('Audio error:', e, src);
    stopPlayback();
  });

  currentAudio = audio;
  playingId = sound.id;

  audio.play().catch(err => {
    console.error('Play failed:', err);
    stopPlayback();
  });

  renderResults();
  updateFooterPlaying(sound);
}

function stopPlayback() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
  playingId = null;
  renderResults();
  footerPlaying.style.display = 'none';
  document.querySelector('.footer').classList.remove('is-playing');
}

function updateFooterPlaying(sound) {
  footerPlayingName.textContent = sound.name;
  footerPlaying.style.display = 'flex';
  document.querySelector('.footer').classList.add('is-playing');
}

// ── Live Badge ─────────────────────────────────────────────
function updateLiveBadge() {
  liveCount.textContent = filtered.length;
}

// ── Theme Toggle ───────────────────────────────────────────
function toggleTheme() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  if (isLight) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('sndbts-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('sndbts-theme', 'light');
  }
}

themeToggle.addEventListener('click', toggleTheme);

document.getElementById('close-btn').addEventListener('click', () => {
  window.sndbts.hideWindow();
});

footerEditBtn.addEventListener('click', () => {
  window.sndbts.openLibraryWindow();
});

// ── Window shown (re-focus and reset) ─────────────────────
window.sndbts.onWindowShown(() => {
  searchInput.focus();
  searchInput.select();
});

// ── Utilities ──────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Boot ───────────────────────────────────────────────────
init();
