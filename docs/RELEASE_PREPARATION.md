# Publication status / 公開状況

Review Desk 1.1.0-beta.3 is available as public MIT-licensed source in [masaakisakamoto/review-desk](https://github.com/masaakisakamoto/review-desk). The approved initial 120 files matched the reviewed source bytes. Documentation is updated for publication; all 24 extension files retain the tested beta.3 bytes.

The [first GitHub Verify run](https://github.com/masaakisakamoto/review-desk/actions/runs/35487399284) passed. Private vulnerability reporting is enabled; see [SECURITY.md](../SECURITY.md). [Publication record and release destination](PUBLISH_GITHUB.md).

Distribute this version as a **Pre-release** with source, Chrome extension ZIP and SHA-256 checksums. The maintainer reported beta.3 works for them. Real-Chrome cold start, capture, full restart and macOS upgrade are still unverified by this environment; [the checklist](MANUAL_CHROME_CHECKLIST.md) remains incomplete. These are required before claiming stable support.

Review Desk has existing name matches. No uniqueness or trademark clearance is claimed. No Web Store listing is published. The original pre-publication candidate is retained as a separate reviewed artifact.

## Chrome Web Store preparation

Follow the current [official publishing workflow](https://developer.chrome.com/docs/webstore/publish). Upload, listing/privacy information, submission and public distribution are separate steps. No developer account action or submission was made here.

Draft single purpose: “Record website review notes with target screenshots, organize decisions, and export a portable change-request file.”

Draft description: “Point to text, images or regions while discussing a website. Keep questions separate from approved work, save the notes in your browser profile, and export an image-backed request. Record before/after evidence under the same issue code. No account or automatic external upload. Japanese beta UI; English/Japanese guides and request output.”

Permission rationale:

| Permission  | Purpose                                                            |
| ----------- | ------------------------------------------------------------------ |
| `activeTab` | User-invoked access to the current page and visible-tab screenshot |
| `scripting` | Inject the review panel into the selected page's main frame        |

Outstanding before submission: live Chrome gate; authentic screenshots recorded only on the fictional site; verified final publisher identity/name; public privacy-policy URL; current dashboard privacy/data-use declarations; final review of distribution settings. Local processing still handles website text and images; do not infer “no data handled” from “no server.”

The store candidate is a packaging aid, **not submission-ready approval**. A future Web Store installation uses a different identity from an unpacked extension unless explicitly handled. Export/import every project before switching; do not promise automatic migration.

日本語：GitHubの公開ソースとCIは確認済みです。実機確認の残件を明記したβ版として配布し、Web Store申請・別サービスへの公開は行っていません。
