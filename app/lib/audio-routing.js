/** Shared virtual-audio device label matching (macOS BlackHole). */

const BLACKHOLE_PATTERN = /blackhole/i;

function isBlackHoleLabel(label) {
  return BLACKHOLE_PATTERN.test(String(label || ''));
}

function pickDefaultBlackHoleDeviceId(devices) {
  if (!Array.isArray(devices)) return '';
  const outputs = devices.filter((d) => d && d.kind === 'audiooutput');
  const match = outputs.find((d) => isBlackHoleLabel(d.label));
  return match ? match.deviceId : '';
}

module.exports = {
  BLACKHOLE_PATTERN,
  isBlackHoleLabel,
  pickDefaultBlackHoleDeviceId,
};
