# SarvamSai — Project Context for New Chat

Paste this entire document at the start of a new Claude chat to continue exactly where we left off.

---

## Project Overview

**Site:** https://sarvamsai.in  
**GitHub:** https://github.com/auraaz/SarvamSai (branch: main, GitHub Pages)  
**Cloudflare:** DNS + CDN in front of GitHub Pages  
**Admin email:** vinnakota.gupta@gmail.com  

SarvamSai is a devotional, net-zero collectible Mystery Box honouring the centenary of Bhagawan Sri Sathya Sai Baba (1926–2026). 100 Mystery Boxes released daily for 100 days (24 Apr – 1 Aug 2026). 10,000 total.

---

## File Structure (GitHub repo root)

```
index.html          — Main single-page site
styles.css          — All CSS (WARNING: Cloudflare truncates this — see Critical Notes)
main.js             — All JavaScript
sarvamsai_apps_script.js  — Google Apps Script backend (deploy separately)
robots.txt          — AI + search crawler permissions
sitemap.xml         — Site sitemap with image metadata
llms.txt            — AI model context file
sarvamsai-og.png    — Social share image (1200×1200 square)
figurine-hero.png   — Hero section illustration (ivory bg, transparent)
centenary-emblem.png — 100 Years centenary emblem
swaroopa-saffron.png — Satya collectible card image
swaroopa-golden.png  — Dharma collectible card image
swaroopa-white.png   — Shanti collectible card image
swaroopa-crimson.png — Prema collectible card image
sarvam_sai_box.webp  — 3D box texture (hosted on GitHub raw)
satyasai_100.webp    — Box top/bottom texture (hosted on GitHub raw)
```

---

## Critical Notes — Cloudflare Issues

**THE MOST IMPORTANT THING:** Cloudflare's Rocket Loader and CSS minifier break the site.

**Rule 1 — CSS:** Cloudflare truncates `styles.css` at ~40KB. Any new CSS must be added as `!important` rules inside the `<style id="critical-inline">` tag in `<head>` of `index.html`. Never rely on styles.css for critical layout.

**Rule 2 — JavaScript:** Cloudflare's Rocket Loader strips inline `<script>` tags near `</body>`. Any critical JS functions must either:
- Go inside `<script data-cfasync="false">` tags
- Or be added to the existing inline countdown script block

**Rule 3 — Caching:** After every push to GitHub, go to Cloudflare → Caching → Purge Everything.

**Rule 4 — Cache busting:** `index.html` loads CSS and JS with version params (`styles.css?v=23`, `main.js?v=23`). Increment these on every push.

**Current version:** v=23

**Currently inlined critical scripts (data-cfasync="false"):**
1. Floating CTA scroll show/hide logic
2. FAQ accordion toggleFaq function
3. Countdown timer IIFE

---

## Design System

```css
--ivory:   #faf6ef
--cream:   #f3ece0
--gold:    #9a7520
--burgundy: #5a1520
--ink:     #0d0702
--muted:   #6b5a3e
--border:  #e8dcc8
--border-str: #d4c8b0
```

**Fonts:** Cinzel (headings/UI), Cormorant Garamond (italic/devotional), EB Garamond (body)  
**Loaded from:** Google Fonts in `<head>`

---

## Backend — Google Apps Script

**Sheet URL:** https://docs.google.com/spreadsheets/d/1G6PoyxfqGFaH54Vu3doMV0_vK04hL61sXk6XOsBNfa0/edit  
**Apps Script URL (current):** `https://script.google.com/macros/s/AKfycbydYU5rFJyss7YfcRqg2gC5JU5VcktvKlgrCkvAz_a-1mxJJvcqrV_G8AQr_W6SjtjaLg/exec`  
**In main.js:** `const API = '...'` on line ~121

**Sheet tabs:**
- `Sheet1` — registrations: name | email | referred_by | invite_count | rank | timestamp | samithi_id | samithi_name | samithi_city
- `Samithis` — auto-created: id | name | city | phone | member_count | created_by | timestamp

**Actions supported:**
- `register` — registers a devotee, sends confirmation email, notifies admin
- `getUser` — returns user data by email
- `leaderboard` — returns top devotees ranked by invite_count
- `getSamithis` — returns all Samithis for search dropdown
- `addSamithi` — creates new Samithi and joins devotee to it
- `joinSamithi` — joins devotee to existing Samithi
- `samithiLeaderboard` — returns Samithis ranked by member_count

