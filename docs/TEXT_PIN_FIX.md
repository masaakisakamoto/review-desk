# 文字に番号を追従させる修正 / Text pin fix

対象：**1.1.0-beta.2**（Chrome表示バージョン **1.1.0.2**）。

## 原因と変更

以前は、撮影した赤枠には選択文字のRangeを使い、ページ上の番号には親HTML要素の矩形を使っていました。横幅の広い中央寄せ見出しで、番号だけ左へ離れる原因でした。

この版では選択文字の位置を復元し、表示中の文字の最初の行の横へ番号を置きます。スクロール・画面幅の変更時にRangeの位置を再計算します。基本は左へ6pxの間隔、左端に余裕がない場合は右側です。

新しいメモは選択文字の開始・終了位置と前後各64文字以内の文脈を端末内に保存します。この情報もバックアップ・書き出しに含まれます。従来のメモは対象要素内の選択文字が一意なら位置を復元します。文言が消えた場合や複数候補を判別できない場合、番号を隠します。メモや撮影済み画像は削除せず、一覧から確認できます。

DB名・バージョン・指摘番号は変更していません。旧コードから同じ保存領域を読みます。既存の記録を一括書き換える移行処理はありません。

## 検証と確認手順

自動検証：`node tests/text-pins-tests.cjs`。実際の本体コードを使い、8件のケースで中央寄せ、文書/要素内スクロール、画面幅、複数行・インライン装飾、重複文言、新規保存と復元、既存メモ、非表示・不明確な対象を確認します。DOMと画像取得・座標は模擬です。実Chromeの描画検証の代替ではありません。

更新手順は `UPDATE_JA.md`。1.1.0-beta.1の配布ZIPから取得した正確なファイルのハッシュを更新ツールへ追加しました。バックアップ後に同じ登録先へ更新し、Chromeの拡張機能と対象Webページの両方を再読み込みしてください。

実機確認用に `demo/text-pins.html` を用意しました。上記の更新後に `npm run demo` を起動し、`http://127.0.0.1:8765/demo/text-pins.html` をChromeで開き、ページ内の手順を実施してください。元のスクリーンショットや第三者サイトの素材は同梱していません。

制限：元の対象要素を特定できないページ変更、Shadow DOM内部、iframeは未対応です。非常に大きな対象（2百万文字・1万テキストノード超）では番号の探索を止めます。CSSアニメーションや自動レイアウト変化への常時追従は行わず、スクロール/リサイズで再計算します。画面端やパネルとの重なりを完全に避ける配置、重複する番号の整理は未対応です。

## English

Text notes now anchor pins to the selected text Range instead of its ancestor's block box. Pins are recomputed on scrolling and resizing and sit 6px beside the first visible line. New notes retain UTF-16 offsets and up to 64 characters of surrounding context on each side; these fields are local and included in explicit exports. Existing notes resolve a unique text match without rewriting their stored records. Missing or ambiguous targets hide the pin, while the note and original screenshot remain accessible in the desk.

Eight integration cases use the shipped code with simulated DOM geometry and capture. Real Chrome/macOS acceptance remains pending. The included fictional manual fixture and the unchanged-ID update guide make that check reproducible. No database schema migration or public publishing was performed.
