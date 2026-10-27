// Plain-text search helpers shared by the in-document find overlay.
//
// The rendered (view) mode highlights matches with mark.js against the DOM, but
// in edit mode the document is a <textarea> whose contents are not in the DOM as
// markable text nodes. These pure helpers power the editor find path (counting,
// cycling and backdrop highlighting) and are unit tested in isolation.

export interface Match {
  /** Inclusive start offset into the source text. */
  start: number;
  /** Exclusive end offset into the source text. */
  end: number;
}

/**
 * Find every non-overlapping, case-insensitive occurrence of `query` in `text`.
 *
 * The match is literal — `query` is never treated as a regular expression — so
 * special characters such as `.` `*` `(` are matched verbatim. Returns an empty
 * array for an empty query.
 */
export function findMatches(text: string, query: string): Match[] {
  const matches: Match[] = [];
  if (!text || !query) return matches;

  // Lowercasing can change string length (e.g. İ), corrupting replacement offsets.
  const pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "giu");
  for (const match of text.matchAll(pattern)) {
    matches.push({ start: match.index!, end: match.index! + match[0].length });
  }
  return matches;
}

/** Replace the active match or all matches literally, then advance past the replacement. */
export function replaceMatches(
  text: string, query: string, replacement: string, activeIndex: number, all: boolean
): { text: string; activeIndex: number } {
  const matches = findMatches(text, query);
  const active = matches[activeIndex] ?? matches[0];
  if (!active) return { text, activeIndex: 0 };

  const parts: string[] = [];
  let cursor = 0;
  for (const match of all ? matches : [active]) {
    parts.push(text.slice(cursor, match.start), replacement);
    cursor = match.end;
  }
  parts.push(text.slice(cursor));
  const next = parts.join("");
  const nextIndex = all ? 0 : findMatches(next, query).findIndex(
    (match) => match.start >= active.start + replacement.length
  );
  return { text: next, activeIndex: Math.max(0, nextIndex) };
}

/**
 * Move an active match index by `direction` (+1 next, -1 previous), wrapping
 * around the ends. Returns 0 when there are no matches.
 */
export function cycleIndex(current: number, total: number, direction: 1 | -1): number {
  if (total <= 0) return 0;
  return (current + direction + total) % total;
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>]/g, (ch) => HTML_ESCAPES[ch]);
}

/**
 * Build the HTML for the editor highlight backdrop: the source text with each
 * match wrapped in a `<mark>`. The match at `activeIndex` additionally gets the
 * `mdv-search-active` class so the focused hit can be styled/scrolled to.
 *
 * The output is rendered behind a transparent <textarea> whose `white-space` is
 * `pre-wrap`, so newlines and spaces are preserved without extra markup.
 */
export function buildHighlightHtml(text: string, matches: Match[], activeIndex: number): string {
  if (matches.length === 0) return escapeHtml(text);

  let html = "";
  let cursor = 0;
  for (let i = 0; i < matches.length; i++) {
    const { start, end } = matches[i];
    if (start < cursor) continue; // defensive: skip overlaps
    html += escapeHtml(text.slice(cursor, start));
    const className =
      i === activeIndex ? "mdv-search-highlight mdv-search-active" : "mdv-search-highlight";
    html += `<mark class="${className}" data-match-index="${i}">`;
    html += escapeHtml(text.slice(start, end));
    html += "</mark>";
    cursor = end;
  }
  html += escapeHtml(text.slice(cursor));
  return html;
}