**When to redeploy Apps Script:** Every time `sarvamsai_apps_script.js` changes, go to script.google.com → Deploy → New Deployment → Web App → Anyone → copy new URL → update `const API` in `main.js`.

---

## Site Sections (in order)

1. **Hero** — figurine-hero.png, title, subtitle with transmedia fund mention, badge
2. **About Baba** — centenary emblem, 3 paragraphs, Human Values, present tense throughout
3. **CTA** — registration form → registered dashboard (rank, invites, social share, samithi leaderboard)
4. **Product** — 3D CSS box, specs, care note, Swaroopa collectible cards (2×2 grid)
5. **Carousel** — 4 Swaroopas with robe/value descriptions
6. **Process** — 4 steps with grace buffer and multiple boxes copy
7. **Mission** — net-zero/transmedia fund quote, Phase I/II/III, size comparison
8. **Team** — K/S/A with governance line
9. **FAQ** — accordion, 6 questions, toggleFaq inline script
10. **Share** — 6 platform buttons
11. **Footer** — tagline, nav links, contact plain text (no mailto — Cloudflare obfuscates)
12. **Floating CTA** — fixed bottom bar, shows after 500px scroll, hides at #cta and #footer
13. **Samithi Modal** — appears 2s after registration, search/add/join flow

---

## Registered Dashboard (post-registration)

Shows after successful email registration:
- Rank card with queue position + invite count + rank movement indicator
- Invite link with copy button + 4 social share buttons (WhatsApp/Twitter/Telegram/LinkedIn)
- Community of Devotees leaderboard (ranked by invites)
- Samithi & Satsang Nominations leaderboard (ranked by member_count)

**LocalStorage key:** `ss_email`  
**Referral mechanic:** `sarvamsai.in/?ref=<email>`

---

## Samithi / Nomination Feature

- Modal appears 2 seconds after registration (only if user has no samithi_id)
- Devotee nominates their Samithi, Satsang or devotional group
- Search existing Samithis, or add new (name, city, phone)
- Each nomination increments member_count in Samithis sheet
- Samithi leaderboard visible only to registered devotees
- Language: "nominate" not "register/join"

---

## SEO & AI Discoverability

Added to `<head>` of index.html:
- Full meta description and keywords
- Open Graph tags (og:title, og:description, og:image, og:type)
- Twitter Card (summary_large_image)
- Canonical URL
- Robots meta (index, follow, max-image-preview:large)
- Googlebot + Bingbot meta
- JSON-LD structured data: WebSite, Organization, Product, FAQPage, Event, 3× Person

Files in repo root:
- `robots.txt` — explicitly welcomes GPTBot, ChatGPT-User, Claude-Web, PerplexityBot, anthropic-ai
- `sitemap.xml` — with image metadata
- `llms.txt` — markdown context file for LLMs

---

## Key Copy Decisions

- Baba always in **present tense** (He is Ananta — without beginning, without end)
- "Human Values" not pillars/teachings
- "Mystery Box" throughout
- "Join the Queue" (not "Register" or "Buy")
- "Nominate" for Samithi (not register/join)
- "Carry His Grace Forward" (share section)
- "Blessing" not "purchase" wherever possible
- Process step 3: "Missing an invite does not mean losing grace"
- "You do not choose your Swaroopa. You receive the one that was always meant for you."

---

## Pending / Known Issues

- [ ] Config.js approach for SCRIPT_URL not yet implemented (currently hardcoded in main.js)
- [ ] WhatsApp Business number not yet in flow (removed)
- [ ] Team member profile photos not yet added (monogram avatars K/S/A)
- [ ] Pricing not yet set (committed to net zero profit)
- [ ] Cloudflare: disable CSS Minify and Rocket Loader in Speed → Optimization
- [ ] Cloudflare: Email Obfuscation should be OFF (contact email in footer is plain text as workaround)
- [ ] Apps Script: needs redeployment any time sarvamsai_apps_script.js changes

---

## How to Continue in a New Chat

1. Start a new Claude chat
2. Paste this entire document
3. Say: "Continue building the SarvamSai website. Here is the full project context."
4. Claude will have everything needed to continue seamlessly.

**Tip:** Also upload any relevant output files (index.html, styles.css, main.js) if you need code-level changes, as Claude won't have the file contents from this context alone.
