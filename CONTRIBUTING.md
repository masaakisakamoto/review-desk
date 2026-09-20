# Contributing

Keep the capture → decision → handoff → verification workflow small. Changes should include the problem, intended behavior, test evidence and any storage/export compatibility implications.

Use Node 22+, npm and Python 3.9+. Run `npm ci --ignore-scripts`, `npm test`, `npm run check` and `npm run package`. `npm run format` formats project code; vendored code is excluded. The normal updater suite uses a synthetic old file tree. To verify the original received 1.0.1 package, additionally run:

```bash
python3 tests/updater-tests.py --baseline /absolute/path/to/ReviewDesk_1.0.1/extension
```

Do not change the database name, delete existing data, renumber existing issues, add remote dependencies to the extension, broaden permissions or introduce network sharing as an incidental cleanup. Propose such changes explicitly. Preserve third-party notices. Never add a real customer page, secret, local browser profile or production screenshot to fixtures.

Run the manual Chrome checklist for release candidates. Passing simulated tests is not a substitute for real extension startup, capture, persistence and export. Report unexecuted checks honestly.
