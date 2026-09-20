# Real Chrome release gate / 実機確認

**Status: structured release checklist NOT RUN.** This checklist is intentionally unfilled. It is not a test report proving real Chrome operation. Use fictional data only; retain any existing records by backing up before updating.

Record date, macOS version, exact Chrome version, extension version/name, and whether this was new install or an in-place upgrade. Keep the extension ID locally to compare before/after; do not publish your profile paths.

| Check                   | Steps / Expected result                                                                                                                                                        | Result  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| Cold startup            | Fully quit Chrome, reopen, visit the fictional HTTP demo, invoke extension. A usable panel appears; no blank panel or undefined-ID error.                                      | Not run |
| Element/image           | Choose 場所, click the fictional button/image. Site action is suppressed; real viewport screenshot shows the expected target and no Review Desk overlay.                       | Not run |
| Text                    | Choose 文字, drag text, add replacement. Selected text and bounded target are correct. Check `demo/text-pins.html`: nearby pin, scroll/reflow, repeated words, previous notes. | Not run |
| Region                  | Choose 囲む, drag in either direction, including after scrolling. Image and marked rectangle match.                                                                            | Not run |
| Save                    | Type quickly, wait for saved state, move to another note and return. Last input persists.                                                                                      | Not run |
| Actual restart          | Quit Chrome completely and reopen the same profile. Project, note IDs/codes, comments and images remain.                                                                       | Not run |
| Worker idle             | Leave the page idle until the extension worker is inactive, then create/save another note. No loss or blank panel.                                                             | Not run |
| Export                  | Approve one To do item, leave discussion/hold/verify items. Request preview/ZIP contain only the approved To do item, with real original/marked images.                        | Not run |
| Full meeting            | Attach an after image and result. Full packet HTML shows before, after, reviewer/result. All relative image links work after extracting on macOS.                              | Not run |
| Restore                 | Import a full backup as a new project; original project remains and every image/code survives.                                                                                 | Not run |
| Update                  | Back up each 1.0.1 project; quit Chrome, run updater on original directory. Same extension ID, same old records, new note gets next number.                                    | Not run |
| Conflict                | Open a note in two desks; update in one then the other. Stale write stops; draft download preserves the unsaved text.                                                          | Not run |
| Stale page after reload | Reload extension while a webpage has the old panel. The next operation explains reconnection; reloading the webpage restores operation.                                        | Not run |
| Presentation            | Check layout at 1280×800 and 1440×900, keyboard focus, Escape, long notes, zoom and readable saved/errors.                                                                     | Not run |

Stop on a failed save or mismatched image; do not proceed to a real customer meeting. Record expected/actual results, error code and sanitized reproduction. A single mocked pass or practice-page screenshot cannot check these rows.

日本語：初回は旧版の記録をバックアップし、架空のデモサイトで確認してください。特に「Chromeを完全終了しても記録が残る」「指定箇所と実際の画像が一致する」「画像付きZIPを解凍して読める」の3点は、模擬試験では代替できません。以前のMacでの停止原因が判明した場合は、元のエラーと復旧手順を分けて記録してください。

Maintainer feedback after beta.1: a supplied screenshot shows a populated panel, selected-text preview and saved-state message, with a misplaced text pin. This supports partial operation only; it does not establish the full checklist or resolution of the original startup cause. Beta.2 position/scroll acceptance remains unverified on real Chrome.

### Beta.3 selection follow-up — NOT RUN on real Chrome

Use `demo/selection-check.html` to check link and button text, selection-disabled text, image/graphic guidance, controls, CSS-generated text, reverse/inline selection, repeat recording, cancel and browse-mode restoration. Expected site click/drag counters remain unchanged while recording. The provided remote browser refused the ordinary HTTP practice URL with `ERR_BLOCKED_BY_CLIENT`; no UI acceptance is inferred from the simulated cases.
