# Review Desk — 元Workへの報告

独立した **Review Desk 1.1.0-beta.3** を、[masaakisakamoto/review-desk](https://github.com/masaakisakamoto/review-desk) でPublic / MITのOSSとして公開しました。β版の配布先は [GitHub Releases](https://github.com/masaakisakamoto/review-desk/releases) です。元サイト、業務データ、運用サーバー、元リポジトリは変更していません。

- 記録 → 要相談・修正確定・保留の判断 → 確定・未対応だけの依頼ZIP → 同じ指摘番号で修正後を確認、という流れに整理しました。
- 文字の近くに番号を置いてスクロールに追従。リンク内の文字選択、画像等の別方式への案内、連続記録も改善しています。
- 案件名・役割の設定、架空デモ・サンプル、日英README、紹介文・60秒デモ構成を同梱しています。
- 既存DB名・形式を維持。案件ごとのバックアップ後、拡張機能を削除せず、同じ登録済みパスへ更新してください。Mac手順は `docs/UPDATE_JA.md` です。
- 自動97件は模擬Chrome API等による検証です。[GitHub CI](https://github.com/masaakisakamoto/review-desk/actions/runs/35487399284) でも依存導入・テスト・静的検査・梱包が成功しました。
- ユーザーから「β3は問題ない」との試用報告を受けています。実Chromeへの導入・撮影・完全再起動・Mac更新の項目別チェックは、この環境では未確認です。最初のMac起動不良の原因も未特定です。

承認済みの公開候補120ファイルとGitHub登録内容のバイト一致を確認しました。拡張機能本体は変更せず、公開状況の文書を更新しています。GitHub経由のソースではMacスクリプトの実行属性が外れますが、同梱の `bash` 手順で実行でき、配布ZIPでは実行属性を保持します。脆弱性の非公開報告を有効にしました。

Web Storeへの申請は行っていません。元Workに追加実装は不要です。今後のReview Desk本体は、この独立OSSで継続管理してください。
