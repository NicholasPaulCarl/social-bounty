/**
 * Build an RFC 5987 / RFC 6266 compliant `Content-Disposition` header value.
 *
 * The naïve `attachment; filename="${fileName}"` pattern (used historically
 * across the codebase before 2026-04-27) is unsafe on two fronts:
 *
 *   1. **Header injection.** A filename containing a double-quote, backslash,
 *      or CR/LF can break the quoted-string form per RFC 7230 — at best
 *      producing a malformed header, at worst injecting additional headers
 *      via CRLF (Express + `res.setHeader` strip CR/LF aggressively, but the
 *      defence-in-depth is cheap).
 *   2. **Non-ASCII filenames.** Brand admins / hunters routinely upload files
 *      with accented or non-Latin characters in their names. The legacy
 *      quoted-string form silently mangles those into `?` or shows a bare
 *      `filename` with no extension; the `filename*` extension introduced by
 *      RFC 5987 fixes this.
 *
 * This helper emits BOTH forms together — the legacy `filename="..."` as a
 * sanitised ASCII fallback for old clients, and the canonical
 * `filename*=UTF-8''...` as the RFC 5987 percent-encoded UTF-8 form for
 * modern clients. Every browser since IE 10 / Firefox 4 / Chrome 14 prefers
 * `filename*` when both are present, so users get the correct filename and
 * pre-modern clients get a sensible degraded experience.
 *
 * Usage at the call site:
 * ```typescript
 * res.setHeader(
 *   'Content-Disposition',
 *   buildContentDisposition('attachment', file.fileName),
 * );
 * ```
 *
 * @example
 *   buildContentDisposition('attachment', 'report Q4 "final".pdf')
 *   // → attachment; filename="report Q4 _final_.pdf";
 *   //   filename*=UTF-8''report%20Q4%20%22final%22.pdf
 *
 * @example
 *   buildContentDisposition('inline', 'naïve résumé.pdf')
 *   // → inline; filename="na_ve r_sum_.pdf";
 *   //   filename*=UTF-8''na%C3%AFve%20r%C3%A9sum%C3%A9.pdf
 *
 * @param disposition  'inline' (display in browser tab) or 'attachment' (force download)
 * @param fileName     The user-supplied filename — may contain UTF-8, quotes, etc.
 * @returns Header value to pass straight to `res.setHeader('Content-Disposition', ...)`.
 */
export function buildContentDisposition(
  disposition: 'inline' | 'attachment',
  fileName: string,
): string {
  // ASCII fallback per RFC 6266 §4.3 + RFC 7230 quoted-string rules.
  // Replace anything that would break parsing with `_`:
  //   - non-printable / non-ASCII (outside U+0020..U+007E)
  //   - DQUOTE (U+0022) — would terminate the quoted-string
  //   - backslash (U+005C) — start of a quoted-pair
  // Whitespace inside DQUOTE is allowed (and useful — preserves "Q4 final"
  // shape), so we keep U+0020. CR/LF are out of the printable range and
  // therefore stripped by the same replace.
  const asciiFallback = fileName.replace(/[^\x20-\x7E]|["\\]/g, '_');

  // RFC 5987 ext-value: percent-encoded UTF-8 octets restricted to the
  // attr-char set (RFC 5987 §3.2.1). `encodeURIComponent` percent-encodes
  // everything except the JS-unreserved set `A-Z a-z 0-9 - _ . ~ ! * ' ( )`.
  // Five of those (`! * ' ( )`) are NOT in attr-char and must be additionally
  // percent-encoded — otherwise modern browsers fall back to the ASCII form
  // when they encounter an unexpected literal.
  const utf8Encoded = encodeURIComponent(fileName).replace(
    /['()!*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase(),
  );

  return `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${utf8Encoded}`;
}
