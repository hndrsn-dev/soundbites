'use strict';

let sounds = [];
let soundsPath = '';
let fuse = null;
let filtered = [];
let selectedIds = new Set();
let lastAnchorIndex = -1;

const tbody = document.getElementById('lib-tbody');
const libEmpty = document.getElementById('lib-empty');
const libSearch = document.getElementById('lib-search');
const libFilterCategory = document.getElementById('lib-filter-category');
const libSelectAll = document.getElementById('lib-select-all');
const dropZone = document.getElementById('drop-zone');
const panelTitle = document.getElementById('panel-title');
const panelSingle = document.getElementById('panel-single');
const panelMulti = document.getElementById('panel-multi');
const panelName = document.getElementById('panel-name');
const panelCategory = document.getElementById('panel-category');
const panelTags = document.getElementById('panel-tags');
const panelSaveSingle = document.getElementById('panel-save-single');
const panelMultiCount = document.getElementById('panel-multi-count');
const panelBatchCategory = document.getElementById('panel-batch-category');
const panelBatchAddTags = document.getElementById('panel-batch-add-tags');
const panelBatchRemoveTag = document.getElementById('panel-batch-remove-tag');
const panelApplyBatch = document.getElementById('panel-apply-batch');
const libStatus = document.getElementById('lib-status');
const btnBrowse = document.getElementById('btn-browse-import');

