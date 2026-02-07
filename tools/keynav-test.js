const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  page.on("console", (m) => console.log("PAGE:", m.text()));
  page.on("pageerror", (err) =>
    console.log("PAGEERROR:", err && err.stack ? err.stack : String(err))
  );

  try {
    await page.goto(process.env.TEST_URL || "http://localhost:5000", {
      waitUntil: "networkidle2",
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Inject a safe opener that simply flips modal classes and focuses title
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
          // small timeout to let CSS transitions settle
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

    // invoke the injected opener
    const opened = await page.evaluate(() => {
      return !!(
        window.__test_injected_opener && window.__test_injected_opener()
      );
    });
    console.log("Injected opener invoked:", opened);

    await new Promise((r) => setTimeout(r, 400));

    // Record focus order while pressing Tab several times
    const focusTrace = [];
    for (let i = 0; i < 8; i++) {
      // grab active element info
      const info = await page.evaluate(() => {
        const a = document.activeElement;
        if (!a) return { index: -1 };
        return {
          tag: a.tagName,
          id: a.id || null,
          name: a.getAttribute("name") || null,
          classes: a.className || null,
          text: (a.innerText || a.value || "").slice(0, 80),
        };
      });
      focusTrace.push({ step: `before-tab-${i}`, info });
      await page.keyboard.press("Tab");
      await new Promise((r) => setTimeout(r, 120));
    }

    // Shift+Tab once to test reverse
    await page.keyboard.down("Shift");
    await page.keyboard.press("Tab");
    await page.keyboard.up("Shift");
    await new Promise((r) => setTimeout(r, 120));
    const reverseInfo = await page.evaluate(() => {
      const a = document.activeElement;
      return {
        tag: a ? a.tagName : null,
        id: a ? a.id : null,
        text: a ? (a.innerText || a.value || "").slice(0, 80) : null,
      };
    });

    console.log("Focus trace:");
    focusTrace.forEach((t, i) =>
      console.log(i, t.step, JSON.stringify(t.info))
    );
    console.log("After reverse shift+tab:", JSON.stringify(reverseInfo));

    // Close modal by clicking close button if present
    await page.evaluate(() => {
      const btn = document.getElementById("close-assessment-modal");
      if (btn) btn.click();
    });

    await new Promise((r) => setTimeout(r, 400));
    console.log("Keynav test complete");
  } catch (e) {
    console.error("Keynav test failed", e && e.stack ? e.stack : String(e));
  } finally {
    await browser.close();
  }
})();
