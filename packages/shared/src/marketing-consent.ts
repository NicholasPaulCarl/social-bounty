// Single source of truth for marketing-consent label copy. Frontend renders
// these strings under each checkbox; backend hashes the same strings (NFC +
// SHA-256) onto MarketingConsent.textHash so we can later prove the exact
// wording the user agreed to.
//
// Bump MARKETING_CONSENT_VERSION whenever a label's text changes; old rows
// keep their original textHash + textVersion.

export const MARKETING_CONSENT_VERSION = 'v1';

export interface MarketingConsentLabel {
  label: string;
  disclosure: string | null;
}

export const MARKETING_CONSENT_LABELS = {
  EMAIL: {
    label:
      'Email me product updates, offers, and bounty alerts. I can unsubscribe via the link in any email.',
    disclosure: null,
  },
  SMS: {
    label: 'Send me SMS messages for bounty alerts and account updates.',
    disclosure:
      'Message frequency may vary. Standard message and data rates may apply. Reply STOP to opt out. Reply HELP for assistance. Your mobile information will not be sold or shared with third parties for promotional or marketing purposes.',
  },
} as const satisfies Record<'EMAIL' | 'SMS', MarketingConsentLabel>;

export type MarketingConsentChannelKey = keyof typeof MARKETING_CONSENT_LABELS;

// The exact statement a user agrees to when ticking the ToS / Privacy Policy
// checkbox. Versioned so the hash on User.termsAcceptedTextHash stays stable
// against the version stamped in User.termsAcceptedVersion.
export const TERMS_ACCEPTANCE_STATEMENT = (version: string) =>
  `I accept the Social Bounty Terms of Service v${version} and Privacy Policy v${version}.`;
