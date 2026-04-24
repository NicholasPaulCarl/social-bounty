/**
 * Send the user to the TradeSafe hosted-checkout URL.
 *
 * In production we use a same-page redirect (window.location.href) — the
 * standard hosted-checkout pattern. After payment, TradeSafe redirects the
 * same window back to our /funded page where the bountyId is resolved.
 *
 * In development the page is often loaded inside an iframe (Claude
 * Preview, some staging tools) that blocks top-level navigation to
 * external origins. Same-page redirect silently fails — the brand sees
 * nothing happen. To keep the flow testable locally we open the URL in
 * a new tab instead, which iframe sandboxes do allow.
 *
 * Both paths stash the bountyId in sessionStorage so the /funded page
 * can resolve the bounty even if the provider's globally-registered
 * redirect URL doesn't carry it in the query string.
 */
export interface HostedCheckoutHandlers {
  /** Toast .showInfo handler for the dev-mode "opened in new tab" notice. */
  onDevNotice?: (message: string) => void;
  /** Called instead of cleanup-on-unload when we don't actually navigate (dev mode). */
  onDevSettled?: () => void;
}

export function redirectToHostedCheckout(
  hostedUrl: string,
  bountyId: string,
  handlers: HostedCheckoutHandlers = {},
): void {
  if (typeof window === 'undefined') return;

  // Stash the bountyId regardless of redirect mode — /funded reads it
  // either way (works for the production same-tab return AND the dev-
  // mode new-tab return).
  try {
    sessionStorage.setItem('fundingBountyId', bountyId);
  } catch {
    // sessionStorage unavailable (private mode, disabled). Best-effort.
  }

  if (process.env.NODE_ENV === 'development') {
    // Open in a new tab so iframe-sandboxed previews don't block the
    // navigation. Note: window.open requires a user-initiated event in
    // most browsers; this helper is always called from a click handler
    // so popup blockers shouldn't fire.
    window.open(hostedUrl, '_blank', 'noopener,noreferrer');
    handlers.onDevNotice?.(
      'Opened checkout in a new tab (dev mode — preview iframes block external redirects).',
    );
    handlers.onDevSettled?.();
    return;
  }

  // Production: standard hosted-checkout same-page redirect.
  window.location.href = hostedUrl;
}
