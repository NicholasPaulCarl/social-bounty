// Single source of truth for the live version of the legal corpus
// (Privacy Policy, Terms of Service, etc.). Both backend (User.termsAcceptedVersion
// stamp at signup) and frontend (apps/web/src/content/legal/entity.ts) read this.
//
// Bump LEGAL_VERSION whenever a substantive change to any document goes live;
// existing User.termsAccepted* rows stay anchored to the version they accepted.

export const LEGAL_VERSION = '1.1';
export const LEGAL_EFFECTIVE_DATE = '2026-04-25';
