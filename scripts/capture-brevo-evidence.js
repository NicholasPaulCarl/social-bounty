// One-off: capture the signup form showing the service-communications notice
// + required ToS checkbox unchecked + disabled Continue button. Output is
// committed to docs/compliance/ as the Brevo evidence file.
//
// SMS + email are positioned as service communications (not direct marketing)
// per the post-2026-04-25 repositioning, so there are no per-channel opt-in
// checkboxes — the notice paragraph plus the no-sale-no-share statement
// satisfy the carrier disclosure expectations for transactional senders.
//
// Usage: node scripts/capture-brevo-evidence.js
// Requires: web-preview server running on http://localhost:3010

const { chromium } = require('playwright');
const path = require('path');

const URL = 'http://localhost:3010/signup';
const OUT = path.resolve(
  __dirname,
  '..',
  'docs',
  'compliance',
  'brevo-opt-in-evidence-2026-04-25.png',
);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 1100 } });
  await page.goto(URL, { waitUntil: 'networkidle' });
  // Give the React tree a beat to settle (PrimeReact Checkbox hydrates after
  // first paint; service-comms notice is server-rendered).
  await page.waitForSelector('[data-testid="service-comms-notice"]');
  await page.waitForSelector('input#termsAccepted');
  await page.screenshot({ path: OUT, fullPage: true });
  console.log(`wrote ${OUT}`);
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
