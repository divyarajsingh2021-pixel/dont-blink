# ⚡ DON'T BLINK — Reflex Arcade Mini-Game

An indie reaction-time challenge browser game configured for 1-click deployment on **Vercel** with **Google AdSense** monetization.

---

## 🚀 Deploying to Vercel

### Option 1: Vercel CLI (Recommended)
From this directory:
```bash
npx vercel
```
- Set up and deploy: Choose **Yes** (`Y`)
- Scope: Your Vercel account
- Link to existing project: **No**
- Project Name: `dont-blink-arcade`
- Directory: `./` (hit Enter)
- Want to modify settings: **No**

To deploy directly to production:
```bash
npx vercel --prod
```

### Option 2: Deploy via GitHub / GitLab
1. Push this folder to a GitHub repository.
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New Project"**.
3. Import your repository. Vercel will automatically detect `vercel.json` and deploy it instantly with custom SSL, clean URLs, and global edge caching!

---


## 🎮 Arcade Features

- **High-Precision Timing:** Measured with sub-millisecond precision using `window.performance.now()`.
- **4 Game Modes:** Classic 5-Round, Tricky Flashes (Deception), Sudden Death, and Daily Seed Challenge.
- **Web Audio Sound Engine:** 100% offline synthesized 8-bit/arcade sound effects (no external audio files needed).
- **Haptic Tactile Feedback:** Integrated with mobile `navigator.vibrate`.
- **Viral Growth Engine:** Custom duel URLs (`?vs=...`), WhatsApp 1-click sharing, and dynamic 1200x675 exportable graphic result cards.
- **Local Hall of Fame & 8 Achievements:** Persisted across sessions via `localStorage`.
