import { chromium } from "playwright";

function getRulesForElement(doc, element, sheet) {
  const rules = [];
  try {
    const cssRules = sheet.cssRules || sheet.rules;
    if (!cssRules) return rules;
    for (let i = 0; i < cssRules.length; i++) {
      const rule = cssRules[i];
      if (rule.constructor.name === "CSSMediaRule") {
        if (rule.media?.mediaText && !window.matchMedia(rule.media.mediaText).matches)
          continue;
        const inner = getRulesForElement(doc, element, rule);
        rules.push(...inner);
        continue;
      }
      if (rule.constructor.name === "CSSContainerRule") {
        const container = rule.parentStyleSheet?.ownerNode?.closest?.(
          rule.conditionText?.split(" ")[0] || ""
        );
        try {
          if (window.matchMedia(`container: ${rule.conditionText}`).matches) {
            const inner = getRulesForElement(doc, element, rule);
            rules.push(...inner.map((r) => ({ ...r, fromContainer: rule.conditionText })));
          }
        } catch (_) {}
        continue;
      }
      if (rule.constructor.name === "CSSStyleRule" && rule.selectorText) {
        try {
          if (element.matches(rule.selectorText)) {
            const width = rule.style.getPropertyValue("width")?.trim();
            const minWidth = rule.style.getPropertyValue("min-width")?.trim();
            const maxWidth = rule.style.getPropertyValue("max-width")?.trim();
            const boxSizing = rule.style.getPropertyValue("box-sizing")?.trim();
            if (width || minWidth || maxWidth || boxSizing) {
              rules.push({
                selector: rule.selectorText,
                width: width || null,
                minWidth: minWidth || null,
                maxWidth: maxWidth || null,
                boxSizing: boxSizing || null,
                sheetIndex: 0,
                ruleIndex: i,
              });
            }
          }
        } catch (_) {}
      }
    }
  } catch (e) {}
  return rules;
}

async function inspectCascade(page, path) {
  await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
  await page.waitForSelector("main > div.w-96", { state: "visible" });

  return page.evaluate(() => {
    const el = document.querySelector("main > div.w-96.mx-auto.px-4");
    if (!el) return { error: "Element not found" };

    const allRules = [];
    const sheets = Array.from(document.styleSheets);

    for (let s = 0; s < sheets.length; s++) {
      const sheet = sheets[s];
      try {
        const cssRules = sheet.cssRules || sheet.rules;
        if (!cssRules) continue;
        for (let i = 0; i < cssRules.length; i++) {
          const rule = cssRules[i];
          const processRule = (r, fromMedia = null, fromContainer = null) => {
            if (r.constructor.name === "CSSMediaRule") {
              try {
                if (!window.matchMedia(r.media.mediaText).matches) return;
              } catch (_) {
                return;
              }
              for (let j = 0; j < (r.cssRules?.length || 0); j++)
                processRule(r.cssRules[j], r.media.mediaText, fromContainer);
              return;
            }
            if (r.constructor.name === "CSSContainerRule") {
              for (let j = 0; j < (r.cssRules?.length || 0); j++)
                processRule(r.cssRules[j], fromMedia, r.conditionText);
              return;
            }
            if (r.constructor.name === "CSSStyleRule" && r.selectorText) {
              try {
                if (el.matches(r.selectorText)) {
                  const width = r.style.getPropertyValue("width")?.trim() || null;
                  const minWidth =
                    r.style.getPropertyValue("min-width")?.trim() || null;
                  const maxWidth =
                    r.style.getPropertyValue("max-width")?.trim() || null;
                  if (width || minWidth || maxWidth) {
                    allRules.push({
                      selector: r.selectorText,
                      width,
                      minWidth,
                      maxWidth,
                      sheetIndex: s,
                      ruleIndex: i,
                      media: fromMedia,
                      container: fromContainer,
                      fullCss: r.cssText?.substring(0, 200),
                    });
                  }
                }
              } catch (_) {}
            }
          };
          processRule(rule);
        }
      } catch (e) {
        allRules.push({ sheetError: sheet.href || "inline", error: e.message });
      }
    }

    const inline = el.getAttribute("style");
    if (inline) {
      const m = inline.match(/width\s*:\s*([^;]+)/i);
      if (m)
        allRules.push({
          selector: "(inline style)",
          width: m[1].trim(),
          minWidth: null,
          maxWidth: null,
        });
    }

    const computed = getComputedStyle(el);
    return {
      rules: allRules,
      computedWidth: computed.width,
      computedMinWidth: computed.minWidth,
      computedMaxWidth: computed.maxWidth,
    };
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const page = await (
    await browser.newContext({ viewport: { width: 1280, height: 720 } })
  ).newPage();

  const signIn = await inspectCascade(page, "/signIn");
  const signUp = await inspectCascade(page, "/signUp");

  await browser.close();

  console.log(JSON.stringify({ signIn, signUp }, null, 2));
}

main().catch(console.error);
