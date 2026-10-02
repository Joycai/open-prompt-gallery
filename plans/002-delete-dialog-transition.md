# 002 — Add the shared transition to deletion confirmation

- **Status**: IMPLEMENTED — automated verification passed; manual feel checks pending
- **Commit**: 2a5cba0
- **Severity**: MEDIUM
- **Category**: Missed opportunities / accessibility
- **Estimated scope**: 2 files; detail controls and focused E2E assertions
- **Dependency**: 001-lightbox-transition.md must be complete first

## Problem

`/Users/caizhengxu/github/open-prompt-gallery/src/components/detail-controls.tsx:61` opens a confirmation abruptly:

```tsx
        onClick={() => ref.current?.showModal()}
```

The same file has direct close handlers at lines 78 and 97:

```tsx
            onClick={() => ref.current?.close()}
```

Successful deletion at line 108 also closes immediately before routing:

```tsx
                  ref.current?.close();
                  router.push(
```

The occasional confirmation deserves a short visual bridge, but successful deletion must never wait for decorative motion.

## Target

- Pointer/touch opening and cancellation: centered `scale(0.97) ↔ scale(1)` and `opacity: 0 ↔ 1`, **200ms cubic-bezier(0.23, 1, 0.32, 1)**. Backdrop opacity follows the same timing; existing 4px blur is static.
- Reduced motion: no scaling, opacity only, **100ms cubic-bezier(0.23, 1, 0.32, 1)**.
- Keyboard/assistive activation (`click.detail === 0`), Escape, and successful deletion close immediately. Successful deletion routes and refreshes immediately. Error messages remain immediately visible and announced.
- No bounce, hold-to-confirm interaction, animated error text, or disabling controls because an entrance is running.

## Repo conventions to follow

- Repository root: `/Users/caizhengxu/github/open-prompt-gallery`. All paths below are relative to this root unless absolute.
- Next.js 16.3.8, React 19.3.0, TypeScript, plain global CSS; no motion library. Interactive components use `"use client"`, native controls, React refs/state, and translated labels.
- Read the installed guide at `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` before source edits, as required by AGENTS.md. Keep browser APIs inside client event handlers/effects.
- CSS lives in `src/app/globals.css`. Its `:root` block at line 47 already centralizes `--radius`; use that block for motion tokens. Existing `.button` at lines 309–311 uses CSS transitions for feedback; extend this approach without changing button behavior.
- No named motion tokens exist at the stamped commit. Introduce or reuse exactly `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`. This deliberately replaces the preliminary opportunity report's default CSS `ease` for these new entrances, following the improve-animations playbook. Do not migrate unrelated transitions.
- `globals.css:1398` currently disables all transitions under reduced motion using `!important`. Retain that default; append exceptions scoped only to the new motion surfaces, with enough specificity and `!important` to allow their opacity transition. Keyboard/immediate-mode selectors must override those exceptions too.

## Steps

1. Confirm plan 001 has supplied `src/components/use-dialog-motion.ts` and `.motion-dialog` CSS. Required hook API: `useDialogMotion(ref)` returns `open(animate: boolean)`, `close(animate: boolean)`, `onCancel`, `onClose`. Its contract is native `showModal()` plus CSS phases; transition-aware pointer exit; immediate keyboard cancel; cancellation of stale frames/timers; focus restoration through native close. Required CSS: centered scale 0.97 and opacity 0 to scale 1 and opacity 1 over 200ms using `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`; backdrop opacity in sync; scoped reduced-motion opacity 100ms; instant mode overrides both. If that dependency is missing, implement plan 001 first rather than duplicating a lifecycle.
2. In `src/components/detail-controls.tsx`, import the hook and bind it to the existing `ref` inside `DeleteButton`. Replace the trigger callback with `open(event.detail > 0)`. Append `motion-dialog` to the existing `dialog` class; attach `onCancel` and `onClose`. Retain `aria-labelledby`, heading ID, all translations, and dialog content.
3. Route the X and Keep buttons through `close(event.detail > 0)`. Leave the deletion server action, pending state and disabled delete button behavior intact. On successful deletion use `close(false)` before the existing `router.push` and `router.refresh`; add no await or animation delay. On failure keep the dialog open and show the existing error immediately.
4. Extend `tests/e2e/gallery.spec.ts` around existing model-in-use and successful deletion coverage: pointer cancellation restores trigger focus; Enter/Space activation and Escape are immediate; the in-use error remains accessible; deleting prompt/group/model still follows existing destination behavior. Include cancellation during entrance so stale lifecycle work cannot reopen the dialog.

## Boundaries

- Do not change `CopyButton`, mutation behavior, confirmation wording, delete destinations, or image-removal `window.confirm`.
- Do not add a second set of timing tokens or another dialog abstraction.
- Keep all three deletion kinds supported: prompt, group, model. Do not add a delay after the server confirms success.
- No new dependencies or global reduced-motion changes.
- Expected drift is the dependency adding shared motion files. If the cited DeleteButton logic has otherwise changed incompatibly, stop and report.

## Verification

- **Mechanical**: from the repository root run `npm run typecheck` and `npm run lint`; both must exit 0. Extend `tests/e2e/gallery.spec.ts` for the behavioral assertions below. With an isolated test database and a running app configured per the README, run `npm run test:e2e -- tests/e2e/gallery.spec.ts`; expect all assertions to pass. The Playwright config does not start a server. Do not run this persistent create/delete workflow against a user's populated instance.
- **Feel check**: inspect normal speed first, then DevTools Animations playback at 10% and frame-by-frame. Verify smooth reversal rather than restarting, no initial fully-visible flash, no animated layout/blur, and no input blocked by an entrance. Emulate `prefers-reduced-motion: reduce`: no scaling, gentle opacity only. Keyboard-triggered actions and Escape must remain immediate in both preferences. Check Chromium and Safari; on a touch device verify taps do not introduce sticky hover or double activation.
- These are executor verification requirements, not checks already run while writing this plan.
- **Specific checks**: try Keep and X on each deletion kind. Native focus must restore correctly. In-use model failure stays inside the open confirmation and remains readable. A successful deletion closes and navigates without waiting 200ms. Escape midway through a pointer entrance immediately removes both surface and backdrop.
- **Done when**: deletion confirmation matches the lightbox motion vocabulary, cancellation remains interruptible, and existing success/error behavior has no new delay or regression.

## Execution result — 2026-10-03

Implemented in an isolated worktree and integrated into the main checkout. `npm run typecheck` and `npm run lint` passed. The expanded Chromium `tests/e2e/gallery.spec.ts` workflow passed (31.9s) against disposable database `gallery_motion_test`, covering both galleries, all deletion kinds, focus restoration, early cancellation, stale-close/reopen handling, panel interruptions, and keyboard/reduced-motion rules. Existing upload, cover selection, reordering and deletion behavior passed in that same workflow. Source review found no blocking motion issues.

Plan adjustment: panel lifecycle is isolated in `src/components/use-panel-motion.ts` rather than inlining it into ImageGallery. Timing and behavior remain as specified. Safari, real-touch-device, and manual slow-motion feel checks remain unverified; this status is intentionally not DONE.
