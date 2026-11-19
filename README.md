# A little letter for you

A cozy Peach and Goma apology website hosted on GitHub Pages.

**Live:** https://wo0f27.github.io/please-forgive-me-my-love/

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

The local PNG art is packaged under \`assets/\` and does not depend on third-party image hosts at runtime. The user says the rightsholder gave permission for use in this public personal project.

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
