# Portfolio copy

## Intro

**Review Desk — turn a website review into a portable change request.**

Point to text, an image or a region while discussing a website. Keep questions separate from agreed changes, hand off an image-backed file to a person or an AI tool, then track the result with the same issue code. Notes stay in the browser profile until you choose to export and share them.

## Case study

The project began with a practical meeting problem: turning comments made while looking at a page into implementation work that preserves the target, the decision and the eventual verification.

Visual annotation and agent handoff already have strong precedents. We reviewed the official descriptions and licenses of BugHerd, Marker.io, MarkLayer and Agentation. Review Desk focuses on a smaller workflow: one person driving a review with non-engineers, local storage, explicit decisions and a portable file handoff. It does not claim to be the first or only tool with these ideas.

A previous release had a reported blank-comment-panel failure after startup did not complete. The supplied 1.0.1 already included recovery behavior. This beta preserves it and adds bounded database opening, draft recovery, safer verification transitions, customizable project roles and before/after export. Reproducible tests cover simulated startup failures, data compatibility, concurrent edits, archive contents and update rollback.

The real Mac startup cause remains unknown. Real extension installation, live-tab capture and browser restart persistence have not been verified in this environment. The beta is a local trial candidate with those limits visible, not a demonstrated production deployment. No time savings, customer counts or effectiveness numbers are claimed.

The public example is a fictional studio website with synthetic evidence. R-0001 is approved for implementation; R-0002 remains a discussion; R-0003 is on hold; R-0004 illustrates recorded verification. The request packet includes only R-0001; the full meeting packet contains all four.

## 60-second demo outline

| Time   | Action                                        | Narration                                             |
| ------ | --------------------------------------------- | ----------------------------------------------------- |
| 0–8s   | Point to the fictional site's unclear button  | “Keep the ‘change this’ moment attached to the page.” |
| 8–20s  | Select text, write a note, show saved state   | “Capture the target and leave a short note.”          |
| 20–30s | Compare Approved, Discussion and On hold      | “Separate agreed work from open questions.”           |
| 30–42s | Preview and export, open request and HTML     | “Hand off the approved work with its context.”        |
| 42–54s | Attach an after image and verification result | “Follow the same issue through the fix.”              |
| 54–60s | Product name, local storage and MIT caption   | “Review Desk. From conversation to the next change.”  |

This is an outline, not a produced video. Record the actual extension on the fictional page after the manual Chrome gate passes. Keep synthetic practice footage visibly labeled; do not substitute it for live-capture evidence.
