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
/** When search is active, Fuse `matches` per sound id (for name highlighting). */
let fuseMatchBySoundId = new Map();

// ── Call mode state ────────────────────────────────────────
let callModeEnabled = false;
let callOutputDeviceId = '';
let outputDevices = [];
let blackHoleDevice = null;
let callSetupVisible = false;
const audioRouting = window.sndbtsAudioRouting;

// ── DOM refs ───────────────────────────────────────────────
const searchInput  = document.getElementById('search-input');
const resultsList  = document.getElementById('results-list');
const resultsEmpty = document.getElementById('results-empty');
const liveCount    = document.getElementById('live-count');
const themeToggle  = document.getElementById('theme-toggle');
const footerPlaying    = document.getElementById('footer-playing');
const footerPlayingName = document.getElementById('footer-playing-name');
const footerEditBtn    = document.getElementById('footer-edit-btn');
const launcher         = document.getElementById('launcher');
const callModeBtn      = document.getElementById('call-mode-btn');
const callSetupPanel   = document.getElementById('call-setup-panel');
const callSetupClose   = document.getElementById('call-setup-close');
const callModeEnabledInput = document.getElementById('call-mode-enabled');
const callOutputSelect = document.getElementById('call-output-device');
const callSetupStatus  = document.getElementById('call-setup-status');
const callSetupStatusText = document.getElementById('call-setup-status-text');
const callSetupError   = document.getElementById('call-setup-error');
const callSetupTestBtn = document.getElementById('call-setup-test-btn');
const callSetupGuideBtn = document.getElementById('call-setup-guide-btn');
const callSetupBlackholeLink = document.getElementById('call-setup-blackhole-link');
const callSetupMidiLink = document.getElementById('call-setup-midi-link');

/** Load sounds.json in Electron (file://) or browser (http same-origin). */
function fetchUrlForSoundsJson(sp) {
  if (typeof sp === 'string' && (sp.startsWith('http://') || sp.startsWith('https://') || sp.startsWith('file://'))) {
    return sp;
  }
  if (typeof sp === 'string' && sp.startsWith('/')) {
    return `${window.location.origin}${sp}`;
  }
  return `file://${sp}`;
}

/** Audio file URL: Electron disk path vs browser static /Effects/... */
async function audioSrcForSound(sound) {
  const rel = sound.path.replace(/^Effects\//, '');
  if (effectsPath === '__browser__') {
    const parts = rel.split('/').map(encodeURIComponent).join('/');
    if (window.location.protocol === 'file:') {
      return new URL(`../../Effects/${parts}`, window.location.href).href;
    }
    return new URL(`Effects/${parts}`, window.location.href).href;
  }
  if (window.sndbts.resolveAudioPath) {
    const resolved = await window.sndbts.resolveAudioPath(sound.path);
    if (resolved) return resolved;
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
    includeMatches: true,
  });

  window.sndbts.onSoundsUpdated(() => {
    fetch(fetchUrlForSoundsJson(soundsPath))
      .then(r => r.json())
      .then(data => {
        sounds = data;
        if (fuse) {
          fuse.setCollection(sounds);
          applySearchFromQuery(searchInput.value);
        } else {
          filtered = sounds;
          fuseMatchBySoundId = new Map();
        }
        renderResults();
        updateLiveBadge();
      })
      .catch(console.error);
  });

  // Initial render (show all)
  applySearchFromQuery('');
  renderResults();
  updateLiveBadge();

  await initCallMode();
}

// ── Search ─────────────────────────────────────────────────
let searchDebounce = null;

searchInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    applySearchFromQuery(searchInput.value);
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

  // ⌘K — focus search (return from list navigation)
  if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
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
    <span class="sound-name">${soundNameHtml(sound)}</span>
    <div class="sound-meta">
      <span class="sound-category">${soundFieldHtml(sound, 'category', sound.category || '')}</span>
      ${(sound.tags && sound.tags.length)
        ? sound.tags.map((t, i) => `<span class="tag-badge">${soundFieldHtml(sound, 'tags', t, i)}</span>`).join('')
        : (sound.source ? `<span class="tag-badge">${soundFieldHtml(sound, 'source', sound.source)}</span>` : '')}
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

async function applyCallModeSink(audio) {
  if (!callModeEnabled || !callOutputDeviceId) return true;
  if (typeof audio.setSinkId !== 'function') {
    setCallSetupError('Call mode is not supported in this environment.');
    return false;
  }
  if (!blackHoleDevice) {
    setCallSetupError('BlackHole not found. Install BlackHole 2ch or turn off Call mode.');
    return false;
  }
  try {
    await audio.setSinkId(callOutputDeviceId);
    clearCallSetupError();
    return true;
  } catch (err) {
    console.error('setSinkId failed:', err);
    setCallSetupError('Could not route audio to the selected device. Re-open Call Audio setup.');
    return false;
  }
}

