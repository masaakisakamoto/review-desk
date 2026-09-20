# Landscape and naming review / 既存ツールと名称

Checked 2026-09-19 against official sites, repository README files and license texts. This is a feature/design review, not hands-on product testing or a trademark clearance.

| Tool                                              | Current official description and terms                                                                                                                                                                                                                                                                                                                                                                | Learn from it                                                               | Fit for Review Desk                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [BugHerd](https://bugherd.com/)                   | Pinned feedback, suggested text edits, screenshots/technical context, a task board and integrations. Guest feedback can be account-free; the service uses commercial [terms](https://bugherd.com/terms), not an identified OSS license.                                                                                                                                                               | Ask reviewers to point, then capture context automatically.                 | Keep the simple capture flow; do not reproduce a hosted task-management suite.                                   |
| [Marker.io](https://marker.io/)                   | Annotated feedback, session replay, comments/status and development-tool integrations. Commercial [terms](https://marker.io/terms) restrict copying/derivative works and extracting source.                                                                                                                                                                                                           | Make a report useful to both reviewer and implementer; make status visible. | Borrow the problem framing from public descriptions. No service source, screenshots or brand assets were copied. |
| [MarkLayer](https://github.com/thevrus/MarkLayer) | The current [README](https://github.com/thevrus/MarkLayer/blob/main/README.md) describes no-account shared boards, drawing/highlighting, threaded comments, local drafts, real-time collaboration, agent context, MCP and PNG export. [Apache-2.0](https://github.com/thevrus/MarkLayer/blob/main/LICENSE).                                                                                           | Accessible entry, clear target context and a human/agent handoff.           | A reasonable existing OSS choice when shared live boards are central. This beta does not import it.              |
| [Agentation](https://www.agentation.com/)         | React integration, element/text/area annotations, code-oriented context, Markdown output and optional MCP synchronization. Official [features](https://www.agentation.com/features) list desktop/React scope and text-only output rather than screenshots. Its current [LICENSE](https://github.com/benjitaylor/agentation/blob/main/LICENSE) is PolyForm Shield 1.0.0 and prohibits competitive use. | Precise target hints and a readable agent handoff.                          | Do not describe it as permissive OSS or copy it into this MIT tool. No source was incorporated.                  |

The above summaries concern public product descriptions; feature availability can vary by version or plan. No prices or marketing efficiency claims were used.

## Focus

**A person driving a website review while discussing it with a non-engineer.** Capture context, separate questions from agreed work, retain the notes on that device, then deliberately carry the request to another person or AI. Afterwards, attach the result to the same issue number.

This combination is a focus choice, not a claim that competitors cannot support it. Account-free commenting alone is not a differentiator: other products offer it. Review Desk's beta keeps storage and handoff simple, without a shared server, room or AI connection.

日本語での整理：非エンジニアと一緒に画面を見ている担当者が、その場で「相談なのか、修正が決まったのか」を残し、確定分だけを持ち出せる体験に集中します。アカウント不要の注釈自体は既存例があります。共有リンクや共同編集を必要とする場合は、既存ツールの採用も選択肢です。

## Reuse decisions

- Keep JSZip 3.10.1 for portable archive generation. Its vendored bytes match the pinned npm distribution. Select the MIT license option and preserve dependency notices.
- Do not import MarkLayer just for selection/annotation. Its current extension, shared-worker, data-store and agent stack would enlarge this beta's scope. If future live collaboration makes it useful, first evaluate the actual needed modules, NOTICE/copyright requirements and dependency licenses. Apache-2.0 terms stay attached; copied components must not simply be relabeled MIT.
- Do not incorporate Agentation code without a separately compatible grant. Publicly documented interaction ideas informed the comparison, not the implementation source.
- Do not introduce a second framework or a hosted service for this first release. The existing plain-JavaScript extension already supplies the required capture/storage boundary.

## Name check

GitHub repository-name search found existing uses, including [dev-nazmussakib/reviewdesk](https://github.com/dev-nazmussakib/reviewdesk), [suraj-12347/reviewDesk](https://github.com/suraj-12347/reviewDesk) and [Darex1991/ReviewDesk](https://github.com/Darex1991/ReviewDesk). Therefore **Review Desk is not a unique name**. Do not imply affiliation with any similarly named project.

Keep the requested working name for local trials. Candidate repository: `masaakisakamoto/review-desk`. Candidate display subtitle: **Review Desk — Local website reviews**. The authenticated profile confirmed the owner name; a repository-specific search returned “not found or inaccessible,” so availability is **not established**. No repository was created.

Before public promotion, confirm the final repository path, inspect the Chrome Web Store name search, and perform any required trademark/domain clearance separately. Those latter checks are not completed here. Do not reserve or register names automatically.
