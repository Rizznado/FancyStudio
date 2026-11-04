# Fancy Studio — landing page

Trilingual (Georgian / Russian / English) landing page for **Fancy Studio**, a nail studio at Arnold Chikobava St. 43, Tbilisi.

Plain HTML + CSS + JavaScript — no build step. Open `index.html` or host the folder anywhere (GitHub Pages works as-is).

## Structure
```
index.html            page markup
assets/css/style.css  styles, animations, responsive rules
assets/js/i18n.js     all texts in ka / ru / en  ← edit copy here
assets/js/main.js     language switcher and motion
assets/img/           photos
```

## Language
- Switcher in the header (ქარ / РУС / ENG); the choice is remembered.
- Link straight to a language with `?lang=ka`, `?lang=ru` or `?lang=en`.

## Motion
Preloader, word-by-word hero title, arch image reveal, glitter particles, parallax, floating cards, rotating badge, service marquee, 3D tilt cards, magnetic buttons, custom cursor (desktop), scroll reveals, rating count-up, draggable auto-scrolling gallery with lightbox, and a sticky call button on mobile. Everything is switched off for visitors with "reduce motion" enabled.

## Before going live
- Confirm opening hours (`contact.hours` in `i18n.js`) — currently "11:00 – 20:00".
- Replace the stock photos in `assets/img/` with the studio's own work (same filenames).
- Photos: Unsplash (free to use under the Unsplash License).
