/* A Little Letter v4 — one physical envelope, one continuous paper.
   The real apology lives inside #letter-paper from the start. */
(() => {
  "use strict";
  const stage = document.getElementById("experience");
  const scenes = [...document.querySelectorAll(".scene")];
  const previous = document.getElementById("previous-scene");
  const nextButton = document.getElementById("next-scene");
  const status = document.getElementById("status");
  const envelope = document.getElementById("envelope");
  const envelopeStage = document.querySelector(".envelope-stage");
  const cover = document.getElementById("envelope-cover");
  const paper = document.getElementById("letter-paper");
  const lastHeart = document.getElementById("last-heart");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let current = 0;
  let envelopePhase = "closed"; // closed, opening, reading, folding
  let envelopeTimer = null;
  let swipeStart = null;

  function announce(message) {
    status.textContent = "";
    requestAnimationFrame(() => { status.textContent = message; });
  }

  function readingAtEnd() {
    return paper.scrollTop + paper.clientHeight >= paper.scrollHeight - 60;
  }

  function updateButtons() {
    previous.disabled = current === 0 || (current === 1 && (envelopePhase === "opening" || envelopePhase === "folding"));
    nextButton.disabled = current === 2 || (current === 1 && (envelopePhase === "opening" || envelopePhase === "folding"));
  }

  function go(index) {
    if (index < 0 || index >= scenes.length || index === current) return;
    const old = scenes[current];
    old.classList.remove("is-current");
    old.classList.add(index > current ? "was-before" : "was-after");
    old.setAttribute("aria-hidden", "true");
    old.inert = true;

    const next = scenes[index];
    next.classList.remove("was-before", "was-after");
    next.classList.add("is-current");
    next.removeAttribute("aria-hidden");
    next.inert = false;
    current = index;
    updateButtons();
    announce(next.querySelector("h1,h2")?.textContent?.trim() || "Another page");
    if (old.contains(document.activeElement) && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setTimeout(() => old.classList.remove("was-before", "was-after"), reducedMotion.matches ? 0 : 550);
  }

  function syncEnvelope() {
    const open = envelopePhase !== "closed";
    const reading = envelopePhase === "reading";
    envelope.classList.toggle("is-open", open);
    envelope.classList.toggle("is-reading", reading);
    envelopeStage.classList.toggle("is-reading", reading);
    envelope.classList.toggle("is-folding", envelopePhase === "folding");
    cover.disabled = open;
    cover.setAttribute("aria-expanded", String(open));
    paper.tabIndex = reading ? 0 : -1;
    paper.setAttribute("aria-hidden", String(!reading));
    paper.inert = !reading;
    updateButtons();
  }

  function openEnvelope() {
    if (envelopePhase !== "closed") return;
    clearTimeout(envelopeTimer);
    envelopePhase = "opening";
    syncEnvelope();
    envelopeTimer = setTimeout(() => {
      if (envelopePhase !== "opening") return;
      envelopePhase = "reading";
      syncEnvelope();
      announce("The complete letter is open. Scroll through the parchment to read it.");
    }, reducedMotion.matches ? 0 : 990);
  }

  function closeEnvelope() {
    if (envelopePhase !== "reading") return;
    clearTimeout(envelopeTimer);
    paper.scrollTop = 0;
    envelopePhase = "folding";
    syncEnvelope();
    envelopeTimer = setTimeout(() => {
      if (envelopePhase !== "folding") return;
      envelopePhase = "closed";
      syncEnvelope();
      announce("The letter is back inside the envelope.");
    }, reducedMotion.matches ? 0 : 740);
  }

  function next() {
    if (current === 0) return go(1);
    if (current === 1) {
      if (envelopePhase === "closed") return openEnvelope();
      if (envelopePhase === "reading" && readingAtEnd()) return go(2);
      return;
    }
  }

  function back() {
    if (current === 2) return go(1);
    if (current === 1) {
      if (envelopePhase === "reading") return closeEnvelope();
      if (envelopePhase === "closed") return go(0);
    }
  }

  function restart() {
    clearTimeout(envelopeTimer);
    envelopePhase = "closed";
    paper.scrollTop = 0;
    syncEnvelope();
    go(0);
  }

  document.getElementById("start-reading").addEventListener("click", () => go(1));
  cover.addEventListener("click", openEnvelope);
  lastHeart.addEventListener("click", () => {
    if (envelopePhase === "reading") go(2);
  });
  document.getElementById("again").addEventListener("click", restart);
  previous.addEventListener("click", back);
  nextButton.addEventListener("click", next);

  // Each externally hosted illustration falls back to the user's local sticker.
  for (const img of document.querySelectorAll("img[data-fallback]")) {
    img.addEventListener("error", () => {
      const fallback = img.getAttribute("data-fallback");
      if (!fallback) return;
      img.removeAttribute("data-fallback");
      img.src = fallback;
    });
  }

  // A true vertical drag inside the letter is always handled by native scrolling.
  // Horizontal swipes within the paper never close it accidentally.
  stage.addEventListener("pointerdown", event => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    if (event.target.closest("button,a")) { swipeStart = null; return; }
    swipeStart = {
      x:event.clientX, y:event.clientY,
      withinPaper:!!event.target.closest("#letter-paper"),
      scrollTop:paper.scrollTop
    };
  }, {passive:true});

  stage.addEventListener("pointerup", event => {
    if (!swipeStart || event.target.closest("button,a")) { swipeStart = null; return; }
    const start = swipeStart;
    swipeStart = null;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (start.withinPaper && Math.abs(paper.scrollTop - start.scrollTop) > 2) return;
    if (Math.abs(dx) < 74 || Math.abs(dx) < Math.abs(dy) * 1.55) return;
    if (start.withinPaper && envelopePhase === "reading" && (dx > 0 || !readingAtEnd())) return;
    if (dx < 0) next();
    else back();
  }, {passive:true});
  stage.addEventListener("pointercancel", () => { swipeStart = null; }, {passive:true});

  document.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    if (event.target.matches("input,textarea,select,[contenteditable=true]")) return;
    if (event.key === "ArrowRight") {
      // The letter has normal arrow-key scrolling; do not steal that input.
      if (current === 1 && envelopePhase === "reading" && event.target.closest("#letter-paper")) return;
      event.preventDefault();
      next();
    } else if (event.key === "ArrowLeft") {
      if (current === 1 && envelopePhase === "reading" && event.target.closest("#letter-paper")) return;
      event.preventDefault();
      back();
    } else if (event.key === "Escape" && current === 1 && envelopePhase === "reading") {
      event.preventDefault();
      closeEnvelope();
    }
  });

  updateButtons();
  syncEnvelope();
})();
