# Developer Guide

This is the "how the codebase actually works" doc — for extending it, not for
the game's design intent (that lives in a private handoff doc, not in this
repo). If you want to add a scenario, a downloadable artifact, a broken web
page, or a new screen, this is where to start.

## 1. Orientation

TypeScript + Vite + vanilla DOM/CSS. No backend, no framework, no build-time
component system. State lives in `localStorage`. See [README.md](README.md)
for the run commands.

The whole app is one `Game` class in [src/main.ts](src/main.ts) holding a
`state: GameState` and a `screen: Screen` (a discriminated union), with a
`render()` method that switches on `screen.type` and calls one `renderX()`
method per screen. There is no router, no component tree, no virtual DOM.
Every screen render rebuilds `#app`'s innerHTML from scratch (or appends a
few DOM nodes to it) and re-attaches event listeners. This is intentional —
see §36A.3 of the design handoff: it's a state machine, not a productivity
app, and keeping it that way is a deliberate hedge against the codebase
drifting into "just build a React dashboard."

## 2. Project layout

```
index.html              Loads IBM Plex Mono from Google Fonts, mounts #app
src/
  main.ts               The Game class — screen state machine, all screen renderers
  terminal.ts            Rendering primitives: renderTerminal, the arrow-key menu,
                          input helpers. No game logic lives here.
  state.ts               GameState shape, initial state, applyDelta, rank titles
  effects.ts              scheduleEffect / applyDueEffects / advancePeriod
  storage.ts              SaveStore interface + LocalStorageStore (localStorage)
  style.css                All styling. CSS custom properties for the terminal palette.

  scenarios/
    types.ts              Scenario, Choice, DocumentReviewScenario, etc.
    data.ts                 The actual authored content — SCENARIOS array

  artifacts/
    download.ts             triggerDownload() — the shared Blob→<a download> helper
    customerWorkbook.ts      .xls generator (SheetJS)
    cxRiskReviewPdf.ts       .pdf generator (pdf-lib)
    actionPlanDoc.ts         .doc generator (hand-rolled RTF, not a library)
    hermesIncidentWorkbook.ts .xls generator for the hacker-event puzzle

  legacy/
    pages.ts               LEGACY_PAGES registry — broken/working intranet page HTML
```

## 3. The four architectural layers

Per the design handoff's §36A.13, these are kept deliberately separate:

```
ENGINE (main.ts Game class, state.ts, effects.ts)
   |
   +---- CONTENT (scenarios/data.ts, legacy/pages.ts)
   |
   +---- RENDERER (terminal.ts)
   |
   +---- ARTIFACT GENERATORS (artifacts/*.ts)
```

The rule of thumb: **scenario data never touches the DOM**, and **terminal.ts
never knows what a "scenario" is**. If you're adding content, you're almost
always editing `scenarios/data.ts` (and maybe adding one file under
`artifacts/` or `legacy/`) — you shouldn't need to touch `terminal.ts` at
all, and you'll only touch `main.ts` if you're adding a genuinely new *kind*
of screen (not a new instance of an existing kind).

## 4. The screen state machine

```ts
type Screen =
  | { type: "main-menu" }
  | { type: "work-queue" }
  | { type: "scenario-choice"; id: string }
  | { type: "doc-intro"; id: string }
  | { type: "legacy-web"; scenarioId: string; pageId: string }
  | ...
```

`game.goto(screen)` sets `this.screen` and calls `render()`, which switches
on `screen.type` and dispatches to a `renderX()` method. Screens are plain
data — the `id` in `{ type: "doc-intro", id }` is a scenario ID looked up via
`getScenario(id)` at render time, not a reference held across renders. This
means state is always re-derived from `this.state` + the screen's IDs, never
cached in the screen object itself (except for things like `doc-scope-warning`'s
in-flight `answers`, which are genuinely transient).

**Adding a new screen type**: add a variant to the `Screen` union, add a
`case` in `render()`'s switch, and write a `renderX()` method. Only do this
for a new *category* of screen — a new scenario does NOT need a new screen
type, it reuses `scenario-choice` or `doc-intro`/`doc-form`.

## 5. Terminal rendering primitives (`terminal.ts`)

`renderTerminal({ sys, headerLeft, bodyHtml, footerActions })` replaces
`#app`'s innerHTML with the terminal chrome (header line + a `.terminal-body`
scroll container holding one `<pre class="terminal-screen">` + footer
F-key buttons). It also resets the two pieces of global keyboard state:
`currentActions` (F-key bindings) and `activeMenu` (the arrow-key menu). Call
it once per screen render, first.

