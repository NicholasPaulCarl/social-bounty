// Single source of truth for the live version of the legal corpus
// (Privacy Policy, Terms of Service, etc.). Both backend (User.termsAcceptedVersion
// stamp at signup) and frontend (apps/web/src/content/legal/entity.ts) read this.
//
// Bump LEGAL_VERSION whenever a substantive change to any document goes live;
// existing User.termsAccepted* rows stay anchored to the version they accepted.

export const LEGAL_VERSION = '1.1';
export const LEGAL_EFFECTIVE_DATE = '2026-04-25';

// The exact statement a user agrees to when ticking the ToS / Privacy Policy
// checkbox at signup. Versioned so the hash on User.termsAcceptedTextHash
// stays stable against the version stamped in User.termsAcceptedVersion.
export const TERMS_ACCEPTANCE_STATEMENT = (version: string) =>
  `I accept the Social Bounty Terms of Service v${version} and Privacy Policy v${version}.`;
