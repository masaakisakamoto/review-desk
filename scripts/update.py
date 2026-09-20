#!/usr/bin/env python3
"""Update an unpacked extension at the same registered path. Never opens Chrome data."""
from __future__ import annotations
import argparse
import hashlib
import json
import shutil
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def hashes(path: Path) -> dict[str, str]:
    result = {}
    for line in path.read_text().splitlines():
        digest, name = line.split('  ', 1)
        if len(digest) != 64 or any(c not in '0123456789abcdef' for c in digest):
            raise ValueError('Invalid checksum')
        if Path(name).is_absolute() or '..' in Path(name).parts:
            raise ValueError('Unsafe checksum path')
        result[name] = digest
    return result


def inventory(root: Path) -> dict[str, str]:
    files = {}
    for item in root.rglob('*'):
        if item.is_symlink():
            raise ValueError('Symlinks are not supported / シンボリックリンクは更新できません')
        if item.is_file() and item.name != '.DS_Store':
            files[item.relative_to(root).as_posix()] = hashlib.sha256(item.read_bytes()).hexdigest()
    return files


def update(target: Path, dry_run: bool = False) -> dict:
    source = ROOT / 'extension'
    expected = hashes(ROOT / 'EXTENSION_SHA256.txt')
    if inventory(source) != expected:
        raise ValueError('Package integrity failed / 配布ファイルの照合に失敗しました')
    if target.is_symlink():
        raise ValueError('Select the real registered directory')
    target = target.resolve(strict=True)
    if not (target / 'manifest.json').is_file() and (target / 'extension/manifest.json').is_file():
        target = target / 'extension'
    if source.resolve() == target or source.resolve().is_relative_to(target) or target.is_relative_to(source.resolve()):
        raise ValueError('Choose the PREVIOUSLY registered extension directory / 今回のフォルダではなく登録済みの場所を選択してください')
    actual = inventory(target)
    if actual == expected:
        return {'status': 'already_updated', 'version': '1.1.0-beta.3'}
    baselines = [hashes(ROOT / 'scripts' / ('BASELINE_' + version + '_SHA256.txt')) for version in ['1.0.0', '1.0.1', '1.1.0-beta.1', '1.1.0-beta.2']]
    if actual not in baselines:
        raise ValueError('Registered files differ from a known release. Nothing changed. / 既知の配布内容と一致しないため更新しません')
    if dry_run:
        return {'status': 'ready', 'version': '1.1.0-beta.3', 'database': 'untouched'}
    # Everything is verified before touching the registered folder. Both renames use the same filesystem.
    staging_parent = Path(tempfile.mkdtemp(prefix='ReviewDesk_update_stage_', dir=target.parent))
    backup_parent = Path(tempfile.mkdtemp(prefix='ReviewDesk_code_backup_', dir=target.parent))
    stage = staging_parent / 'extension'
    backup = backup_parent / 'extension'
    moved = installed = False
    try:
        shutil.copytree(source, stage)
        if inventory(stage) != expected:
            raise ValueError('Staged package integrity failed')
        target.rename(backup)
        moved = True
        stage.rename(target)
        installed = True
        if inventory(target) != expected:
            raise ValueError('Installed package integrity failed')
        return {'status': 'updated', 'version': '1.1.0-beta.3', 'backup': str(backup), 'database': 'untouched'}
    except BaseException:
        if moved:
            if installed:
                target.rename(staging_parent / 'failed-install')
            backup.rename(target)
        raise
    finally:
        shutil.rmtree(staging_parent)
        if not list(backup_parent.iterdir()):
            backup_parent.rmdir()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('target', type=Path)
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    print(json.dumps(update(args.target, args.dry_run), ensure_ascii=False, indent=2))
    print('Reload Review Desk at chrome://extensions, then reload the reviewed page. Do not remove the extension.')


if __name__ == '__main__':
    main()
