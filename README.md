# A little letter for you

A cozy Peach and Goma apology website hosted on GitHub Pages.

**Live:** https://wo0f27.github.io/please-forgive-me-my-love/

## Version 14 — final personalized letter, music and bouquet staging

- Replaced the apology text with the user's own **exact Taglish letter**, preserving its original word choices, punctuation and paragraphs; the signoff is **With love, Your Woof**.
- Changed the first button to **Please read this...**.
- Added **- Your Woof** between the fireworks question and its Yes/No controls.
- While the final heart creates the wrapped bouquet alongside the 64-heart burst, temporarily hide the animated Peach/Goma figures inside the letter scene so no mascot artwork overlaps the flowers. The figures return as the original physical refolding/closing animation starts.
- Added the user-supplied **Bandari — The First Snowflakes** song as `assets/music/first-snowflakes.m4a` (AAC-LC, stereo, about 196 seconds, looped). The music begins after the letter opens, **muted by default**, with an explicit button to toggle sound. The song stops and resets when the final heart is activated or the letter is closed early. Reopening starts muted again.
- Preserved the existing envelope and fireworks interaction; all music playback is in-browser with no telemetry or external audio host.
- The browser-friendly AAC audio was encoded at a compact rate from the user-supplied file for responsive mobile loading.

## Version 13 — flowers bloom when the last heart is pressed

The end-of-letter heart now starts **two effects together**: a wrapped bouquet grows visibly in the viewport and the existing 64-heart emoji burst launches. The bouquet is the same three-flower artwork originally drawn for the letter, now held as an invisible illustration template instead of blooming during reading. This avoids having the flowers already grown before the user presses the heart, or having them hidden above the viewport at the time of the tap.

After approximately 2.15 seconds, both celebration overlays clear, then the approved physical sequence proceeds: refold, insert, seal, and finally show the fireworks question. Repeat taps are ignored while the sequence runs. Reduced-motion visitors see a fully formed bouquet without flower-growth motion and the existing 12 restrained hearts. No letter words, stickers, invitation wording or existing envelope structure were changed.

## Version 12 — playful fireworks question and merging heart

The final screen is simplified to a single question and two buttons:

**Will you go with me to watch the fireworks tomorrow?**

- **No** playfully hops to a different in-bounds position after each tap or keyboard activation. The button remains on screen, and **Yes** remains stationary.
- **Yes** brings both buttons to the center of the invitation. They shrink and disappear together while a pink heart emerges with the words **"i love you"**. Heart and sparkle particles appear around the completed heart.
- No explicit date, venue, time, event subtitle, extra explanatory copy, or replay button appears on this screen. The existing animated Peach and Goma illustration remains above the pink invitation.
- Buttons are kept within the interactive region on portrait phones, 320px widths, short-height landscape layouts, and desktop. The choreography respects reduced-motion settings.
- The response is local to the webpage. No RSVP or response is transmitted or stored. Navigating back to the letter and reopening the ending resets the sequence.

## Version 11 — a private, phone-friendly fireworks invitation

The closing scene now follows the reference video's **cute pink pop-up window** idea without adding a second envelope or obstructing the real apology letter. The user asked for a direct invitation to watch the fireworks together on Saturday, November 21, 2026, at SM City Pampanga (Amphitheatre). The event's published start is 6:00 PM; the exact fireworks ignition time is not stated separately.

- Closing question: **"Will you go watch the fireworks with me tomorrow? ♡"**
- Two full-size, stationary, accessible touch targets: **"Yes ♡"** and **"Not this time"**. Neither is intentionally elusive or manipulative.
- Choosing Yes shows a small heart/sparkle celebration and a gentle acknowledgment. Choosing No shows a respectful acknowledgment without guilt or animation. The visitor can change their selection.
- **Selections remain in the page only**: no messages are sent to the author, no network requests, analytics, cookies or local storage.
- The local animation and floral palette are preserved. A CSS-only celebratory burst is disabled for users who prefer reduced motion.
- Smartphone portrait layouts, 320px-wide phones, short screens, landscape and keyboard activation are tested. Buttons are at least 44px tall.
- The previously removed "read it again" control stays absent. The former generic closing paragraphs are replaced by the direct invitation; the rest of the apology is unchanged.

## Version 10 — animated, high-quality Peach and Goma stickers

The six illustration slots in the letter and closing scene now use **six distinct, locally hosted transparent animated WebP files** restored from the source GIFs rather than the first-frame PNG conversions. There are **eight animated placements** in total, including the landing and envelope companion. The original transparent user-provided PNG is retained in the repository as a fallback.

