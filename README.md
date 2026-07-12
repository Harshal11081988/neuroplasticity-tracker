# 🧠 Neuroplasticity & Cognitive Training Tracker

Three neuroscience-backed cognitive tasks, played in-browser, with a
session dashboard so you can watch your own scores trend across
repeated attempts — the actual signature of neuroplasticity (change
with practice), not just a one-off measurement.

> ⚠️ Educational self-tracking tool, not a validated clinical
> assessment. Score history is **session-only** (see Architecture
> below for why, and how to keep a permanent record).

## The three tasks

1. **N-Back** (1/2/3-back difficulty) — the task most directly tied to
   working-memory training research. Watch a stream of letters; press
   space whenever the current letter matches the one shown N steps back.
2. **Corsi Block-Tapping Span** — classic visuospatial working memory
   test. Reproduce an increasingly long sequence of flashed block
   positions in order.
3. **Simple Reaction Time** — processing speed, measured via
   millisecond-precision click latency.

After each attempt, copy the generated result line and paste it into
the "Log a result" box to add it to your progress dashboard, which
plots your scores across attempts within the session.

## Architecture — why it's built this way

**Games run entirely client-side (HTML/JS embedded via
`streamlit.components.v1.html`), not as native Streamlit widgets.**
Streamlit's execution model is a server round-trip per interaction —
every button click reruns the whole Python script. That's fine for
forms and dashboards, but useless for tasks needing millisecond-accurate
stimulus timing and response capture (reaction time, N-back timing).
So each task is a self-contained JS game with its own timing loop,
running in the browser where `performance.now()` gives real
sub-millisecond precision.

**Game logic was unit-tested with Node before being embedded in
HTML.** The sequence generation, scoring, and statistics functions in
`logic/*.js` are pure functions with no DOM dependency, validated by
`test_logic.js` (27 assertions covering match-rate targeting, scoring
edge cases, span-staircase logic, and RT statistics) before being
copied into the browser-facing game files.

**Score history is session-only, by design, not by oversight.** True
cross-session persistence needs a real database (or a paid Streamlit
Cloud tier with persistent storage) — faking permanence with something
that quietly resets would be worse than being upfront about the
limitation. The CSV download button is the honest workaround: log your
sessions, download after each one, and stitch them together yourself
if you want a longer-term record.

## Project structure

```
neuroplasticity-tracker/
├── app.py                   # Streamlit shell: task selector, log parser, dashboard
├── games/
│   ├── nback.html             # Self-contained N-Back game (HTML/CSS/JS)
│   ├── corsi_span.html         # Self-contained Corsi Span game
│   └── reaction_time.html       # Self-contained Reaction Time game
├── logic/                        # Pure JS logic, unit-tested independently
│   ├── nback_logic.js
│   ├── corsi_logic.js
│   └── reaction_logic.js
├── test_logic.js                  # Node test runner (run with `node test_logic.js`)
├── requirements.txt
└── README.md
```

## Setup (local)

```bash
git clone <your-repo-url>
cd neuroplasticity-tracker

# Optional: verify the game logic before running the app
node test_logic.js

pip install -r requirements.txt
streamlit run app.py
```

## Deploying to Streamlit Community Cloud

No external dataset, no network dependency, no training step — push
the whole repo as-is and point Streamlit Cloud at `app.py`.

## Tech stack

- **Streamlit** — app shell, dashboard, CSV export
- **Vanilla HTML/CSS/JS** — the actual games (no framework needed;
  kept dependency-free for a component embedded via `components.html`)
- **Node.js** — used only at build/test time to validate game logic
  before shipping (not a runtime dependency of the deployed app)
- **Plotly** — progress trend charts
- **Pandas** — session history table + CSV export

## Possible extensions

- Real persistence via a lightweight database (SQLite, Supabase, etc.)
  instead of session-only history
- Additional tasks: Stroop test, flanker task, digit span
- Difficulty auto-adaptation based on recent performance (true
  adaptive training, closer to how real cognitive training studies work)
- Direct Streamlit↔JS bidirectional communication (via the full
  Streamlit Component protocol) to auto-log results instead of
  copy/paste
