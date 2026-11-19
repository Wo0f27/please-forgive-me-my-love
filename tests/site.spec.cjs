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
  await expect(page.locator("#letter-paper .letter-text > p")).toHaveCount(12);
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
  await expect(page.locator("#letter-paper .letter-hello")).toHaveText("My Love,");
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


test("landing page respects My Love greeting, transparent PNG and restrained copy", async ({page}) => {
  await page.goto("/");
  await expect(page.locator("#intro-title")).toHaveText("Hey, My Love.");
  await expect(page.locator("#beginning .soft-line")).toHaveText("There's something I want you to read.");
  await expect(page.locator("#beginning p")).toHaveCount(1);
  const sticker = page.locator(".art-opening");
  await expect(sticker).toHaveAttribute("src","./assets/peach-goma-transparent.png");
  await expect(sticker).toHaveJSProperty("complete",true);
  const alpha = await sticker.evaluate(img=>{
    const canvas=document.createElement("canvas");
    canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
    const ctx=canvas.getContext("2d");ctx.drawImage(img,0,0);
    return ctx.getImageData(0,0,1,1).data[3];
  });
  expect(alpha).toBeLessThanOrEqual(1);
  await expect(page.locator("#start-reading")).toHaveCSS("border-radius","8px");
  await expect(page.locator("#start-reading")).toHaveAttribute("aria-label","Open the letter");
  const gradient=await page.locator(".room").evaluate(el=>getComputedStyle(el).backgroundImage);
  expect(gradient).toContain("radial-gradient");
  await expect(page.locator("#letter-paper .letter-hello")).toHaveText("My Love,");
  await page.screenshot({path:test.info().outputPath("v5-landing.png"),fullPage:false});
});


test("short browser and phone viewports keep the entire reading window inside the screen", async ({page}) => {
  await openTheActualLetter(page);
  for (const size of [
    {width:1280,height:614},
    {width:390,height:640},
    {width:360,height:600},
    {width:844,height:390}
  ]) {
    await page.setViewportSize(size);
    const metrics=await page.locator("#letter-paper").evaluate(el => {
      const r=el.getBoundingClientRect();
      return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,scroll:el.scrollHeight,view:el.clientHeight};
    });
    expect(metrics.top, JSON.stringify(size)).toBeGreaterThanOrEqual(-1);
    expect(metrics.bottom,JSON.stringify(size)).toBeLessThanOrEqual(size.height+1);
    expect(metrics.left,JSON.stringify(size)).toBeGreaterThanOrEqual(-1);
    expect(metrics.right,JSON.stringify(size)).toBeLessThanOrEqual(size.width+1);
    expect(metrics.scroll).toBeGreaterThan(metrics.view);
  }
  await page.screenshot({path:test.info().outputPath("short-screen.png"),fullPage:false});
});

test("tucked-corner control closes the parchment and reopening resumes reading position", async ({page}) => {
  await openTheActualLetter(page);
  const paper=page.locator("#letter-paper");
  const tuck=page.locator("#tuck-away");
  await expect(tuck).toBeVisible();
  await expect(tuck).toBeEnabled();
  await paper.evaluate(el=>{el.scrollTop=Math.floor(el.scrollHeight*.48);el.dispatchEvent(new Event("scroll"));});
  const before=await paper.evaluate(el=>el.scrollTop);
  expect(before).toBeGreaterThan(100);
  await tuck.click();
  await expect(page.locator("#envelope")).not.toHaveClass(/is-open/,{timeout:4500});
  await expect(tuck).toBeDisabled();
  await page.locator("#envelope-cover").click();
  await expect(page.locator("#envelope")).toHaveClass(/is-reading/,{timeout:4500});
  await expect.poll(()=>paper.evaluate(el=>el.scrollTop),{timeout:5000}).toBeGreaterThan(before-75);
  await expect(page.locator("#sealed")).toHaveClass(/is-current/);
});

test("the envelope companion is a locally stored transparent sticker", async ({page}) => {
  await page.goto("/");
  await page.locator("#start-reading").click();
  const img=page.locator(".envelope-companion");
  await expect(img).toHaveAttribute("src","./assets/peach-goma-transparent.png");
  await expect.poll(()=>img.evaluate(el=>el.naturalWidth)).toBeGreaterThan(0);
});

test("scrollbars are visually hidden while native reading scroll remains enabled", async ({page}) => {
  await openTheActualLetter(page);
  const metrics=await page.locator("#letter-paper").evaluate(el=>({
    overflow:getComputedStyle(el).overflowY,
    scrollbar:getComputedStyle(el).scrollbarWidth,
    scroll:el.scrollHeight,
    view:el.clientHeight
  }));
  expect(metrics.overflow).toBe("auto");
  expect(metrics.scroll).toBeGreaterThan(metrics.view);
  expect(metrics.scrollbar).toBe("none");
});


test("local cutout artwork keeps opaque cat bodies and transparent surrounding corners", async ({page}) => {
  await page.goto("/");
  const sources=[
    ["tender-hug", .68, .43],
    ["ending-hug", .65, .45],
    ["comfort", .49, .44],
    ["sad-tears", .48, .53],
    ["little-kiss", .56, .49]
  ];
  for(const [name,x,y] of sources){
    const result=await page.evaluate(async ({name,x,y})=>{
      const img=new Image();
      img.src="./assets/stickers/"+name+".png";
      await img.decode();
      const canvas=document.createElement("canvas");
      canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
      const ctx=canvas.getContext("2d",{willReadFrequently:true});
      ctx.drawImage(img,0,0);
      return {
        width:canvas.width,
        height:canvas.height,
        corner:ctx.getImageData(0,0,1,1).data[3],
        body:ctx.getImageData(Math.floor(x*canvas.width),Math.floor(y*canvas.height),1,1).data[3]
      };
    },{name,x,y});
    expect(result.width,name).toBeGreaterThan(100);
    expect(result.corner,name).toBeLessThan(40);
    expect(result.body,name).toBeGreaterThan(160);
  }
  await expect(page.locator('img[src*="tenor.com"]')).toHaveCount(0);
});
