# Storage and sharing / 保存と共有

Review Desk 1.1.0-beta.3 stores project labels, manually selected roles, captured page text, text-selection offsets and up to 64 surrounding characters on each side, sanitized URLs, CSS selector hints, viewport/scroll information, browser user agent, images, comments and verification records in the current Chrome profile's IndexedDB.

No telemetry, account, server, cloud storage, AI API, remote code or background upload is implemented. The extension requests only `activeTab` and `scripting`. A content script is injected into the main frame after explicit invocation. The panel uses a closed shadow root to reduce ordinary page-script inspection. It is still rendered inside the website and is not a secure isolated editor against a hostile page; avoid entering secrets into it. The background verifies the sender and checks the active tab before and after capture. We do not collect console logs, cookies, passwords or form control values intentionally. This does **not** prevent visible private pixels or selected text from appearing in a screenshot or note.

URL username/password and query strings are removed. Fragments containing `=` or exceeding 120 characters are removed. Other fragments and the path remain. Do not treat this as complete secret detection. Screenshot redaction and attachment-metadata stripping are not implemented.

Export is an explicit download. Review Desk does not choose a recipient or send the file. Images may be omitted before export. A full-meeting ZIP can include discussion and on-hold items; a request-only ZIP includes Approved + To do. Trash is excluded from both; full backups include Trash. The recipient can retain and redistribute any file you share.

Data is not encrypted by Review Desk. It remains subject to the security and retention of the operating system and browser profile. Uninstalling, deleting the profile, clearing storage, storage eviction and disk failure may delete it. Keep separate backups. There is no deletion scheduler, cloud recovery or tamper-proof log.

日本語：保存先は利用中のChromeプロファイルです。外部への自動送信はしません。記録した文章・画面には個人情報が含まれ得るため、共有前に確認してください。URLのクエリ除去は自動マスキングではありません。画像のメタデータも自動除去しません。アプリ独自の暗号化や保存保証はなく、拡張機能・プロファイルの削除等でデータを失う場合があります。全件保存は「バックアップ」を使用し、書き出したファイルの共有相手は利用者が選びます。

文字の位置を復元するため、選択文字の開始・終了位置と前後各64文字以内も端末内に保存し、明示的な書き出しに含めます。

Text mode temporarily changes only selection/cursor/drag styles on pointed elements and their ancestors; it restores these when the mode ends. Editable controls are excluded from original-text extraction. This does not redact their visible pixels from an explicitly captured screenshot.
