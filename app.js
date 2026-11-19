/* A Little Letter — v9
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
  const heartLayer = document.getElementById("heart-burst");
  const garden = document.querySelector("[data-bloom-scene]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let current = 0;
  let phase = "closed";
  let rememberedScrollTop = 0;
  let swipeStart = null;
  let generation = 0;
  let timers = [];

  const durations = {
    extract: 710, unfold: 620, heartBurst: 1650,
    refold: 660, insert: 550, seal: 630, finalHold: 160, settle: 520
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
    const busy = ["extracting","unfolding","heartburst","refolding","inserting","sealing"].includes(phase);
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
    const reading = phase === "reading" || phase === "heartburst";
    envelope.classList.toggle("is-open",open);
    for (const state of ["extracting","unfolding","reading","heartburst","refolding","inserting","sealing"]) {
      envelope.classList.toggle("is-"+state, state === "reading" ? reading : phase === state);
    }
    envelopeStage.classList.toggle("is-reading", ["unfolding","reading","heartburst","refolding"].includes(phase));
    cover.disabled = phase !== "closed";
    cover.setAttribute("aria-expanded",String(open));
    paper.tabIndex = reading ? 0 : -1;
    paper.setAttribute("aria-hidden",String(!reading));
    paper.inert = !reading;
    lastHeart.disabled = phase !== "reading";
    lastHeart.classList.toggle("is-ready",phase === "reading" && readingAtEnd());
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


  function burstHearts() {
    heartLayer.replaceChildren();
    const origin = lastHeart.getBoundingClientRect();
    const x = origin.left + origin.width / 2;
    const y = origin.top + origin.height / 2;
    const emojis = ["💗","💕","💖","💞","💘","💓","❤️","💝"];
    const count = reducedMotion.matches ? 12 : 64;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const heart = document.createElement("span");
      heart.className = "heart-particle";
      heart.textContent = emojis[(i*5+i%3) % emojis.length];
      heart.style.setProperty("--heart-x", x+"px");
      heart.style.setProperty("--heart-y", y+"px");
      const angle = (i * 137.508 + 20) * Math.PI / 180;
      const distance = 112 + (i % 11) * 23;
      heart.style.setProperty("--heart-dx",Math.round(Math.cos(angle)*distance)+"px");
      heart.style.setProperty("--heart-dy",Math.round(-82-Math.abs(Math.sin(angle))*distance)+"px");
      heart.style.setProperty("--heart-delay",reducedMotion.matches?"0ms":(i%13*31)+"ms");
      heart.style.setProperty("--heart-size",(18+(i*7)%22)+"px");
      heart.style.setProperty("--heart-end-scale",(0.7+(i%5)*0.15).toFixed(2));
      heart.style.setProperty("--heart-rotate",((-160+(i*43)%320))+"deg");
      fragment.appendChild(heart);
    }
    heartLayer.appendChild(fragment);
  }

  function launchHeartFinale() {
    if (phase !== "reading" || !readingAtEnd()) return;
    cancelSequence();
    phase = "heartburst";
    syncEnvelope();
    burstHearts();
    announce("Lots of love for you.");
    schedule(() => {
      heartLayer.replaceChildren();
      phase = "reading";
      syncEnvelope();
      closeEnvelope(true);
    }, durations.heartBurst);
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
            announce("The letter is sealed with love.");
            schedule(() => go(2),durations.finalHold);
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
      if (phase === "reading" && readingAtEnd()) return launchHeartFinale();
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
    garden.classList.remove("is-blooming","is-grown");
    heartLayer.replaceChildren();
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
    // A direct jump to the very end should never show a vacant flower
    // placeholder. Slow reading still gets the stem-and-petal animation.
    if (readingAtEnd() || g.bottom < p.top) {
      garden.classList.add("is-blooming","is-grown");
      return;
    }
    if (visible >= Math.min(70,g.height*.25)) garden.classList.add("is-blooming");
  }

  document.getElementById("start-reading").addEventListener("click", () => go(1));
  cover.addEventListener("click",openEnvelope);
  lastHeart.addEventListener("click", launchHeartFinale);
  document.getElementById("again").addEventListener("click",restart);
  previous.addEventListener("click",back);
  nextButton.addEventListener("click",next);
  paper.addEventListener("scroll",() => {
    if (phase === "reading") {
      maybeBloom();
      lastHeart.classList.toggle("is-ready",readingAtEnd());
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
