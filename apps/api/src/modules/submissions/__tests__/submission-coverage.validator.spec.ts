import { BadRequestException } from '@nestjs/common';
import { SocialChannel, PostFormat } from '@social-bounty/shared';
import type { ChannelSelection, ProofLinkInput } from '@social-bounty/shared';
import { validateProofLinkCoverage } from '../submission-coverage.validator';

// Valid sample URLs that match CHANNEL_URL_PATTERNS + FORMAT_URL_HINTS.
const IG_REEL = 'https://instagram.com/reels/ABC123/';
const IG_POST = 'https://www.instagram.com/p/XYZ789/';
const IG_STORY = 'https://instagram.com/stories/acme/456/';
const TT_VIDEO = 'https://www.tiktok.com/@user/video/1234567890';
const FB_POST = 'https://www.facebook.com/acme/posts/pfbid02abc';

function asInput(channel: SocialChannel, format: PostFormat, url: string): ProofLinkInput {
  return { channel, format, url };
}

describe('validateProofLinkCoverage', () => {
  it('accepts empty links + null channels (bounty has no channels)', () => {
    expect(() => validateProofLinkCoverage([], null)).not.toThrow();
    expect(() => validateProofLinkCoverage([], {} as ChannelSelection)).not.toThrow();
  });

  it('rejects links on a bounty with no channels', () => {
    expect(() =>
      validateProofLinkCoverage(
        [asInput(SocialChannel.INSTAGRAM, PostFormat.REEL, IG_REEL)],
        null,
      ),
    ).toThrow(BadRequestException);
  });

  it('accepts single-channel single-format coverage', () => {
    const channels: ChannelSelection = { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] };
    expect(() =>
      validateProofLinkCoverage(
        [asInput(SocialChannel.INSTAGRAM, PostFormat.REEL, IG_REEL)],
        channels,
      ),
    ).not.toThrow();
  });

  it('accepts multi-channel multi-format coverage', () => {
    const channels: ChannelSelection = {
      [SocialChannel.INSTAGRAM]: [PostFormat.REEL, PostFormat.FEED_POST],
      [SocialChannel.TIKTOK]: [PostFormat.VIDEO_POST],
    };
    expect(() =>
      validateProofLinkCoverage(
        [
          asInput(SocialChannel.INSTAGRAM, PostFormat.REEL, IG_REEL),
          asInput(SocialChannel.INSTAGRAM, PostFormat.FEED_POST, IG_POST),
          asInput(SocialChannel.TIKTOK, PostFormat.VIDEO_POST, TT_VIDEO),
        ],
        channels,
      ),
    ).not.toThrow();
  });

  it('rejects when a required (channel, format) pair is missing', () => {
    const channels: ChannelSelection = {
      [SocialChannel.INSTAGRAM]: [PostFormat.REEL, PostFormat.FEED_POST],
    };
    try {
      validateProofLinkCoverage(
        [asInput(SocialChannel.INSTAGRAM, PostFormat.REEL, IG_REEL)],
        channels,
      );
      fail('should have thrown');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(BadRequestException);
      const response = (err as BadRequestException).getResponse() as { details: Array<{ message: string }> };
      expect(response.details.some((d) => d.message.includes('Missing URL for INSTAGRAM FEED_POST'))).toBe(true);
    }
  });

  it('rejects a URL that does not match the channel domain', () => {
    const channels: ChannelSelection = { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] };
    try {
      validateProofLinkCoverage(
        [asInput(SocialChannel.INSTAGRAM, PostFormat.REEL, 'https://tiktok.com/@bad/video/1')],
        channels,
      );
      fail('should have thrown');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(BadRequestException);
      const response = (err as BadRequestException).getResponse() as { details: Array<{ message: string }> };
      expect(response.details.some((d) => d.message.includes("doesn't match the INSTAGRAM domain"))).toBe(true);
    }
  });

  it('rejects a URL whose path hint mismatches the requested format', () => {
    const channels: ChannelSelection = { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] };
    try {
      // Valid Instagram URL, but it's a feed-post URL being submitted for REEL.
      validateProofLinkCoverage(
        [asInput(SocialChannel.INSTAGRAM, PostFormat.REEL, IG_POST)],
        channels,
      );
      fail('should have thrown');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(BadRequestException);
      const response = (err as BadRequestException).getResponse() as { details: Array<{ message: string }> };
      expect(response.details.some((d) => d.message.includes("doesn't look like a REEL URL"))).toBe(true);
    }
  });

  it('accepts any Facebook URL for any Facebook format (no path hints)', () => {
    const channels: ChannelSelection = {
      [SocialChannel.FACEBOOK]: [PostFormat.FEED_POST, PostFormat.REEL, PostFormat.STORY],
    };
    expect(() =>
      validateProofLinkCoverage(
        [
          asInput(SocialChannel.FACEBOOK, PostFormat.FEED_POST, FB_POST),
          asInput(SocialChannel.FACEBOOK, PostFormat.REEL, FB_POST),
          asInput(SocialChannel.FACEBOOK, PostFormat.STORY, FB_POST),
        ],
        channels,
      ),
    ).not.toThrow();
  });

  it('rejects an extra URL for a format the bounty did not request', () => {
    const channels: ChannelSelection = { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] };
    try {
      validateProofLinkCoverage(
        [
          asInput(SocialChannel.INSTAGRAM, PostFormat.REEL, IG_REEL),
          asInput(SocialChannel.INSTAGRAM, PostFormat.STORY, IG_STORY),
        ],
        channels,
      );
      fail('should have thrown');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(BadRequestException);
      const response = (err as BadRequestException).getResponse() as { details: Array<{ message: string }> };
      expect(response.details.some((d) => d.message.includes('Unexpected URL for INSTAGRAM STORY'))).toBe(true);
    }
  });

  it('rejects a duplicate URL for the same (channel, format) pair', () => {
    const channels: ChannelSelection = { [SocialChannel.INSTAGRAM]: [PostFormat.REEL] };
    try {
      validateProofLinkCoverage(
        [
          asInput(SocialChannel.INSTAGRAM, PostFormat.REEL, IG_REEL),
          asInput(SocialChannel.INSTAGRAM, PostFormat.REEL, IG_REEL + '?t=2'),
        ],
        channels,
      );
      fail('should have thrown');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(BadRequestException);
      const response = (err as BadRequestException).getResponse() as { details: Array<{ message: string }> };
      expect(response.details.some((d) => d.message.includes('Duplicate URL'))).toBe(true);
    }
  });
});
