/*
  Lightweight Puppeteer smoke test template for Toji's Training Regimen
  - This script is a template. You must provide FIREBASE_TEST_EMAIL and FIREBASE_TEST_PASSWORD
    or modify the script to use an existing test account.
  - Run locally with: node tools/smoke-test.js

  Notes:
  - The test will open the local host URL provided by TEST_URL (default: http://localhost:5000)
  - It signs in, triggers the assessment modal, and attempts to save an assessment.
  - It does not talk to Firestore directly; you can extend it to verify network requests or query Firestore with admin SDK if you add service account credentials.
*/

const puppeteer = require("puppeteer");

const TEST_URL = process.env.TEST_URL || "http://localhost:5000";
const EMAIL = process.env.FIREBASE_TEST_EMAIL || "";
const PASSWORD = process.env.FIREBASE_TEST_PASSWORD || "";

if (!EMAIL || !PASSWORD) {
  console.error(
    "Set FIREBASE_TEST_EMAIL and FIREBASE_TEST_PASSWORD env vars before running."
  );
  process.exit(1);
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  page.on("console", (msg) => console.log("PAGE:", msg.text()));

  try {
    await page.goto(TEST_URL, { waitUntil: "networkidle2" });

    // Wait for auth inputs
    await page.waitForSelector("#email-input");
    await page.type("#email-input", EMAIL);
    await page.type("#password-input", PASSWORD);
    await page.click("#login-btn");

    // Wait for app to load
    await page.waitForSelector("#app-container", { timeout: 10000 });

    // Go to Settings and trigger assessment test
    await page.click('.tab-btn[data-tab="settings"]');
    await page.waitForSelector("#trigger-assessment-test-btn");
    await page.click("#trigger-assessment-test-btn");

    // Wait for assessment modal and fill in values
    await page.waitForSelector("#assessment-modal", { visible: true });
    await page.type("#assess-pushups", "10");
    await page.type("#assess-plank", "30");
    await page.type("#assess-weight", "75");
    await page.type("#assess-fitness", "6");
    await page.click("#save-assessment-btn");

    // Wait a moment for the save to complete and toast
    await page.waitForTimeout(2000);

    console.log("Smoke test completed - check Firestore for saved assessment.");
  } catch (err) {
    console.error("Smoke test failed:", err);
  } finally {
    await browser.close();
  }
})();