**Building multi-block screens**: most screens need more than static text —
a selectable list, an input row, more text after that. The pattern used
throughout `main.ts` is: call `renderTerminal()` with just the static header
text, then use `insertAfter(terminalScreenEl(), tag, className)` repeatedly
to append sibling blocks into `.terminal-body`, chaining each new block off
the previous one:

```ts
renderTerminal({ ...headerOnly });

const menuList = insertAfter(terminalScreenEl(), "div", "menu-list");
renderMenuItems(menuList, [...]);

const tailBlock = insertAfter(menuList, "pre", "terminal-block");
tailBlock.textContent = "...";
```

**Known gotcha**: `.terminal-screen` used to carry `flex: 1` directly. The
first time blocks were appended after it as siblings, it kept claiming all
the leftover vertical space and pushed everything else to the bottom of the
box, creating a big visual gap. Fixed by giving `.terminal-body` the `flex: 1`
+ `overflow-y: auto` instead, and making `.terminal-screen` a normal
`flex-shrink: 0` block. If you see a mystery gap after adding a new appended
block, check you're not putting `flex: 1` on an individual block — only the
`.terminal-body` container should own that.

**The arrow-key menu**: `renderMenuItems(container, items)` renders a
keyboard-only, inverse-video highlight-bar menu (Up/Down moves it, Enter
selects) — this was a deliberate choice (see the arrow-highlight interface
discussion) to match real 5250-terminal cursor-selectable lists. It has
**no mouse interaction** — no hover, no click — by design. Don't add it back
without checking that's actually wanted; it was explicitly removed once
already.

**Pinning a block to the bottom**: set `el.style.marginTop = "auto"` on a
block inside `.terminal-body` (which is a flex column) — see how the main
menu pins its `MANAGEMENT METRICS` + `Selection ===>` block to the bottom
while the divider right after the menu list stays put.

