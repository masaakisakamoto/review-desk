# Validation report / 検証結果

Updated for **1.1.0-beta.3** (selection interaction follow-up). Verdict: **public beta source with explicit real-Chrome verification gaps**.

## Results and their boundaries

| Suite                        | Result                      | What actually ran                                                                                                                                            |
| ---------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Functional regression        | 39 / 39 pass                | Application code in Node, happy-dom and fake-indexeddb; Chrome APIs mocked; real native canvas encoding and ZIP extraction                                   |
| Startup regression           | 13 / 13 pass                | Shipped background/client/content/popup connected across a simulated message boundary, including failed/empty/delayed responses                              |
| Beta regressions             | 15 / 15 pass                | Legacy backup, custom roles, stable identity, failed database opening, verification changes, archive contents, draft conflict and clipping                   |
| Updater contracts            | 7 / 7 pass                  | Python filesystem operations on Linux using the exact previously delivered 1.1.0-beta.2 extension tree, including backup, refusal and rollback               |
| Text pin regressions         | 8 / 8 pass                  | Shipped content/core/DB in happy-dom; selected text Range, nested scroll clipping, reflow, anchors, legacy notes and import; geometry mocked                 |
| Selection interactions       | 15 / 15 pass                | Complete pointer/mouse/cancel/save flows in happy-dom; caret hit-testing, Range geometry and Chrome capture mocked                                           |
| JavaScript/static boundaries | Pass                        | 22 JS/CJS/MJS files parsed; manifest permissions, no direct network APIs in application modules, CSP and lockfile checked                                    |
| Dependency advisory check    | 0 known advisories returned | npm audit against the pinned dependency tree on 2026-09-19; dependency versions are unchanged; this is not proof of absence of vulnerabilities               |
| Distribution integrity       | Pass                        | Received ZIP manifest matched 36 files; current packages checked against their manifests; original beta.1 duplicate-build check was within one build session |

**97 automated cases passed (82 existing + 15 selection interaction cases).** This is a coverage statement for those cases, not a commercial-readiness score or a substitute for real Chrome.

