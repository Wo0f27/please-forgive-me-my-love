# A little letter for you

A small, cutesy-cozy Peach and Goma apology website, published on GitHub Pages.

**Live:** https://wo0f27.github.io/please-forgive-me-my-love/

## Version 7 — a paper letter that unfolds and returns home

The interface is deliberately minimal. There is no header, chapter indicator, visible page arrows, or forced forgiveness interaction. A warm cream-and-blush backdrop replaces Version 6's dark night colors.

The experience contains three connected scenes:

1. **Hey, My Love.** A simple greeting and a gentle invitation button.
2. **The actual letter.** Tap the sealed envelope. Its flap opens and the real parchment rises out **still folded**. Only once it has cleared the pocket does it visibly **unfold** into the long, native-scrollable apology. Near the end are the original three pastel flowers from the Ash garden, blooming on the paper itself.
3. **A soft ending.** At the very bottom of the parchment, tap the **heart**. The sheet visibly **refolds, slips back into the envelope, and seals**, then the final scene opens. The heart is the only visible in-letter close/continue control. There is no upper-right fold button.

Between scenes, the page uses a quiet dissolve and a handful of short-lived floating pastel petals rather than a conventional slider transition. Mobile horizontal swipes work outside the scrollable letter; vertical swipes inside the letter always remain native. Keyboard users can use Escape to return the paper to the envelope without advancing, or use focused navigation controls that remain hidden until tabbed to.

Reduced-motion preferences skip the choreography and show the full flower illustration without motion. The substantive apology text, Peach and Goma illustrations and the previous user-approved "My Love" greeting remain intact.

## The flowers from Ash

The three flowers—peach, cream and lavender, with stems and leaves that grow before their petals open—come directly from the SVG and CSS in the user's [For Ash](https://github.com/Wo0f27/for-ash) site. Only the **flower shapes and their growth mechanism** were reused. Ash's personal messages, dark garden backdrop, unrelated celebrations, and story text were not carried into this apology.

The For Ash flower mechanism credited inspiration from [FIQTOR](https://github.com/FIQTOR) through its THIRD_PARTY_NOTICES.md. The envelope layering was inspired by [zspxx's animated-envelope](https://github.com/zspxx/animated-envelope) (MIT).

## Artwork

Peach and Goma characters were created by Bu Jue Xiao Xiao. The user states the creator/rightsholder gave permission for this public personal project. The user-supplied transparent landing PNG and six separately stored still images under \`assets/stickers/\` ship **inside the repository**, so the website does not require image hotlinks. The images were extracted from previously selected Peach and Goma sticker references, then conservatively cut out to preserve the white-cat silhouette.

## Source and testing

- \`index.html\` — full letter, Ash flower SVG, stationery scene structure.
- \`styles.css\` — cozy blush-and-cream palette, paper stage animation, bloom/petal motion and short-screen layouts.
- \`app.js\` — seven-stage envelope interaction, native scrolling, end-heart progression, gesture/keyboard support.
- \`assets/\` — locally stored art.
- \`tests/site.spec.cjs\` — Playwright tests for mobile and desktop, including short-height and reduced-motion cases.
- \`.github/workflows/site-qa.yml\` — automated Chromium checks.

Runtime requires no build step, analytics, cookies, paid API, external JavaScript or framework. To run browser checks:

\`\`\`sh
npm install
npx playwright install chromium
npm test
\`\`\`

The repository and site are public. The \`noindex\` tag does not make either private.
