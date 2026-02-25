import { chromium } from "playwright";

async function measureAtViewport(page, viewportWidth) {
  await page.setViewportSize({ width: viewportWidth, height: 720 });
  await page.goto("http://localhost:3000/analyze", { waitUntil: "networkidle" });

  return page.evaluate(() => {
    const button = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("解析する") || b.textContent?.includes("解析中...")
    );
    const selectContainer = button?.nextElementSibling;
    const select = selectContainer?.querySelector("select");
    if (!select) return null;

    const cs = getComputedStyle(select);
    const rect = select.getBoundingClientRect();

    const getParents = (el, depth = 0) => {
      if (!el?.parentElement || depth > 4) return [];
      const p = el.parentElement;
      const pcs = getComputedStyle(p);
      return [
        {
          tag: p.tagName,
          className: p.className || "(none)",
          width: pcs.width,
          maxWidth: pcs.maxWidth,
          minWidth: pcs.minWidth,
        },
        ...getParents(p, depth + 1),
      ];
    };

    const parents = getParents(select);

    return {
      select: {
        className: select.className,
        computedWidth: cs.width,
        maxWidth: cs.maxWidth,
        minWidth: cs.minWidth,
        rectWidth: rect.width,
      },
      container: selectContainer
        ? {
            className: selectContainer.className,
            computedWidth: getComputedStyle(selectContainer).width,
            maxWidth: getComputedStyle(selectContainer).maxWidth,
            minWidth: getComputedStyle(selectContainer).minWidth,
          }
        : null,
      parents,
    };
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await browser.newContext();
  const page = await context.newPage();

  const at1280 = await measureAtViewport(page, 1280);
  const at375 = await measureAtViewport(page, 375);

  await browser.close();

  const width1280 = at1280?.select?.rectWidth ?? parseFloat(at1280?.select?.computedWidth);
  const width375 = at375?.select?.rectWidth ?? parseFloat(at375?.select?.computedWidth);
  const widthChanges = Math.abs(width1280 - width375) > 1;

  const report = {
    select: {
      className: at1280?.select?.className,
      at1280: {
        computedWidth: at1280?.select?.computedWidth,
        maxWidth: at1280?.select?.maxWidth,
        minWidth: at1280?.select?.minWidth,
      },
      at375: {
        computedWidth: at375?.select?.computedWidth,
        maxWidth: at375?.select?.maxWidth,
        minWidth: at375?.select?.minWidth,
      },
      widthChanges: widthChanges,
    },
    container: {
      className: at1280?.container?.className,
      at1280: at1280?.container,
      at375: at375?.container,
    },
    parents: at1280?.parents,
    conflictingParent: (() => {
      const selW1280 = parseFloat(at1280?.select?.computedWidth) || 0;
      const selW375 = parseFloat(at375?.select?.computedWidth) || 0;
      for (const p of at1280?.parents ?? []) {
        const max = p.maxWidth;
        const min = p.minWidth;
        if (max !== "none" && max !== "undefined") {
          const maxPx = parseFloat(max);
          if (!isNaN(maxPx) && maxPx < 9999 && (maxPx < selW1280 || maxPx < selW375))
            return { element: p, reason: `max-width ${max} may constrain` };
        }
        if (min !== "none" && min !== "0px") {
          const minPx = parseFloat(min);
          if (!isNaN(minPx) && minPx > 0 && minPx > selW375)
            return { element: p, reason: `min-width ${min} may constrain on mobile` };
        }
      }
      return null;
    })(),
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch(console.error);
