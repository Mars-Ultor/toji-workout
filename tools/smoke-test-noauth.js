const puppeteer = require("puppeteer");

const TEST_URL = process.env.TEST_URL || "http://localhost:5000";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  page.on("console", (msg) => console.log("PAGE:", msg.text()));
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
    await page.goto(TEST_URL, { waitUntil: "networkidle2" });

    // Wait a short while in case app initialization is async
    await new Promise((r) => setTimeout(r, 1000));

    // Click Settings tab (or fallback to evaluate the opener directly)
    try {
      await page.click('.tab-btn[data-tab="settings"]');
    } catch (e) {
      console.warn(
        "Could not click settings tab, will attempt to call opener directly"
      );
    }

    // Wait for test button or call global opener
    const hasTestBtn = await page.$("#trigger-assessment-test-btn");
    if (hasTestBtn) {
      console.log("Trigger button found, invoking click in page context");
      await page.evaluate(() => {
        const btn = document.getElementById("trigger-assessment-test-btn");
        if (btn) {
          try {
            btn.click();
          } catch (e) {
            console.error("btn.click threw", e);
          }
        }
      });
    } else {
      console.log(
        "Trigger button not found, invoking global opener if available"
      );
      await page.evaluate(() => {
        if (window.openAssessmentModalForTest) {
          try {
            window.openAssessmentModalForTest();
          } catch (e) {
            console.error("opener threw", e);
          }
        } else if (window.openAssessmentModal) {
          try {
            window.openAssessmentModal();
          } catch (e) {
            console.error("openAssessmentModal threw", e);
          }
        } else {
          console.error("No opener function present on window");
        }
      });
    }

    // Wait a moment then force-call openGenericModal in page context if available
    await new Promise((r) => setTimeout(r, 500));
    await page.evaluate(() => {
      try {
        const modal = document.getElementById("assessment-modal");
        const container = document.getElementById("assessment-modal-container");
        if (window.openGenericModal && modal) {
          console.log(
            "TEST: invoking openGenericModal directly from smoke test"
          );
          try {
            window.openGenericModal(modal, container);
          } catch (e) {
            console.error("openGenericModal threw", e);
          }
        } else {
          console.log("TEST: openGenericModal not present or modal missing");
        }
      } catch (e) {
        console.error("TEST: evaluate error", e);
      }
    });
    // Wait to let logs and modal open happen
    await new Promise((r) => setTimeout(r, 2000));

    // Deep diagnostics: check opener/generic function presence, try invoking them, and return modal state
    const diag = await page.evaluate(() => {
      const out = {
        openerPresent: !!window.openAssessmentModalForTest,
        genericPresent: !!window.openGenericModal,
        logs: [],
      };
      try {
        if (window.openAssessmentModalForTest) {
          try {
            window.openAssessmentModalForTest();
            out.logs.push("openAssessmentModalForTest invoked");
          } catch (e) {
            out.logs.push(
              "openAssessmentModalForTest threw: " + (e && e.message)
            );
          }
        } else {
          out.logs.push("openAssessmentModalForTest not present");
        }
      } catch (e) {
        out.logs.push("error checking opener: " + e.message);
      }
      try {
        if (window.openGenericModal) {
          try {
            const modal = document.getElementById("assessment-modal");
            const container = document.getElementById(
              "assessment-modal-container"
            );
            window.openGenericModal(modal, container);
            out.logs.push("openGenericModal invoked");
          } catch (e) {
            out.logs.push("openGenericModal threw: " + (e && e.message));
          }
        } else {
          out.logs.push("openGenericModal not present");
        }
      } catch (e) {
        out.logs.push("error checking generic: " + e.message);
      }

      const modal = document.getElementById("assessment-modal");
      const container = document.getElementById("assessment-modal-container");
      if (!modal) {
        out.modalFound = false;
        return out;
      }
      const cs = window.getComputedStyle
        ? window.getComputedStyle(modal)
        : null;
      out.modalFound = true;
      out.modalClass = modal.className;
      out.containerClass = container ? container.className : null;
      out.computedDisplay = cs ? cs.display : null;
      out.computedOpacity = cs ? cs.opacity : null;
      return out;
    });
    console.log("DIAG:", diag);

    await new Promise((r) => setTimeout(r, 2000));

    console.log("Smoke test (no-auth) completed.");
  } catch (err) {
    console.error("Smoke test (no-auth) failed:", err);
  } finally {
    await browser.close();
  }
})();
