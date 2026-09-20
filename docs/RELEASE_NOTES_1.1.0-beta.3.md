# Review Desk 1.1.0-beta.3

Public beta source under MIT. Distribute this version as a GitHub **Pre-release**, with the validation limits below.

Turn a website review into a portable change request.

Review Desk is a small Chrome extension for people reviewing a website together. Select text, an image or a region, record the conversation, distinguish agreed changes from open questions, and export an image-backed request. Keep before/after evidence and verification under the same issue code.

## Included

- Text, element/image and region notes with local saving and target screenshots.
- Discussion, Approved and On hold decisions, separate from implementation progress.
- A request ZIP for Approved + To do items; a full meeting ZIP for broader context.
- English/Japanese Markdown requests, offline HTML, JSON and image files.
- Project names and role labels that the reviewer can configure.
- Before/after images and verification notes under stable issue codes.
- Text pins anchored to the selected words, with scroll/resize tracking.
- Link/button text-selection assistance, contextual media guidance and repeated capture.
- Backups, legacy data compatibility and an updater for the existing extension path.

No account or backend is required. Notes remain in the Chrome profile until the reviewer explicitly exports and shares a file. The beta UI is Japanese; setup documentation and request output support English and Japanese.

## Try it

Download `ReviewDesk_1.1.0-beta.3_OSS.zip` from the release assets. Extract the source ZIP to a permanent folder and load its `extension/` directory using Chrome's **Load unpacked** action. Follow [the English README](../README.md) or [日本語README](../README_JA.md).

If upgrading, export a backup for each project and follow [the update guide](UPDATE_EN.md). Keep the existing registered extension path and do not uninstall it. The Chrome manifest version is **1.1.0.3**; its version name is **1.1.0-beta.3**. This publication preparation changes documentation and packaging, not the beta.3 extension files or database format.

## Validation and limits

[GitHub CI](https://github.com/masaakisakamoto/review-desk/actions/runs/35487399284) passed dependency installation, tests, static checks and packaging on Ubuntu 24.04 / Node 22.18.0. The recorded automated runs pass 97 functional/startup/selection/update cases using simulated Chrome APIs and DOM geometry. They include real ZIP generation and image encoding. These are not real-browser end-to-end tests.

Real Chrome installation, live-tab capture, persistence after fully quitting Chrome and the macOS in-place upgrade remain unverified by the development environment. The originally reported Mac cold-start cause is unresolved. The maintainer reported that beta.3 works for them; this is not a completed real-Chrome checklist. A previously supplied screenshot supports partial use only. See [the full validation report](VALIDATION.md) and [unfilled Chrome checklist](MANUAL_CHROME_CHECKLIST.md).

Desktop Chrome and ordinary HTTP(S) pages are the intended scope. No mobile/Firefox/Safari support, OCR, live collaboration, cloud synchronization or direct AI connection is claimed. Sharing files is explicit; screenshots and page paths may contain private information. [Storage and privacy](../PRIVACY.md).

## License

Project code, documentation and original demo assets use MIT. JSZip uses its MIT option with bundled notices retained. [License inventory](LICENSING.md).

## 日本語

**打ち合わせを、画像付きの修正依頼に。**

Webサイトの文字・画像・範囲を指定してメモし、「要相談・修正確定・保留」を整理するChrome拡張機能です。確定した未対応の内容だけを、人やAIへ渡せるZIPにまとめ、修正後も同じ指摘番号で確認できます。登録やサーバーは不要。記録は端末内に保存し、共有するときだけ書き出します。

このβ版では文字の近くに番号を置く処理、リンク内の文字選択、画像などの代替指定案内、続けて記録する操作を改善しました。案件名・役割を設定でき、架空デモ、日英README、旧版からの更新手順を同梱します。

自動検証97件の成功は、模擬Chrome APIを使った検証結果です。実Chromeでの起動・撮影・完全再起動・Mac更新は、この環境では未確認です。安定版としての動作保証や、元のMac起動問題が解消したとの主張は行いません。新規導入はREADME、既存利用者は[更新手順](UPDATE_JA.md)を参照してください。
