/* ═══════════════════════════════════════════════════════════
   FLASH - Input Sanitization (R12)
   Strips bidi controls + zero-width + control chars.
   Use before storing AND before rendering any user/AI text.
   ═══════════════════════════════════════════════════════════ */

/* Unicode ranges that can be abused for spoofing / invisible text */
const BIDI_CONTROLS = /[\u202A-\u202E\u2066-\u2069\u200E\u200F\u061C]/g;
const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/**
 * Strips bidi controls, zero-width chars, and control characters.
 * Safe for Arabic + English mixed text.
 */
export function sanitizeText(input: string | null | undefined, maxLength = 4000): string {
  if (!input) return '';
  let s = String(input);
  s = s.replace(BIDI_CONTROLS, '');
  s = s.replace(ZERO_WIDTH, '');
  s = s.replace(CONTROL_CHARS, '');
  /* Collapse 3+ newlines to 2 */
  s = s.replace(/\n{3,}/g, '\n\n');
  /* Collapse 3+ spaces to 1 */
  s = s.replace(/ {3,}/g, ' ');
  s = s.trim();
  if (s.length > maxLength) s = s.slice(0, maxLength);
  return s;
}

/**
 * Sanitize a display name.
 * - Bidi/zero-width removed
 * - Length 1..30
 * - No control chars
 */
export function sanitizeDisplayName(input: string | null | undefined): string {
  const s = sanitizeText(input, 30);
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Escape HTML special chars — use when inserting into innerHTML on the frontend,
 * or when returning any text that will be rendered as HTML.
 */
export function escapeHtml(input: string | null | undefined): string {
  if (!input) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Detect if input contains any suspicious invisible/bidi chars.
 * Useful for logging / anti-abuse checks without mutating the input.
 */
export function hasSuspiciousChars(input: string | null | undefined): boolean {
  if (!input) return false;
  return BIDI_CONTROLS.test(String(input)) || ZERO_WIDTH.test(String(input));
}