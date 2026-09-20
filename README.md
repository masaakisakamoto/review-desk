# Review Desk

Turn a website review into a portable change request.

[日本語](README_JA.md) · [Installation and updates](docs/UPDATE_EN.md) · [Validation](docs/VALIDATION.md) · [Design decisions](docs/DESIGN.md)

[Beta release notes](docs/RELEASE_NOTES_1.1.0-beta.3.md) · [Fictional request example](examples/request/REQUEST.md) · [Publication status](docs/RELEASE_PREPARATION.md)

A small Chrome extension for developers, designers and people reviewing websites together. Point to text, an image or a region, add a note, agree what should change, and hand off an image-backed ZIP to a person or an AI tool. Follow the same issue code through implementation and verification.

**1.1.0-beta.3 — local trial candidate.** Automated tests use simulated Chrome APIs. Installing this build in a real Chrome profile and capturing a real tab have **not** been verified here. The original Mac startup cause is unresolved. Complete the [Chrome checklist](docs/MANUAL_CHROME_CHECKLIST.md) before publishing or relying on it in a meeting. There is no Web Store listing yet. The beta interface is Japanese; setup guides and generated request packets support English and Japanese.

Text mode includes caret-based link/button selection, contextual Element/Region alternatives and repeat selection. See the [interaction review and manual fixture](docs/OPERATION_REVIEW_JA.md) for fixes and verification boundaries.

Text pins now follow the selected text on scroll and resize, including existing notes with a unique text match. See the [text pin fix and manual fixture](docs/TEXT_PIN_FIX.md).

## Start

No account, backend or build step is needed to use the extension.

1. Keep the extracted folder somewhere permanent.
2. Open `chrome://extensions` in desktop Chrome and enable Developer mode.
3. Choose **Load unpacked** and select `extension/`.
4. Open an ordinary HTTP(S) page. Click Review Desk → **この画面でメモする** (review this page).
5. Select **場所** (element/image), **文字** (text) or **囲む** (region). Type a note and wait for **端末に保存済み** (saved on device).
6. Choose a decision. Open **一覧・修正依頼** to export, compare evidence and verify changes.

Already using 1.0.0 or 1.0.1? **Do not remove the extension or load this folder as a second extension.** Back up your data and [update the existing registered path](docs/UPDATE_EN.md).

| Decision            | Meaning                                            |
| ------------------- | -------------------------------------------------- |
| 要相談 / Discussion | Keep the question; implementation is not approved. |
| 修正確定 / Approved | The requirement is agreed.                         |
| 保留 / On hold      | Keep the idea outside the implementation scope.    |

Approved issues move through **To do → Awaiting verification → Verified**. Only Approved + To do issues appear in the implementation section of `REQUEST.md`. Editing the agreed note, replacement text or scope reopens verified work. A result is required before marking an issue verified; a reviewer name and after image are optional.

## What you hand off

The default export includes only Approved + To do issues. Choose a full meeting packet to share discussion, on-hold and verified records as well. The preview shows the issue codes and lets you omit all images. Creating the ZIP downloads a file; it does not send it anywhere.

| File                  | Purpose                                                             |
| --------------------- | ------------------------------------------------------------------- |
| `REQUEST.md`          | Bounded implementation request, in English or Japanese              |
| `MEETING_REVIEW.html` | Offline, readable before/after evidence and verification results    |
| `review-data.json`    | Stable issue IDs, target hints, viewport, decisions and image paths |
| `images/`             | Original, marked, reference and after images, if included           |
| `backup.review.json`  | Restore the exported subset as a separate project                   |

A packet is a snapshot, not automatic synchronization. The standalone **Backup** button includes all project records, including Trash. Restoring a backup creates a new project without overwriting the existing one, keeps issue codes and stable `issueId` values, and assigns new local database IDs. Restoring repeatedly does not merge projects.

## Try without customer data

After `npm ci --ignore-scripts`, run `npm run demo`. Open `http://127.0.0.1:8765/` for the fictional **Fieldnotes Studio** website. Use the extension on this page to test real capture.

`http://127.0.0.1:8765/extension/demo.html` is an **explicit practice mode with synthetic captures**. It exercises the interface but does not prove Chrome extension messaging or screen capture. On HTTP it uses that origin's browser database; when opened inside the extension it creates a separate demo project in the extension database.

Import `examples/sample.review.json`, or open `examples/meeting/MEETING_REVIEW.html`. Sample images are clearly marked as synthetic. [Walkthrough and 60-second demo outline](docs/PORTFOLIO_JA.md).

## Storage and privacy

- Records live in IndexedDB in this Chrome profile. No telemetry, external API calls, remote code, cloud sync or background upload.
- Permissions are `activeTab` and `scripting`. Page access starts when you invoke the extension. There are no persistent host permissions.
- URL credentials and query strings are removed. Some token-like fragments are removed. **Paths, ordinary fragments, page text and visible pixels may still contain private information.** This is not automatic redaction.
- Screenshots capture the visible viewport, not the whole page. File attachments are PNG, JPEG or WebP, up to 8 MB each. Export rendering accepts up to 40 megapixels per image. Packet data is limited to 100 MiB before compression; large datasets need smaller projects.
- Data is not encrypted by Review Desk. Removing the extension/profile, browser storage eviction or a disk failure can lose records. Keep explicit backups. File attachments can retain metadata.

See [PRIVACY.md](PRIVACY.md) for the full storage and sharing boundary.

## Support and limits

Desktop Chrome on ordinary HTTP(S) pages. Manifest minimum: Chrome 110; this is an API floor, not a tested version matrix. No mobile, Safari or Firefox support is claimed. Browser internal pages and the Chrome Web Store cannot be annotated. File URLs are not enabled. Use region capture for iframes and complex embedded content; selectors inside iframe/shadow trees are not resolved. Reopen the extension after navigation. Some pages may intercept earlier pointer handlers; do not test a capture on a destructive live action. DOM selectors are hints, not a guarantee of source-code identity.

Concurrent edits to the same note stop stale overwrites. A failed draft can be downloaded; it is not auto-merged. Changes in another open tab are not live-synchronized. Before/after comparison uses manually attached after images. History retains the latest 200 decision/progress transitions; it is not a tamper-proof audit log. Stored role labels do not confer application permissions.

## Development

Node 22+ (the pinned development dependencies require it), npm and Python 3.9+.

```bash
npm ci --ignore-scripts
npm test
npm run check
npm run package
```

`extension/` is the actual distributable source; no minified application build or bundler is needed. JSZip is vendored locally. Dependency versions and integrity hashes are locked. Unit/DOM tests use `fake-indexeddb`, `happy-dom` and a native canvas encoder. They are **not browser end-to-end tests**. See [VALIDATION.md](docs/VALIDATION.md) for test boundaries and the optional exact-release updater check.

## Why this tool

Review Desk concentrates on a meeting workflow: capture → decide → portable handoff → verify. [BugHerd, Marker.io, MarkLayer and Agentation already address related workflows](docs/RESEARCH.md). We do not claim novelty or measured productivity gains. MarkLayer is a reasonable option when shared live boards are the primary need. Review Desk deliberately keeps a local record and an explicit file handoff.

Real-time collaboration, cloud sync, recordings and direct AI connections are [later candidates](docs/ROADMAP.md).

## License

[MIT](LICENSE) for project code, documentation and original demo assets. JSZip uses its MIT licensing option; bundled components retain their notices in `extension/vendor/THIRD_PARTY_NOTICES.txt`. Development dependencies have their own licenses. [Provenance and license review](docs/LICENSING.md). No competitor source code is included.
