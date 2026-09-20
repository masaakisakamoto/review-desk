# Updating 1.0.0 / 1.0.1 / 1.1.0-beta.1 / 1.1.0-beta.2

Keep the **same unpacked-extension directory path and extension ID**. Do not remove the extension or register the new directory as a second extension.

1. Export a backup for each existing project. Record the current extension ID and source path at `chrome://extensions`.
2. Quit Chrome.
3. Extract the trial ZIP into Downloads. On macOS:

```bash
bash "$HOME/Downloads/ReviewDesk_1.1.0-beta.3/UPDATE_FROM_MAC.command"
```

4. Choose the previously registered `extension` folder, not the new package.
5. Reopen Chrome and reload the extension. Confirm version 1.1.0.3 (version name 1.1.0-beta.3) and the unchanged ID.
6. Reload the reviewed website and check previous issue codes, comments and screenshots.

Python 3.9+ is required. The updater verifies exact known old files and SHA-256 hashes of the new files. It stages the new code, retains the old code beside the registered directory under `ReviewDesk_code_backup_.../extension`, and restores the old directory if installation fails. It never opens or modifies Chrome's data directory. Unexpected or edited files cause refusal.

For a manual update without Python, first back up and quit Chrome. Move the old extension directory to a backup name, then put the new extension directory at the **exact original path**. Reload the existing registration. Manual replacement does not perform the updater's integrity checks or rollback.

To roll back, quit Chrome, keep the new code separately, and restore the backed-up old directory to the registered path. Take a new data backup first. The database schema stays unchanged, but old code does not understand new custom roles or verification metadata; editing new fields with an old version is not guaranteed to preserve them.

If startup fails, try the retry button once and reload stale website tabs after an update. Report the error code, Chrome/macOS versions and the steps taken, without private page contents. The original Mac startup cause is still unknown; failure recovery is not proof that its cause is resolved.
