const puppeteer = require("puppeteer");
const TEST_URL = process.env.TEST_URL || "http://localhost:5000";
(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(30000);
  page.on("console", (msg) => console.log("PAGE:", msg.type(), msg.text()));
  page.on("pageerror", (err) =>
    console.log("PAGEERROR:", err && err.stack ? err.stack : String(err))
  );
  page.on("error", (err) =>
    console.log(
      "PAGE_RUNTIME_ERROR:",
      err && err.stack ? err.stack : String(err)
    )
  );

  try {
    console.log("Navigating to", TEST_URL);
    await page.goto(TEST_URL, { waitUntil: "networkidle2" });
    console.log("Page loaded — waiting 4s for runtime logs...");
    // Some puppeteer versions lack page.waitForTimeout; use a simple sleep instead
    await new Promise((resolve) => setTimeout(resolve, 4000));

    const diag = await page.evaluate(() => {
      return {
        documentReady: document.readyState,
        scripts: Array.from(document.querySelectorAll("script")).map((s) => ({
          src: s.src,
          type: s.type,
        })),
        firebasePresent: !!(
          window.firebase ||
          window.getAuth ||
          window.initializeApp
        ),
        authObj: typeof window.auth !== "undefined",
        errors: window.__collectedErrors || null,
      };
    });
    console.log("DIAG:", JSON.stringify(diag, null, 2));
  } catch (e) {
    console.error("ERROR running collector:", e && e.stack ? e.stack : e);
  } finally {
    await browser.close();
  }
})();
