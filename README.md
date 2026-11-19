# A little letter for you

A quiet, responsive Peach and Goma apology experience, hosted on GitHub Pages.

**Site:** https://wo0f27.github.io/please-forgive-me-my-love/

## Version 3 design

Unlike Version 2, there is no header, navigation bar, arrow buttons, chapter numbering, progress dots, or imposed pagination.

- Swipe horizontally between six moments; desktop keyboard Left/Right arrows work too. Keyboard-accessible previous/next controls appear only on focus.
- The envelope opens in two physical stages, adapted from the user's [For Ash](https://github.com/Wo0f27/for-ash) website. Tap the extracted paper to fold it back.
- **The letter is one continuous scrollable parchment** with a visible torn-paper ending. Vertical swipes on the parchment scroll it rather than navigating away.
- A small heart at the parchment's end opens the closing scene. Nothing asks for forgiveness or forces a reply.
- The rest of the site is deliberately restrained: dark cozy surroundings, warm paper, minimal interface text and no gratuitous animations.
- Reduced-motion support, focus indicators, semantic sections and responsive layout.

## Art

- \`assets/peach-goma.webp\`: user-supplied Peach and Goma artwork, stored locally.
- Two additional Peach and Goma illustrations are linked from Tenor and used only in reflection, letter and closing scenes. Their **image sources** are:
  - https://media.tenor.com/0D5fTCGQzZIAAAAe/sending-hugs.png
  - https://media.tenor.com/zBljNGMfvlAAAAAe/couple-tear.png

These are images of characters created by **Bu Jue Xiao Xiao**; they are **not verified as official creator-hosted uploads**. The user reports permission to use these characters on this public personal site. The external sources can change or go offline. If an image fails to load, the site falls back to the local user-supplied asset. Official artist resources: https://blog.peachandgoma.com/p/about.html and https://t.me/peachandgoma.

## Development

Runtime is plain \`index.html\`, \`styles.css\` and \`app.js\`. No CDN frameworks, build system, cookies or analytics are required.

A separate, **development-only** test suite runs browser interaction checks using Playwright. To test locally with Node.js:

\`\`\`sh
npm install
npx playwright install chromium
npm test
\`\`\`

The \`Site browser QA\` GitHub Actions workflow tests desktop and mobile-sized Chromium viewports, the envelope, swipe behavior, and native parchment scrolling before publishing revisions.

## Credit

Envelope layering developed from the user's For Ash repository, which used the MIT-licensed concept in https://github.com/zspxx/animated-envelope. Third-party characters and images remain credited to their respective artists. This is an unofficial, non-commercial personal website.

This repository is public. \`noindex\` requests that search engines not index the site; it **does not** make it private.
