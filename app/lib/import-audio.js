'use strict';

const path = require('path');
const fs = require('fs');
const { parseFilename } = require('./parse-filename');

/** Reject path traversal in basenames */
function validateBasename(filename) {
  if (!filename || typeof filename !== 'string') return false;
  if (/[\\/]/.test(filename)) return false;
  if (filename.includes('..')) return false;
  return true;
}

/**
 * Copy audio files from absolute source paths into effectsDir (flat, by basename).
 * @returns {{ entries: object[], paths: string[] }} paths = basenames copied
 */
function importAudioFilesFromSourcePaths(sourcePaths, effectsDir) {
  const entries = [];
  const outFilenames = [];
  for (const filePath of sourcePaths) {
    if (typeof filePath !== 'string' || !path.isAbsolute(filePath)) continue;
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) continue;
    const filename = path.basename(filePath);
    if (!validateBasename(filename)) continue;
    if (!/\.(mp3|wav)$/i.test(filename)) continue;
    const destPath = path.join(effectsDir, filename);
    try {
      fs.copyFileSync(filePath, destPath);
      const basename = path.basename(filename, path.extname(filename));
      const meta = parseFilename(basename);
      outFilenames.push(filename);
      entries.push({
        filename,
        path: 'Effects/' + filename,
        name: meta.name,
        source: meta.source,
        category: meta.category,
        tags: meta.tags || [meta.source || 'effect'].filter(Boolean),
        format: path.extname(filename).slice(1).toLowerCase(),
        duration: null,
        userAdded: true,
      });
    } catch (err) {
      console.error('import copy failed:', filename, err);
    }
  }
  return { entries, paths: outFilenames };
}

module.exports = {
  validateBasename,
  importAudioFilesFromSourcePaths,
};
