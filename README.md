# I Should Have Listened — Cozy Night Edition (Version 2)

A small, dark-but-cozy, interactive apology experience featuring Peach and Goma.

**Live (after deployment):** https://wo0f27.github.io/please-forgive-me-my-love/

## Version 2 changes

The previous vertically scrolling cream-colored site has been replaced with **six full-screen scenes**:

1. Hey, love — a soft nighttime introduction
2. A little letter — physical envelope animation
3. You deserved to be heard — what went wrong
4. What I understand / What I'll work on — three paired notes
5. From me, to you — the full apology, paginated into **four paper pages**
6. With all my love — a calm closing, without any request for forgiveness

The experience uses buttons, left/right arrow keys, or horizontal swipes. The main page never scrolls; even the longer letter uses page transitions rather than a nested scrollbar. The site respects reduced-motion preferences and works without JavaScript frameworks, external fonts, backend services, audio, tracking or cookies.

### Envelope behavior

The envelope is based on the layered construction in the user-owned [For Ash](https://github.com/Wo0f27/for-ash) birthday website.

- The flap opens first.
- A folded sheet rises from **behind the front pocket**.
- Once it has cleared the pocket, the paper expands over the envelope.
- Tap the paper to fold it and tuck it away again, or choose **Read what I need to say** to continue.

The For Ash envelope mechanism was itself inspired by [zspxx/animated-envelope](https://github.com/zspxx/animated-envelope) (MIT), crediting [Josh Nichols' CSS envelope](https://codepen.io/MrBlank/pen/JjXxovL). The envelope interaction, scene navigation and styling here are adapted for this separate personal project.

## Editing

- \`index.html\`: scene markup and visible short copy.
- \`styles.css\`: midnight-blue night theme, warm rose and amber accents, responsive layouts.
- \`app.js\`: scene and navigation state, three combined realization/commitment notes, paginated letter, envelope sequence. Update the \`acknowledgments\` and \`pages\` arrays to personalize the writing.
- \`assets/peach-goma.webp\`: illustration originally supplied by the user in this ChatGPT conversation.
- \`.nojekyll\`: prevents Jekyll processing on GitHub Pages.

Open \`index.html\` locally or serve the repository with a simple HTTP server for testing. There is no build step.

## Privacy and permissions

This is a **public** GitHub repository and a public Pages site. A noindex meta tag is not access control. Do not publish private messages, names, screenshots or other sensitive details without consent.

**Peach and Goma characters and illustration remain the property of their creator/rightsholders.** The included user-supplied image is not covered by a software license and is an unofficial placeholder for personal review. Obtain permission for publicly hosting/redistributing this image or replace it with art you are authorized to publish. No endorsement by the creator is implied.

## Tone

The recipient is free to leave at any time. There are no "forgive me" / "stay with me" buttons, countdowns, trackers, demands for a reply or mandatory interactions. The website does not substitute for a real conversation and meaningful, sustained changes in behavior.
