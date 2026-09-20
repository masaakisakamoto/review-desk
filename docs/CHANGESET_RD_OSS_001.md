# RD-OSS-001 — Independent OSS beta preparation

Baseline: received Review Desk 1.0.1 ZIP, SHA-256 `d64f48691937d23aa2f8e4eba87f7f003cc126605ec83cd51243bc8dd7832f18`.

Status: implementation and automated validation complete; manual Chrome publication gate pending.

Scope: only the independent Review Desk source, tests, fictional demos, user documentation and release artifacts. No original operational repository, deployment or business data changes. No public repository mutation or store submission.

Acceptance:

| Requirement                                                  | Evidence / status                                                                 |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Capture, save, restore and portable handoff remain available | Functional/DOM/archive tests; real Chrome checklist still required                |
| Preserve 1.0.1 data and registered-path update               | Legacy fixture, unchanged DB schema, actual-1.0.1 updater contract tests          |
| General project and role labels                              | Configurable roles, escaped labels, round-trip test                               |
| Approved work separated from discussion/hold/verification    | Default export filtering and byte-level archive assertions                        |
| Follow the same issue before/after                           | Stable IDs, verification invalidation, before/after HTML and paths                |
| Shareable public source and portfolio material               | English/Japanese docs, original demo assets, license notices and package audit    |
| Public posting                                               | Pending real Chrome evidence and maintainer approval of destination and artifacts |

Storage: no schema-version increase, no automatic rewrite of old records, no renumbering. New fields are additive. Complete backups remain available; packet backups intentionally contain the exported subset.

Recovery: keep the old extension directory and the data backup. Update at the exact same registered path with Chrome closed. An interrupted directory installation restores previous code. To roll back manually, keep the current code separately, restore the old directory to that same path and reload; old code does not understand every new field.

Tests and limits are documented in VALIDATION.md. Do not infer real-device acceptance from the automated test count. Source/trial and store-layout ZIPs are generated deterministically from the current prepared files, with SHA-256 manifests. No patch was applied to an existing external git tree; `git apply --check` is therefore not a used deployment gate for this new independent source package.
