'use strict';

// Prefix → human-readable category mapping (shared with generate-metadata.js)
const PREFIX_MAP = {
  'ad':     { category: 'Arrested Development', source: 'ad' },
  'bale':   { category: 'Christian Bale',        source: 'bale' },
  'bacon':  { category: 'Kevin Bacon',           source: 'bacon' },
  'bm':     { category: 'Billy Madison',         source: 'bm' },
  'bf':     { category: 'Karl',                  source: 'bf' },
  'blake':  { category: 'Workaholics',           source: 'blake' },
  'bog':    { category: 'Misc',                  source: 'bog' },
  'at':     { category: 'Adventure Time',        source: 'at' },
  '30rock': { category: '30 Rock',               source: '30rock' },
  'biggie': { category: 'Biggie Smalls',         source: 'biggie' },
  'bk':     { category: 'Burger King',           source: 'bk' },
  'bell':   { category: 'Bell',                  source: 'bell' },
  'office': { category: 'The Office',            source: 'office' },
  'snl':    { category: 'SNL',                   source: 'snl' },
  'mario':  { category: 'Mario',                 source: 'mario' },
  'shia':   { category: 'Shia LaBeouf',         source: 'shia' },
  'cb':     { category: 'Misc',                  source: 'cb' },
  'fb':     { category: 'Misc',                  source: 'fb' },
  'airhorn':{ category: 'Effects',               source: 'airhorn' },
  'air':    { category: 'Effects',               source: 'air' },
};

function splitCamelCase(str) {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function parseFilename(filename) {
  const dashIdx = filename.indexOf('-');

  if (dashIdx > 0) {
    const prefix = filename.slice(0, dashIdx).toLowerCase();
    const rest = filename.slice(dashIdx + 1);
    const mapped = PREFIX_MAP[prefix];

    if (mapped) {
      return {
        source: mapped.source,
        category: mapped.category,
        name: splitCamelCase(rest),
        tags: [mapped.source],
      };
    }
  }

  return {
    source: null,
    category: 'Effects',
    name: splitCamelCase(filename),
    tags: ['effect'],
  };
}

module.exports = { PREFIX_MAP, splitCamelCase, parseFilename };