**Other primitives**:
- `appendSelectionInput(anchor, onSubmit)` — the `Selection ===>` text input,
  Enter submits. Not autofocused (autofocus was found to swallow arrow keys
  meant for the menu — don't reintroduce it).
- `bindInputs()` — returns a `{ [data-field]: HTMLInputElement }` map, used
  to read back free-text form fields after render (see `submitDocForm`).
- `clearGlobalHandlers()` — call this if a screen bypasses `renderTerminal`
  entirely (see `renderLegacyWeb`), so stale F-key/menu bindings from the
  previous screen don't fire while the player's on a totally different UI.
- `fmtBody(text)` — HTML-escapes text for use inside the `bodyHtml` `<pre>`.
  All scenario/legacy-page content is authored/trusted, but body text going
  into the escaped `<pre>` still needs this; content going into raw
  `innerHTML` (like `legacy-web`'s page bodies) does not, because it's
  meant to contain real markup.

**CSS tokens** (`style.css` `:root`): `--term-bg`, `--term-fg`,
`--term-fg-dim`, `--term-fg-white`, `--term-fg-amber`, `--term-fg-red`. Reuse
these rather than hardcoding colors for anything rendered inside `.terminal`.
Legacy web pages intentionally do NOT use these — they have their own
`.legacy-*` palette (see §9) specifically to look like a different system
from a different era.

## 6. Game state & the effects engine

`GameState` (`state.ts`) splits metrics into two conceptual groups, though
they're just flat fields on one object:

- **Management metrics** (shown on the main menu / Reports): `profit`,
  `efficiency`, `executiveConfidence`.
- **Reality metrics** (never surfaced in the UI, only referenced in result
  text): `customerHealth`, `employeeHealth`, `regulatoryRisk`,
  `institutionalDebt`, `complaints`, `churn`, `refundFraud`,
  `supportBacklog`.

This split is the whole point of the game (see the design handoff §4) —
don't casually add a new reality metric to a status screen.

`applyDelta(state, delta: MetricDelta)` applies a partial update immediately.
`scheduleEffect(state, { periodsLater, source, label, effects })` queues a
`MetricDelta` to fire N periods in the future; `advancePeriod(state)`
increments `state.period` and applies anything now due, returning the applied
effects (for the period-transition screen to display). This is how "your
decision now, consequence three turns later" works — see
`refund-optimization`'s `delayed` array for the canonical example.

**Promotion**: `Game.checkPromotion()` (in `main.ts`, not `state.ts`) is a
simple threshold check — `completedScenarios.length >= (rank + 1) * 2 &&
executiveConfidence >= 50` — called once per `advancePeriod()`. `RANKS` is
the title ladder in `state.ts`.

**Persistence**: `store.save(state)` is called manually after every state
mutation (end of `resolveChoice`, `finalizeDocReview`, `resolveChoiceQuestion`,
`advancePeriod`, etc.) — there's no automatic reactivity. If you add a new
method that mutates `this.state`, remember to call `this.save()` before
navigating away, or the change won't survive a reload.

## 7. Adding scenario content (the main extension point)

A `Scenario` (`scenarios/types.ts`) is either:

**`ChoiceScenario`** — a menu of choices, each with its own immediate +
delayed effects and result text. Optionally shows a `processTable` (the
`Seq/Function/Cost/Required` table). See `refund-optimization` or
`cobol-custadj-01` (which just puts source code + a dump in
`executiveMessage` — no dedicated COBOL UI exists, and that was a deliberate
scope decision, not an oversight).

**`DocumentReviewScenario`** — the player reviews `artifacts` (downloadable
files) and/or `webReferences` (links to `legacy/pages.ts` entries), then
responds one of two ways (pick exactly one per scenario):

- `questions` (free-text, validated against `answer`/`aliases`) +
  `onCorrect` (effects + result text on the right answer). Optionally add
  `unsolicited` for the §14 "management asked the wrong question" branch —
  see `customer-report-review`.
- `choiceQuestion` (a menu of options, each with its own effects — **not** a
  pass/fail gate). Use this when several answers are all "valid" but have
  different political costs — see `cx-risk-review`, where the factually
  correct answer costs Executive Confidence but reduces Institutional Debt.

**Recipe — adding a new scenario**:

1. Add an entry to the `SCENARIOS` array in `scenarios/data.ts`. Give it a
   unique `id`, an `availableFromPeriod`, and an `executiveMessage`.
2. If it needs a downloadable file, write a generator function under
   `artifacts/` (see §8) and reference it from `artifacts: [{ filename,
   generate }]`.
3. If it needs a broken/working web page, add an entry to `LEGACY_PAGES` in
   `legacy/pages.ts` (see §9) and reference its `pageId` from
   `webReferences`.
4. Write the choices/questions and their effects. Keep effects small and
   plausible — look at existing scenarios for scale (immediate effects are
   usually single digits to low teens; delayed effects arrive 3 periods out
   by convention, not a hard rule).
5. `npm run typecheck`, then manually play through it. There's no test
   suite — see §10 for how to fast-forward state to reach a scenario without
   clicking through everything from period 1.

**Known gap**: `ScenarioBase.requires?: string[]` exists in the type but
`availableScenarios()` never checks it — it's currently dead. If you want
scenario prerequisites beyond `availableFromPeriod`, you'll need to wire that
check into `availableScenarios()` in `scenarios/data.ts` yourself.

## 8. Adding a downloadable artifact

Every generator has the same shape:

```ts
export function generateFoo(_state: GameState): void {
  // build content
  triggerDownload(bytesOrBlob, "FILENAME.ext", mimeType);
}
```

(or `async`, returning `void | Promise<void>` — `ArtifactRef.generate`
accepts both; the caller doesn't await it, it just fires the download.)

**Format constraints — this is deliberate, not a limitation**: nothing in
this game should postdate the AS/400 console's era. Concretely:

- Spreadsheets are `.xls` (BIFF8), via SheetJS's `XLSX.writeFile(wb, name,
  { bookType: "biff8" })` — not `.xlsx`.
- Word documents are `.doc`, but the actual bytes are hand-written RTF (see
  `actionPlanDoc.ts` — no library, just string concatenation with a few
  escaped control words). This isn't a shortcut: legacy Word content-sniffs
  RTF regardless of file extension, and a lot of real period enterprise
  systems exported "Word" documents this way. There is no good browser-safe
  library for genuine binary `.doc` (OLE2 compound file format), so don't go
  looking for one — RTF-as-`.doc` is the intended solution, not a stopgap.
- PDFs are genuinely `.pdf` via `pdf-lib` (PDF itself isn't an OOXML-era
  format, so no substitution needed there).
- The `docx` (OOXML) npm package was removed after being used briefly —
  don't reintroduce it for `.doc`/`.docx` output.

**Content should be authored, not derived from live state**, per the design
handoff's explicit preference for deterministic content in the MVP — none of
the current generators read anything from the `state` argument beyond having
it in scope. If a future artifact genuinely needs to reflect live numbers,
that's a valid reason to break this pattern, but default to authored.

## 9. Adding a broken/legacy web page

`legacy/pages.ts` exports `LEGACY_PAGES: Record<string, LegacyPage>`, where
each entry is `{ url, era: "bare-1998" | "asp-error-2002", bodyHtml }`.
`bodyHtml` is a trusted, hand-written HTML fragment — it's injected via
`innerHTML`, not escaped, so treat it like you'd treat any other string
literal of markup you wrote yourself (never interpolate anything
user-controlled into it — there isn't any today).

`renderLegacyWeb` (`main.ts`) does NOT use `renderTerminal` — it replaces
`#app`'s entire innerHTML with `.legacy-browser` chrome (fake nav icons, a
fake address bar showing `page.url`, a real "Return to EMS Terminal"
button) and calls `clearGlobalHandlers()` first. This is intentional: legacy
pages are supposed to look like a completely different, older system, not a
terminal skin. If you add a new era, add matching CSS under the "Legacy web
pages" section of `style.css` (`.legacy-*` classes) — don't reuse `--term-*`
tokens there.

Wire a page into a scenario via `DocumentReviewScenario.webReferences:
[{ id, label, pageId }]` — it shows up merged into the same selectable menu
as file artifacts on the `doc-intro` screen (labeled `[WEB] ...`).

## 10. Dev workflow

```
npm run dev         # Vite dev server
npm run typecheck    # tsc -b --noEmit — run this before every commit
npm run build         # tsc -b && vite build
```

There's no test suite. Verification is: typecheck clean, then manually play
the relevant path in a browser.

**Fast-forwarding state for manual testing** — rather than clicking through
every prior period/scenario to reach the thing you're testing, set
`localStorage` directly (open devtools console, or use this pattern from a
script) and reload:

```js
localStorage.setItem("executive2000.save.v1", JSON.stringify({
  period: 6,
  profit: 100, efficiency: 100, executiveConfidence: 50,
  customerHealth: 100, employeeHealth: 100, regulatoryRisk: 0, institutionalDebt: 0,
  complaints: 0, churn: 0, refundFraud: 0, supportBacklog: 0,
  rank: 0,
  completedScenarios: ["refund-optimization", "customer-report-review" /* ... */],
  decisions: [], scheduledEffects: [], events: [], unlockedSystems: [],
  retiredMetrics: [], documentFlags: {}, hackerFlags: {}, legacySystemFlags: {},
}));
```

The save key is `"executive2000.save.v1"` (`storage.ts`). `F9=New Game` on
the main menu clears it.

**Git**: this repo is currently pushing straight to `main`, no branches/PRs
(a deliberate call for this early phase — revisit once the project wants
real review). If your local branch diverges from `origin/main` (e.g. after
a squash-merge elsewhere), `git fetch origin main && git rebase origin/main`
before pushing — don't force-push.

## 11. What's not built yet

Everything below is out of scope for the current build, not forgotten:

- The dual-layer help system (`MAN`/`APROPOS`/Easy Help) and the Customer
  Support phone IVR — both large, self-contained systems per the design
  handoff, not started.
- Audio (music zones, DTMF, etc.) — not started.
- The separate expansion handoff's four threads (murder mystery, ghost
  encounters, hacker cooperation arc, DSL trial) — explicitly designed as
  modular add-ons layered on top of a working base game via an
  `EncounterManager`/`GameEvent` subscription model, not the direct
  scenario system described above. None of that event-emission plumbing
  exists yet. If you start on any of these, that's the first thing to add —
  a thin event emission point in `Game` (on `resolveChoice`,
  `advancePeriod`, `openScenario`, etc.) that a future encounter system can
  subscribe to, without threading logic into the base engine.

## 12. Conventions

- No comments unless the *why* is genuinely non-obvious (a workaround, a
  hidden constraint) — match the existing style, don't add explanatory
  comments for what the code already says.
- Prefer authored/deterministic content over anything procedural or
  randomized — this is a recurring, explicit preference in the design
  handoff, not just a code-style nit.
- Keep the terminal aesthetic restrained — no extra scanline/CRT effects,
  no unprompted "retro hacker" flourishes. Legacy web pages are the one
  place a different visual language is intentional.
