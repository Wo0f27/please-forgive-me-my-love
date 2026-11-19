const { test, expect } = require("@playwright/test");

test("version 3 has no decorative navigation or paginated letter", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".scene")).toHaveCount(6);
  await expect(page.locator(".site-header,.site-nav,.nav-arrow,.chapter-dots")).toHaveCount(0);
  await expect(page.locator(".scene.is-current h1")).toHaveText("Hey, love.");
  await expect(page.locator("#parchment-scroll .letter-text p")).toHaveCount(11);
  await expect(page.locator("img[data-fallback]")).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1)).toBeTruthy();
});

test("envelope opens in two stages, then the paper can fold back", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#sealed")).toHaveClass(/is-current/);
  await page.locator("#envelope-cover").click();
  await expect(page.locator("#envelope")).toHaveClass(/is-open/);
  await expect(page.locator("#envelope")).toHaveClass(/is-extracted/, { timeout:3500 });
  const envelopeGeometry = await page.evaluate(() => {
    const paper = document.querySelector("#folded-letter");
    const pocket = document.querySelector(".envelope-pocket");
    return {paperZ: Number(getComputedStyle(paper).zIndex),pocketZ:Number(getComputedStyle(pocket).zIndex)};
  });
  expect(envelopeGeometry.paperZ).toBeGreaterThan(envelopeGeometry.pocketZ);
  await page.locator("#folded-letter").click();
  await expect(page.locator("#envelope")).not.toHaveClass(/is-open/, { timeout:2000 });
});

test("one uninterrupted parchment scrolls vertically without changing the scene", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("ArrowRight"); // envelope
  await page.keyboard.press("ArrowRight"); // open
  await expect(page.locator("#envelope")).toHaveClass(/is-extracted/, { timeout:3500 });
  await page.keyboard.press("ArrowRight"); // apology
  await page.keyboard.press("ArrowRight"); // understanding and changes
  await page.keyboard.press("ArrowRight"); // parchment
  await expect(page.locator("#the-letter")).toHaveClass(/is-current/);
  const letter = page.locator("#parchment-scroll");
  const dimensions = await letter.evaluate(el => ({scroll:el.scrollHeight,view:el.clientHeight}));
  expect(dimensions.scroll).toBeGreaterThan(dimensions.view + 150);
  await letter.hover();
  await page.mouse.wheel(0, 700);
  await expect.poll(() => letter.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  await expect(page.locator("#the-letter")).toHaveClass(/is-current/);
  await letter.evaluate(el => {el.scrollTop=el.scrollHeight;el.dispatchEvent(new Event("scroll"));});
  await expect(page.locator("#closing-mark")).toBeVisible();
  await page.locator("#closing-mark").click();
  await expect(page.locator("#one-last-thing")).toHaveClass(/is-current/);
  await page.screenshot({path:test.info().outputPath("ending.png"),fullPage:false});
});

test("a horizontal swipe advances scenes and a reverse swipe returns", async ({ page }) => {
  await page.goto("/");
  const width = page.viewportSize().width;
  const y = page.viewportSize().height * 0.82;
  await page.mouse.move(width * 0.81,y);
  await page.mouse.down();
  await page.mouse.move(width * 0.17,y,{steps:8});
  await page.mouse.up();
  await expect(page.locator("#sealed")).toHaveClass(/is-current/);
  await page.mouse.move(width * 0.19,y);
  await page.mouse.down();
  await page.mouse.move(width * 0.84,y,{steps:8});
  await page.mouse.up();
  await expect(page.locator("#beginning")).toHaveClass(/is-current/);
});

test("letter and intro remain within viewport and images have local fallbacks", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".opening")).toBeVisible();
  const viewport = page.viewportSize();
  const opening = await page.locator(".opening").boundingBox();
  expect(opening.y).toBeGreaterThanOrEqual(-1);
  expect(opening.y + opening.height).toBeLessThanOrEqual(viewport.height+1);
  for(const image of await page.locator("img[data-fallback]").all()) {
    await expect(image).toHaveAttribute("data-fallback", /peach-goma/);
  }
  await page.screenshot({path:test.info().outputPath("intro.png"),fullPage:false});
});
