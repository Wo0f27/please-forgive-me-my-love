/* A Little Letter — v7
   One letter with distinct extracting, unfolding, reading, refolding and
   reinserting phases. The final tap finishes the physical letter before
   opening the closing scene. No navigation bar or artificial page breaks. */
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
  const petals = document.getElementById("scene-petals");
  const garden = document.querySelector("[data-bloom-scene]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let current = 0;
  let phase = "closed";
  let rememberedScrollTop = 0;
  let swipeStart = null;
  let generation = 0;
  let timers = [];

  const durations = {
    extract: 860, unfold: 650,
    refold: 640, insert: 610, seal: 730, settle: 650
  };

  function schedule(callback, duration) {
    const token = generation;
    const id = setTimeout(() => {
      if (token === generation) callback();
    }, reducedMotion.matches ? 0 : duration);
    timers.push(id);
  }

  function cancelSequence() {
    generation++;
    for (const t of timers) clearTimeout(t);
    timers = [];
  }

  function announce(message) {
    status.textContent = "";
    requestAnimationFrame(() => { status.textContent = message; });
  }

  function readingAtEnd() {
    return paper.scrollTop + paper.clientHeight >= paper.scrollHeight - 60;
  }

  function updateButtons() {
    const busy = ["extracting","unfolding","refolding","inserting","sealing"].includes(phase);
    previous.disabled = current === 0 || (current === 1 && busy);
    nextButton.disabled = current === 2 || (current === 1 && (
      busy || (phase === "reading" && !readingAtEnd())
    ));
  }

  function petalTransition() {
    if (reducedMotion.matches) return;
    petals.classList.remove("is-playing");
    void petals.offsetWidth;
    petals.classList.add("is-playing");
    setTimeout(() => petals.classList.remove("is-playing"), 1200);
  }

  function go(index) {
    if (index < 0 || index >= scenes.length || index === current) return;
    const old = scenes[current];
    old.classList.remove("is-current");
    old.classList.add(index > current ? "was-before" : "was-after");
    old.setAttribute("aria-hidden","true");
    old.inert = true;
    const upcoming = scenes[index];
    upcoming.classList.remove("was-before","was-after");
    upcoming.classList.add("is-current");
    upcoming.removeAttribute("aria-hidden");
    upcoming.inert = false;
    current = index;
    petalTransition();
    updateButtons();
    announce(upcoming.querySelector("h1,h2")?.textContent?.trim() || "Another part of the letter");
    if (old.contains(document.activeElement) && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setTimeout(() => old.classList.remove("was-before","was-after"), reducedMotion.matches ? 0 : 760);
  }

  function syncEnvelope() {
    const open = !["closed","sealing"].includes(phase);
    const reading = phase === "reading";
    envelope.classList.toggle("is-open",open);
    for (const state of ["extracting","unfolding","reading","refolding","inserting","sealing"]) {
      envelope.classList.toggle("is-"+state, phase === state);
    }
    envelopeStage.classList.toggle("is-reading", ["unfolding","reading","refolding"].includes(phase));
    cover.disabled = phase !== "closed";
    cover.setAttribute("aria-expanded",String(open));
    paper.tabIndex = reading ? 0 : -1;
    paper.setAttribute("aria-hidden",String(!reading));
    paper.inert = !reading;
    lastHeart.disabled = !reading;
    updateButtons();
    if (reading) maybeBloom();
  }

  function openEnvelope() {
    if (phase !== "closed") return;
    cancelSequence();
    phase = "extracting";
    syncEnvelope();
    announce("The envelope is opening.");
    schedule(() => {
      phase = "unfolding";
      syncEnvelope();
      announce("The paper is unfolding.");
      schedule(() => {
        phase = "reading";
        syncEnvelope();
        announce("Your letter is ready to read.");
        schedule(() => {
          if (phase === "reading") {
            paper.scrollTop = Math.max(0,Math.min(rememberedScrollTop,paper.scrollHeight-paper.clientHeight));
            maybeBloom();
            updateButtons();
          }
        },durations.settle);
      },durations.unfold);
    },durations.extract);
  }

  function closeEnvelope(advanceToEnding = false) {
    if (phase !== "reading") return;
    cancelSequence();
    rememberedScrollTop = paper.scrollTop;
    phase = "refolding";
    syncEnvelope();
    announce("The letter is folding.");

    // Conceal the writing before resetting the scroll position. Only the
    // paper and fold creases remain visible during the return to the pocket.
    schedule(() => { paper.scrollTop = 0; }, 175);
    schedule(() => {
      phase = "inserting";
      syncEnvelope();
      announce("The folded letter is returning to its envelope.");
      schedule(() => {
        phase = "sealing";
        syncEnvelope();
        schedule(() => {
          phase = "closed";
          syncEnvelope();
          if (advanceToEnding) {
            rememberedScrollTop = 0;
            go(2);
          } else {
            announce("The letter is safely tucked away.");
          }
        },durations.seal);
      },durations.insert);
    },durations.refold);
  }

  function next() {
    if (current === 0) return go(1);
    if (current === 1) {
      if (phase === "closed") return openEnvelope();
      if (phase === "reading" && readingAtEnd()) return closeEnvelope(true);
    }
  }

  function back() {
    if (current === 2) return go(1);
    if (current === 1) {
      if (phase === "reading") return closeEnvelope(false);
      if (phase === "closed") return go(0);
    }
  }

  function restart() {
    cancelSequence();
    rememberedScrollTop = 0;
    phase = "closed";
    paper.scrollTop = 0;
    garden.classList.remove("is-blooming");
    syncEnvelope();
    go(0);
  }

  function maybeBloom() {
    if (!garden || garden.classList.contains("is-blooming") || phase !== "reading") return;
    if (reducedMotion.matches) {
      garden.classList.add("is-blooming");
      return;
    }
    const g = garden.getBoundingClientRect();
    const p = paper.getBoundingClientRect();
    const visible = Math.min(g.bottom,p.bottom)-Math.max(g.top,p.top);
    if (visible >= Math.min(70,g.height*.25)) garden.classList.add("is-blooming");
  }

  document.getElementById("start-reading").addEventListener("click", () => go(1));
  cover.addEventListener("click",openEnvelope);
  lastHeart.addEventListener("click",() => {
    if (phase === "reading" && readingAtEnd()) closeEnvelope(true);
  });
  document.getElementById("again").addEventListener("click",restart);
  previous.addEventListener("click",back);
  nextButton.addEventListener("click",next);
  paper.addEventListener("scroll",() => {
    if (phase === "reading") {
      maybeBloom();
      updateButtons();
    }
  },{passive:true});

  for (const img of document.querySelectorAll("img[data-fallback]")) {
    img.addEventListener("error", () => {
      const fallback = img.getAttribute("data-fallback");
      if (!fallback) return;
      img.removeAttribute("data-fallback");
      img.src = fallback;
    });
  }

  // Vertical drags inside the parchment remain native. Horizontal drags
  // on the paper itself never skip or tuck the letter prematurely.
  stage.addEventListener("pointerdown",event => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    if (event.target.closest("button,a")) { swipeStart = null; return; }
    swipeStart = {
      x:event.clientX,y:event.clientY,
      withinPaper:!!event.target.closest("#letter-paper"),
      scrollTop:paper.scrollTop
    };
  },{passive:true});

  stage.addEventListener("pointerup",event => {
    if (!swipeStart || event.target.closest("button,a")) { swipeStart=null; return; }
    const start = swipeStart;
    swipeStart = null;
    const dx=event.clientX-start.x,dy=event.clientY-start.y;
    if (start.withinPaper) return;
    if (Math.abs(dx)<74 || Math.abs(dx)<Math.abs(dy)*1.55) return;
    if (dx<0) next(); else back();
  },{passive:true});
  stage.addEventListener("pointercancel",() => {swipeStart=null;},{passive:true});

  document.addEventListener("keydown",event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    if (event.target.matches("input,textarea,select,[contenteditable=true]")) return;
    const insidePaper=!!event.target.closest?.("#letter-paper");
    if (event.key==="ArrowRight") {
      if (current===1 && phase==="reading" && insidePaper) return;
      event.preventDefault();next();
    } else if (event.key==="ArrowLeft") {
      if (current===1 && phase==="reading" && insidePaper) return;
      event.preventDefault();back();
    } else if (event.key==="Escape" && current===1 && phase==="reading") {
      event.preventDefault();closeEnvelope(false);
    }
  });

  syncEnvelope();
  if (reducedMotion.matches && garden) garden.classList.add("is-blooming");
})();
