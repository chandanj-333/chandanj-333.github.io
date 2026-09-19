# Chandan & Swetha — Wedding Invitation

A premium, mobile-first, fully **static** digital wedding invitation.
Plain HTML, CSS and vanilla JavaScript — no build tools, no backend, no database.
Works by double-clicking `index.html` and on GitHub Pages.

```
/
├── index.html          ← all content & structure
├── style.css           ← design (colours, typography, animations)
├── script.js           ← countdown, calendar, maps, share, music, petals
├── .nojekyll           ← tells GitHub Pages to serve files as-is
├── README.md
└── assets/
    ├── images/         ← put photos here (optional)
    └── audio/          ← music.mp3 or wedding-music.mp3 here (optional)
```

---

## 1. Run locally

**Simplest:** double-click `index.html`. Everything works from `file://`
(countdown, calendar downloads, maps, share to WhatsApp).

**Recommended for testing exactly like GitHub Pages** (any static server works):

```bash
# Python 3
python3 -m http.server 8080
# then open http://localhost:8080

# or Node (no install needed)
npx serve .
```

Test on your phone by opening `http://<your-computer-ip>:8080` on the same Wi-Fi.

---

## 2. Deploy to GitHub Pages

1. Create a new repository on GitHub (for example `wedding`).
2. Push these files to the `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Wedding invitation"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPOSITORY.git
   git push -u origin main
   ```
3. In the repository go to **Settings → Pages**.
4. Under **Build and deployment** choose **Source: Deploy from a branch**,
   select **Branch: `main`** and folder **`/ (root)`**, then **Save**.
5. After a minute the site is live at:
   `https://USERNAME.github.io/REPOSITORY/`

All asset paths are relative, so the site works in a sub-folder like `/REPOSITORY/`
as well as at a custom domain root. No configuration needed.

**WhatsApp link preview image:** WhatsApp needs an *absolute* image URL.
`assets/images/og-image.jpg` is already included. In `index.html`, replace `USERNAME`
and `REPOSITORY` in the `og:image` meta tag with your real GitHub values.

---

## 3. Change wedding details

Everything visible is in **`index.html`** — search for the text you want to change.
The main places:

| What                          | Where in `index.html`                       |
|-------------------------------|---------------------------------------------|
| Hero (cover) names & date     | `<header id="hero">`                        |
| Blessings lines               | `<section class="blessings">`               |
| Invitation card (names, parents, date, muhurtham, lagnam) | `<section id="invitation">` |
| Reception / Muhurtham cards   | `<section id="events">`                     |
| Venue name & address          | `<section id="venue">`                      |
| Family names & addresses      | `<section id="family">`                     |
| Footer text                   | `<footer class="footer">`                   |
| Page title / share preview    | `<title>` and the `og:` meta tags in `<head>` |

Dates, times and links used by the **countdown, calendar, maps and share** live at the
top of **`script.js`** in the `CONFIGURATION` block:

```js
const VENUE = { name, address, mapsLink, lat, lng };
const EVENTS = {
  wedding:   { title, description, start: Date.UTC(2026, 10, 11, 4, 0, 0), end: ... },  // 9:30 AM IST
  reception: { title, description, start: Date.UTC(2026, 10, 10, 13, 30, 0), end: ... } // 7:00 PM IST
};
const SHARE_TEXT = "...";
const RSVP_TEXT  = "...";
```

> Times are written as **UTC** so the countdown is correct in every visitor's timezone.
> IST = UTC + 5:30, so 9:30 AM IST → `Date.UTC(2026, 10, 11, 4, 0, 0)`.
> Note JavaScript months are zero-based: `10` = November.

Colours and fonts are CSS variables at the top of **`style.css`** (`:root { ... }`).

---

## 4. Add background music

1. Put an MP3 at **`assets/audio/wedding-music.mp3`** or **`assets/audio/music.mp3`**
   (keep it under ~3 MB).
2. That's it. The floating music button appears automatically when one of these files exists,
   and stays hidden when neither does.

Music starts when the visitor taps **Open Invitation** (browsers require a tap first).
If a browser still blocks it, the button simply shows the "play" state — the visitor can tap it.
To use a different file name or path, edit the `MUSIC_SOURCES` list at the top of `script.js`.

---

## 5. Add photos

Photos live in **`assets/images/`** (JPG or WebP, ideally under 400 KB each).

| File | Used for |
|------|----------|
| `couple.jpg`   | The arched portrait at the top of the invitation card (`<figure class="card__photo">` in `index.html`). Replace the file to swap the photo; keep it roughly 4:5 or wider. |
| `og-image.jpg` | 1200×630 preview shown when the link is shared on WhatsApp / social. Regenerate it from a new photo if you change `couple.jpg`. |

To add more photos, use a relative path and always include `loading="lazy"` and meaningful `alt` text:

```html
<img src="assets/images/your-photo.jpg" alt="Chandan and Swetha" loading="lazy">
```

---

## 6. Configure the WhatsApp RSVP number

Open **`script.js`** and set the number **with country code, digits only**:

```js
const RSVP_WHATSAPP_NUMBER = "919876543210";   // India: 91 + 10-digit mobile
```

- When the number is empty (`""`) the **RSVP on WhatsApp** button is hidden automatically.
- The pre-filled message is `RSVP_TEXT` in the same block.

---

## Features

- Immersive animated cover with **Open Invitation**
- Invitation card with blessings, parents' names, date, muhurtham & lagnam
- Live **countdown** to 11 Nov 2026, 9:30 AM IST (shows "The Wedding Day Has Arrived ❤️" afterwards)
- Reception & Muhurtham event cards with **View Location**
- Venue with **Open in Google Maps**, **Get Directions**, **Copy Address**
- **Add to Calendar**: Google Calendar or downloadable `.ics` (wedding, reception, or both)
- Family section, WhatsApp **RSVP**, floating **Share** (Web Share API → WhatsApp fallback)
- Optional background music, back-to-top, floating jasmine petals
- Tap **Chandan ❤ Swetha** in the footer for a petal & gold-sparkle burst
- Scroll-reveal animations via `IntersectionObserver`; all decorative motion respects `prefers-reduced-motion`
- Semantic HTML, keyboard navigation, visible focus states, ARIA labels

## Browser support

Modern iOS Safari, Android Chrome, Chrome, Edge, Firefox and Safari on desktop.
