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
  await expect(page.locator("#envelope")).toHaveClass(/is-heartburst/);
  await expect(page.locator("#one-last-thing")).toHaveClass(/is-current/,{timeout:7500});
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
  await expect(page.locator("#envelope")).toHaveClass(/is-heartburst/);
  await expect(page.locator("#one-last-thing")).toHaveClass(/is-current/,{timeout:7500});
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
  await page.waitForTimeout(670);
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


test("landing page respects My Love greeting, transparent animated sticker and restrained copy", async ({page}) => {
  await page.goto("/");
  await expect(page.locator("#intro-title")).toHaveText("Hey, My Love.");
  await expect(page.locator("#beginning .soft-line")).toHaveText("There's something I want you to read.");
  await expect(page.locator("#beginning p")).toHaveCount(1);
  const sticker = page.locator(".art-opening");
  await expect(sticker).toHaveAttribute("src","./assets/stickers/tender-hug.webp");
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
    await page.waitForTimeout(760); // viewport resize transition must finish
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

test("Escape refolds and reinserts the paper; reopening restores scroll progress", async ({page}) => {
  await openTheActualLetter(page);
  const paper=page.locator("#letter-paper");
  await paper.evaluate(el=>{el.scrollTop=Math.floor(el.scrollHeight*.48);el.dispatchEvent(new Event("scroll"));});
  const before=await paper.evaluate(el=>el.scrollTop);
  expect(before).toBeGreaterThan(100);
  await page.keyboard.press("Escape");
  await expect(page.locator("#envelope")).toHaveClass(/is-refolding/);
  await expect(page.locator("#envelope")).toHaveClass(/is-inserting/,{timeout:4500});
  await expect(page.locator("#envelope")).not.toHaveClass(/is-open/,{timeout:4500});
  await expect(page.locator("#letter-paper")).toHaveAttribute("aria-hidden","true");
  await page.locator("#envelope-cover").click();
  await expect(page.locator("#envelope")).toHaveClass(/is-unfolding/,{timeout:3500});
  await expect(page.locator("#envelope")).toHaveClass(/is-reading/,{timeout:3500});
  await expect.poll(()=>paper.evaluate(el=>el.scrollTop),{timeout:3500}).toBeGreaterThan(before-75);
  await expect(page.locator("#sealed")).toHaveClass(/is-current/);
});

test("the envelope companion is a locally stored transparent sticker", async ({page}) => {
  await page.goto("/");
  await page.locator("#start-reading").click();
  const img=page.locator(".envelope-companion");
  await expect(img).toHaveAttribute("src","./assets/stickers/little-kiss.webp");
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



test("the letter physically extracts before unfolding and refolds before insertion", async ({page}) => {
  await page.goto("/");
  await page.locator("#start-reading").click();
  const env=page.locator("#envelope");
  await page.locator("#envelope-cover").click();
  await expect(env).toHaveClass(/is-extracting/);
  await expect(env).toHaveClass(/is-unfolding/,{timeout:3400});
  await expect.poll(() => page.locator("#letter-paper").evaluate(el=>el.getBoundingClientRect().height))
    .toBeGreaterThan(170);
  await expect(env).toHaveClass(/is-reading/,{timeout:3400});
  await expect(page.locator("#letter-paper")).toHaveAttribute("aria-hidden","false");
  await page.locator("#letter-paper").evaluate(el=>{el.scrollTop=el.scrollHeight;el.dispatchEvent(new Event("scroll"));});
  await page.locator("#last-heart").click();
  await expect(env).toHaveClass(/is-heartburst/);
  await expect(page.locator("#heart-burst .heart-particle")).toHaveCount(64);
  await expect(env).toHaveClass(/is-refolding/,{timeout:3300});
  await expect(env).toHaveClass(/is-inserting/,{timeout:3300});
  await expect(env).toHaveClass(/is-sealing/,{timeout:3300});
  await expect(page.locator("#one-last-thing")).toHaveClass(/is-current/,{timeout:7000});
  await expect(env).not.toHaveClass(/is-open/);
});

test("the only visible way forward from the completed letter is its final heart", async ({page}) => {
  await openTheActualLetter(page);
  await expect(page.locator("#tuck-away")).toHaveCount(0);
  const paper=page.locator("#letter-paper");
  await paper.evaluate(el=>{el.scrollTop=el.scrollHeight*.45;});
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#sealed")).toHaveClass(/is-current/);
  await paper.evaluate(el=>{el.scrollTop=el.scrollHeight;el.dispatchEvent(new Event("scroll"));});
  await expect(page.locator("#last-heart")).toHaveAttribute("aria-label","Send a burst of hearts, fold the letter, and read the last message");
  await page.locator("#last-heart").click();
  await expect(page.locator("#heart-burst .heart-particle")).toHaveCount(64);
  await expect(page.locator("#one-last-thing")).toHaveClass(/is-current/,{timeout:7500});
});

test("Ash's three original flowers bloom within the parchment", async ({page}) => {
  await openTheActualLetter(page);
  const garden=page.locator("#letter-paper .paper-garden");
  await expect(garden).toHaveCount(1);
  await expect(garden.locator(".garden-flower")).toHaveCount(3);
  await expect(garden.locator(".garden-petal")).toHaveCount(18);
  await garden.scrollIntoViewIfNeeded();
  await expect(garden).toHaveClass(/is-blooming/,{timeout:3000});
  await expect(page.locator("#sealed")).toHaveClass(/is-current/);
});

test("the overall palette is pastel and transitions remain unobtrusive", async ({page}) => {
  await page.goto("/");
  const visual=await page.evaluate(()=>({
    colorScheme:getComputedStyle(document.documentElement).colorScheme,
    background:getComputedStyle(document.body).backgroundColor,
    backgroundArt:getComputedStyle(document.querySelector(".room")).backgroundImage
  }));
  expect(visual.colorScheme).toContain("light");
  expect(visual.background).toBe("rgb(255, 241, 233)");
  expect(visual.backgroundArt).toContain("radial-gradient");
  await page.locator("#start-reading").click();
  await expect(page.locator("#scene-petals")).toHaveClass(/is-playing/);
});

test("reduced motion reveals all flowers without unfolding animation", async ({page}) => {
  await page.emulateMedia({reducedMotion:"reduce"});
  await openTheActualLetter(page);
  const petals=page.locator("#scene-petals");
  await expect(petals).not.toHaveClass(/is-playing/);
  const garden=page.locator(".paper-garden");
  const data=await garden.evaluate(el=>{
    const stem=el.querySelector(".garden-stem");
    const leaf=el.querySelector(".garden-leaf");
    return {offset:getComputedStyle(stem).strokeDashoffset,leafOpacity:getComputedStyle(leaf).opacity};
  });
  expect(parseFloat(data.offset)).toBe(0);
  expect(parseFloat(data.leafOpacity)).toBe(1);
});


test("jumping directly to the end reveals the flowers rather than an empty area", async ({page}) => {
  await openTheActualLetter(page);
  const paper=page.locator("#letter-paper");
  await paper.evaluate(el=>{el.scrollTop=el.scrollHeight;el.dispatchEvent(new Event("scroll"));});
  const garden=page.locator(".paper-garden");
  await expect(garden).toHaveClass(/is-grown/);
  const shapes=await garden.evaluate(el=>({
    stem:getComputedStyle(el.querySelector(".garden-stem")).strokeDashoffset,
    petals:getComputedStyle(el.querySelector(".garden-petals")).opacity
  }));
  expect(parseFloat(shapes.stem)).toBe(0);
  expect(parseFloat(shapes.petals)).toBe(1);
  await page.screenshot({path:test.info().outputPath("flowers-at-letter-end.png"),fullPage:false});
});


test("three Ash flowers form a wrapped bouquet, with instantly visible stems and leaves", async ({page}) => {
  await openTheActualLetter(page);
  const garden=page.locator("#letter-paper .paper-garden");
  await expect(garden.locator(".garden-flower")).toHaveCount(3);
  await expect(garden.locator(".bouquet-wrap")).toHaveCount(1);
  await expect(garden.locator(".bouquet-ribbon")).toHaveCount(1);
  await expect(garden.locator(".garden-flower-1")).toHaveAttribute("transform",/rotate\(-19/);
  await expect(garden.locator(".garden-flower-3")).toHaveAttribute("transform",/rotate\(18/);
  const prep=await garden.evaluate(el=>({
    stem:getComputedStyle(el.querySelector(".garden-stem")).strokeDashoffset,
    leaves:getComputedStyle(el.querySelector(".garden-leaf")).opacity,
    petals:getComputedStyle(el.querySelector(".garden-petals")).opacity
  }));
  expect(parseFloat(prep.stem)).toBe(0);
  expect(parseFloat(prep.leaves)).toBe(1);
  expect(parseFloat(prep.petals)).toBeGreaterThan(.2);
  await garden.scrollIntoViewIfNeeded();
  await expect(garden).toHaveClass(/is-blooming/);
  await page.screenshot({path:test.info().outputPath("bouquet.png"),fullPage:false});
});

test("ambient petals fall constantly behind scenes, and stop for reduced-motion users", async ({page}) => {
  await page.goto("/");
  const flakes=page.locator(".ambient-petals i");
  await expect(flakes).toHaveCount(18);
  const data=await flakes.first().evaluate(el=>({
    name:getComputedStyle(el).animationName,
    iteration:getComputedStyle(el).animationIterationCount,
    background:getComputedStyle(el).backgroundColor
  }));
  expect(data.name).toContain("ambientPetalFall");
  expect(data.iteration).toBe("infinite");
  expect(data.background).not.toBe("rgba(0, 0, 0, 0)");
  await page.emulateMedia({reducedMotion:"reduce"});
  const stilled=await flakes.first().evaluate(el=>getComputedStyle(el).animationName);
  expect(stilled).toBe("none");
});

test("the folded paper hides writing from extraction through insertion", async ({page}) => {
  await page.goto("/");
  await page.locator("#start-reading").click();
  const envelope=page.locator("#envelope");
  const text=page.locator("#parchment");
  await page.locator("#envelope-cover").click();
  await expect(envelope).toHaveClass(/is-extracting/);
  await expect(text).toHaveCSS("visibility","hidden");
  await expect(envelope).toHaveClass(/is-unfolding/,{timeout:3600});
  await expect(text).toHaveCSS("visibility","hidden");
  await expect(envelope).toHaveClass(/is-reading/,{timeout:3600});
  await expect(text).toHaveCSS("visibility","visible");
  await page.locator("#letter-paper").evaluate(el=>{el.scrollTop=el.scrollHeight;el.dispatchEvent(new Event("scroll"));});
  await page.locator("#last-heart").click();
  await expect(envelope).toHaveClass(/is-heartburst/);
  await expect(text).toHaveCSS("visibility","visible");
  await expect(envelope).toHaveClass(/is-refolding/,{timeout:3300});
  await expect(text).toHaveCSS("visibility","hidden");
  await expect(envelope).toHaveClass(/is-inserting/,{timeout:3300});
  await expect(text).toHaveCSS("visibility","hidden");
});

test("the compact sheet stays within the pink envelope during insertion", async ({page}) => {
  await openTheActualLetter(page);
  const paper=page.locator("#letter-paper");
  await paper.evaluate(el=>{el.scrollTop=el.scrollHeight;el.dispatchEvent(new Event("scroll"));});
  await page.locator("#last-heart").click();
  const envelope=page.locator("#envelope");
  await expect(envelope).toHaveClass(/is-inserting/,{timeout:5000});
  await page.waitForTimeout(500);
  const m=await page.evaluate(()=>{
    const rect=s=>document.querySelector(s).getBoundingClientRect();
    const sheet=rect("#letter-paper");
    const pocket=rect(".envelope-pocket");
    return {sheetBottom:sheet.bottom,pocketBottom:pocket.bottom,paperHeight:sheet.height,
      paperZ:getComputedStyle(document.querySelector("#letter-paper")).zIndex,
      pocketZ:getComputedStyle(document.querySelector(".envelope-pocket")).zIndex};
  });
  expect(m.sheetBottom).toBeLessThanOrEqual(m.pocketBottom+2);
  expect(m.paperHeight).toBeLessThan(140);
  expect(Number(m.paperZ)).toBeLessThan(Number(m.pocketZ));
  await page.screenshot({path:test.info().outputPath("letter-reinserting.png"),fullPage:false});
});

test("the heart finale emits a large burst before any folding or scene transition", async ({page}) => {
  await openTheActualLetter(page);
  const paper=page.locator("#letter-paper");
  await paper.evaluate(el=>{el.scrollTop=el.scrollHeight;el.dispatchEvent(new Event("scroll"));});
  await page.locator("#last-heart").click();
  await expect(page.locator("#heart-burst .heart-particle")).toHaveCount(64);
  await expect(page.locator("#envelope")).toHaveClass(/is-heartburst/);
  await expect(page.locator("#sealed")).toHaveClass(/is-current/);
  const burst=await page.locator("#heart-burst .heart-particle").first().evaluate(el=>({
    emoji:el.textContent,
    style:getComputedStyle(el).animationName
  }));
  expect(burst.emoji.length).toBeGreaterThan(0);
  expect(burst.style).toContain("heartFlutter");
  await page.screenshot({path:test.info().outputPath("heart-burst.png"),fullPage:false});
  await expect(page.locator("#envelope")).toHaveClass(/is-refolding/,{timeout:3300});
  await expect(page.locator("#one-last-thing")).not.toHaveClass(/is-current/);
  await expect(page.locator("#one-last-thing")).toHaveClass(/is-current/,{timeout:7500});
  await expect(page.locator("#heart-burst .heart-particle")).toHaveCount(0);
  await expect(page.locator(".ending-flowers span")).toHaveCount(3);
});


test("the unrolling letter is compact rather than a giant empty card", async ({page}) => {
  await page.goto("/");
  await page.locator("#start-reading").click();
  await page.locator("#envelope-cover").click();
  const envelope=page.locator("#envelope");
  await expect(envelope).toHaveClass(/is-unfolding/,{timeout:2500});
  await page.waitForTimeout(430);
  const geometry=await page.evaluate(()=>{
    const p=document.querySelector("#letter-paper").getBoundingClientRect();
    const pocket=document.querySelector(".envelope-pocket").getBoundingClientRect();
    return {height:p.height,width:p.width,bottom:p.bottom,pocketTop:pocket.top};
  });
  expect(geometry.height).toBeLessThanOrEqual(260);
  expect(geometry.width).toBeLessThanOrEqual(314);
  expect(geometry.bottom).toBeGreaterThanOrEqual(geometry.pocketTop-10);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.pocketTop+20);
  await page.screenshot({path:test.info().outputPath("compact-unfolding.png"),fullPage:false});
});

test("refolding meets the envelope mouth rather than hovering above it", async ({page}) => {
  await openTheActualLetter(page);
  await page.locator("#letter-paper").evaluate(el=>{
    el.scrollTop=el.scrollHeight;el.dispatchEvent(new Event("scroll"));
  });
  await page.locator("#last-heart").click();
  const envelope=page.locator("#envelope");
  await expect(envelope).toHaveClass(/is-refolding/,{timeout:2900});
  await page.waitForTimeout(500);
  const geometry=await page.evaluate(()=>{
    const p=document.querySelector("#letter-paper").getBoundingClientRect();
    const pocket=document.querySelector(".envelope-pocket").getBoundingClientRect();
    return {paperBottom:p.bottom,pocketTop:pocket.top,pocketBottom:pocket.bottom,
      paperHeight:p.height};
  });
  expect(geometry.paperBottom).toBeGreaterThanOrEqual(geometry.pocketTop-18);
  expect(geometry.paperBottom).toBeLessThanOrEqual(geometry.pocketBottom+1);
  expect(geometry.paperHeight).toBeLessThanOrEqual(165);
  await page.screenshot({path:test.info().outputPath("refolding-at-pocket.png"),fullPage:false});
});

test("the final heart flurry remains playful but finishes before paper folding", async ({page}) => {
  await openTheActualLetter(page);
  await page.locator("#letter-paper").evaluate(el=>{
    el.scrollTop=el.scrollHeight;el.dispatchEvent(new Event("scroll"));
  });
  await page.locator("#last-heart").click();
  const particles=page.locator("#heart-burst .heart-particle");
  await expect(particles).toHaveCount(64);
  await expect(page.locator("#envelope")).toHaveClass(/is-heartburst/);
  const distances=await particles.evaluateAll(els=>els.map(el=>el.style.getPropertyValue("--heart-dx")));
  expect(new Set(distances).size).toBeGreaterThan(40);
  await expect(page.locator("#envelope")).toHaveClass(/is-refolding/,{timeout:3100});
  await expect(page.locator("#one-last-thing")).toHaveClass(/is-current/,{timeout:7000});
  await expect(particles).toHaveCount(0);
});


test("envelope heading and companion stay concealed until sealing finishes", async ({page}) => {
  await openTheActualLetter(page);
  await page.locator("#letter-paper").evaluate(el=>{
    el.scrollTop=el.scrollHeight;el.dispatchEvent(new Event("scroll"));
  });
  await page.locator("#last-heart").click();
  const heading=page.locator(".envelope-heading");
  await expect(page.locator("#envelope")).toHaveClass(/is-inserting/,{timeout:4900});
  await expect(heading).toHaveCSS("opacity","0");
  await expect(page.locator("#envelope")).toHaveClass(/is-sealing/,{timeout:1700});
  await expect(heading).toHaveCSS("opacity","0");
  await expect(page.locator("#one-last-thing")).toHaveClass(/is-current/,{timeout:3200});
});


test("the envelope greeting never bleeds into the closing scene", async ({page}) => {
  await openTheActualLetter(page);
  await page.locator("#letter-paper").evaluate(el=>{
    el.scrollTop=el.scrollHeight;el.dispatchEvent(new Event("scroll"));
  });
  await page.locator("#last-heart").click();
  await expect(page.locator("#one-last-thing")).toHaveClass(/is-current/,{timeout:7300});
  await expect(page.locator(".envelope-stage")).toHaveClass(/is-finishing/);
  await expect(page.locator(".envelope-heading")).toHaveCSS("opacity","0");
  await expect(page.locator(".envelope-companion")).toHaveCSS("opacity","0");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#sealed")).toHaveClass(/is-current/);
  await expect(page.locator(".envelope-stage")).not.toHaveClass(/is-finishing/);
});


test("reading state begins only after mobile parchment finishes expanding", async ({page}) => {
  await page.setViewportSize({width:390,height:640});
  await page.goto("/");
  await page.locator("#start-reading").click();
  await page.locator("#envelope-cover").click();
  const env=page.locator("#envelope");
  const paper=page.locator("#letter-paper");
  await expect(env).toHaveClass(/is-unfolding/);
  await expect(env).toHaveClass(/is-expanding/,{timeout:3100});
  await expect(paper).toHaveAttribute("aria-hidden","true");
  await expect(env).toHaveClass(/is-reading/,{timeout:2500});
  const m=await paper.evaluate(el=>{
    const r=el.getBoundingClientRect();
    return {height:r.height,viewport:window.innerHeight,scroll:el.scrollHeight,
      view:el.clientHeight,overflow:getComputedStyle(el).overflowY};
  });
  expect(m.height).toBeGreaterThan(m.viewport*.68);
  expect(m.scroll).toBeGreaterThan(m.view+300);
  expect(m.overflow).toBe("auto");
  await paper.evaluate(el=>{el.scrollTop=Math.round(el.scrollHeight*.4)});
  expect(await paper.evaluate(el=>el.scrollTop)).toBeGreaterThan(100);
});



test("closing page asks the single fireworks invitation without a replay control", async ({page}) => {
  await page.goto("/");
  await expect(page.locator("#again")).toHaveCount(0);
  await expect(page.getByRole("button",{name:/read it again/i})).toHaveCount(0);
  await expect(page.locator("#ending-title")).toHaveText("Will you go watch the fireworks with me tomorrow? ♡");
  await expect(page.locator("#one-last-thing .invite-event")).toContainText("Saturday, November 21");
  await expect(page.locator("#one-last-thing .invite-event")).toContainText("SM City Pampanga");
  await expect(page.locator("#one-last-thing .invite-event")).toContainText("Event starts at 6:00 PM");
  await expect(page.locator("#invite-yes")).toHaveText("Yes ♡");
  await expect(page.locator("#invite-no")).toHaveText("Not this time");
  await expect(page.locator(".invite-privacy")).toContainText("won't send me a message");
});

test("all eight visible stickers use full-resolution local animated WebP with static reduced-motion alternates", async ({page}) => {
  await page.goto("/");
  await expect(page.locator("picture.animated-sticker")).toHaveCount(8);
  await expect(page.locator('img[src$=".webp"]')).toHaveCount(8);
  await expect(page.locator('picture source[media="(prefers-reduced-motion: reduce)"]')).toHaveCount(8);
  await expect(page.locator('img[src*="tenor.com"]')).toHaveCount(0);
  const manifest=await page.evaluate(async ()=>{
    const r=await fetch("./assets/stickers/animations.json");
    if(!r.ok) throw new Error("Animation metadata missing: "+r.status);
    return r.json();
  });
  expect(manifest.failed).toEqual([]);
  expect(manifest.animations).toHaveLength(6);
  for(const item of manifest.animations){
    expect(item.frames,item.name).toBeGreaterThan(1);
    expect(item.width,item.name).toBeGreaterThanOrEqual(450);
    expect(item.height,item.name).toBeGreaterThanOrEqual(400);
    expect(item.duration_ms,item.name).toBeGreaterThan(300);
    expect(item.bytes,item.name).toBeLessThan(9_000_000);
  }
  const loaded=await page.evaluate(async()=>{
    const paths=[...new Set([...document.querySelectorAll('img[src$=".webp"]')]
      .map(el=>el.getAttribute("src")))];
    const results=[];
    for(const path of paths){
      const img=new Image();
      img.src=path;
      await img.decode();
      const canvas=document.createElement("canvas");
      canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
      const ctx=canvas.getContext("2d");
      ctx.drawImage(img,0,0);
      results.push({path,width:img.naturalWidth,
        alpha:ctx.getImageData(0,0,1,1).data[3]});
    }
    return results;
  });
  expect(loaded).toHaveLength(6);
  for(const image of loaded){
    expect(image.width,image.path).toBeGreaterThanOrEqual(450);
    expect(image.alpha,image.path).toBeLessThan(32);
  }
});

test("restored GIF-based artwork visibly animates in rendered screenshots", async ({page}) => {
  await openTheActualLetter(page);
  // Drawing an animated image to canvas returns the first frame in some
  // Chromium versions. The real browser rendering is the correct test.
  await page.addStyleTag({content:
    ".ambient-petals,.scene-petals{visibility:hidden!important}"+
    ".letter-illustration img{filter:none!important}"});
  for(const name of ["sad-tears","little-kiss"]){
    const img=page.locator('#letter-paper img[src$="/'+name+'.webp"]');
    await img.scrollIntoViewIfNeeded();
    await expect.poll(()=>img.evaluate(el=>el.naturalWidth)).toBeGreaterThan(450);
    const screenshots=[];
    for(let i=0;i<4;i++){
      screenshots.push((await img.screenshot()).toString("base64"));
      await page.waitForTimeout(390);
    }
    const unique=new Set(screenshots);
    expect(unique.size,name+" should visibly change poses").toBeGreaterThan(1);
  }
});

test("reduced-motion users receive the original transparent still alternatives", async ({page}) => {
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
  await expect(page.locator("picture.animated-sticker")).toHaveCount(8);
  const sources=await page.locator('picture.animated-sticker source').evaluateAll(
    els=>els.map(el=>({media:el.media,source:el.srcset})));
  expect(sources).toHaveLength(8);
  for(const source of sources){
    expect(source.media).toBe("(prefers-reduced-motion: reduce)");
    expect(source.source).toMatch(/\.png$/);
  }
  const intro=await page.locator(".art-opening").evaluate(el=>el.currentSrc);
  expect(intro).toMatch(/\.png$/);
  await expect(page.locator("#again")).toHaveCount(0);
});



async function reachFireworksInvitation(page) {
  await openTheActualLetter(page);
  await page.locator("#letter-paper").evaluate(el=>{
    el.scrollTop=el.scrollHeight;el.dispatchEvent(new Event("scroll"));
  });
  await page.locator("#last-heart").click();
  await expect(page.locator("#one-last-thing")).toHaveClass(/is-current/,{timeout:9000});
}

test("the fireworks invitation is a real choice on desktop and mobile", async ({page}) => {
  await reachFireworksInvitation(page);
  const yes=page.locator("#invite-yes");
  const no=page.locator("#invite-no");
  await expect(yes).toBeVisible();
  await expect(no).toBeVisible();
  await expect(yes).toHaveAttribute("aria-pressed","false");
  await expect(no).toHaveAttribute("aria-pressed","false");
  await page.screenshot({path:test.info().outputPath("fireworks-invitation.png"),fullPage:false});
  const position=()=>no.evaluate(el=>{
    const btn=el.getBoundingClientRect();
    const parent=el.closest(".invite-window").getBoundingClientRect();
    return {x:btn.left-parent.left,y:btn.top-parent.top};
  });
  const noBefore=await position();
  await no.hover();
  const noAfter=await position();
  expect(Math.abs(noAfter.x-noBefore.x)).toBeLessThan(1);
  expect(Math.abs(noAfter.y-noBefore.y)).toBeLessThan(1);
  await no.click();
  await expect(no).toHaveAttribute("aria-pressed","true");
  await expect(yes).toHaveAttribute("aria-pressed","false");
  await expect(page.locator("#invite-answer")).toHaveText("That's okay. Thank you for reading. ♡");
  await expect(page.locator("#invite-sparkles")).toBeEmpty();
  await yes.click();
  await expect(yes).toHaveAttribute("aria-pressed","true");
  await expect(no).toHaveAttribute("aria-pressed","false");
  await expect(page.locator("#invite-answer")).toContainText("I'd love that.");
  await expect(page.locator("#invite-sparkles .invite-sparkle")).toHaveCount(28);
  await page.screenshot({path:test.info().outputPath("fireworks-yes.png"),fullPage:false});
});

test("phone portrait, tiny screens and landscape keep both invitation choices reachable", async ({page}) => {
  await reachFireworksInvitation(page);
  for(const size of [
    {width:390,height:844},
    {width:360,height:600},
    {width:320,height:568},
    {width:844,height:390}
  ]){
    await page.setViewportSize(size);
    await page.waitForTimeout(780); // avoid sampling scene scale-in
    const metrics=await page.evaluate(()=>{
      const rect=selector=>{
        const r=document.querySelector(selector).getBoundingClientRect();
        return {x:r.x,y:r.y,left:r.left,right:r.right,top:r.top,bottom:r.bottom,
          width:r.width,height:r.height};
      };
      return {yes:rect("#invite-yes"),no:rect("#invite-no"),
        question:rect("#ending-title"),card:rect(".invite-window"),
        viewport:window.innerWidth};
    });
    for(const button of [metrics.yes,metrics.no]){
      expect(button.height,JSON.stringify(size)).toBeGreaterThanOrEqual(44);
      expect(button.width,JSON.stringify(size)).toBeGreaterThanOrEqual(100);
      expect(button.left,JSON.stringify(size)).toBeGreaterThanOrEqual(-1);
      expect(button.right,JSON.stringify(size)).toBeLessThanOrEqual(size.width+1);
    }
    expect(metrics.card.left,JSON.stringify(size)).toBeGreaterThanOrEqual(-1);
    expect(metrics.card.right,JSON.stringify(size)).toBeLessThanOrEqual(size.width+1);
    await expect(page.locator("#invite-yes")).toBeVisible();
    await expect(page.locator("#invite-no")).toBeVisible();
  }
  await page.locator("#invite-no").click();
  await expect(page.locator("#invite-answer")).toContainText("That's okay");
});

test("answer selection never sends an RSVP or request to another service", async ({page}) => {
  const actions=[];
  page.on("request",req=>{
    if(!["GET","HEAD"].includes(req.method()))actions.push(req.method()+" "+req.url());
  });
  await reachFireworksInvitation(page);
  await page.locator("#invite-yes").click();
  await page.locator("#invite-no").click();
  expect(actions).toEqual([]);
  await expect(page.locator(".invite-privacy")).toContainText("stays on this page");
});

test("invitation buttons work with keyboard and reduced motion skips confetti", async ({page}) => {
  await page.emulateMedia({reducedMotion:"reduce"});
  await reachFireworksInvitation(page);
  await page.locator("#invite-yes").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#invite-yes")).toHaveAttribute("aria-pressed","true");
  await expect(page.locator("#invite-answer")).toContainText("I'd love that");
  await expect(page.locator("#invite-sparkles")).toBeEmpty();
  await page.locator("#invite-no").focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#invite-no")).toHaveAttribute("aria-pressed","true");
  await expect(page.locator("#invite-answer")).toContainText("That's okay");
});
