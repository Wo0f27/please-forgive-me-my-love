const { test, expect } = require("@playwright/test");

async function openTheActualLetter(page) {
  await page.goto("/");
  await page.locator("#start-reading").click();
  await expect(page.locator("#sealed")).toHaveClass(/is-current/);
  await page.locator("#envelope-cover").click();
  await expect(page.locator("#envelope")).toHaveClass(/is-reading/, {timeout:4500});
}

test("the full letter exists only inside the envelope", async ({page}) => {
  await page.goto("/");
  await expect(page.locator(".scene")).toHaveCount(3);
  await expect(page.locator(".scene.letter-scene,.site-header,.site-nav,.nav-arrow,.chapter-dots")).toHaveCount(0);
  await expect(page.locator("#sealed #letter-paper article.parchment")).toHaveCount(1);
  await expect(page.locator("#letter-paper .letter-text > p")).toHaveCount(11);
  await expect(page.locator("img")).toHaveCount(8);
  const sources = await page.locator("img").evaluateAll(els => els.map(el => el.getAttribute("src")));
  expect(new Set(sources).size).toBeGreaterThanOrEqual(4);
  const heights = await page.evaluate(() => ({
    body:document.body.scrollHeight,viewport:window.innerHeight
  }));
  expect(heights.body).toBeLessThanOrEqual(heights.viewport + 1);
});

test("opening the envelope enlarges that same paper into a scrollable document", async ({page}) => {
  await page.goto("/");
  await page.locator("#start-reading").click();
  const paper = page.locator("#letter-paper");
  await expect(paper).toHaveAttribute("aria-hidden","true");
  await page.locator("#envelope-cover").click();
  await expect(page.locator("#envelope")).toHaveClass(/is-open/);
  await expect(page.locator("#envelope")).toHaveClass(/is-reading/, {timeout:4500});
  await expect(paper).toHaveAttribute("aria-hidden","false");
  await expect.poll(() => paper.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThan(page.viewportSize().height * .68);
  const metrics = await paper.evaluate(el => ({
    view:el.clientHeight, total:el.scrollHeight,overflow:getComputedStyle(el).overflowY,
    contained:el.contains(document.querySelector(".letter-signoff"))
  }));
  expect(metrics.total).toBeGreaterThan(metrics.view + 500);
  expect(metrics.overflow).toBe("auto");
  expect(metrics.contained).toBe(true);
  await page.screenshot({path:test.info().outputPath("opened-letter.png"),fullPage:false});
});

test("the paper scrolls continuously until its real sign-off and ending", async ({page}) => {
  await openTheActualLetter(page);
  const paper = page.locator("#letter-paper");
  await paper.hover();
  await page.mouse.wheel(0,520);
  await expect.poll(() => paper.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  await expect(page.locator("#sealed")).toHaveClass(/is-current/);
  await paper.evaluate(el => { el.scrollTop = el.scrollHeight; el.dispatchEvent(new Event("scroll")); });
  await expect(page.locator(".letter-signoff")).toBeVisible();
  await expect(page.locator("#last-heart")).toBeVisible();
  await page.screenshot({path:test.info().outputPath("parchment-end.png"),fullPage:false});
  await page.locator("#last-heart").click();
  await expect(page.locator("#one-last-thing")).toHaveClass(/is-current/);
});

test("swiping through the paper does not prematurely leave the apology", async ({page}) => {
  await openTheActualLetter(page);
  const paper = page.locator("#letter-paper");
  const rect = await paper.boundingBox();
  const y = rect.y + Math.min(rect.height * .6, 240);
  await page.mouse.move(rect.x + rect.width * .85,y);
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width * .17,y,{steps:8});
  await page.mouse.up();
  await expect(page.locator("#sealed")).toHaveClass(/is-current/);
  await paper.evaluate(el => {el.scrollTop=el.scrollHeight;el.dispatchEvent(new Event("scroll"));});
  await page.locator("#last-heart").click();
  await expect(page.locator("#one-last-thing")).toHaveClass(/is-current/);
});

test("the envelope can fold back without destroying or duplicating the letter", async ({page}) => {
  await openTheActualLetter(page);
  await page.keyboard.press("Escape");
  await expect(page.locator("#envelope")).not.toHaveClass(/is-open/,{timeout:4500});
  await expect(page.locator("#letter-paper")).toHaveAttribute("aria-hidden","true");
  await expect(page.locator("#letter-paper article.parchment")).toHaveCount(1);
  await page.locator("#envelope-cover").click();
  await expect(page.locator("#envelope")).toHaveClass(/is-reading/,{timeout:4500});
  await expect(page.locator("#letter-paper .letter-hello")).toHaveText("Hey, love,");
});

test("mobile layout keeps the letter within the viewport and images have fallbacks", async ({page}) => {
  await openTheActualLetter(page);
  const paper = await page.locator("#letter-paper").boundingBox();
  const viewport = page.viewportSize();
  expect(paper.x).toBeGreaterThanOrEqual(-2);
  expect(paper.y).toBeGreaterThanOrEqual(-2);
  expect(paper.x+paper.width).toBeLessThanOrEqual(viewport.width + 2);
  expect(paper.y+paper.height).toBeLessThanOrEqual(viewport.height + 2);
  expect(await page.locator("img").count()).toBeGreaterThan(6);
  await page.screenshot({path:test.info().outputPath("mobile-or-desktop-paper.png"),fullPage:false});
});

test("horizontal swipe on intro still navigates without visible arrows", async ({page}) => {
  await page.goto("/");
  const viewport = page.viewportSize();
  const y=viewport.height*.88;
  await page.mouse.move(viewport.width*.82,y);
  await page.mouse.down();
  await page.mouse.move(viewport.width*.17,y,{steps:8});
  await page.mouse.up();
  await expect(page.locator("#sealed")).toHaveClass(/is-current/);
  await page.mouse.move(viewport.width*.15,y);
  await page.mouse.down();
  await page.mouse.move(viewport.width*.86,y,{steps:8});
  await page.mouse.up();
  await expect(page.locator("#beginning")).toHaveClass(/is-current/);
});
