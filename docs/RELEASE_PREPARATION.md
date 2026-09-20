# Publication preparation / 公開前の確認

## Concrete candidate

- Product: Review Desk — Local website reviews (working name; non-unique).
- Version: `1.1.0-beta.3`; Chrome manifest `version: 1.1.0.3` and matching `version_name`.
- Candidate GitHub destination: `masaakisakamoto/review-desk`. Owner was confirmed through the selected GitHub connection. Repository availability is not established. No creation, commit to a remote, push, merge or release publication was performed.
- Prepared contents: independent extension source, MIT license, third-party notices, English/Japanese READMEs, fictional demo, sample packets, test code/results, CI workflow, privacy/security/contribution documents and portfolio copy.
- Packaging: `npm run package` writes a source/trial ZIP and a store-layout candidate ZIP with `manifest.json` at its root. Neither operation publishes anything.

The source candidate is now named `ReviewDesk_1.1.0-beta.3_OSS_candidate.zip` to distinguish this publication preparation from the previously delivered trial ZIP. The extension's 24 files are unchanged. [Publication destination and sequence](PUBLISH_GITHUB.md) and [bilingual release text](RELEASE_NOTES_1.1.0-beta.3.md) are prepared. The original trial archive is retained separately.

The GitHub account was rechecked as `masaakisakamoto`. Repository search returned no match and a direct lookup returned 404; neither proves that the name is available. The browser connection visible to this Work is still the cloud browser. No Mac connection or additional actual-Chrome acceptance was established.

The extension-only archive is `ReviewDesk_1.1.0-beta.3_Chrome_candidate.zip`. Packaging omits implicit directory entries, whose timestamps previously changed between builds even when file contents did not. Every file has a fixed ZIP timestamp. The prior trial ZIP remains a distinct artifact.

## Gates before a public GitHub release

1. Complete the real Chrome checklist, especially cold startup, capture, restart and exact-path upgrade. Current status: **not run**.
2. Review the final source/asset/privacy report and confirm the supplied source may be released under MIT. No previous repository history is included.
3. Confirm final owner/repository path and working name. Review Desk has existing name matches. Store naming and any trademark/domain review remain open.
4. Enable private vulnerability reporting and publish a verified contact route.
5. Ask the maintainer to approve the exact source archive, destination and public visibility. Remote creation, code push and any default-branch integration are distinct actions; none is automatically approved by this document.

The provided CI workflow is ready to review but has not run on GitHub. Branch protection, private reporting, website hosting and release tags are not remotely configured.

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

日本語：公開先・公開内容の候補は上記です。まず実機検証と名称・権利確認を完了し、具体的なZIPと公開先を提示して最終承認を受けます。この資料を作ったことは、GitHub公開・push・main統合・Web Store申請の承認ではありません。
