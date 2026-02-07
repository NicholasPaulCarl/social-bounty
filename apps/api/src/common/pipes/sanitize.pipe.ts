import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

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
      return this.stripHtml(value);
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

  private stripHtml(input: string): string {
    // Remove script tags and their content first
    let result = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // Remove all remaining HTML tags
    result = result.replace(/<[^>]*>/g, '');
    // Decode common HTML entities that could be used for XSS
    result = result
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/');
    // Re-strip tags in case decoded entities formed new tags
    result = result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    result = result.replace(/<[^>]*>/g, '');
    return result;
  }
}
