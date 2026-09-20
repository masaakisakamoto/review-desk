# Design decisions / 設計判断

## First public beta boundary

A small, local desktop-Chrome extension for capture → decision → handoff → verification. No accounts, backend, real-time rooms, audio/video recording, external AI calls or automatic deployment. The original project and operational systems are outside this repository.

## State and storage

Keep IndexedDB `review-desk-v1`, version 1, stores `projects`, `notes`, `checks`, `meta`. Existing projects and notes are not rewritten on startup. New fields are additive. Unknown old role labels are retained; default roles and a per-project role list are presentation labels only.

`notes.id` is the local database key. `issueId` is stable across export/import. `code` is the human reference within a project (e.g. R-0001), so cross-project communication must include the project and stable ID. Import makes a separate project with new local IDs. It never overwrites or merges existing records. New issue numbers are allocated in the same transaction as the project counter.

| Decision             | Progress              | Export as implementation work   |
| -------------------- | --------------------- | ------------------------------- |
| Discussion / On hold | To do                 | No                              |
| Approved             | To do                 | Yes                             |
| Approved             | Awaiting verification | No; keep in full meeting packet |
| Approved             | Verified              | No; keep in full meeting packet |

A verification result is required to set Verified. Changing the agreed memo, replacement text or scope reopens work; replacing an after image invalidates the previous verification. Verification records are lightweight meeting records, not evidence of authenticated approval.

## Reliability

- Content selection is disabled until a valid project and note list load. One retry is used for the initial read; writes are not automatically retried after a lost response.
- IndexedDB opening has a bounded wait, a distinct blocked state and connection reset on close/version change. A late connection after failure is closed.
- Each editor serializes writes and uses revision matching. A stale update cannot overwrite a newer note.
- Text controls send only the changed field. This prevents a stale form snapshot from re-applying “Verified” while rapid edits are reopening a note.
- Saved state is shown only when that editor's pending write queue is drained. Failures leave the draft visible and offer a file download.
- Image reading binds to the initiating note and prevents navigation while reading. Capture uses a separate busy latch so cancelling the visual selection cannot start a duplicate capture.
- Bundle export reads project, notes and checks in one database transaction. Export is a snapshot; no live synchronization is claimed.

## Export

Default packet scope is Approved + To do. A full-meeting packet is explicit. Trash is always excluded; a separate complete backup includes it. Users can omit all images. The preview shows the actual issue codes. Both an offline HTML and language-selectable Markdown are included, alongside JSON and relative image files.

Captured text is escaped in HTML and Markdown. The in-page panel uses a closed shadow root, which limits ordinary DOM traversal but is not a hostile-page security boundary. The HTML viewer has a restrictive CSP and no script. An agent handoff says which items are approved and that evidence does not authorize unrelated external actions. This reduces ambiguity; it cannot guarantee how a recipient or AI will interpret supplied content.

## Interface

A neutral charcoal/ivory palette, short labels, visible save state and plain numbered records. Selection uses an outline and a subtle surface change. The panel hides while selecting and while capturing; keyboard Escape returns to browsing. The first screen shows the four-step workflow and a practice link.

Japanese UI is retained for the first beta to finish the reliability scope. English guides and request output make the boundary explicit. Full UI localization is next, not silently presented as complete.

## Module map

| File              | Responsibility                                                          |
| ----------------- | ----------------------------------------------------------------------- |
| `core.js`         | Validation, URL filtering, enums, backup schema and request text        |
| `db.js`           | IndexedDB lifecycle, transactions, revisions and additive compatibility |
| `background.js`   | Trusted extension message boundary and active-tab capture               |
| `client.js`       | Time-bounded callback messaging and connection errors                   |
| `content.js`      | Shadow-DOM panel, target selection and recording                        |
| `desk.js`         | Projects, decisions, verification, recovery and export preview          |
| `export.js`       | Image marking, offline viewer and portable ZIP                          |
| `demo-adapter.js` | Explicit synthetic practice; never injected by the popup                |

The application remains plain JavaScript, reformatted for readable diffs. Tests and sample generation are separate from the loadable extension. No runtime package installation or remote script loading is required.
