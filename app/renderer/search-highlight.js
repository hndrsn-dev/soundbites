'use strict';

(function () {
  function escapeHtml(str) {
    if (str == null || str === '') return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Escape `text` and wrap case-insensitive, non-overlapping occurrences of `query` in <mark>.
   */
  function highlightSearchHtml(text, query) {
    const q = (query || '').trim();
    const s = text == null ? '' : String(text);
    if (!q) return escapeHtml(s);
    const lower = s.toLowerCase();
    const ql = q.toLowerCase();
    const ranges = [];
    let pos = 0;
    while (pos <= s.length - ql.length) {
      const i = lower.indexOf(ql, pos);
      if (i === -1) break;
      ranges.push([i, i + ql.length]);
      pos = i + ql.length;
    }
    if (ranges.length === 0) return escapeHtml(s);
    let result = '';
    let last = 0;
    for (const [a, b] of ranges) {
      result += escapeHtml(s.slice(last, a));
      result += '<mark class="search-highlight">' + escapeHtml(s.slice(a, b)) + '</mark>';
      last = b;
    }
    result += escapeHtml(s.slice(last));
    return result;
  }

  window.highlightSearchHtml = highlightSearchHtml;
})();
