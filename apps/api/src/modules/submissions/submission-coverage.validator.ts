/**
 * Per-format URL coverage validator for hunter submissions.
 *
 * Rule: for every (channel, format) pair in bounty.channels, the submission
 * must include exactly one URL whose hostname matches CHANNEL_URL_PATTERNS
 * for that channel. No extras — hunters cannot submit URLs for formats the
 * bounty did not request. Facebook URLs are allowed for any FB format
 * because the URL path doesn't distinguish REEL vs FEED_POST; the post
 * scraper confirms the format from metadata.
 *
 * This is a pure function for easy unit testing. It throws
 * BadRequestException with `details: [{field, message}]` matching the
 * established error contract (see bounties.service.ts:1069-1073).
 */
import { BadRequestException } from '@nestjs/common';
import { CHANNEL_URL_PATTERNS, SocialChannel, PostFormat } from '@social-bounty/shared';
import type { ChannelSelection, ProofLinkInput } from '@social-bounty/shared';

/**
 * Regex hints used to sanity-check whether the URL path plausibly matches
 * the requested format. When a hint exists for a (channel, format) pair,
 * the URL must match. Facebook intentionally has no hints — its URLs don't
 * expose format in the path (e.g. /123456 could be a reel, post, or story).
 */
const FORMAT_URL_HINTS: Record<SocialChannel, Partial<Record<PostFormat, RegExp>>> = {
  [SocialChannel.INSTAGRAM]: {
    [PostFormat.REEL]: /\/reels?\//i,
    [PostFormat.FEED_POST]: /\/p\//i,
    [PostFormat.STORY]: /\/stories\//i,
  },
  [SocialChannel.FACEBOOK]: {
    // No path-based hints — Facebook URL routing doesn't expose post
    // format. Deferred to scraper.
  },
  [SocialChannel.TIKTOK]: {
    [PostFormat.VIDEO_POST]: /(\/video\/|\/v\/|\/@[^/]+\/video\/)/i,
  },
};

export function validateProofLinkCoverage(
  proofLinks: ProofLinkInput[],
  channels: ChannelSelection | null,
): void {
  // Bounty has no channels → no URLs should be submitted either.
  if (!channels || Object.keys(channels).length === 0) {
    if (proofLinks.length > 0) {
      throw new BadRequestException({
        message: 'Submission URL coverage invalid',
        details: [
          {
            field: 'proofLinks',
            message: 'Bounty has no required channels — proofLinks must be empty',
          },
        ],
      });
    }
    return;
  }

  // Build the set of (channel, format) pairs the hunter must cover.
  const requiredPairs = Object.entries(channels).flatMap(([channel, formats]) =>
    (formats || []).map((format) => ({
      channel: channel as SocialChannel,
      format,
    })),
  );

  const details: Array<{ field: string; message: string }> = [];

  // 1. Every required pair has a matching, well-formed URL.
  for (const { channel, format } of requiredPairs) {
    const link = proofLinks.find(
      (p) => p.channel === channel && p.format === format,
    );
    if (!link) {
      details.push({
        field: 'proofLinks',
        message: `Missing URL for ${channel} ${format}`,
      });
      continue;
    }
    if (!CHANNEL_URL_PATTERNS[channel].test(link.url)) {
      details.push({
        field: 'proofLinks',
        message: `URL for ${channel} ${format} doesn't match the ${channel} domain`,
      });
      continue;
    }
    const formatHint = FORMAT_URL_HINTS[channel]?.[format];
    if (formatHint && !formatHint.test(link.url)) {
      details.push({
        field: 'proofLinks',
        message: `URL for ${channel} ${format} doesn't look like a ${format} URL`,
      });
    }
  }

  // 2. Reject extras — no URLs beyond the required pairs.
  for (const link of proofLinks) {
    const isRequired = requiredPairs.some(
      (p) => p.channel === link.channel && p.format === link.format,
    );
    if (!isRequired) {
      details.push({
        field: 'proofLinks',
        message: `Unexpected URL for ${link.channel} ${link.format} — bounty doesn't require this`,
      });
    }
  }

  // 3. Reject duplicates — same (channel, format) submitted twice.
  const seen = new Set<string>();
  for (const link of proofLinks) {
    const key = `${link.channel}_${link.format}`;
    if (seen.has(key)) {
      details.push({
        field: 'proofLinks',
        message: `Duplicate URL for ${link.channel} ${link.format}`,
      });
    }
    seen.add(key);
  }

  if (details.length > 0) {
    throw new BadRequestException({
      message: 'Submission URL coverage invalid',
      details,
    });
  }
}