async function playSound(sound, options = {}) {
  stopPlayback();

  const src = await audioSrcForSound(sound);
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

  const routed = await applyCallModeSink(audio);
  if (!routed && callModeEnabled) {
    stopPlayback();
    return;
  }

  try {
    await audio.play();
  } catch (err) {
    console.error('Play failed:', err);
    if (callModeEnabled) {
      setCallSetupError('Playback failed. Check your output device in Call Audio setup.');
    }
    stopPlayback();
    return;
  }

  if (!options.silentUi) {
    renderResults();
    updateFooterPlaying(sound);
  }
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

function applySearchFromQuery(rawQuery) {
  const query = String(rawQuery || '').trim();
  if (!query || !fuse) {
    filtered = sounds;
    fuseMatchBySoundId = new Map();
    return;
  }
  const raw = fuse.search(query);
  fuseMatchBySoundId = new Map(raw.map(r => [r.item.id, r.matches]));
  filtered = raw.map(r => r.item);
}

/** Merge Fuse index ranges (inclusive) for highlighting. */
function mergeInclusiveRanges(indices) {
  if (!indices || !indices.length) return [];
  const sorted = indices.slice().sort((a, b) => a[0] - b[0]);
  const out = [];
  let curS = sorted[0][0];
  let curE = sorted[0][1];
  for (let i = 1; i < sorted.length; i++) {
    const s = sorted[i][0];
    const e = sorted[i][1];
    if (s <= curE + 1) {
      curE = Math.max(curE, e);
    } else {
      out.push([curS, curE]);
      curS = s;
      curE = e;
    }
  }
  out.push([curS, curE]);
  return out;
}

/** HTML for sound title: Fuse name matches → <mark>, else escaped plain text. */
function soundNameHtml(sound) {
  return soundFieldHtml(sound, 'name', sound.name || '');
}

/**
 * Generic Fuse highlight helper for any field.
 * - For scalar fields (name/category/source): match.key === fieldKey
 * - For array fields (tags): match.key === 'tags' and match.refIndex matches the tag index
 */
function soundFieldHtml(sound, fieldKey, rawValue, refIndex = null) {
  const value = String(rawValue || '');
  const matches = fuseMatchBySoundId.get(sound.id);
  if (!matches || !matches.length) return escapeHtml(value);

  const m = matches.find(match => {
    if (match.key !== fieldKey) return false;
    // Fuse adds refIndex for array matches (e.g. tags).
    if (refIndex == null) return true;
    return match.refIndex === refIndex;
  });

  if (!m || !m.indices || !m.indices.length) return escapeHtml(value);

  const ranges = mergeInclusiveRanges(m.indices);
  let out = '';
  let pos = 0;
  for (let i = 0; i < ranges.length; i++) {
    const s = ranges[i][0];
    const e = ranges[i][1];
    if (s > pos) out += escapeHtml(value.slice(pos, s));
    out += '<mark class="search-hit">' + escapeHtml(value.slice(s, e + 1)) + '</mark>';
    pos = e + 1;
  }
  if (pos < value.length) out += escapeHtml(value.slice(pos));
  return out;
}

// ── Call mode / setup panel ────────────────────────────────
async function initCallMode() {
  if (!window.sndbts.getSettings) return;

  const settings = await window.sndbts.getSettings();
  callModeEnabled = Boolean(settings.callMode && settings.callMode.enabled);
  callOutputDeviceId = (settings.callMode && settings.callMode.outputDeviceId) || '';

  await refreshOutputDevices();
  bindCallSetupUi();

  if (callModeEnabledInput) {
    callModeEnabledInput.checked = callModeEnabled;
  }
  updateCallModeUi();
  window.sndbts.onShowCallSetup(() => showCallSetupPanel(true));
}

async function refreshOutputDevices() {
  if (!audioRouting) return;
  outputDevices = await audioRouting.listAudioOutputDevices();
  blackHoleDevice = audioRouting.findBlackHoleDevice(outputDevices);
  populateOutputDeviceSelect();
  updateBlackHoleStatus();
}

function populateOutputDeviceSelect() {
  if (!callOutputSelect) return;

  const previous = callOutputDeviceId;
  callOutputSelect.innerHTML = '<option value="">System default</option>';

  outputDevices.forEach((device) => {
    const opt = document.createElement('option');
    opt.value = device.deviceId;
    opt.textContent = audioRouting.formatDeviceLabel(device);
    callOutputSelect.appendChild(opt);
  });

  if (previous && outputDevices.some((d) => d.deviceId === previous)) {
    callOutputDeviceId = previous;
  } else if (callModeEnabled && blackHoleDevice) {
    callOutputDeviceId = blackHoleDevice.deviceId;
  } else if (!callModeEnabled) {
    callOutputDeviceId = '';
  }

  callOutputSelect.value = callOutputDeviceId;
  callOutputSelect.disabled = !callModeEnabled;
}

function updateBlackHoleStatus() {
  if (!callSetupStatus || !callSetupStatusText) return;

  callSetupStatus.classList.remove('is-ok', 'is-warn');
  if (blackHoleDevice) {
    callSetupStatus.classList.add('is-ok');
    callSetupStatusText.textContent = `BlackHole detected — ${audioRouting.formatDeviceLabel(blackHoleDevice)}`;
    if (callModeEnabled && !callOutputDeviceId) {
      callOutputDeviceId = blackHoleDevice.deviceId;
      if (callOutputSelect) callOutputSelect.value = callOutputDeviceId;
      persistCallSettings();
    }
  } else {
    callSetupStatus.classList.add('is-warn');
    callSetupStatusText.textContent = 'BlackHole not found — install BlackHole 2ch to use Call mode';
  }
}

function updateCallModeUi() {
  if (callModeBtn) {
    callModeBtn.classList.toggle('is-active', callModeEnabled);
    callModeBtn.title = callModeEnabled
      ? 'Call mode on — soundbites route to virtual audio'
      : 'Call audio setup';
  }
  if (callOutputSelect) {
    callOutputSelect.disabled = !callModeEnabled;
  }
  if (callModeEnabled && !blackHoleDevice) {
    setCallSetupError('BlackHole not found. Install BlackHole 2ch before using Call mode on a call.');
  } else if (!callModeEnabled) {
    clearCallSetupError();
  }
}

function setCallSetupError(message) {
  if (!callSetupError) return;
  if (!message) {
    callSetupError.hidden = true;
    callSetupError.textContent = '';
    return;
  }
  callSetupError.hidden = false;
  callSetupError.textContent = message;
}

function clearCallSetupError() {
  setCallSetupError('');
}

async function persistCallSettings() {
  if (!window.sndbts.saveSettings) return;
  await window.sndbts.saveSettings({
    callMode: {
      enabled: callModeEnabled,
      outputDeviceId: callOutputDeviceId,
    },
  });
}

function showCallSetupPanel(show) {
  callSetupVisible = show;
  if (!callSetupPanel || !launcher) return;
  callSetupPanel.hidden = !show;
  launcher.classList.toggle('is-call-setup', show);
  if (show) {
    refreshOutputDevices();
  }
}

function bindCallSetupUi() {
  if (callModeBtn) {
    callModeBtn.addEventListener('click', () => {
      showCallSetupPanel(!callSetupVisible);
    });
  }
  if (callSetupClose) {
    callSetupClose.addEventListener('click', () => showCallSetupPanel(false));
  }
  if (callModeEnabledInput) {
    callModeEnabledInput.addEventListener('change', async () => {
      callModeEnabled = callModeEnabledInput.checked;
      if (callModeEnabled && blackHoleDevice && !callOutputDeviceId) {
        callOutputDeviceId = blackHoleDevice.deviceId;
      }
      if (!callModeEnabled) {
        callOutputDeviceId = '';
      }
      populateOutputDeviceSelect();
      updateCallModeUi();
      await persistCallSettings();
    });
  }
  if (callOutputSelect) {
    callOutputSelect.addEventListener('change', async () => {
      callOutputDeviceId = callOutputSelect.value;
      if (callOutputDeviceId && !audioRouting.isBlackHoleLabel(
        audioRouting.formatDeviceLabel(outputDevices.find((d) => d.deviceId === callOutputDeviceId))
      )) {
        setCallSetupError('For calls, choose BlackHole 2ch so Zoom/Teams can receive soundbites.');
      } else {
        clearCallSetupError();
      }
      await persistCallSettings();
    });
  }
  if (callSetupTestBtn) {
    callSetupTestBtn.addEventListener('click', () => playCallModeTestSound());
  }
  if (callSetupGuideBtn) {
    callSetupGuideBtn.addEventListener('click', () => {
      if (window.sndbts.openCallAudioGuide) window.sndbts.openCallAudioGuide();
    });
  }
  if (callSetupBlackholeLink) {
    callSetupBlackholeLink.addEventListener('click', () => {
      if (window.sndbts.openBlackholeDownload) window.sndbts.openBlackholeDownload();
    });
  }
  if (callSetupMidiLink) {
    callSetupMidiLink.addEventListener('click', () => {
      if (window.sndbts.openAudioMidiSetup) window.sndbts.openAudioMidiSetup();
    });
  }

  if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
    navigator.mediaDevices.addEventListener('devicechange', () => {
      refreshOutputDevices();
    });
  }
}

function findTestSound() {
  const preferred = sounds.find((s) => s.path && s.path.includes('zoom-rec.mp3'));
  if (preferred) return preferred;
  return sounds.find((s) => s.path && /\.(mp3|wav)$/i.test(s.path));
}

async function playCallModeTestSound() {
  const testSound = findTestSound();
  if (!testSound) {
    setCallSetupError('No sounds loaded to test. Run npm run generate first.');
    return;
  }
  if (callModeEnabled && !blackHoleDevice) {
    setCallSetupError('Install BlackHole 2ch before testing Call mode.');
    return;
  }
  clearCallSetupError();
  await playSound(testSound, { silentUi: true });
}

// ── Boot ───────────────────────────────────────────────────
init();