The original static importer in \`tools/vendor_stickers.py\` used \`seek(0)\` and converted each GIF to one still PNG, which explains why nothing moved in earlier releases. The previous image cutout/downscaling also reduced quality. Version 10 preserves each frame at the original image dimensions and uses lossless animated WebP with alpha transparency. Animated WebP is supported by modern Chrome, Brave, Safari and Firefox and avoids the GIF format's color/edge limitations.

- \`assets/stickers/{sad-tears,comfort,back-hug,little-kiss,tender-hug,ending-hug}.webp\`: 6 source animations, 12–20 frames each. The JSON manifest at \`assets/stickers/animations.json\` records original source, dimensions, frame counts, durations and hashes.
- \`<picture>\` switches to existing **transparent still PNGs** when the visitor enables reduced motion; failed animation requests also have local fallback art.
- The final **"read it again"** control has been removed. The closing page ends naturally with its existing message and flowers.
- \`tools/restore_animated_stickers.py\` documents and reproduces the approved frame-preserving conversion if the assets ever need updating.

No remote image hosting is needed at runtime. The original artwork was supplied by the user or linked in earlier versions; the user says they have permission for this public personal project. Native source images are roughly 460–498 pixels wide, so displaying them above that scale will not create new detail, but no deliberate downsampling is performed in this revision.

## Version 9 — screen-recording fixes (November 20, 2026)

The user supplied a 21.6-second recording showing two physical continuity problems in Version 8: the extracted letter unfolded into a disproportionately large empty rectangle, and the refolded card hung visibly above the pink envelope before it moved into the pocket. The pause between the heart burst and the closing scene also felt long.

This revision keeps the existing approved content and design, including all Peach and Goma stickers and the tied Ash bouquet, while making these targeted changes:

- The extracting trifold is now limited to about 290px tall at desktop scale and aligned at the envelope mouth, rather than becoming a 362px floating blank rectangle.
- The full letter's writing fades in only after the reading paper has nearly reached its final size.
- Refolding ends directly at the envelope opening; insertion then slides the compact sheet behind the front pocket, without a visible vertical gap.
- The physical animation timings have been shortened and coordinated, removing the dead pause before the closing page.
- The final heart now releases **64** varied heart emojis across a wider area before folding begins (12 subdued hearts with reduced motion).
- Ambient petals are slightly easier to see, and the wrapped bouquet has been enlarged modestly.
- Additional Playwright tests capture the unfolding geometry, refolding alignment and wider heart burst on both mobile and desktop.

The long apology, the single scrollable parchment, pink stationery theme, flower artwork, ending message and no-navbar gesture design are unchanged.

## Version 8 — a bouquet, falling petals, and a heart-filled ending

The overall feel remains cutesy and cozy. The opening uses "Hey, My Love." and a simple invitation; no navbar, chapter indicators, big arrows or forgiveness-request buttons are added.

The letter itself is still the real parchment inside the physical envelope. The staged sequence is:

1. The sealed envelope opens. A compact, **still-folded** piece of paper rises behind the front pocket. Its writing is concealed.
2. The paper visibly **unfolds around three hinged sections**, then grows into the tall, natively scrollable full letter.
3. Inside the parchment, the three original Ash garden flower designs are arranged into a **single wrapped bouquet** with gathered stems, pink gift paper and a small ribbon. The leaves and stems are already visible, and the blossoms open shortly after the bouquet comes into view.
4. The site has **18 gently drifting animated background petals**, positioned behind the text and envelope; these loop with varied durations and negative starts, so the motion doesn't synchronize or appear overly busy.
5. At the very bottom, the large but visually minimal heart is the final interactive footer. **One tap launches a burst of 48 heart emojis** (12 restrained hearts with reduced-motion enabled). The burst completes *before* the letter refolds.
6. The folded paper then slides down into the envelope's front pocket at its compact size. The flap closes; only after a short hold does the closing scene appear, with small floral details around Peach and Goma.

Vertical scrolling is native inside the long parchment; horizontal swipes work between other scenes. Escape remains an accessible way to close without proceeding. The end-heart is the only visible in-letter finishing control.

The site packages animated WebP illustrations and still PNG fallbacks under \`assets/\`, with no third-party image hosts required at runtime. The user says the rightsholder gave permission for use in this public personal project.

### Reduced motion

The site observes \`prefers-reduced-motion\`. It turns off looping background petals and avoids prolonged transforms; the bouquet remains visible. The final heart still gets a brief, stationary acknowledgment, without a moving burst.

### Files

- \`index.html\` — complete letter, Peach/Goma images, original Ash flower paths arranged as a bouquet, ambient petal layer and heart overlay.
- \`styles.css\` — pastel stationery look, physical hinged folds, looping background petals, bouquet wrapping, heart burst.
- \`app.js\` — envelope and reading state machine, final burst followed by folding/insertion and closing-scene transition.
- \`tests/site.spec.cjs\` — Playwright interaction, responsiveness, bouquet, movement and reduced-motion tests.
- \`.github/workflows/site-qa.yml\` — browser tests before publication.

The website itself is plain HTML, CSS and JavaScript. There are no external runtime scripts, cookies, analytics, subscriptions or paid APIs.

Run browser tests locally:

\`\`\`sh
npm install
npx playwright install chromium
npm test
\`\`\`

### Credits and privacy

Peach and Goma are characters by Bu Jue Xiao Xiao. The three original SVG flower designs were reused from the user's [For Ash](https://github.com/Wo0f27/for-ash) website. The physical envelope technique was adapted from the same repository, whose source credited the MIT-licensed [animated-envelope](https://github.com/zspxx/animated-envelope) concept. The personal Ash story and messages were not imported.

This repo and its GitHub Pages URL are public. The noindex meta tag asks search engines not to index it; it does not restrict access.
