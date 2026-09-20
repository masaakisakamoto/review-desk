# Changelog

## 1.1.0-beta.3 — Selection guidance and interaction fixes

- Select link/button text through caret positions and suppress competing native drags.
- Explain text, links, media, input controls and unavailable selections; offer Element/Region alternatives.
- Temporarily assist selection-disabled text, then restore original styles on exit.
- Show the current mode and offer repeat selection after recording.
- Reject stale/secondary/cancelled text gestures and tiny accidental regions.
- Protect pending/failed drafts and in-progress capture during mode changes.
- Add 15 simulated interaction cases, a fictional manual fixture and beta.2 same-path update support.

Chrome manifest version: 1.1.0.3. Real-browser acceptance remains pending; see `docs/OPERATION_REVIEW_JA.md`.

## 1.1.0-beta.2 — Text pin fix

- Position text pins beside the selected Range, including existing uniquely matched text notes.
- Follow scrolling and resizing; resolve repeated text using saved offsets/context.
- Preserve anchors through backup/import and hide pins with missing/ambiguous targets.
- Add eight simulated integration cases and a fictional manual Chrome fixture.
- Support exact same-path updates from the released beta.1 package. Chrome manifest version: 1.1.0.2.

Real Chrome visual acceptance for this fix remains pending. See `docs/TEXT_PIN_FIX.md`.

## 1.1.0-beta.1 — 2026-09-19

Independent local-trial candidate, not a published or real-Chrome-verified release.

- Configurable project names and role labels; preserve old records and database identity.
- Bounded database startup and explicit recovery; protect failed drafts and image operations.
- Serialize changed fields without reapplying stale verification; invalidate old verification when requirements change.
- Export Approved + To do by default, with optional full meeting scope and optional images.
- Include before/after images and verification results in offline HTML; retain stable issue IDs on import.
- Preserve source image formats, correct clipping and suppress target pointer handlers during selection.
- Introduce fictional demos, bilingual guides/request text, MIT project license and third-party notices.
- Prepare an integrity-checked same-path updater with a code backup and rollback.

Real Chrome installation, active-tab capture, browser restart persistence, macOS folder picker and the original Mac startup cause remain open. See the validation report and manual checklist.
