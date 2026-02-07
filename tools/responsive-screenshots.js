const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "screenshots");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORTS = [
  { name: "iphone-x", width: 375, height: 812, deviceScaleFactor: 3 },
  { name: "pixel-5", width: 412, height: 915, deviceScaleFactor: 2.5 },
  { name: "tablet", width: 768, height: 1024, deviceScaleFactor: 2 },
  { name: "desktop", width: 1280, height: 800, deviceScaleFactor: 1 },
];

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  page.on("console", (m) => console.log("PAGE:", m.text()));
  page.on("pageerror", (err) =>
    console.log("PAGEERROR:", err && err.stack ? err.stack : String(err))
  );

  try {
    await page.goto(process.env.TEST_URL || "http://localhost:5000", {
      waitUntil: "networkidle2",
    });
    // ensure page has time to initialize
    await new Promise((r) => setTimeout(r, 800));

    // Inject opener helper
    await page.evaluate(() => {
      window.__test_injected_opener = function () {
        try {
          const modal = document.getElementById("assessment-modal");
          const container = document.getElementById(
            "assessment-modal-container"
          );
          if (!modal) return false;
          modal.classList.remove("hidden");
          modal.classList.remove("opacity-0");
          if (container) container.classList.remove("scale-95");
          setTimeout(() => {
            const title = document.getElementById("assessment-modal-title");
            if (title && title.focus) title.focus();
          }, 50);
          return true;
        } catch (e) {
          console.error("injected opener error", e && e.message);
          return false;
        }
      };
    });

    for (const vp of VIEWPORTS) {
      console.log("Capturing", vp.name);
      await page.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.deviceScaleFactor,
      });
      await page.reload({ waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 600));

      // full-page screenshot before modal
      const beforePath = path.join(OUT_DIR, `${vp.name}-before.png`);
      await page.screenshot({ path: beforePath, fullPage: true });

      // open modal
      const opened = await page.evaluate(
        () => window.__test_injected_opener && window.__test_injected_opener()
      );
      console.log("Modal opened:", opened);
      await new Promise((r) => setTimeout(r, 400));

      // center-crop screenshot to show modal area if present
      const modalScreenshotPath = path.join(OUT_DIR, `${vp.name}-modal.png`);
      try {
        const modal = await page.$("#assessment-modal");
        if (modal) {
          // screenshot the viewport region (fallback to fullpage crop if bounding box fails)
          const bbox = await modal.boundingBox();
          if (bbox) {
            // expand slightly
            const pad = 20;
            const clip = {
              x: Math.max(0, bbox.x - pad),
              y: Math.max(0, bbox.y - pad),
              width: Math.min(vp.width, bbox.width + pad * 2),
              height: Math.min(vp.height, bbox.height + pad * 2),
            };
            await page.screenshot({ path: modalScreenshotPath, clip });
          } else {
            await page.screenshot({
              path: modalScreenshotPath,
              fullPage: false,
            });
          }
        } else {
          await page.screenshot({ path: modalScreenshotPath, fullPage: false });
        }
      } catch (e) {
        console.error("screenshot modal failed", e && e.message);
        await page.screenshot({ path: modalScreenshotPath, fullPage: false });
      }

      // close modal if close button exists
      await page.evaluate(() => {
        const btn = document.getElementById("close-assessment-modal");
        if (btn) btn.click();
      });
      await new Promise((r) => setTimeout(r, 300));
    }

    console.log("Responsive screenshots saved to", OUT_DIR);
  } catch (e) {
    console.error("Responsive test failed", e && e.stack ? e.stack : String(e));
  } finally {
    await browser.close();
  }
})();
