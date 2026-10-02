# Animation implementation plans

Plans 001–003 were prepared against commit **2a5cba0** and implemented on 2026-10-03. Typecheck, lint, and expanded Chromium workflow passed; manual Safari/touch/slow-motion feel checks remain pending. Plans 004–005 were prepared against **6aefe6e** and have also been implemented; their manual device/slow-motion checks remain pending.

| Order | Plan | Severity | Status | Dependencies |
| --- | --- | --- | --- | --- |
| 1 | [Full-image preview](001-lightbox-transition.md) | MEDIUM | IMPLEMENTED | None; supplies shared dialog lifecycle and ease-out token |
| 2 | [Deletion confirmation](002-delete-dialog-transition.md) | MEDIUM | IMPLEMENTED | 001 |
| 3 | [Image-management mode](003-image-manager-transition.md) | LOW | IMPLEMENTED | Run after 001–002 to avoid overlapping file edits |
| 4 | [Immediate segment selection feedback](004-segment-selection-feedback.md) | LOW | IMPLEMENTED | Reuses existing ease-out token; no new dependency |
| 5 | [Card pointer press feedback](005-card-press-feedback.md) | LOW | IMPLEMENTED | Execute after 004 to avoid overlapping CSS/test edits |

Execute sequentially. The plans contain exact current excerpts, target values, scope boundaries, interruption behavior, accessibility requirements, and mechanical/manual verification. Update status to DONE only after implementation and verification; record unavailable browser checks rather than claiming they passed.

Common decision: use a new shared `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` token for these new entrances, as specified by improve-animations/AUDIT.md. This refines the preliminary report's default CSS ease without changing existing button or card motion. Reduced motion keeps scoped gentle opacity feedback; keyboard activation and Escape remain immediate. Existing global reduced-motion defaults remain in place for unrelated UI.

Unselected/rejected surfaces stay out of scope: library grid entrances, core/mobile navigation, thumbnail transitions, model-edit expansion, and empty-state decoration.

Handoff: `improve-animations execute plans/001-lightbox-transition.md`, then execute 002 and 003 in order. The execute variant delegates implementation and reviews the resulting diff; this planning pass does not execute it.

## Execution verification

All three plans were executed sequentially in an isolated worktree, reviewed, and integrated into the main checkout. No new dependencies. Chromium full workflow passed in 31.9s using a disposable database; production/library data was not modified. Manual feel checks listed above remain unverified, so the plans are marked IMPLEMENTED rather than DONE.

## New feedback plans — 2026-10-03

Plans 004–005 were prepared against **6aefe6e** and executed sequentially in an isolated worktree, then integrated into the primary checkout. They cover the selected segment switching and card click feedback; copy-success motion remains unselected. Plans 001–003 retain their existing implementation status and manual-check limitations. Implementation passed typecheck, lint and the expanded Chromium gallery workflow (final touchscreen regression run: 41.3s). Settled dark-grid and light-list screenshots were inspected. Manual Safari, physical-device and slow-motion checks remain pending.

Plans 004–005 are IMPLEMENTED. Mark them DONE only after the remaining manual feel checks are recorded as passing.
