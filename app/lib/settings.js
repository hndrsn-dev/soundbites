const fs = require('fs');

const DEFAULT_SETTINGS = {
  callMode: {
    enabled: false,
    outputDeviceId: '',
  },
};

function mergeSettings(data) {
  const base = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  if (!data || typeof data !== 'object') return base;
  return {
    ...base,
    ...data,
    callMode: {
      ...base.callMode,
      ...(data.callMode && typeof data.callMode === 'object' ? data.callMode : {}),
    },
  };
}

function loadSettings(settingsPath) {
  try {
    if (fs.existsSync(settingsPath)) {
      const raw = fs.readFileSync(settingsPath, 'utf8');
      return mergeSettings(JSON.parse(raw));
    }
  } catch (err) {
    console.error('loadSettings error:', err);
  }
  return mergeSettings(null);
}

function saveSettings(settingsPath, settings) {
  const merged = mergeSettings(settings);
  fs.writeFileSync(settingsPath, JSON.stringify(merged, null, 2));
  return merged;
}

module.exports = {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
};
