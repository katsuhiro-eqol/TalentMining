import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const page = await (await browser.newContext({ viewport: { width: 375, height: 667 } })).newPage();
  await page.goto("http://localhost:3000/analyze", { waitUntil: "networkidle" });

  const r = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("解析する") || b.textContent?.includes("解析中...")
    );
    const sel = btn?.nextElementSibling;
    if (!btn || !sel) return null;
    const br = btn.getBoundingClientRect();
    const sr = sel.getBoundingClientRect();
    const span = btn.querySelector("span");
    const spanRect = span?.getBoundingClientRect();
    const horizontal = spanRect ? spanRect.width >= spanRect.height : true;
    const overlap = br.right > sr.left && br.left < sr.right;
    return {
      buttonWidth: Math.round(br.width * 10) / 10,
      selectContainerWidth: Math.round(sr.width * 10) / 10,
      textHorizontal: horizontal,
      overlapping: overlap,
    };
  });

  await browser.close();
  console.log(JSON.stringify(r, null, 2));
}

main().catch(console.error);
