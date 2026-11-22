# Make It Count — web app

A plain HTML/CSS/JS installable PWA built from [`../SPEC.md`](../SPEC.md). There's no build step and no dependencies.

## Run locally

```bash
python3 -m http.server 8123 --directory app
```

Then open http://localhost:8123. Service workers only run over `https` or on `localhost`, so opening `index.html` as a file won't make it installable.

## Install

- **Chrome / Edge (desktop or Android):** use the "Install app" link on the home screen, or the install icon in the address bar.
- **iOS Safari:** Share → Add to Home Screen.

To install it on a phone, host the `app/` folder on any static HTTPS host (GitHub Pages, Netlify, Cloudflare Pages). All paths are relative, so a subfolder works.

## Structure

| File | What it does |
|---|---|
| `index.html` | Shell, meta tags, and the manifest link |
| `styles.css` | Visual language from spec §7 |
| `js/model.js` | Lever types, copy tables, and the loose projection model (§5.2.2, §6) |
| `js/app.js` | Screens: home, decision (drag NOW), add/edit lever; hash routing; backup |
| `js/storage.js` | `localStorage` persistence (key `make-it-count:v1`) |
| `sw.js` | Network-first, with an offline cache of the app shell and Google Fonts |
| `manifest.webmanifest`, `icons/` | PWA metadata and icons |

## Data

Everything stays in `localStorage` on the device, with no account (spec §8). The home footer has **Back up** (download JSON) and **Restore**. The app also asks the browser to keep its storage persistent once you add a lever.

Model: `levers[]` holds `{ id, type, name, vals, created }`. `events[]` holds `{ id, leverId, t, c: 'y' | 'n' }`, where `y` is the good choice.

## Accessibility

The decision chart is a focusable `role="slider"`. Use ↑/↓ to move NOW, Enter to commit (once past 60%), and Esc to reset. The screen reader reads out the projection text as the value.
