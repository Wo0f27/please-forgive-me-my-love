# A little letter for you

A dark, cozy Peach and Goma apology website. This is a small personal site, not a frontend framework demo.

**Live:** https://wo0f27.github.io/please-forgive-me-my-love/

## Reading the letter

Open the envelope to reveal the actual full apology. The paper lifts from the envelope pocket and expands into a single, vertically scrollable parchment. There is no separate preview letter, artificial page break, or secondary long-letter scene.

- The fold-shaped corner at the top-right of the paper closes the letter, even on mobile.
- Closing the letter remembers your reading position, which is restored after opening it again.
- The reader uses native scrolling, but the scrollbar is visually hidden to reduce the sense of a web panel. A softly curled top and actual ragged paper end give it a continuous stationery appearance.
- On short desktop browser windows and small mobile viewports, the fully open letter stays within the viewport. It does not inherit the compact positioning used only by the opening animation.
- Swipe between the opening and the envelope. Vertical scrolling inside the letter does not change scenes; at the end, a little heart opens the final message.
- Keyboard users can press Escape to close the letter and use focus-revealed navigation controls. Reduced-motion preferences are respected for site transitions.

## Artwork

Peach and Goma are created by Bu Jue Xiao Xiao. The user has reported explicit permission to use the artwork on this personal public website.

The landing and the envelope companion use the same **locally hosted transparent PNG**, from the image supplied by the user. Other illustrations originate from the seven Tenor image references in earlier versions.

For durability, the one-time \`tools/vendor_stickers.py\` utility can download six of those references to \`assets/stickers/\`, convert animated files to still images (to respect quiet reading and reduced motion), and remove only *border-connected near-white matte areas*. It keeps the original subjects; it does not generate new drawings. The utility changes image paths in \`index.html\` only when an image has been saved successfully.

If an external image could not be vendored, its original URL remains and the existing local transparent illustration is used as a fallback. Static assets are preferable to a third-party image hotlink for long-term reliability.

The site is unofficial and makes no claim of endorsement by the creator.

## Editing and testing

The runtime uses plain HTML, CSS and JavaScript:

- \`index.html\` — actual letter, visuals and the three scene sections.
- \`styles.css\` — dark rose nighttime room, envelope layers, responsive parchment.
- \`app.js\` — opening/folding, saved reading position, scrolling, swipes and keyboard handling.
- \`assets/\` — locally stored, user-authorized images.
- \`tests/site.spec.cjs\` — Playwright browser checks including 390×640, 360×600, 1280×614 and landscape 844×390.
- \`.github/workflows/site-qa.yml\` — GitHub-hosted browser QA on pull requests and main branch.

No client-side framework, external scripts, cookies, analytics or paid API is needed.

To test locally:

\`\`\`sh
npm install
npx playwright install chromium
npm test
\`\`\`

The envelope construction adapts the user's For Ash website and the MIT-licensed idea from https://github.com/zspxx/animated-envelope.

**Privacy:** The repository and GitHub Pages site are public. The \`noindex\` tag is not authentication or access control.
