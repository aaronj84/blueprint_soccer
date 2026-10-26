# Blueprint Soccer — BHS Blueprint, CFC Red & CFC Red Futsal

Interactive tactical learning for Brighton’s program:

- **BHS Blueprint** — 11v11 Fresh/Soph Blue (4-3-3 / 2-3-5 / 4-4-2)
- **CFC Red** — U12 boys 9v9 (4-1-2-1 / 2-3-3). Outdoor. Not the futsal model.
- **CFC Red Futsal** — U12 boys futsal. Four outfield jobs (High, Low, Left, Right), Zone 14, keeper in buildup, and a compact diamond that can flex. Players rotate. The spaces get rebalanced. There is no official attacking-system nickname yet.

Vanilla HTML, CSS, and JavaScript. No build step. Progress is saved in `localStorage` on the device only, one key per pack.

The Varsity Shot Tracker lives in a separate repo: [`bhs_shot_tracker`](https://github.com/aaronj84/bhs_shot_tracker).

## Run locally

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Coach mode

Add `?coach=1` to the URL (e.g. `http://localhost:8080/?coach=1#attack-01`).

## Module admin

The gear at the top right opens Settings. **Manage modules** asks for a passkey, then turns areas and individual modules on or off.

Choices are saved on this device only (`blueprint-module-visibility`). The starting setup has **BHS Blueprint off**, **CFC Red on**, and **CFC Red Futsal on**. A module toggle affects only that module. Other devices keep the starting setup until changed there.

Direct link: `#admin`.

## Deep links

| Hash | Opens |
|------|--------|
| `#home` | Hub (areas that are turned on) |
| `#admin` | Module admin (passkey) |
| `#blueprint` | BHS Blueprint modules |
| `#basics` `#attack` `#wide` `#support` `#defense` `#corner` | BHS modules |
| `#challenge` `#glossary` | BHS challenge / glossary |
| `#cfc-red` | CFC Red modules |
| `#cfc-basics` … `#cfc-corner` | CFC modules |
| `#cfc-challenge` `#cfc-glossary` | CFC challenge / glossary |
| `#cfc-futsal` | CFC Red Futsal modules |
| `#futsal-four-jobs` `#futsal-zone14` `#futsal-rotation` `#futsal-keeper` `#futsal-finish` | Futsal attack modules |
| `#futsal-diamond` `#futsal-motion` `#futsal-transitions` | Futsal defend modules |
| `#futsal-challenge` `#futsal-glossary` | Futsal challenge / glossary |
| `#futsal-zone14-01` (any futsal scenario id) | Specific futsal scenario |
| `#attack-01` (any scenario id) | Specific scenario |

## Project structure

```text
/
  index.html
  styles.css
  app.js                 # Multi-pack engine (pitch, interactions, progress, coach)
  scenarios.js           # BHS Blueprint pack (window.SoccerIQ)
  cfc-red-scenarios.js   # CFC Red outdoor pack (window.CfcRedIQ)
  cfc-futsal-scenarios.js # CFC Red Futsal pack (window.CfcFutsalIQ)
  SLIDES_BRIEF.md
  assets/logo.svg
```

Each pack exposes `CONFIG`, `GLOSSARY`, `NAV_GROUPS`, `MODULES`, and `SCENARIOS`. `app.js` binds one pack at a time. Pack ownership is explicit (`PACK_META`), so a futsal id is never treated as outdoor CFC.

## Court

Outdoor packs draw a grass pitch from `CONFIG.pitch` width and length (BHS 68×105, CFC 9v9 uses the same outdoor markings). Futsal sets `CONFIG.pitch.kind = "futsal"` and uses its own court: **x = 0–20 m across, y = 0–40 m long, attack toward the top**. Markings are a 3 m goal, a 3 m center circle, halfway, and 6 m penalty arcs at both ends (quarter-circles from the posts, joined in front of the goal), plus penalty marks at 6 m and 10 m. Zone 14 is the central pocket just outside the opponent’s arc — the futsal version of the outdoor space immediately outside the other team’s box. It does not follow the ball.

## Progress keys

- BHS: `brighton-soccer-iq-progress`
- CFC Red: `cfc-red-soccer-iq-progress`
- CFC Red Futsal: `cfc-futsal-soccer-iq-progress`

Existing keys are left in place. Reset in Settings clears the pack you are in.

## Futsal content notes

Coach-facing, not a player gate. A useful first stretch of practices: (1) four jobs and show/clear, (2) Zone 14 arrival, exchange, and when to stay, (3) compact diamond, shift, pressure plus cover, and the turnover, (4) keeper buildup, finishing, and the mixed challenge.

Assumptions kept out of the lessons as rules:

- No league back-pass, re-touch, or restart law. The keeper lessons teach a safe pass to his feet and a simple outlet.
- No set-piece routines until the coach supplies them. Outdoor corners are not copied onto the futsal court.
- 3-1 and 1-3 are counts of that diagram, read from their goal toward ours. They are not permanent names for “high press” and “low block.”
- “Blender” is not an official requirement. The cues players see are “Arrive in 14. Don’t live in 14.” and “Show, create, or clear.”

## Deploy

GitHub Pages from the repo root (`main`, `/`). `.nojekyll` is included.
