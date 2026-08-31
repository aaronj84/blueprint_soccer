# Blueprint Soccer — BHS Blueprint & CFC Red

Interactive tactical learning for Brighton’s program:

- **BHS Blueprint** — 11v11 Fresh/Soph Blue (4-3-3 / 2-3-5 / 4-4-2)
- **CFC Red** — U12 boys 9v9 (4-1-2-1 / 2-3-3)

Vanilla HTML, CSS, and JavaScript. No build step. Progress is saved in `localStorage` on the device only.

The Varsity Shot Tracker lives in a separate repo: [`the_blueprint`](https://github.com/aaronj84/the_blueprint).

## Run locally

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Coach mode

Add `?coach=1` to the URL (e.g. `http://localhost:8080/?coach=1#attack-01`).

## Deep links

| Hash | Opens |
|------|--------|
| `#home` | Hub (both packs) |
| `#blueprint` | BHS Blueprint modules |
| `#basics` `#attack` `#wide` `#support` `#defense` `#corner` | BHS modules |
| `#challenge` `#glossary` | BHS challenge / glossary |
| `#cfc-red` | CFC Red modules |
| `#cfc-basics` … `#cfc-corner` | CFC modules |
| `#cfc-challenge` `#cfc-glossary` | CFC challenge / glossary |
| `#attack-01` (any scenario id) | Specific scenario |

## Project structure

```text
/
  index.html
  styles.css
  app.js                 # Multi-pack engine (pitch, interactions, progress, coach)
  scenarios.js           # BHS Blueprint pack (window.SoccerIQ)
  cfc-red-scenarios.js   # CFC Red pack (window.CfcRedIQ)
  SLIDES_BRIEF.md
  assets/logo.svg
```

## Progress keys

- BHS: `brighton-soccer-iq-progress`
- CFC Red: `cfc-red-soccer-iq-progress`

## Deploy

GitHub Pages from the repo root (`main`, `/`). `.nojekyll` is included.
