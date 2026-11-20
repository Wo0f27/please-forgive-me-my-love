/* A Little Letter — v13
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
  const finaleBouquetLayer = document.getElementById("finale-bouquet-layer");
  const invitationYes = document.getElementById("invite-yes");
  const invitationNo = document.getElementById("invite-no");
  const invitationArea = document.getElementById("invite-play-area");
  const invitationHeart = document.getElementById("invite-heart-result");
  const invitationSparkles = document.getElementById("invite-sparkles");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let current = 0;
  let phase = "closed";
  let rememberedScrollTop = 0;
  let swipeStart = null;
  let generation = 0;
  let timers = [];
  let invitationEffectToken = 0;
  let noHopCount = 0;
  let invitationAccepted = false;

  const durations = {
    extract: 710, unfold: 620, expand: 640, heartBurst: 2150,
    refold: 660, insert: 550, seal: 630, finalHold: 160, settle: 80
  };

  function schedule(callback, duration, retainDuration = false) {
    const token = generation;
    const id = setTimeout(() => {
      if (token === generation) callback();
    }, reducedMotion.matches && !retainDuration ? 0 : duration);
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
    const busy = ["extracting","unfolding","expanding","heartburst","refolding","inserting","sealing"].includes(phase);
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
    if (current === 2 && index === 1) envelopeStage.classList.remove("is-finishing");
    old.classList.remove("is-current");
    old.classList.add(index > current ? "was-before" : "was-after");
    old.setAttribute("aria-hidden","true");
    old.inert = true;
    const upcoming = scenes[index];
    if (index === 2) resetInvitation();
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
    for (const state of ["extracting","unfolding","expanding","reading","heartburst","refolding","inserting","sealing"]) {
      envelope.classList.toggle("is-"+state, state === "reading" ? reading : phase === state);
    }
    envelopeStage.classList.toggle("is-reading", ["unfolding","expanding","reading","heartburst","refolding","inserting","sealing"].includes(phase));
    cover.disabled = phase !== "closed";
    cover.setAttribute("aria-expanded",String(open));
    paper.tabIndex = reading ? 0 : -1;
    paper.setAttribute("aria-hidden",String(!reading));
    paper.inert = !reading;
    lastHeart.disabled = phase !== "reading";
    lastHeart.classList.toggle("is-ready",phase === "reading" && readingAtEnd());
    updateButtons();
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
        // Hold a noninteractive, unfolded face while the sheet grows into
        // the final reading viewport. On mobile this eliminates the race
        // where "reading" started before its scroll container had a height.
        phase = "expanding";
        syncEnvelope();
        announce("The paper is opening fully.");
        schedule(() => {
          phase = "reading";
          syncEnvelope();
          announce("Your letter is ready to read.");
          schedule(() => {
            if (phase === "reading") {
              paper.scrollTop = Math.max(0,Math.min(rememberedScrollTop,paper.scrollHeight-paper.clientHeight));
              updateButtons();
            }
          },durations.settle);
        },durations.expand);
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

  // The wrapped flowers are held as a hidden source illustration inside
  // the parchment. They appear in the viewport only when the last heart is
  // pressed, so the recipient can actually watch the bouquet being created.
  function createFinaleBouquet() {
    finaleBouquetLayer.replaceChildren();
    const bouquet = garden.cloneNode(true);
    bouquet.removeAttribute("data-bloom-scene");
    bouquet.removeAttribute("role");
    bouquet.removeAttribute("aria-label");
    bouquet.setAttribute("aria-hidden","true");
    bouquet.classList.remove("is-blooming","is-grown");
    bouquet.classList.add("is-final-bouquet");
    finaleBouquetLayer.appendChild(bouquet);
    finaleBouquetLayer.classList.add("is-showing");
    if (reducedMotion.matches) {
      bouquet.classList.add("is-created");
    } else {
      void bouquet.offsetWidth;
      bouquet.classList.add("is-creating");
    }
  }

  function launchHeartFinale() {
    if (phase !== "reading" || !readingAtEnd()) return;
    cancelSequence();
    phase = "heartburst";
    syncEnvelope();
    createFinaleBouquet();
    burstHearts();
    announce("A bouquet of flowers and lots of love for you.");
    schedule(() => {
      heartLayer.replaceChildren();
      finaleBouquetLayer.classList.remove("is-showing");
      finaleBouquetLayer.replaceChildren();
      phase = "reading";
      syncEnvelope();
      closeEnvelope(true);
    }, reducedMotion.matches ? 1000 : durations.heartBurst, true);
  }


  // The invitation is a playful, local-only interaction: No hops away
  // within the card, while Yes triggers an animated button-to-heart merge.
  // The browser's Back/Close controls always remain available.
  function resetInvitation() {
    invitationEffectToken++;
    invitationAccepted = false;
    noHopCount = 0;
    invitationArea.classList.remove("is-merging","is-heart");
    invitationYes.disabled = false;
    invitationNo.disabled = false;
    invitationYes.removeAttribute("aria-hidden");
    invitationNo.removeAttribute("aria-hidden");
    invitationNo.style.removeProperty("left");
    invitationNo.style.removeProperty("top");
    invitationHeart.setAttribute("aria-hidden","true");
    invitationSparkles.replaceChildren();
  }

  function hopNo() {
    if (current !== 2 || invitationAccepted) return;
    const bounds = invitationArea.getBoundingClientRect();
    const noBox = invitationNo.getBoundingClientRect();
    const yesBox = invitationYes.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const halfW = noBox.width / 2;
    const halfH = noBox.height / 2;
    const maxX = bounds.width-halfW-6;
    const maxY = bounds.height-halfH-6;
    const spots = [
      [.76,.79],[.52,.82],[.24,.77],[.79,.50],
      [.56,.72],[.83,.86],[.29,.72],[.72,.78],[.48,.88],[.76,.39]
    ];
    const previousX=noBox.left-bounds.left+halfW;
    const previousY=noBox.top-bounds.top+halfH;
    for(let n=0;n<spots.length;n++){
      const [fx,fy]=spots[(noHopCount+n)%spots.length];
      const x=Math.max(halfW+6,Math.min(maxX,bounds.width*fx));
      const y=Math.max(halfH+6,Math.min(maxY,bounds.height*fy));
      const left=bounds.left+x-halfW;
      const top=bounds.top+y-halfH;
      const overlapsYes = (
        left < yesBox.right+8 && left+noBox.width > yesBox.left-8 &&
        top < yesBox.bottom+8 && top+noBox.height > yesBox.top-8
      );
      if(overlapsYes || Math.hypot(x-previousX,y-previousY)<22) continue;
      noHopCount=(noHopCount+n+1)%spots.length;
      invitationNo.style.left=x+"px";
      invitationNo.style.top=y+"px";
      return;
    }
    // Even in a very narrow viewport, keep the hopping button contained.
    noHopCount=(noHopCount+1)%spots.length;
    invitationNo.style.left=Math.max(halfW+6,Math.min(maxX,bounds.width*.76))+"px";
    invitationNo.style.top=Math.max(halfH+6,Math.min(maxY,bounds.height*.83))+"px";
  }

  function celebrateInvitation() {
    const token=++invitationEffectToken;
    invitationSparkles.replaceChildren();
    if(reducedMotion.matches) return;
    const icons=["💗","✨","💕","♡","✦","💖"];
    const fragment=document.createDocumentFragment();
    for(let i=0;i<30;i++){
      const sparkle=document.createElement("span");
      sparkle.className="invite-sparkle";
      sparkle.textContent=icons[(i*5+i%4)%icons.length];
      const radians=(i*137.508+15)*Math.PI/180;
      const radius=60+(i%7)*18;
      sparkle.style.setProperty("--dx",Math.round(Math.cos(radians)*radius)+"px");
      sparkle.style.setProperty("--dy",Math.round(Math.sin(radians)*radius-38)+"px");
      sparkle.style.setProperty("--turn",((-90+i*27)%180)+"deg");
      sparkle.style.setProperty("--delay",(i%7*30)+"ms");
      sparkle.style.setProperty("--size",(16+(i%5)*4)+"px");
      fragment.appendChild(sparkle);
    }
    invitationSparkles.appendChild(fragment);
    setTimeout(()=>{
      if(token===invitationEffectToken) invitationSparkles.replaceChildren();
    },1500);
  }

  function chooseFireworks(answer) {
    if(current!==2 || invitationAccepted) return;
    if(answer==="no") { hopNo(); return; }
    invitationAccepted=true;
    invitationYes.disabled=true;
    invitationNo.disabled=true;
    invitationArea.classList.add("is-merging");
    announce("i love you");
    const token=++invitationEffectToken;
    setTimeout(()=>{
      if(token!==invitationEffectToken || current!==2) return;
      invitationArea.classList.add("is-heart");
      invitationHeart.setAttribute("aria-hidden","false");
      invitationYes.setAttribute("aria-hidden","true");
      invitationNo.setAttribute("aria-hidden","true");
      celebrateInvitation();
    },reducedMotion.matches?0:590);
  }

  function closeEnvelope(advanceToEnding = false) {
    if (phase !== "reading") return;
    cancelSequence();
    rememberedScrollTop = paper.scrollTop;
    envelopeStage.classList.toggle("is-finishing",advanceToEnding);
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

  document.getElementById("start-reading").addEventListener("click", () => go(1));
  cover.addEventListener("click",openEnvelope);
  lastHeart.addEventListener("click", launchHeartFinale);
  invitationYes.addEventListener("click",()=>chooseFireworks("yes"));
  invitationNo.addEventListener("click",()=>chooseFireworks("no"));
  window.addEventListener("resize",()=>{
    if(current===2 && !invitationAccepted && noHopCount>0) {
      invitationNo.style.removeProperty("left");
      invitationNo.style.removeProperty("top");
      hopNo();
    }
  },{passive:true});
  // Explicitly support hardware keyboards as well as touchscreen taps.
  // Prevent native keyboard click synthesis so an answer is never selected twice.
  function chooseViaKeyboard(event,answer) {
    if (event.repeat || !["Enter"," ","Spacebar"].includes(event.key)) return;
    event.preventDefault();
    chooseFireworks(answer);
  }
  invitationYes.addEventListener("keydown",event=>chooseViaKeyboard(event,"yes"));
  invitationNo.addEventListener("keydown",event=>chooseViaKeyboard(event,"no"));
  previous.addEventListener("click",back);
  nextButton.addEventListener("click",next);
  paper.addEventListener("scroll",() => {
    if (phase === "reading") {
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
})();
