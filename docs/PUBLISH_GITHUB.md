# GitHub publication handoff

This document fixes the proposed destination and content. It does not publish anything or grant permission to publish.

| Item                | Candidate                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------ |
| Owner               | `masaakisakamoto` (confirmed by the selected GitHub connection)                            |
| Repository          | `review-desk`                                                                              |
| Intended visibility | Public, after the maintainer's final confirmation                                          |
| Default branch      | `main`                                                                                     |
| Display name        | Review Desk — Local website reviews                                                        |
| Description         | Local-first Chrome extension for website reviews, decisions, and portable change requests. |
| License             | MIT for project code; retain all bundled third-party notices                               |
| Proposed tag        | `v1.1.0-beta.3`                                                                            |
| Release title       | Review Desk 1.1.0-beta.3                                                                   |
| Release flag        | Pre-release; do not present as a stable/latest release                                     |
| Release text        | `docs/RELEASE_NOTES_1.1.0-beta.3.md`                                                       |
| Suggested topics    | `chrome-extension`, `website-feedback`, `local-first`, `screenshots`, `change-requests`    |

The selected connection returned no matching repository, and a direct repository lookup returned 404. This can mean missing or inaccessible; name availability and repository write access are not established. Do not overwrite or repurpose an existing repository. No remote repository, release or tag was created during preparation.

## Content to publish

Use the exact source tree in `ReviewDesk_1.1.0-beta.3_OSS_candidate.zip`, checked against the delivered SHA-256 file. It contains extension code, fictional examples, bilingual documentation, tests, validation reports, update tools, third-party notices and the proposed CI workflow.

Start a fresh repository history from that tree. Do not copy the development directory wholesale, previous project history, uploaded source archives, browser profiles, dependencies, real customer screenshots or local logs. The archive's `PACKAGE_SHA256.txt` identifies its files; `EXTENSION_SHA256.txt` identifies the shipped extension. Preserve the executable bit on `UPDATE_FROM_MAC.command`.

## Publication sequence

1. Confirm this destination, Public visibility, supplied source rights under MIT and the exact source archive with the maintainer. The initial task explicitly requested this final confirmation.
2. Record actual Chrome acceptance in `MANUAL_CHROME_CHECKLIST.md`: cold start, target selection, save, full restart, image-bearing ZIP and existing-path upgrade. If publishing an experimental source preview before these checks, obtain explicit agreement to that narrower status and retain every unverified item. A generic “done” does not prove these checks.
3. Create or confirm the independent repository with an authorized owner connection. For a new repository, avoid generated README/license files that would conflict with the prepared tree.
4. Push only the reviewed tree as `main` with fresh history. Check that the published content matches the approved archive. Do not use force-push to resolve an existing repository conflict.
5. Run the included Verify workflow and inspect its result. The local test report is not evidence of a GitHub Actions pass.
6. Enable private vulnerability reporting if available and verify the reporting route before advertising it. Update `SECURITY.md` to the actual route; do not publish a personal email obtained from account metadata.
7. Prepare the proposed tag and a draft pre-release using the supplied bilingual text. Attach the approved source ZIP and its checksum. Check the target commit and downloaded bytes before publishing the pre-release.

Do not enable Pages, submit to the Chrome Web Store, publish to npm or announce the release on another service as part of this handoff. Those are separate destinations. The store-layout candidate is only packaging preparation and is not a Web Store submission.

## 日本語

公開候補は **`masaakisakamoto/review-desk` / Public / MIT / `v1.1.0-beta.3`（Pre-release）** です。元案件のリポジトリと履歴は使用しません。具体的なソースZIP・公開先を確認してから公開する、という最初の依頼に従い、最終確認を残しています。

現在の接続ではリポジトリ取得が404となり、新規作成やRelease作成の機能も公開されていません。公開先が空いていること、作成権限があること、公開が完了したことは未確認です。最終承認後に、正式に利用可能な接続またはGitHub画面で作成可否を確認します。認証や権限を迂回しません。
