/* Version 3: deliberate swipe scenes, native parchment scrolling.
   No dependencies, timers for animation only, no tracking. */
(() => {
  "use strict";
  const scenes = [...document.querySelectorAll(".scene")];
  const stage = document.getElementById("experience");
  const previous = document.getElementById("previous-scene");
  const following = document.getElementById("next-scene");
  const status = document.getElementById("status");
  const envelope = document.getElementById("envelope");
  const envelopeCover = document.getElementById("envelope-cover");
  const foldedLetter = document.getElementById("folded-letter");
  const parchment = document.getElementById("parchment-scroll");
  const closingMark = document.getElementById("closing-mark");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let current = 0;
  let envelopePhase = "closed";
  let timer;
  let pointerStart = null;

  function announce(message) {
    status.textContent = "";
    requestAnimationFrame(() => { status.textContent = message; });
  }

  function go(index) {
    if (index < 0 || index >= scenes.length || index === current) return;
    const old = scenes[current];
    old.classList.remove("is-current");
    old.classList.add(index > current ? "was-before" : "was-after");
    old.setAttribute("aria-hidden", "true");
    old.inert = true;

    scenes.forEach((scene, i) => {
      if (i !== index) scene.classList.remove("is-current");
    });
    const next = scenes[index];
    next.classList.remove("was-before", "was-after");
    next.classList.add("is-current");
    next.removeAttribute("aria-hidden");
    next.inert = false;
    current = index;
    previous.disabled = current === 0;
    following.disabled = current === scenes.length - 1;
    announce(next.querySelector("h1,h2")?.textContent?.trim() || "Next part of the letter");
    if (current === 4) updateParchment();
    if (old.contains(document.activeElement)) document.activeElement.blur();
    window.setTimeout(() => old.classList.remove("was-before", "was-after"), prefersReducedMotion.matches ? 0 : 500);
  }

  function updateEnvelope() {
    const opened = envelopePhase !== "closed";
    const extracted = envelopePhase === "extracted";
    envelope.classList.toggle("is-open", opened);
    envelope.classList.toggle("is-extracted", extracted);
    envelope.classList.toggle("is-folding", envelopePhase === "folding");
    envelopeCover.disabled = opened;
    envelopeCover.setAttribute("aria-expanded", String(opened));
    foldedLetter.disabled = !extracted;
    foldedLetter.tabIndex = extracted ? 0 : -1;
    foldedLetter.setAttribute("aria-hidden", String(!extracted));
  }

  function openEnvelope() {
    if (envelopePhase !== "closed") return;
    clearTimeout(timer);
    envelopePhase = "opening";
    updateEnvelope();
    timer = setTimeout(() => {
      if (envelopePhase !== "opening") return;
      envelopePhase = "extracted";
      updateEnvelope();
      announce("The letter is open");
    }, prefersReducedMotion.matches ? 0 : 1030);
  }

  function closeEnvelope() {
    if (envelopePhase !== "extracted") return;
    clearTimeout(timer);
    envelopePhase = "folding";
    updateEnvelope();
    timer = setTimeout(() => {
      if (envelopePhase !== "folding") return;
      envelopePhase = "closed";
      updateEnvelope();
      announce("The letter is tucked back in");
    }, prefersReducedMotion.matches ? 0 : 500);
  }

  function next() {
    if (current === 1 && envelopePhase === "closed") return openEnvelope();
    if (current === 1 && envelopePhase !== "extracted") return;
    go(current + 1);
  }

  function back() {
    if (current === 1 && envelopePhase === "extracted") return closeEnvelope();
    if (current === 1 && envelopePhase !== "closed") return;
    go(current - 1);
  }

  function updateParchment() {
    const atEnd = parchment.scrollTop + parchment.clientHeight >= parchment.scrollHeight - 65;
    closingMark.classList.toggle("is-ready", atEnd);
    closingMark.setAttribute("aria-hidden", String(!atEnd));
    closingMark.tabIndex = atEnd ? 0 : -1;
    closingMark.disabled = !atEnd;
  }

  function restart() {
    clearTimeout(timer);
    envelopePhase = "closed";
    updateEnvelope();
    parchment.scrollTop = 0;
    updateParchment();
    go(0);
  }

  envelopeCover.addEventListener("click", openEnvelope);
  foldedLetter.addEventListener("click", closeEnvelope);
  parchment.addEventListener("scroll", updateParchment, { passive: true });
  closingMark.addEventListener("click", () => go(5));
  document.getElementById("again").addEventListener("click", restart);
  previous.addEventListener("click", back);
  following.addEventListener("click", next);

  for (const image of document.querySelectorAll("img[data-fallback]")) {
    image.addEventListener("error", () => {
      const fallback = image.getAttribute("data-fallback");
      if (fallback) {
        image.removeAttribute("data-fallback");
        image.src = fallback;
      }
    });
  }

  stage.addEventListener("pointerdown", event => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    if (event.target.closest("button,a")) { pointerStart = null; return; }
    pointerStart = { x:event.clientX, y:event.clientY, scrollTop:parchment.scrollTop,
      parchment:event.target.closest(".parchment-viewport") !== null };
  }, { passive:true });

  stage.addEventListener("pointerup", event => {
    if (!pointerStart || event.target.closest("button,a")) { pointerStart = null; return; }
    const start = pointerStart;
    pointerStart = null;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (start.parchment && Math.abs(parchment.scrollTop - start.scrollTop) > 5) return;
    if (Math.abs(dx) >= 72 && Math.abs(dx) >= Math.abs(dy) * 1.6) {
      if (dx < 0) next(); else back();
      return;
    }
    // A small, invisible tap target on the empty margins is the mouse/touch
    // alternative to swipes. Content taps do not trigger navigation.
    if (Math.abs(dx) > 12 || Math.abs(dy) > 12) return;
    if (event.target.closest("p,h1,h2,img,.envelope,.parchment-viewport,.promise-prose,.reflection-words")) return;
    const rect = stage.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    if (ratio > .9) next();
    else if (ratio < .1) back();
  }, { passive:true });
  stage.addEventListener("pointercancel", () => { pointerStart = null; }, { passive:true });

  document.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    if (event.target.matches("input,textarea,select,[contenteditable=true]")) return;
    if (event.key === "ArrowRight") { event.preventDefault(); next(); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); back(); }
    else if (event.key === "Escape" && current === 1) closeEnvelope();
  });

  previous.disabled = true;
  following.disabled = false;
  updateEnvelope();
  updateParchment();
})();
