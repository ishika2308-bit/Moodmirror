# MoodMirror — Your Emotional Sanctuary

> A companion for the thoughts you don't always say out loud.

MoodMirror is a private journaling and emotional reflection companion for Android. It quietly observes the patterns of your life — no dashboards, no tracking, no cloud. Just you and your mirror.

**Publisher:** Sunshine Pvt. Ltd.  
**Platform:** Android  
**Current Release:** v1.0 Gift Edition — June 2026

---

## Website

This repository contains the **marketing website** for MoodMirror, built with React + Vite + TypeScript.

It is intentionally separate from the Android app source code.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| 3D / Canvas | Three.js, React Three Fiber |
| Animation | Framer Motion |
| Smooth Scroll | Lenis |
| Styling | Tailwind CSS v4 |

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## Deployment (Vercel — Recommended)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import `anveshr312-bit/moodmirror-web`
4. Framework: **Vite** (auto-detected)
5. Build command: `npm run build`
6. Output directory: `dist`
7. Click **Deploy**

---

## APK Distribution

The Download button links to the GitHub Release asset.

To update the APK:
1. Go to **Releases** → **Draft a new release**
2. Tag: `v1.0.0`, Title: `v1.0 Gift Edition`
3. Upload `MoodMirror.apk`
4. Publish release

The download URL pattern is:
```
https://github.com/anveshr312-bit/moodmirror-web/releases/download/v1.0.0/MoodMirror.apk
```

---

## Disclaimer

MoodMirror is a personal reflection and journaling companion.  
It is not intended to provide medical, psychiatric, or crisis intervention services.

---

## License & Branding

© Sunshine Pvt. Ltd. All Rights Reserved.

MoodMirror and the MoodMirror logo are trademarks of Sunshine Pvt. Ltd.
