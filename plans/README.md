# Animation implementation plans

Prepared against commit **2a5cba0**. All three opportunities selected by the user are covered. Implemented on 2026-10-03. Typecheck, lint, and expanded Chromium workflow passed; manual Safari/touch/slow-motion feel checks remain pending.

| Order | Plan | Severity | Status | Dependencies |
| --- | --- | --- | --- | --- |
| 1 | [Full-image preview](001-lightbox-transition.md) | MEDIUM | IMPLEMENTED | None; supplies shared dialog lifecycle and ease-out token |
| 2 | [Deletion confirmation](002-delete-dialog-transition.md) | MEDIUM | IMPLEMENTED | 001 |
| 3 | [Image-management mode](003-image-manager-transition.md) | LOW | IMPLEMENTED | Run after 001–002 to avoid overlapping file edits |

Execute sequentially. The plans contain exact current excerpts, target values, scope boundaries, interruption behavior, accessibility requirements, and mechanical/manual verification. Update status to DONE only after implementation and verification; record unavailable browser checks rather than claiming they passed.

Common decision: use a new shared `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` token for these new entrances, as specified by improve-animations/AUDIT.md. This refines the preliminary report's default CSS ease without changing existing button or card motion. Reduced motion keeps scoped gentle opacity feedback; keyboard activation and Escape remain immediate. Existing global reduced-motion defaults remain in place for unrelated UI.

Unselected/rejected surfaces stay out of scope: library grid entrances, core/mobile navigation, thumbnail transitions, model-edit expansion, and empty-state decoration.

Handoff: `improve-animations execute plans/001-lightbox-transition.md`, then execute 002 and 003 in order. The execute variant delegates implementation and reviews the resulting diff; this planning pass does not execute it.

## Execution verification

All three plans were executed sequentially in an isolated worktree, reviewed, and integrated into the main checkout. No new dependencies. Chromium full workflow passed in 31.9s using a disposable database; production/library data was not modified. Manual feel checks listed above remain unverified, so the plans are marked IMPLEMENTED rather than DONE.
