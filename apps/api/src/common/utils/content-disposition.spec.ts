import { buildContentDisposition } from './content-disposition';

describe('buildContentDisposition', () => {
  describe('happy path', () => {
    it('plain ASCII filename — both forms present, identical content', () => {
      const result = buildContentDisposition('attachment', 'report.pdf');
      expect(result).toBe(
        `attachment; filename="report.pdf"; filename*=UTF-8''report.pdf`,
      );
    });

    it('inline disposition for inline-rendered files', () => {
      const result = buildContentDisposition('inline', 'preview.jpg');
      expect(result).toBe(
        `inline; filename="preview.jpg"; filename*=UTF-8''preview.jpg`,
      );
    });

    it('preserves spaces in ASCII fallback (whitespace is allowed inside quoted-string)', () => {
      const result = buildContentDisposition('attachment', 'My Q4 Report.pdf');
      expect(result).toContain(`filename="My Q4 Report.pdf"`);
      // utf8Encoded form — spaces percent-encoded as %20.
      expect(result).toContain(`filename*=UTF-8''My%20Q4%20Report.pdf`);
    });
  });

  describe('header-injection defence (RFC 7230 quoted-string boundary chars)', () => {
    it('strips DQUOTE from ASCII fallback', () => {
      const result = buildContentDisposition('attachment', 'report "Q4".pdf');
      expect(result).toContain(`filename="report _Q4_.pdf"`);
      // The UTF-8 form percent-encodes the quotes (%22), keeping them
      // recoverable on the modern-client side.
      expect(result).toContain(`filename*=UTF-8''report%20%22Q4%22.pdf`);
    });

    it('strips backslash from ASCII fallback (would otherwise start a quoted-pair)', () => {
      const result = buildContentDisposition('attachment', 'a\\b.pdf');
      expect(result).toContain(`filename="a_b.pdf"`);
      expect(result).toContain(`filename*=UTF-8''a%5Cb.pdf`);
    });

    it('strips CR / LF (would inject additional headers if interpreted)', () => {
      const result = buildContentDisposition(
        'attachment',
        'evil.pdf\r\nX-Injected: true',
      );
      // Both CR and LF are outside U+0020..U+007E, so the ASCII fallback
      // replaces them with `_`. The colon and space stay (printable ASCII)
      // — they're not header-meaningful inside the quoted-string.
      expect(result).toContain(`filename="evil.pdf__X-Injected: true"`);
      // The full string MUST NOT contain a literal newline. Express's
      // `res.setHeader` would also reject this, but defence-in-depth.
      expect(result).not.toMatch(/[\r\n]/);
    });

    it('strips control characters (TAB, NUL, etc.)', () => {
      const result = buildContentDisposition(
        'attachment',
        'a\tb\x00c.pdf',
      );
      expect(result).toContain(`filename="a_b_c.pdf"`);
    });
  });

  describe('non-ASCII handling (RFC 5987 ext-value)', () => {
    it('encodes accented Latin characters', () => {
      const result = buildContentDisposition(
        'attachment',
        'naïve résumé.pdf',
      );
      // ASCII fallback: each non-ASCII char becomes _.
      expect(result).toContain(`filename="na_ve r_sum_.pdf"`);
      // UTF-8 form: ï = %C3%AF, é = %C3%A9.
      expect(result).toContain(`filename*=UTF-8''na%C3%AFve%20r%C3%A9sum%C3%A9.pdf`);
    });

    it('encodes CJK characters', () => {
      // 报告 = U+62A5 U+544A → UTF-8 = E6 8A A5 E5 91 8A
      const result = buildContentDisposition('attachment', '报告.pdf');
      expect(result).toContain(`filename="__.pdf"`);
      expect(result).toContain(
        `filename*=UTF-8''%E6%8A%A5%E5%91%8A.pdf`,
      );
    });

    it('encodes emoji', () => {
      // 📄 = U+1F4C4 → UTF-8 surrogate pair = F0 9F 93 84
      const result = buildContentDisposition('inline', '📄.pdf');
      expect(result).toContain(`filename="__.pdf"`);
      expect(result).toContain(`filename*=UTF-8''%F0%9F%93%84.pdf`);
    });
  });

  describe('RFC 5987 attr-char extra-encoding', () => {
    // encodeURIComponent leaves these alone, but RFC 5987 §3.2.1 requires
    // them percent-encoded. We hand-encode after `encodeURIComponent`.
    it.each([
      ["'", '%27'],
      ['(', '%28'],
      [')', '%29'],
      ['!', '%21'],
      ['*', '%2A'],
    ])('percent-encodes %s as %s in ext-value', (char, expected) => {
      const result = buildContentDisposition('attachment', `a${char}b.pdf`);
      expect(result).toContain(`filename*=UTF-8''a${expected}b.pdf`);
    });

    it('encodes a filename with all attr-char-violating chars at once', () => {
      const result = buildContentDisposition(
        'attachment',
        `it's a (test)*!.pdf`,
      );
      expect(result).toContain(
        `filename*=UTF-8''it%27s%20a%20%28test%29%2A%21.pdf`,
      );
    });
  });

  describe('edges', () => {
    it('empty filename returns syntactically valid header (degraded but parseable)', () => {
      const result = buildContentDisposition('attachment', '');
      expect(result).toBe(`attachment; filename=""; filename*=UTF-8''`);
    });

    it('only-non-ASCII filename produces an all-underscore ASCII fallback', () => {
      const result = buildContentDisposition('attachment', '日本語');
      expect(result).toContain(`filename="___"`);
      // Modern clients ignore filename when filename* is present — they
      // get the proper UTF-8 string.
      expect(result).toContain(
        `filename*=UTF-8''%E6%97%A5%E6%9C%AC%E8%AA%9E`,
      );
    });

    it('output never contains a literal newline regardless of input', () => {
      // Header value must be a single line; CR/LF must be stripped.
      const inputs = [
        'a\rb.pdf',
        'a\nb.pdf',
        'a\r\nb.pdf',
        'a b.pdf', // U+2028 LINE SEPARATOR (outside ASCII)
      ];
      for (const input of inputs) {
        const result = buildContentDisposition('attachment', input);
        expect(result).not.toMatch(/[\r\n]/);
      }
    });
  });
});
