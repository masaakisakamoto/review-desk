# Follow-up scope

The first gate is real Chrome reliability, not a longer feature list.

| Candidate                                           | When it becomes justified                                                            | Current status                                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Real Chrome automation and compatibility matrix     | Startup/capture/update workflow has passed on a maintainer Mac                       | Manual gate pending; not presented as E2E coverage                                     |
| Full English UI                                     | English-language reviewers need to drive meetings directly                           | Guides and export are bilingual; UI remains Japanese                                   |
| Selective redaction and attachment metadata removal | Real users identify a repeatable sharing need                                        | Not implemented; never imply existing automatic protection                             |
| Structured implementation-result import             | Portable issue IDs prove useful across several real review cycles                    | Manual after image + result now; no merge protocol yet                                 |
| Collaboration or cloud sync                         | Multiple reviewers need concurrent work more than simple file handoff                | Compare adoption of MarkLayer first; identity/access/retention require separate design |
| Direct AI/MCP connection                            | Repeated copying materially blocks the workflow                                      | No automatic write or external connection in beta                                      |
| Voice/video                                         | An observed review task cannot be explained with a note and still image              | Out of first-release scope; storage/privacy costs first                                |
| Web Store distribution                              | Manual Chrome, privacy, screenshots, final name and maintainer approval are complete | Submission not started                                                                 |

Measure future results with consent: time to create a complete request, percentage of requests missing context, repeat-clarification count and successful verification rate. No baseline, improvement or user count is claimed today.