Execution environment: Linux, Node **24.19.0**, Python **3.12.14**; exact npm versions are in `package-lock.json` and `docs/DEPENDENCIES.json`. The [GitHub Verify workflow](https://github.com/masaakisakamoto/review-desk/actions/runs/35487399284) also completed successfully on Ubuntu 24.04 with Node **22.18.0**, including dependency installation, `npm test`, static checks and packaging. Its updater tests use the synthetic old-tree fixture; the exact delivered beta.2 check above was run locally.

The original 1.0.1 functional/startup suites also passed independently: 38 + 13. The previously reported four updater cases require a 1.0.0 code directory, which was not supplied. That old suite was not reclassified as a pass. The prior beta.1 validation used actual 1.0.1 bytes. This follow-up reran the seven-case updater suite using exact beta.2 bytes extracted from the delivered ZIP. Its default `npm test` run uses a synthetic old tree so new contributors can reproduce the contract tests without the private input package.

## Critical observed checks

- Startup failure and missing project data do not permit target selection or produce an empty editing panel in the simulated boundary. Retry can resume recording.
- Database blocked/timeout errors do not leave a permanently rejected connection cached. Late connections are closed.
- Fast edits persist in order; a concurrent stale revision is refused. Unsaved input remains visible with a draft-download route.
- Legacy image-bearing backups preserve codes, images, deleted records and existing projects. Import assigns new local IDs but preserves stable issue identity.
- Request-only ZIP excludes discussion, hold, awaiting-verification and verified records. Full meeting ZIP links original/marked/after images correctly. Image-free export removes image data from all output formats.
- Before/after HTML includes verification notes and escapes captured HTML. Captured Markdown is escaped to prevent embedded remote images; the in-page panel uses a closed shadow root. Screenshot original format is retained rather than always named JPEG.
- Changes to verified requirements return the issue to To do; rapid typing cannot reapply a stale verification value.
- The updater rejects edited, unexpected, symlinked or corrupt files before replacing registered code. A failure between directory swaps restores the exact previous tree.

## Not verified on a real browser/device

| Area                                                       | Status and reason                                                                                                                              |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Real Chrome extension install and cold start               | Not run: the provided cloud browser refused `chrome://extensions` under its URL/security policy. No alternate installation mechanism was used. |
| Actual element/text/region capture with Chrome APIs        | Not run. Synthetic practice and mocked capture are not counted.                                                                                |
| Save persistence after completely quitting Chrome          | Not run. Reopening a simulated IndexedDB connection is not a full browser restart.                                                             |
| Service-worker suspension/wakeup                           | Not run in Chrome.                                                                                                                             |
| macOS update chooser and unchanged extension ID            | Not run. File operations were tested on Linux; ID preservation still needs an operator check.                                                  |
| Layout, accessibility and real screenshot composition      | No actual browser visual acceptance. Synthetic sample evidence was visually inspected; it is not a product screenshot.                         |
| Ordinary HTTP practice page in the remote browser          | Beta.3 attempt was refused with `net::ERR_BLOCKED_BY_CLIENT`; no successful interaction was recorded.                                          |
| Original Mac startup failure                               | Cause unresolved. A recovered mocked read does not establish its diagnosis or resolution.                                                      |
| Store installation/migration and enterprise-managed Chrome | Not run.                                                                                                                                       |

Use `MANUAL_CHROME_CHECKLIST.md` to close these gaps on the maintainer's Mac before claiming stable support. Report the actual Chrome version and each result separately.

## Reproduce

```bash
npm ci --ignore-scripts
npm test
npm run check
npm run package
```

For the exact legacy update test, with an independently extracted received package:

```bash
python3 tests/updater-tests.py --baseline /absolute/path/to/ReviewDesk_1.1.0-beta.2/extension
```

Structured results: `reports/functional-tests.json`, `reports/startup-tests.json`, `reports/beta-tests.json`, `reports/text-pins-tests.json`, `reports/selection-tests.json`, `reports/updater-tests.json`. The source package contains no customer data and does not need access to the original site or an operational server. Sample packet generation is optional (`npm run examples`) and produces explicitly synthetic images.

## Known limits

Japanese UI, desktop Chrome, HTTP(S) top-frame targets, visible viewport only, manually attached after images, explicit snapshots instead of live sync. Role labels are not permissions; selectors are hints; ordinary page paths and pixels may contain private information. No automatic masking, encryption, guaranteed storage lifetime, tamper-proof history, collaborative merge or direct AI connection. Source and captured content remain separate trust boundaries. Full details are in the READMEs and PRIVACY.md.

日本語：この候補は、実装と模擬検証を終えた試用版です。起動・記録・保存・復元・書き出しについて自動検証は成功しましたが、実Chromeの代替として扱っていません。特にユーザーのMacでの初回停止原因、実際の撮影と再起動、既存版の拡張機能ID維持は引き続き実機での確認事項です。

## Maintainer feedback and this fix

The supplied beta.1 screenshot shows a populated editing panel, captured selected text and a saved-state message. It also shows a text pin far from the selected words. Source inspection confirmed the pin used the ancestor block rectangle, whereas the image mark used the selected Range. Beta.2 restores the Range and remeasures it on scroll/resize. The user feedback is partial real-use evidence, not completion of the structured Chrome checklist. This new positioning behavior has not been accepted on real Chrome here. The manual fixture is `demo/text-pins.html`; implementation and known limits are in `TEXT_PIN_FIX.md`. The screenshot itself is excluded from the public distribution.

## Selection follow-up

Beta.3 adds pointer-based caret selection and contextual alternatives for links/media/controls, with repeat-selection and draft/capture guards. The new operations, fixes and manual steps are in `OPERATION_REVIEW_JA.md`. The original reported site failure was not reproduced in an actual browser; code-level causes and simulated behaviors were tested. The new fixture is `demo/selection-check.html`. Browser API bootstrap succeeded after one timeout; navigation to the local practice URL was blocked by the client. This is an environment restriction, not evidence that the target website blocks automation.

## OSS publication preparation

`npm ci --ignore-scripts` completed from the locked dependencies; the 97-case suite, 22-file static check and the seven-case exact beta.2 update check were rerun successfully. The update cases are part of the 97 total, not additional coverage. The 24 shipped extension files and 18 source-package assets are byte-identical to the previously delivered beta.3. Browser discovery still exposed only the existing cloud browser, so the real-Chrome rows remain unfilled.

Packaging review found that JSZip's implicit directory entries inherited the build time. Earlier duplicate-build checks did not establish reproducibility across different times. The packaging script now omits those unnecessary entries and fixes every file timestamp. This only changes ZIP container metadata; it does not change the extension's behavior or storage. The original publication preflight report accompanies the candidate archive. The subsequent GitHub CI run linked above passed.

## Public repository verification — 2026-09-20

All 120 initial repository file blobs matched the approved OSS candidate bytes; no extra files were present. The 24 extension files remain unchanged. Documentation is then updated to record publication, feedback and the verified private reporting route. GitHub browser uploads store `UPDATE_FROM_MAC.command` as mode 100644; the release ZIP explicitly preserves 100755. The documented `bash UPDATE_FROM_MAC.command` invocation works without the executable bit. No original project history was imported.

The maintainer reported that `ReviewDesk_1.1.0-beta.3.zip` had no problems. This is user acceptance feedback, not a measured completion of every real-Chrome row above.
