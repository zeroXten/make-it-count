# Make It Count — design spec

**Status:** v0.1 · 22 Nov 2026
**Prototype:** `prototype/index.html` (open in a browser, phone-width; fully interactive)
**Previews:** `previews/*.png`
**Design canvas source:** `design-canvas/` (Claude Design artboards; live canvas: https://claude.ai/artifact/9EhJDEjy7RwdothftBiuk2)

---

## 1. The problem

Small choices — a chocolate bar, a skipped workout, a late night — are individually insignificant. Their effect only shows up over months, while the reward for the wrong choice is immediate. The feedback loop is too slow and too noisy to feel.

## 2. The idea

At the moment of choice, make the future visible and make the user **physically change it**.

> **You're changing the future with this decision, right now.**

That sentence is the product. Every design decision should be tested against it.

## 3. Principles

1. **Emotion over precision.** No "1.42 kg". Use everyday comparisons ("a bag of sugar lighter", "a weekend away richer", "noticeably stronger"). The maths runs underneath only to pick the right comparison.
2. **Always show the projection.** The future line is on screen at rest, not only after interaction. A screen without a projection is broken.
3. **Show outcomes, not inputs.** "Stronger legs, better balance" — never "a working week of practice" or "35 hours".
4. **Up is good, everywhere.** Lines climb away from the old you. Even for weight: the chart plots *you vs the old you*, not kilograms.
5. **Drag, never tap.** The decision is a physical act on the graph. No tap buttons for the choice itself.
6. **Bold, consequential copy.** Each choice should feel like it matters. Firm, not shaming — the app has to stay something you want to open.
7. **No food diary.** Log only at the decision moment, one gesture. No calorie counting, no daily entry.

## 4. Core concepts

| Concept | Meaning |
|---|---|
| **Lever** | A habit the user wants to move — either one to cut back (snacks, alcohol, screen time, spending…) or one to build up (exercise, sleep, learning…). Generic type, user-named. |
| **Old you** | The baseline — what the user usually does. Always drawn as a flat dashed grey line. |
| **Current path** | Where the user's recent behaviour (last ~4 weeks) is taking them. |
| **Summer-you** | The projected future self at the horizon. Default horizon: next summer (a season you can picture beats "12 months"). Configurable later (holiday, birthday). |
| **NOW** | The draggable handle. The user moves the present; the future moves further. |

## 5. Screens

### 5.1 Home — `previews/01-home.png`, `02-home-slipping.png`

- **Hero card**, two states:
  - *Ahead* (dark): "You're pulling away from the old you." Green line climbs away from dashed old-you; shaded gap labelled "that gap is you". "By summer, that gap is:" + chips (*lighter*, *a weekend away*, *stronger*).
  - *Slipping* (deep red): "You're drifting back to the old you." Line rose then falls back; "the gap is closing". "By summer, you're throwing away:" + chips.
  - *First run / no choices this month* (dark): "Doing nothing isn't standing still." / "Standing still is drifting." Doing nothing is never drawn as flat: from NOW the chart forks into a green *start now* line and a red *do nothing* line drifting down, with "the gap is your choice" between them and a countdown ("summer · 30 weeks"). The lines draw in on load. On first run, a full-width "Start now: pick your first habit" button replaces the tile grid.
- **Swipeable hero** (once there's at least one lever): scroll-snap slides with a dot indicator below; mouse drag works on desktop.
  1. *Your path* — the trajectory card above.
  2. *Streaks* — one row per lever, best streak first, top 4 shown ("+N more"). Each row: name, today status (*today ✓* green / *today?* amber when a live streak isn't banked yet / *best N* when broken), a 7-day strip (green good, red slipped, empty none; today outlined) and the streak count. A lever's day counts when its good choices outnumber its bad. Headline: "Keep them alive today." if any live streak is unbanked, "Don't break them." if all are banked, "Start a streak today." if none. Footer: longest-ever streak and which lever. Rows link to that lever's decision screen.
  3. *Banked* — "Already banked." Total good choices plus what they've already earned (real, not projected): weight comparison, £ kept, evenings back, and sessions per build-up lever.
- **Lever tiles** (2-col grid). Each tile: name, a mini line vs dashed old-you (green climbing / grey flat / red falling), and one concrete fact ("9 skipped this month", "Less than last month" in red). No abstract status words ("ahead of usual" was rejected).
- Tapping a tile opens its decision screen. Last tile: "+ Add a lever".

### 5.2 Decision — `previews/03…09`

The core interaction. One per lever (snack and stance holds shown).

**Layout (top → bottom):**
1. Back link.
2. Headline — changes live (see 5.2.2).
3. Instruction: "Grab NOW and move it. Watch summer-you move with it."
4. **Chart** (the control):
   - Top half tinted green, labelled with the good outcome (*lighter* / *stronger*) and the up-gesture hint (*↑ skip it* / *↑ do it now*).
   - Bottom half tinted red, labelled with the bad outcome (*heavier* / *weaker*) and *↓ have it* / *↓ skip it*.
   - Dashed **old you** line across the middle.
   - **NOW handle** (large ring, left) on the user's line.
   - User's line from NOW to the **summer** end dot; area between it and old-you shaded green or red, intensity scaling with distance.
   - Bracket at the summer end showing the gap.
   - While dragging, the **current path** stays as a faint green line so the user sees how far this choice bends them off it.
   - Timeline under the chart: **now · Jan · Mar · May · summer**.
5. **Projection panel** — always present:
   - At rest: "On your current pace, by summer: **You, nearly a bag of sugar lighter.**"
   - While dragging: "If this becomes your habit, by summer: **You, a bag of sugar heavier.** Tighter jeans. Less energy. Same summer as last year, only heavier."
   - Panel fills green/red to match.
6. **Result card + Done** whenever NOW is left past ±60%. No Undo: nothing is logged until Done.

#### 5.2.1 Gesture

- Drag NOW vertically. Handle travels ±50 px; the summer end travels ±118 px — **the amplification is the point** (small move now, big swing later).
- Effective future position `e`:
  - `e = base + v·(1 − base)` when dragging up, `e = base + v·(1 + base)` when dragging down, where `v ∈ [−1, 1]` is handle position and `base` is the current-path position (0.5 in mocks).
  - So: at rest the line shows the current path; full drag down drives past old-you into the red.
- **NOW stays where you leave it.** Releasing never commits and never springs back, so you can keep adjusting: drag up, back to the middle, down, as often as you like.
- Past ±60% the choice is **pending**: headline flips to the result ("Lighter by summer." / "Heavier by summer.") and a result card with a **Done** button appears. Back in the middle, the card disappears.
- **Done** logs the choice (haptic: short buzz for good, double-buzz for bad) and returns home. Leaving the screen without Done logs nothing.
- No tap alternative for the decision.

#### 5.2.2 Copy

| State | Snack | Stance holds |
|---|---|---|
| Rest headline | Snack? | Holds now? |
| Dragging up | You just changed summer. | You just changed summer. |
| Dragging down | You just changed summer. For the worse. | same |
| Pending good (past 60%) | Lighter by summer. | Stronger by summer. |
| Pending bad (past 60%) | Heavier by summer. | Weaker by summer. |
| Good result | Skipped. Clothes that fit better, more energy, less puffed on the stairs. That's what you just chose. | Timer's on. Stronger legs, better balance, hard holds getting easy. Ten minutes. |
| Bad result | Had it. You just pulled summer-you down. Make the next one count. | Skipped. That's a day summer-you doesn't get back. I'll ask again at half one. |

Projection wording scales with drag distance:

| \|e\| | Snack (good / bad) | Holds (good / bad) |
|---|---|---|
| ≤ 0.45 | a block of butter lighter / heavier | a bit stronger / a bit weaker |
| ≤ 0.8 | nearly a bag of sugar lighter / heavier | noticeably stronger / noticeably weaker |
| > 0.8 | a bag of sugar lighter / heavier | properly strong / back to where you started |

Outcome lines — snack good: *Clothes fit better. More energy. Less puffed on the stairs.* Snack bad: *Tighter jeans. Less energy. Same summer as last year, only heavier.* Holds good: *Stronger legs. Better balance. Holds that were hard feel easy.* Holds bad: *The strength you built fades. Holds feel hard again.*

### 5.3 Add a lever — `previews/10-add-lever.png`, `11-add-lever-drink.png`

- Pick a type (pills). Each type pre-fills **typical values**; user nudges with sliders. No spreadsheets, no typing numbers.
- Name field (pre-filled).
- Live projection card: "Skip half of them, and summer-you is… **a bag of sugar lighter** / **a nice meal out richer**".
- Note: "Typical values to start. Close enough is fine."

Ranges allow heavy-but-real use (several times a day for frequent habits). Types are generic; the user names each lever (e.g. an Exercise lever called "Bike ride"). They fall into two groups shown in the picker:

| Group | Type | Defaults | Summer outcome |
|---|---|---|---|
| Cut back | Snacks | 150 kcal, £0.75, 14/week (up to 42) | weight, money |
| Cut back | Sweets & desserts | 250 kcal, £0, 5/week (up to 28) | weight, money |
| Cut back | Alcohol | 180 kcal, £5, 10 drinks/week (up to 70) | weight, money |
| Cut back | Takeaways | +500 kcal, +£12 vs cooking, 2/week (up to 21) | weight, money |
| Cut back | Smoking & vaping | £0.80 each, 70/week (up to 420) | healthier, money |
| Cut back | Screen time | 20 min each, 28/week (up to 140) | evenings back (capped at 8 h/day) |
| Cut back | Spending | £25 each (up to £500), 3/week | money |
| Build up | Exercise | 30 min (up to 4 h), 200 kcal (up to 2000; 0 if unknown), 2/week | fitter, weight |
| Build up | Sleep | +45 min per early night, 1/week | sharper |
| Build up | Fruit & veg | 14 portions/week (up to 70) | more energy |
| Build up | Learning | 20 min, 3/week | better at it |
| Build up | Mindfulness | 10 min, 3/week | calmer |

## 6. Projection model (deliberately loose)

The numbers exist only to choose a comparison. They are never shown.

- Horizon: ~30 weeks ("summer").
- Weight: `kg ≈ kcal saved per week × 30 / 7700 × 0.8` (0.8 ≈ metabolic adaptation; the naive 7700 kcal/kg rule overstates).
- Exercise calories counted at 60% — trackers overestimate burn.
- Weight comparisons: < 0.4 kg block of butter · < 1.5 bag of sugar · < 3.5 bag of potatoes · < 7 bowling ball · else suitcase.
- Money comparisons: < £40 takeaway · < £120 nice meal out · < £350 weekend away · < £900 long weekend in Europe · else proper holiday.
- Time (screen time): hours reclaimed, counted as evenings (~3 h each): "12 evenings back".
- Sleep/fruit/learning/mindfulness/smoking health: qualitative outcomes scaled by drag distance (a bit / noticeably / properly).

## 7. Visual language

| Token | Value | Use |
|---|---|---|
| Ground | `#F5F3EE` | page |
| Card | `#FFFFFF`, border `#E4E0D8` | cards, tiles |
| Ink | `#16181B` | text, NOW handle, dark hero |
| Muted | `#5B6068` | secondary text |
| Good | `#1B6B4F` (on dark `#7FD1AE`) | gains, up |
| Bad | `#C0362C` (on dark `#FF8A7A`, bg `#3A1412`) | losses, down |
| Ghost | `#9A9EA5` dashed | old you |

- Type: **Space Grotesk** 700 for headlines and projections; **Inter** for body.
- Radii: 14–24 px. Touch targets ≥ 44 px.
- Colour never carries meaning alone: green/red always paired with up/down position and words.

## 8. Not yet designed / open questions

- **Getting to the decision screen fast** — home-screen widget, lock-screen widget, watch complication. The decision only works if it's one gesture away when the snack is in your hand.
- **Prompts** for good habits (holds, bedtime): time-based nudges that open the decision screen.
- **Automatic levers** from Health data (workouts, sleep) so they need no gesture.
- **Horizon choice** — summer by default; let the user pick an event (holiday, birthday, race).
- **Remaining lever screens** — dessert, drink, exercise, fruit, bedtime decision variants (same component, different copy table).
- **Tone guardrail** — keep the bad-path copy firm without tipping into shame; test with real use.
- **Accessibility** — drag-only decision needs a VoiceOver/keyboard path (e.g. adjustable control with swipe up/down) that keeps the "move it" feel.
- Data: local-first, no account for v1.

## 9. Files

```
make-it-count/
├── SPEC.md                  ← this file
├── index.html, styles.css, js/, sw.js, manifest.webmanifest, icons/
│                            ← the web app (PWA), served from the repo root — see README.md
├── prototype/index.html     ← interactive phone prototype (?screen=home|snack|holds|add, &mood=slipping)
├── previews/                ← PNG renders of each screen/state
└── design-canvas/           ← Claude Design artboard sources (.dc.html) + canvas.json
```
