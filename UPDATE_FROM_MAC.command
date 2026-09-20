#!/bin/bash
set -euo pipefail
package_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
if ! command -v python3 >/dev/null 2>&1; then
  printf 'Python 3が必要です。docs/UPDATE_JA.md の手動更新を使ってください。\n'
  exit 1
fi
printf '先にバックアップを保存し、Chromeを終了してください。\n登録済み extension フォルダを同じ場所で更新します。\n'
if [[ $# -gt 0 ]]; then
  target_dir="$1"
else
  if [[ "$(uname -s)" != Darwin ]]; then
    printf '登録済みフォルダを引数に指定してください。\n'
    exit 1
  fi
  target_dir="$(/usr/bin/osascript -e 'POSIX path of (choose folder with prompt "以前Chromeに登録した Review Desk の extension フォルダを選択してください")')"
fi
python3 "$package_dir/scripts/update.py" "$target_dir"