function fetchUrlForSoundsJson(sp) {
  if (typeof sp === 'string' && (sp.startsWith('http://') || sp.startsWith('https://'))) {
    return sp;
  }
  if (typeof sp === 'string' && sp.startsWith('/')) {
    return `${window.location.origin}${sp}`;
  }
  return `file://${sp}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getCategoryFilter() {
  return libFilterCategory.value.trim();
}

function applyFilters() {
  const q = libSearch.value.trim();
  const cat = getCategoryFilter();
  let list = sounds;
  if (q && fuse) {
    list = fuse.search(q).map((r) => r.item);
  }
  if (cat) {
    list = list.filter((s) => (s.category || '') === cat);
  }
  filtered = list;
  renderTable();
  updateCategoryDropdown();
}

function initFuse() {
  fuse = new Fuse(sounds, {
    keys: ['name', 'source', 'category', 'tags'],
    threshold: 0.35,
    minMatchCharLength: 1,
    includeScore: true,
  });
}

function updateCategoryDropdown() {
  const cats = [...new Set(sounds.map((s) => s.category).filter(Boolean))].sort();
  const cur = libFilterCategory.value;
  libFilterCategory.innerHTML = '<option value="">All</option>';
  cats.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    libFilterCategory.appendChild(opt);
  });
  if (cats.includes(cur)) libFilterCategory.value = cur;
}

async function loadSounds() {
  const resp = await fetch(fetchUrlForSoundsJson(soundsPath));
  sounds = await resp.json();
  initFuse();
  applyFilters();
  setStatus(`${sounds.length} sounds loaded`);
}

function renderTable() {
  tbody.innerHTML = '';
  if (filtered.length === 0) {
    libEmpty.hidden = false;
    libSelectAll.checked = false;
    libSelectAll.indeterminate = false;
    updatePanel();
    return;
  }
  libEmpty.hidden = true;

  filtered.forEach((sound, idx) => {
    const tr = document.createElement('tr');
    tr.dataset.id = sound.id;
    tr.dataset.index = String(idx);
    if (selectedIds.has(sound.id)) tr.classList.add('is-selected');

    const tdCheck = document.createElement('td');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = selectedIds.has(sound.id);
    cb.addEventListener('click', (e) => {
      if (e.shiftKey) {
        e.preventDefault();
        handleRowClick(idx, e);
        return;
      }
      e.stopPropagation();
    });
    cb.addEventListener('change', () => {
      if (cb.checked) {
        selectedIds.add(sound.id);
        lastAnchorIndex = idx;
      } else {
        selectedIds.delete(sound.id);
      }
      syncRowClasses();
      updateSelectAllCheckbox();
      updatePanel();
    });
    tdCheck.appendChild(cb);

    const tdName = document.createElement('td');
    tdName.textContent = sound.name || '';

    const tdCat = document.createElement('td');
    tdCat.textContent = sound.category || '';

    const tdTags = document.createElement('td');
    const tags = Array.isArray(sound.tags) ? sound.tags : [];
    const tagList = document.createElement('div');
    tagList.className = 'tag-list';
    tags.forEach((t) => {
      const chip = document.createElement('span');
      chip.className = 'lib-tag-chip';
      chip.textContent = t;
      tagList.appendChild(chip);
    });
    tdTags.appendChild(tagList);

    const tdDur = document.createElement('td');
    tdDur.textContent = sound.duration || '';

    tr.appendChild(tdCheck);
    tr.appendChild(tdName);
    tr.appendChild(tdCat);
    tr.appendChild(tdTags);
    tr.appendChild(tdDur);

    tr.addEventListener('click', (e) => {
      if (e.target.closest('input[type="checkbox"]')) return;
      handleRowClick(idx, e);
    });

    tbody.appendChild(tr);
  });

  requestAnimationFrame(() => {
    document.querySelectorAll('.tag-list').forEach((list) => {
      const chips = [...list.querySelectorAll('.lib-tag-chip')];
      if (chips.length === 0) return;
      const LINE_H = chips[0].offsetHeight + 2; // chip height + top+bottom margin
      const MAX_TOP = LINE_H * 3;
      let cutIdx = -1;
      for (let i = 0; i < chips.length; i++) {
        if (chips[i].offsetTop >= MAX_TOP) { cutIdx = i; break; }
      }
      if (cutIdx === -1) return;
      const hiddenCount = chips.length - cutIdx;
      chips.slice(cutIdx).forEach((c) => { c.hidden = true; });
      const more = document.createElement('span');
      more.className = 'lib-tag-chip lib-tag-more';
      more.textContent = `+${hiddenCount}`;
      list.appendChild(more);
    });
  });

  updateSelectAllCheckbox();
  updatePanel();
}

function syncRowClasses() {
  tbody.querySelectorAll('tr').forEach((tr) => {
    const id = tr.dataset.id;
    tr.classList.toggle('is-selected', selectedIds.has(id));
    const cb = tr.querySelector('input[type="checkbox"]');
    if (cb) cb.checked = selectedIds.has(id);
  });
}

function handleRowClick(index, e) {
  const sound = filtered[index];
  if (!sound) return;

  if (e.shiftKey && lastAnchorIndex >= 0) {
    const a = Math.min(lastAnchorIndex, index);
    const b = Math.max(lastAnchorIndex, index);
    for (let i = a; i <= b; i++) {
      selectedIds.add(filtered[i].id);
    }
  } else if (e.metaKey || e.ctrlKey) {
    if (selectedIds.has(sound.id)) selectedIds.delete(sound.id);
    else selectedIds.add(sound.id);
    lastAnchorIndex = index;
  } else {
    if (selectedIds.has(sound.id)) selectedIds.delete(sound.id);
    else selectedIds.add(sound.id);
    lastAnchorIndex = index;
  }

  syncRowClasses();
  updateSelectAllCheckbox();
  updatePanel();
}

function updateSelectAllCheckbox() {
  const visIds = filtered.map((s) => s.id);
  const allSel = visIds.length > 0 && visIds.every((id) => selectedIds.has(id));
  const someSel = visIds.some((id) => selectedIds.has(id));
  libSelectAll.checked = allSel;
  libSelectAll.indeterminate = someSel && !allSel;
}

libSelectAll.addEventListener('change', () => {
  if (libSelectAll.checked) {
    filtered.forEach((s) => selectedIds.add(s.id));
  } else {
    filtered.forEach((s) => selectedIds.delete(s.id));
  }
  syncRowClasses();
  updatePanel();
});

function soundById(id) {
  return sounds.find((s) => s.id === id);
}

function updatePanel() {
  const n = selectedIds.size;
  if (n === 0) {
    panelTitle.textContent = 'No selection';
    panelSingle.hidden = true;
    panelMulti.hidden = true;
    return;
  }
  if (n === 1) {
    const id = [...selectedIds][0];
    const s = soundById(id);
    panelTitle.textContent = 'Edit sound';
    panelSingle.hidden = false;
    panelMulti.hidden = true;
    panelName.value = s.name || '';
    panelCategory.value = s.category || '';
    panelTags.value = (Array.isArray(s.tags) ? s.tags : []).join(', ');
    return;
  }
  panelTitle.textContent = 'Batch edit';
  panelSingle.hidden = true;
  panelMulti.hidden = false;
  panelMultiCount.textContent = `${n} sounds selected`;
  panelBatchCategory.value = '';
  panelBatchAddTags.value = '';
  const unionTags = new Set();
  [...selectedIds].forEach((id) => {
    const s = soundById(id);
    (Array.isArray(s.tags) ? s.tags : []).forEach((t) => unionTags.add(t));
  });
  const sorted = [...unionTags].sort();
  panelBatchRemoveTag.innerHTML = '<option value="">— Choose tag —</option>';
  sorted.forEach((t) => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    panelBatchRemoveTag.appendChild(opt);
  });
}

panelSaveSingle.addEventListener('click', async () => {
  if (selectedIds.size !== 1) return;
  const id = [...selectedIds][0];
  const s = soundById(id);
  if (!s) return;
  s.name = panelName.value.trim() || s.name;
  s.category = panelCategory.value.trim() || s.category;
  const tagStr = panelTags.value.trim();
  s.tags = tagStr
    ? tagStr.split(',').map((t) => t.trim()).filter(Boolean)
    : [];
  s.userEdited = true;
  try {
    await window.sndbts.saveSounds(sounds);
    initFuse();
    applyFilters();
    setStatus('Saved');
  } catch (err) {
    console.error(err);
    setStatus('Save failed');
  }
});

panelApplyBatch.addEventListener('click', async () => {
  if (selectedIds.size < 2) return;

  const cat = panelBatchCategory.value.trim();
  const addStr = panelBatchAddTags.value.trim();
  const removeTag = panelBatchRemoveTag.value.trim();

  const addTags = addStr
    ? addStr.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  [...selectedIds].forEach((id) => {
    const s = soundById(id);
    if (!s) return;
    if (cat) s.category = cat;
    if (addTags.length) {
      const cur = Array.isArray(s.tags) ? [...s.tags] : [];
      addTags.forEach((t) => {
        if (!cur.includes(t)) cur.push(t);
      });
      s.tags = cur;
    }
    if (removeTag) {
      s.tags = (Array.isArray(s.tags) ? s.tags : []).filter((t) => t !== removeTag);
    }
    s.userEdited = true;
  });

  try {
    await window.sndbts.saveSounds(sounds);
    initFuse();
    applyFilters();
    setStatus('Batch changes saved');
  } catch (err) {
    console.error(err);
    setStatus('Save failed');
  }
});

function setStatus(msg) {
  libStatus.textContent = msg;
}

function mergeNewEntries(entries) {
  const maxId = sounds.reduce((m, s) => Math.max(m, parseInt(s.id, 10) || 0), 0);
  entries.forEach((entry, i) => {
    entry.id = String(maxId + 1 + i).padStart(4, '0');
    entry.userAdded = true;
  });
  sounds = [...sounds, ...entries];
}

async function handleImportResult(result) {
  const { entries } = result;
  if (!entries || !entries.length) return;
  mergeNewEntries(entries);
  try {
    await window.sndbts.saveSounds(sounds);
    initFuse();
    applyFilters();
    setStatus(`Imported ${entries.length} file(s)`);
  } catch (err) {
    console.error(err);
    setStatus('Save after import failed');
  }
}

btnBrowse.addEventListener('click', async () => {
  try {
    const result = await window.sndbts.importSounds();
    await handleImportResult(result);
  } catch (err) {
    console.error(err);
  }
});

['dragenter', 'dragover'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('is-dragover');
  });
});

['dragleave', 'drop'].forEach((ev) => {
  dropZone.addEventListener(ev, (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (ev === 'dragleave') dropZone.classList.remove('is-dragover');
  });
});

dropZone.addEventListener('drop', async (e) => {
  dropZone.classList.remove('is-dragover');
  const files = e.dataTransfer && e.dataTransfer.files;
  if (!files || !files.length) return;
  const paths = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (f.path) paths.push(f.path);
  }
  if (paths.length === 0) {
    setStatus('Could not read file paths (drop from Finder)');
    return;
  }
  try {
    const result = await window.sndbts.importSoundsFromPaths(paths);
    await handleImportResult(result);
  } catch (err) {
    console.error(err);
    setStatus('Import failed');
  }
});

let searchDebounce = null;
libSearch.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => applyFilters(), 80);
});

libFilterCategory.addEventListener('change', () => applyFilters());

window.sndbts.onSoundsUpdated(() => {
  loadSounds().catch(console.error);
});

async function init() {
  soundsPath = await window.sndbts.getSoundsPath();
  await loadSounds();
}

init().catch(console.error);
