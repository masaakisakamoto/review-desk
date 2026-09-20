# Received 1.0.1 audit

Source: `ReviewDesk_1.0.1.zip`, 115,111 bytes.
SHA-256: `d64f48691937d23aa2f8e4eba87f7f003cc126605ec83cd51243bc8dd7832f18`.

The original ZIP is not included in the public source. Its business-specific labels, guide copy and previous report are not the new public documentation.

| Area         | Observed in received code                                    | Treatment                                                                                                                                                                                                                                                                |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Startup      | Ready gate, one read retry, callback messaging, failure view | Retained. Added bounded database open and recovery in the desk.                                                                                                                                                                                                          |
| Selection    | Element/image, selected text, area, viewport                 | Retained; capture busy latch strengthened.                                                                                                                                                                                                                               |
| Storage      | IndexedDB, revision checks, per-project counters, trash      | Kept database identity. Added custom-role and stable-import identity handling.                                                                                                                                                                                           |
| Decision     | Discussion, approved, hold; separate progress                | Retained; default export limited to approved/to-do. Verification needs a result.                                                                                                                                                                                         |
| Export       | ZIP, marked/original images, JSON, HTML                      | After image existed in the ZIP but was absent from the human HTML view. Added before/after and results; fixed original-image filename extension handling.                                                                                                                |
| Recovery     | Content errors shown, writes queued                          | A failed draft could lose its visible editing context when opening another note. Added guards and a draft download.                                                                                                                                                      |
| Generality   | Business-specific project defaults and fixed roles           | Replaced defaults; per-project role configuration; existing roles retained.                                                                                                                                                                                              |
| Practice     | DOM adapter and synthetic captures                           | Replaced fictional design; explicit synthetic label; never described as real Chrome capture.                                                                                                                                                                             |
| Verification | Received report claimed 38 + 13 + 4 passes                   | Re-ran 38 functional and 13 startup cases successfully. The old updater's four-case suite requires the original 1.0.0 directory, absent from the received package; it was not rerun as a passing suite. The new updater is tested separately with the actual 1.0.1 code. |

## Startup incident

The received 1.0.1 no longer permits target selection before a valid project loads. Its startup suite reproduces missing/failed responses with a mocked Chrome boundary and verifies retry and resumed editing. The original 1.0.0 source is not present, so the reported 1.0.0 undefined-ID defect was not independently reproduced against those exact bytes here.

The first failed read on the user's Mac remains unexplained. Database-open timeout handling is a robustness change, not a demonstrated diagnosis of that Mac failure. A real Chrome session must still confirm startup, target selection, saved comments, restart persistence and image ZIP output.

## Boundaries

Only the independent Review Desk directory was changed. No original-site repository, operational host, business database or deployment was accessed for mutation. No prior git history was imported into the release source.
