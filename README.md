# A little letter for you

An intimate, mobile-first Peach and Goma apology site hosted on GitHub Pages.

**Live:** https://wo0f27.github.io/please-forgive-me-my-love/

## Version 4 — the letter really comes out of the envelope

The previous version opened a short preview note and placed the real letter on a later scene. This version fixes that by making **the envelope’s paper itself the complete letter**:

1. Open a quiet introduction and continue to the sealed envelope.
2. Tap the envelope. Its flap opens; a small part of the actual paper rises behind the envelope pocket.
3. The **same DOM element** expands into a tall, full-height parchment. It is natively scrollable and contains the complete apology, illustrations, and final sign-off. There is no separate letter page, preview message, or repeated letter.
4. At the true end of the parchment, a small heart leads to the closing message.

There are only three scenes, no fixed header, navbar, chapter numbering, or visible arrow buttons. Swipe to change scenes when not reading; **vertical swipes inside the parchment stay native** and horizontal swipes cannot accidentally skip the letter before the end. Escape folds the letter back. Keyboard-only reading controls become visible when focused.

### Peach and Goma art

Version 4 contains **eight image placements with eight distinct sources**: the user's existing locally hosted illustration, a companion sticker beside the envelope, five illustrations throughout the parchment, and an ending illustration.

All new illustration links are to real Peach and Goma character stickers returned by online image search. The externally hosted URLs are:

- https://media.tenor.com/R5hcw0c8l_sAAAAe/peachcat-peachcat-and-goma.png
- https://media.tenor.com/7Qz2iamu4egAAAAi/peach-goma-sad-tears.gif
- https://media.tenor.com/Ca7voVE7eoUAAAAC/peachcat-peachcat-and-goma.gif
- https://media1.tenor.com/m/SnuIjjNClm4AAAAC/peach-goma.gif
- https://media.tenor.com/qSGlyWc8uv8AAAAi/peach-goma-kiss-peach-and-goma.gif
- https://media.tenor.com/zBljNGMfvlAAAAAe/couple-tear.png
- https://media.tenor.com/0D5fTCGQzZIAAAAe/sending-hugs.png

**Reliability note:** Tenor hosts these assets externally; we have not incorporated them as permanent files in the repository. Each has an error fallback to \`assets/peach-goma.webp\`, the user-supplied picture. If Tenor blocks or removes an image, that illustration will be replaced by the local fallback, potentially reducing visible variety. Images are credited to Bu Jue Xiao Xiao, creator of Peach and Goma. The user has stated that they received permission to use the characters and art on this personal public site. Official creator: https://blog.peachandgoma.com/p/about.html.

### Implementation

- \`index.html\`: exact letter text, physical envelope, inline art and closing.
- \`styles.css\`: cozy nighttime styling, envelope layers and one long scrollable parchment.
- \`app.js\`: envelope stage transitions, scene navigation, input handling, accessibility and image fallbacks.
- \`assets/peach-goma.webp\`: locally stored user-supplied illustration.
- \`tests/site.spec.cjs\`: Playwright interaction and desktop/mobile layout tests.
- \`.github/workflows/site-qa.yml\`: runs browser tests on PRs and main-branch changes.

No framework, third-party JavaScript, tracking, cookies, network API or subscription is needed to run the site. Only the new illustrations currently use third-party hosting.

Run checks locally:

\`\`\`sh
npm install
npx playwright install chromium
npm test
\`\`\`

### Credit and privacy

The envelope mechanism is adapted from the user's For Ash website, which used the MIT-licensed [zspxx animated-envelope layering approach](https://github.com/zspxx/animated-envelope). Character art belongs to its creator and rightsholders. This is an unofficial, non-commercial personal website. The repository and the Pages site are public; the noindex tag does not make them private.
