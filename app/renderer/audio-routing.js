/* ============================================================
   SNDBTS — Audio routing helpers (renderer)
   Device enumeration and BlackHole detection for Call mode.
   ============================================================ */

'use strict';

const BLACKHOLE_PATTERN = /blackhole/i;

function isBlackHoleLabel(label) {
  return BLACKHOLE_PATTERN.test(String(label || ''));
}

/** Request mic permission so enumerateDevices returns human-readable labels. */
async function ensureDeviceLabels() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
  } catch (_err) {
    // Labels may still be available in Electron without permission.
  }
}

async function listAudioOutputDevices() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return [];
  }
  await ensureDeviceLabels();
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === 'audiooutput');
}

function findBlackHoleDevice(devices) {
  return devices.find((d) => isBlackHoleLabel(d.label)) || null;
}

function formatDeviceLabel(device) {
  if (!device) return '';
  const label = (device.label || '').trim();
  if (label) return label;
  return device.deviceId === 'default' ? 'System Default' : 'Unknown device';
}

window.sndbtsAudioRouting = {
  isBlackHoleLabel,
  ensureDeviceLabels,
  listAudioOutputDevices,
  findBlackHoleDevice,
  formatDeviceLabel,
};
