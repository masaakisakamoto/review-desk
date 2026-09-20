# Licensing and asset provenance

Release preparation date: 2026-09-19.

| Component                                                              | Condition                                                                   | Decision                                                                                                                                      |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| User-supplied Review Desk code, new application code and documentation | Prepared under the maintainer's request to release this independent project | Root MIT license. Final public release approval remains with the maintainer.                                                                  |
| Vendored JSZip 3.10.1                                                  | MIT OR GPL-3.0-or-later; upstream dual-license text preserved               | Choose MIT. Vendored SHA-256 `acc7e41455a80765b5fd9c7ee1b8078a6d160bbbca455aeae854de65c947d59e` matches npm `jszip@3.10.1/dist/jszip.min.js`. |
| JSZip bundled dependencies                                             | Upstream notices include MIT, ISC and Zlib terms                            | Preserve `extension/vendor/THIRD_PARTY_NOTICES.txt`, alongside JSZip's original license.                                                      |
| Development packages                                                   | Includes Apache-2.0 (`fake-indexeddb`), MIT, ISC and BSD-2-Clause packages  | Locked dependencies, separate inventory and license texts. Not installed/shipped as part of the extension.                                    |
| Extension icons                                                        | New simple geometric icons created for this release                         | MIT, no retained legacy icon provenance assumption.                                                                                           |
| `sample-object.svg`, demo HTML/CSS, synthetic sample evidence          | Original geometric illustration and fictional copy/layout for this project  | MIT. No customer images, photos, logos or external fonts.                                                                                     |
| Competitor code/material                                               | Public descriptions and licenses reviewed only                              | No source, logo, product screenshot or other asset incorporated.                                                                              |

Sources: [JSZip licensing](https://github.com/Stuk/jszip/blob/v3.10.1/LICENSE.markdown), [pako license](https://github.com/nodeca/pako/blob/1.0.11/LICENSE), [MarkLayer Apache-2.0](https://github.com/thevrus/MarkLayer/blob/main/LICENSE), [Agentation's restrictive license](https://github.com/benjitaylor/agentation/blob/main/LICENSE).

`docs/DEPENDENCIES.json` records installed pinned development package versions and declared licenses. `docs/DEVELOPMENT_LICENSES.txt` preserves their available upstream license files. The extension only distributes the vendored JSZip bundle and its notices; development packages are retrieved by `npm ci`.

MIT does not clear the Review Desk name as a trademark or establish ownership of any external material a reviewer later captures. Final publication also requires the maintainer's approval that the supplied original code may be released. No name exclusivity or legal-clearance claim is made.
