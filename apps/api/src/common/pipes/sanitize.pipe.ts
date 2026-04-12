import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

/**
 * Global pipe that strips HTML tags from all string values in request bodies.
 * Prevents stored XSS attacks by sanitizing user input at the API boundary.
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    // Only sanitize body parameters
    if (metadata.type !== 'body') {
      return value;
    }

    return this.sanitize(value);
  }

  private sanitize(value: unknown): unknown {
    if (typeof value === 'string') {
      // sanitize-html strips all tags but also HTML-encodes characters like
      // & → &amp; in the output. Since the sanitized value is stored as data
      // (not rendered as raw HTML), decode common entities back so values
      // like "Fitness & Wellness" stay as plain text, not "Fitness &amp; Wellness".
      const stripped = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
      // Only decode ampersands and quotes — NOT angle brackets (&lt; &gt;)
      // which must stay encoded to prevent reconstructed <script> tags.
      return stripped
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#39;/g, "'");
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitize(item));
    }

    if (value !== null && typeof value === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = this.sanitize(val);
      }
      return sanitized;
    }

    return value;
  }
}
