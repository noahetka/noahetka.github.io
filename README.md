# Friday Night MTB — Static Site Starter

A lightweight, **accountless** website to publish your Friday night MTB race dates, times, locations, and (afterward) photos. No logins for visitors; simple JSON data for you to update.

## Features
- **Arena-select** style horizontal carousel with keyboard (◄ ►), edge-click, and touch drag.
- **Locked events** until 48 hours before start, with a live **countdown** to unlock.
- **Upcoming / Live / Past** badges with a progress bar.
- **Post-race photos** auto-rotate (no clicking) after an event ends.
- 100% static: HTML + CSS + JS. Host for free on GitHub Pages or Netlify.

## Quick start
1. Open `index.html` locally to preview.
2. Edit `assets/data/events.json` to set your real dates, times, and locations.
   - Use ISO 8601 with timezone offset, e.g. `2025-08-15T18:30:00-04:00` (Eastern Daylight Time).
   - Each event can list a `gallery` of image URLs (relative like `assets/img/photo1.jpg`).
3. Drop photos into `assets/img/` and list them in the event’s `gallery` array.
4. Deploy to the web:
   - **GitHub Pages**: push files to a repo → Settings → Pages → Source: `main`.
   - **Netlify**: drag‑and‑drop this folder into the dashboard or connect your repo.

## Data format (`assets/data/events.json`)
```json
{
  "events": [
    {
      "id": 1,
      "title": "Round title",
      "startsAt": "2025-08-15T18:30:00-04:00",
      "endsAt":   "2025-08-15T20:00:00-04:00",
      "location": "Trailhead name, City, State",
      "note": "Optional short note for parking or course details.",
      "gallery": ["assets/img/photo1.jpg", "assets/img/photo2.jpg"]
    }
  ]
}
```
- Events **unlock 48 hours** before `startsAt`. Before that, they’re labeled **LOCKED** and show a countdown to unlock.
- If `endsAt` is omitted, it assumes same as `startsAt`.
- After `endsAt`, if `gallery` has images, the background subtly **cycles** them every few seconds.

## Tips
- Keep images around 1600px wide for quality vs. size; use `.webp` if possible.
- You can update `events.json` from your phone using the GitHub app to make quick changes on the go.
- All times render in the viewer’s local timezone label, but set with your Eastern offset so countdowns are correct.

## Customization
- Colors and spacing live in `assets/css/styles.css` (`:root` variables).
- Unlock window: change `UNLOCK_LEAD_MS` in `assets/js/app.js`. Default is 48 hours.

## No clicks?
The site has no links for visitors. Navigation is via arrows/touch. Photos auto‑rotate after events; nothing opens new pages.

Ride on 🤘
