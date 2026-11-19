/* Cozy Night Edition — a finite-state, non-scrolling reading experience.
   Inspired by the envelope interaction in the user's For Ash website.
   No network calls, analytics, or form submissions. */
(function () {
  "use strict";

  const scenes = Array.from(document.querySelectorAll(".scene"));
  const dots = Array.from(document.querySelectorAll(".chapter-dot"));
  const backButton = document.getElementById("back");
  const nextButton = document.getElementById("next");
  const nextLabel = document.getElementById("next-label");
  const chapterNumber = document.getElementById("chapter-number");
  const announcer = document.getElementById("sr-announcement");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const envelopeWorld = document.getElementById("envelope-world");
  const envelopeToggle = document.getElementById("envelope-toggle");
  const envelopeSheet = document.getElementById("envelope-sheet");
  const envelopeHint = document.getElementById("envelope-hint");
  const envelopeContinue = document.getElementById("envelope-continue");
  const note = document.getElementById("insight-note");
  const noteButtons = Array.from(document.querySelectorAll("[data-note]"));
  const letterCopy = document.getElementById("letter-copy");
  const letterPageEl = document.getElementById("letter-page");

  const acknowledgments = [
    {
      title: "Your feelings deserved space.",
      realize: "You were asking for care, not a debate. I turned your needs into a defense of myself.",
      action: "I'll let you finish, ask questions first, and listen without preparing an argument."
    },
    {
      title: "I've left too much on your shoulders.",
      realize: "You've felt like you were the only one trying to hold us together. My reactions have added to that weight.",
      action: "I'll take initiative, check in, and share the effort in ordinary moments, not only when something goes wrong."
    },
    {
      title: "My insecurity isn't an excuse.",
      realize: "I let my own fears turn into defensive and reactive behavior. That made honesty harder for you.",
      action: "I'll recognize when I'm getting defensive, pause without disappearing, come back calmly, and own it when I get something wrong."
    }
  ];

  const pages = [
    {
      greeting: "Hey, love,",
      paragraphs: [
        "I'm sorry for the way I've made you feel. You were trying to tell me what you needed, and I became defensive instead of taking the time to understand.",
        "I turned a conversation about your feelings into something about mine. You deserved patience and care, not a reaction you had to work around."
      ]
    },
    {
      paragraphs: [
        "I know I've made you feel like you're the only one carrying the effort in our relationship. Even when you were simply asking for something important to you, I made it harder than it needed to be.",
        "I can only imagine how exhausting it has been to explain yourself while also trying to keep us close. You shouldn't have to fight to feel understood by me."
      ]
    },
    {
      paragraphs: [
        "My insecurity doesn't excuse the way I've reacted. It's mine to work on, and I shouldn't put the responsibility for managing it on you.",
        "I want to listen without turning things into an argument, slow down when I'm defensive, and take initiative instead of leaving you to carry the work. I know that means doing these things consistently."
      ]
    },
    {
      paragraphs: [
        "This little website can't fix the hurt I've caused. A meaningful apology has to show up in how I treat you after these words, including on ordinary days and during difficult conversations.",
        "I'm sorry for making you feel alone in a relationship that's meant to have both of us in it. I love you, and I want my actions to feel like love too. You don't owe me forgiveness or a reply right now."
      ],
      signoff: "With love, me ♡"
    }
  ];

  let sceneIndex = 0;
  let noteIndex = 0;
  let pageIndex = 0;
  let envelopeState = "closed"; // closed → opening → extracted → folding → closed
  let envelopeTimer = null;
  let lastPointer = null;
  let visited = new Set([0]);

  function smallAnimation(element, offset) {
    if (reducedMotion.matches || typeof element.animate !== "function") return;
    element.animate(
      [
        { opacity: 0.68, transform: "translateY(" + (offset || 6) + "px)" },
        { opacity: 1, transform: "translateY(0)" }
      ],
      { duration: 320, easing: "cubic-bezier(.22,.73,.29,1)" }
    );
  }

  function announce(text) {
    announcer.textContent = "";
    window.requestAnimationFrame(function () {
      announcer.textContent = text;
    });
  }

  function updateFooter() {
    dots.forEach(function (dot, index) {
      dot.classList.toggle("current", index === sceneIndex);
    });

    let detail = "";
    if (sceneIndex === 3) detail = " · note " + (noteIndex + 1) + " of 3";
    if (sceneIndex === 4) detail = " · page " + (pageIndex + 1) + " of " + pages.length;
    chapterNumber.textContent = String(sceneIndex + 1).padStart(2, "0") + " / 06" + detail;

    const envelopeBusy = sceneIndex === 1 && (envelopeState === "opening" || envelopeState === "folding");
    backButton.disabled = sceneIndex === 0 || envelopeBusy;
    nextButton.disabled = sceneIndex === 5 || envelopeBusy;

    if (sceneIndex === 0) nextLabel.textContent = "Begin";
    else if (sceneIndex === 1 && envelopeState === "closed") nextLabel.textContent = "Open";
    else if (sceneIndex === 1 && envelopeBusy) nextLabel.textContent = "Opening…";
    else if (sceneIndex === 1) nextLabel.textContent = "Continue";
    else if (sceneIndex === 3 && noteIndex < acknowledgments.length - 1) nextLabel.textContent = "Next note";
    else if (sceneIndex === 4 && pageIndex < pages.length - 1) nextLabel.textContent = "Turn page";
    else if (sceneIndex === 5) nextLabel.textContent = "The end";
    else nextLabel.textContent = "Next";

    const backText = backButton.querySelectorAll("span")[1];
    backText.textContent = sceneIndex === 1 && envelopeState === "extracted" ? "Close" : "Back";
  }

  function showScene(next) {
    if (next < 0 || next >= scenes.length || next === sceneIndex) return;
    const old = scenes[sceneIndex];
    const target = scenes[next];
    const direction = next > sceneIndex ? "leaving-left" : "leaving-right";
    old.classList.remove("active", "leaving-left", "leaving-right");
    old.classList.add(direction);
    old.setAttribute("aria-hidden", "true");
    old.inert = true;

    scenes.forEach(function (scene, index) {
      if (index !== next) scene.classList.remove("active");
    });
    target.classList.remove("leaving-left", "leaving-right");
    target.classList.add("active");
    target.removeAttribute("aria-hidden");
    target.inert = false;
    sceneIndex = next;
    visited.add(next);
    updateFooter();
    announce(target.querySelector("h1,h2").textContent.trim());
    window.setTimeout(function () { old.classList.remove("leaving-left", "leaving-right"); }, 650);
  }

  function syncEnvelope() {
    const open = envelopeState !== "closed";
    const extracted = envelopeState === "extracted";
    envelopeWorld.classList.toggle("is-open", open);
    envelopeWorld.classList.toggle("is-extracted", extracted);
    envelopeWorld.classList.toggle("is-folding", envelopeState === "folding");
    envelopeToggle.disabled = open;
    envelopeToggle.setAttribute("aria-expanded", String(open));
    envelopeSheet.disabled = !extracted;
    envelopeSheet.tabIndex = extracted ? 0 : -1;
    envelopeSheet.setAttribute("aria-hidden", String(!extracted));
    envelopeContinue.hidden = !extracted;
    if (envelopeState === "closed") envelopeHint.textContent = "Tap the sealed envelope to open it.";
    else if (envelopeState === "opening") envelopeHint.textContent = "A little note is unfolding…";
    else if (envelopeState === "extracted") envelopeHint.textContent = "Tap the paper to tuck it back, or continue.";
    else envelopeHint.textContent = "Tucking the letter away…";
    updateFooter();
  }

  function openEnvelope() {
    if (envelopeState !== "closed") return;
    clearTimeout(envelopeTimer);
    envelopeState = "opening";
    syncEnvelope();
    announce("Opening the envelope.");
    envelopeTimer = window.setTimeout(function () {
      if (envelopeState !== "opening") return;
      envelopeState = "extracted";
      syncEnvelope();
      announce("The paper has unfolded. Read the note, or tap the paper to close it.");
    }, reducedMotion.matches ? 0 : 1030);
  }

  function closeEnvelope() {
    if (envelopeState !== "extracted") return;
    clearTimeout(envelopeTimer);
    envelopeState = "folding";
    syncEnvelope();
    envelopeTimer = window.setTimeout(function () {
      if (envelopeState !== "folding") return;
      envelopeState = "closed";
      syncEnvelope();
      announce("The letter is back in the envelope.");
    }, reducedMotion.matches ? 0 : 510);
  }

  function setNote(index) {
    if (index < 0 || index >= acknowledgments.length) return;
    noteIndex = index;
    const entry = acknowledgments[index];
    document.getElementById("insight-ordinal").textContent = "note " + (index + 1) + " of three";
    document.getElementById("insight-title").textContent = entry.title;
    document.getElementById("insight-realize").textContent = entry.realize;
    document.getElementById("insight-action").textContent = entry.action;
    noteButtons.forEach(function (button, i) {
      button.classList.toggle("selected", i === index);
      if (i === index) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    smallAnimation(note, 7);
    updateFooter();
    announce(entry.title);
  }

  function setPage(index) {
    if (index < 0 || index >= pages.length) return;
    pageIndex = index;
    const page = pages[index];
    const content = document.createDocumentFragment();
    if (page.greeting) {
      const greeting = document.createElement("p");
      greeting.className = "letter-greeting";
      greeting.textContent = page.greeting;
      content.appendChild(greeting);
    }
    page.paragraphs.forEach(function (paragraph) {
      const p = document.createElement("p");
      p.textContent = paragraph;
      content.appendChild(p);
    });
    if (page.signoff) {
      const signoff = document.createElement("p");
      signoff.className = "letter-signoff";
      signoff.textContent = page.signoff;
      content.appendChild(signoff);
    }
    letterCopy.replaceChildren(content);
    document.getElementById("paper-page").textContent = (index + 1) + " / " + pages.length;
    smallAnimation(letterPageEl, 6);
    updateFooter();
    announce("Letter page " + (index + 1) + " of " + pages.length + ".");
  }

  function next() {
    if (sceneIndex === 5) return;
    if (sceneIndex === 1) {
      if (envelopeState === "closed") openEnvelope();
      else if (envelopeState === "extracted") showScene(2);
      return;
    }
    if (sceneIndex === 3 && noteIndex < acknowledgments.length - 1) {
      setNote(noteIndex + 1);
      return;
    }
    if (sceneIndex === 4 && pageIndex < pages.length - 1) {
      setPage(pageIndex + 1);
      return;
    }
    showScene(sceneIndex + 1);
  }

  function back() {
    if (sceneIndex === 0) return;
    if (sceneIndex === 1) {
      if (envelopeState === "extracted") closeEnvelope();
      else if (envelopeState === "closed") showScene(0);
      return;
    }
    if (sceneIndex === 3 && noteIndex > 0) {
      setNote(noteIndex - 1);
      return;
    }
    if (sceneIndex === 4 && pageIndex > 0) {
      setPage(pageIndex - 1);
      return;
    }
    showScene(sceneIndex - 1);
  }

  backButton.addEventListener("click", back);
  nextButton.addEventListener("click", next);
  document.getElementById("begin").addEventListener("click", function () { showScene(1); });
  document.getElementById("replay").addEventListener("click", function () {
    setNote(0);
    setPage(0);
    showScene(0);
  });
  envelopeToggle.addEventListener("click", openEnvelope);
  envelopeSheet.addEventListener("click", closeEnvelope);
  envelopeContinue.addEventListener("click", function () {
    if (envelopeState === "extracted") showScene(2);
  });
  noteButtons.forEach(function (button) {
    button.addEventListener("click", function () { setNote(Number(button.dataset.note)); });
  });

  document.addEventListener("keydown", function (event) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    const target = event.target;
    if (target && target.closest && target.closest("input,textarea,[contenteditable=true]")) return;
    if (event.key === "ArrowRight") { event.preventDefault(); next(); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); back(); }
  });

  const stage = document.getElementById("experience");
  stage.addEventListener("pointerdown", function (event) {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    if (event.target.closest("button,a")) { lastPointer = null; return; }
    lastPointer = { x: event.clientX, y: event.clientY };
  }, { passive: true });
  stage.addEventListener("pointerup", function (event) {
    if (!lastPointer || event.target.closest("button,a")) { lastPointer = null; return; }
    const dx = event.clientX - lastPointer.x;
    const dy = event.clientY - lastPointer.y;
    lastPointer = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) next();
      else back();
    }
  }, { passive: true });
  stage.addEventListener("pointercancel", function () { lastPointer = null; });

  setNote(0);
  setPage(0);
  syncEnvelope();
  updateFooter();
})();
