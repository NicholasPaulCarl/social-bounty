// One-off: capture the signup form with all three checkboxes unchecked + the
// SMS carrier disclosure visible. Output is committed to docs/compliance/ as
// the Brevo opt-in evidence file.
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
  // Give the React tree a beat to settle (custom checkboxes hydrate after first paint).
  await page.waitForSelector('input#consentEmail');
  await page.waitForSelector('input#consentSms');
  await page.waitForSelector('input#termsAccepted');
  await page.screenshot({ path: OUT, fullPage: true });
  console.log(`wrote ${OUT}`);
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
