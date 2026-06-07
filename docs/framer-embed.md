# Embedding the SNDBTS web demo in Framer

The interactive demo is deployed to GitHub Pages when changes land on `main`/`master`.

## Demo URL

After enabling GitHub Pages (Settings → Pages → Source: **GitHub Actions**), the demo will be at:

```
https://hndrsn-dev.github.io/soundbites/
```

## Embed in your case study

1. Open your SNDBTS case study page in Framer.
2. Add an **Embed** component (or **iframe** block).
3. Set the URL to `https://hndrsn-dev.github.io/soundbites/`.
4. Size the embed responsively — recommended min height **560px**, width **100%** of the content column (max ~720px matches the launcher).
5. Preview on desktop and mobile; the demo is keyboard-driven but also works with click/tap.

## What visitors can do

- Fuzzy-search ~90 curated sounds
- Play/stop with Enter or click
- Navigate with arrow keys
- Toggle dark/light theme with `⌘/`

Library editing and global shortcuts require the downloadable macOS app.

## Updating the demo

```bash
npm run build:web-demo   # local preview in web-demo/
git push                 # CI rebuilds and redeploys automatically
```

To change which sounds appear, edit selection logic in `scripts/build-web-demo.js`.
