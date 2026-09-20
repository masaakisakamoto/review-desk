"""Updater contract tests. --baseline optionally verifies the received 1.0.1 bytes."""
import argparse
import hashlib
import importlib.util
import json
import shutil
import tempfile
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--baseline', type=Path)
args = parser.parse_args()
spec = importlib.util.spec_from_file_location('reviewdesk_update', ROOT / 'scripts/update.py')
updater = importlib.util.module_from_spec(spec)
spec.loader.exec_module(updater)
results = []


def check(name, fn):
    try:
        fn()
        results.append({'name': name, 'result': 'PASS'})
        print('PASS', name)
    except Exception as error:
        results.append({'name': name, 'result': 'FAIL', 'error': repr(error)})
        print('FAIL', name, repr(error))


with tempfile.TemporaryDirectory(prefix='reviewdesk-update-test-') as temporary:
    base = Path(temporary)
    package = base / 'package'
    shutil.copytree(ROOT / 'extension', package / 'extension')
    (package / 'scripts').mkdir()
    source_hashes = updater.inventory(package / 'extension')
    def write_hashes(file, mapping):
        file.write_text(''.join(f'{value}  {name}\n' for name, value in sorted(mapping.items())))
    write_hashes(package / 'EXTENSION_SHA256.txt', source_hashes)
    old = base / 'baseline'
    if args.baseline:
        shutil.copytree(args.baseline, old)
        assert updater.inventory(old) in [updater.hashes(f) for f in (ROOT / 'scripts').glob('BASELINE_*_SHA256.txt')], 'Exact supplied baseline mismatch'
    else:
        old.mkdir()
        (old / 'manifest.json').write_text('{"version":"1.0.1"}')
        (old / 'old-only.js').write_text('/* synthetic old code */')
    original = updater.inventory(old)
    write_hashes(package / 'scripts/BASELINE_1.0.1_SHA256.txt', original)
    shutil.copyfile(package / 'scripts/BASELINE_1.0.1_SHA256.txt', package / 'scripts/BASELINE_1.0.0_SHA256.txt')
    shutil.copyfile(package / 'scripts/BASELINE_1.0.1_SHA256.txt', package / 'scripts/BASELINE_1.1.0-beta.1_SHA256.txt')
    shutil.copyfile(package / 'scripts/BASELINE_1.0.1_SHA256.txt', package / 'scripts/BASELINE_1.1.0-beta.2_SHA256.txt')
    updater.ROOT = package
    def target(name):
        destination = base / name / 'extension'
        shutil.copytree(old, destination)
        return destination
    def success():
        destination = target('登録済み folder')
        assert updater.update(destination, dry_run=True)['status'] == 'ready'
        assert updater.inventory(destination) == original
        outcome = updater.update(destination)
        assert updater.inventory(destination) == source_hashes
        assert updater.inventory(Path(outcome['backup'])) == original
        assert updater.update(destination)['status'] == 'already_updated'
        assert len(list(destination.parent.glob('ReviewDesk_code_backup_*'))) == 1
    check('Same-path update, exact backup and idempotent repeat, including spaces', success)
    def modified():
        destination = target('modified')
        (destination / 'manifest.json').write_text('custom edit')
        before = updater.inventory(destination)
        try:
            updater.update(destination)
            raise AssertionError('Expected refusal')
        except ValueError:
            pass
        assert updater.inventory(destination) == before
    check('Locally modified code is refused without changing bytes', modified)
    def wrong():
        for destination in [package / 'extension', base]:
            try:
                updater.update(destination)
                raise AssertionError('Expected refusal')
            except ValueError:
                pass
    check('New source folder and unrelated folders cannot be overwritten', wrong)
    def extra():
        destination = target('unknown-file')
        (destination / 'user-note.txt').write_text('keep this')
        before = updater.inventory(destination)
        try:
            updater.update(destination)
            raise AssertionError('Expected refusal')
        except ValueError:
            pass
        assert updater.inventory(destination) == before
    check('Unexpected files prevent overwrite instead of being deleted', extra)
    def symlink():
        destination = target('symlink')
        (destination / 'link').symlink_to(old / 'manifest.json')
        try:
            updater.update(destination)
            raise AssertionError('Expected refusal')
        except ValueError:
            pass
        assert (destination / 'link').is_symlink()
    check('Symlink content is rejected', symlink)
    def rollback():
        destination = target('rollback')
        original_rename = Path.rename
        def failing_rename(item, other):
            if item.name == 'extension' and item.parent.name.startswith('ReviewDesk_update_stage_'):
                raise OSError('Injected installation failure')
            return original_rename(item, other)
        with patch.object(Path, 'rename', failing_rename):
            try:
                updater.update(destination)
                raise AssertionError('Expected failure')
            except OSError:
                pass
        assert updater.inventory(destination) == original
    check('Failure between directory swaps restores the exact previous code', rollback)
    def corrupt_package():
        destination = target('corrupt-package')
        file = package / 'extension/core.js'
        content = file.read_bytes()
        file.write_text('corrupt')
        try:
            updater.update(destination)
            raise AssertionError('Expected refusal')
        except ValueError:
            pass
        finally:
            file.write_bytes(content)
        assert updater.inventory(destination) == original
    check('Corrupted distribution is rejected before touching registered files', corrupt_package)

report = {'baseline': (json.loads((args.baseline / 'manifest.json').read_text()).get('version_name') or json.loads((args.baseline / 'manifest.json').read_text())['version']) if args.baseline else 'synthetic-old-tree', 'platform': 'Python filesystem tests; no real Chrome or macOS picker', 'tests': results}
(ROOT / 'reports/updater-tests.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
if any(item['result'] == 'FAIL' for item in results):
    raise SystemExit(1)
