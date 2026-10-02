# 001 — Add a restrained full-preview transition

- **Status**: IMPLEMENTED — automated verification passed; manual feel checks pending
- **Commit**: 2a5cba0
- **Severity**: MEDIUM
- **Category**: Missed opportunities / interruptibility / accessibility
- **Estimated scope**: 4 files; component, CSS, one small shared dialog hook, focused E2E assertions

## Problem

`/Users/caizhengxu/github/open-prompt-gallery/src/components/image-gallery.tsx:102` opens the native dialog immediately:

```tsx
            onClick={() => dialog.current?.showModal()}
```

At lines 127–135, the full preview has no lifecycle for a visible exit:

```tsx
          <dialog
            className="lightbox"
            ref={dialog}
            aria-label={t("Full image preview")}
          >
            <button
              className="icon-button lightbox-close"
              onClick={() => dialog.current?.close()}
              aria-label={t("Close preview")}
```

`src/app/globals.css:1030` styles `.lightbox` without transitions. This occasional surface appears abruptly over the image-focused workspace. The purpose is preventing a jarring change, not embellishing image comparison.

## Target

- Pointer/touch open: dialog `opacity: 0 → 1`, `transform: scale(0.97) → scale(1)`, `transform-origin: center`, both **200ms cubic-bezier(0.23, 1, 0.32, 1)**. This normalizes the preliminary 0.98 scale to the playbook's subtle 0.97 value.
- Pointer close: reverse to opacity 0 and scale 0.97 over **200ms** with that same curve. Animate backdrop opacity 0 ↔ 1 in sync; keep its existing background and 4px blur constant.
- Reduced motion: no transform; opacity 0 ↔ 1 over **100ms cubic-bezier(0.23, 1, 0.32, 1)** for dialog and backdrop.
- Keyboard/assistive activation (`click.detail === 0`), native cancel/Escape, and programmatic close: immediate, no fade. Do not delay focus placement on opening.
- CSS transitions must retarget from their current value. No keyframes, springs, dependencies, animated dimensions, image morphs, or permanent `will-change`.

## Repo conventions to follow

- Repository root: `/Users/caizhengxu/github/open-prompt-gallery`. All paths below are relative to this root unless absolute.
- Next.js 16.3.8, React 19.3.0, TypeScript, plain global CSS; no motion library. Interactive components use `"use client"`, native controls, React refs/state, and translated labels.
- Read the installed guide at `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` before source edits, as required by AGENTS.md. Keep browser APIs inside client event handlers/effects.
- CSS lives in `src/app/globals.css`. Its `:root` block at line 47 already centralizes `--radius`; use that block for motion tokens. Existing `.button` at lines 309–311 uses CSS transitions for feedback; extend this approach without changing button behavior.
- No named motion tokens exist at the stamped commit. Introduce or reuse exactly `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`. This deliberately replaces the preliminary opportunity report's default CSS `ease` for these new entrances, following the improve-animations playbook. Do not migrate unrelated transitions.
- `globals.css:1398` currently disables all transitions under reduced motion using `!important`. Retain that default; append exceptions scoped only to the new motion surfaces, with enough specificity and `!important` to allow their opacity transition. Keyboard/immediate-mode selectors must override those exceptions too.

## Steps

1. Add `/Users/caizhengxu/github/open-prompt-gallery/src/components/use-dialog-motion.ts` as a client hook shared by the two native dialog consumers. Define a concrete API: `useDialogMotion(ref)` returns `open(animate: boolean)`, `close(animate: boolean)`, `onCancel`, and `onClose`. Use refs for queued animation frames, a close fallback timeout, and a monotonically increasing operation ID. No state updates during render.
2. Drive attributes on the dialog: `data-motion="animated" | "instant"`, `data-phase="entering" | "open" | "closing"`. Before `showModal()`, set the starting attributes. For animated entry, wait two animation frames before setting phase open, so the start style paints; keep controls usable throughout. Instant entry goes directly to open. Guard `showModal()` with the native `open` property.
3. For animated close, cancel pending entry frames and set phase closing while leaving the native dialog open. Call native `close()` after its own opacity transition ends, or after **200ms** (**100ms** under reduced motion), whichever completes first. Ignore bubbled child events and stale operation IDs. Remove listeners/timers/frames after completion or unmount. A close before entry has painted should finish immediately; a reopen while closing cancels that close and retargets to open without replaying the initial state. Native cancel must synchronously clear motion and call close with `animate=false`; native close must clear pending work so a stale callback cannot affect a subsequent opening. A live reduced-motion preference change during a transition must not leave the dialog stuck.
4. Add scoped shared `.motion-dialog` CSS and the ease-out token in `src/app/globals.css`. Use the exact target values above. Apply start/closing styles using attributes and settled styles using phase open. Backdrop selectors follow the same phase. Instant mode has `transition: none !important`, including `::backdrop`. Append scoped reduced-motion rules after the existing global media block. Native closed dialogs remain hidden through their existing native behavior; do not override `display` globally. This explicit lifecycle avoids requiring discrete display/overlay transition support.
5. In `src/components/image-gallery.tsx`, retain the existing dialog ref, call the hook, add `motion-dialog` beside `lightbox`, and wire cancel/close handlers. Use `open(event.detail > 0)` on the hero button and `close(event.detail > 0)` on its close button. Keep thumbnail swaps, image URLs, alt text, and selected-image state unchanged.
6. Add focused assertions to `tests/e2e/gallery.spec.ts` after the fixture uploads images: native modal opens; closing completes; focus returns to the hero trigger; Escape during entrance closes immediately and does not reopen; Enter opens without motion. Cover rapid close/reopen and reduced-motion settings. Verify keyboard focus stays inside an open dialog.

## Boundaries

- Do not edit delete behavior yet; plan 002 adopts the shared lifecycle.
- Do not add backdrop-click dismissal, swipe gestures, zoom, or carousel motion.
- Keep native dialog focus management and semantics. During a pointer exit the dialog remains modal for at most 200ms; Escape can close it immediately. Do not disable its close control or lock input for an entrance.
- No new dependencies, route changes, server actions, or global motion refactor.
- If the cited component structure has drifted incompatibly since the commit stamp, stop and report before improvising.

## Verification

- **Mechanical**: from the repository root run `npm run typecheck` and `npm run lint`; both must exit 0. Extend `tests/e2e/gallery.spec.ts` for the behavioral assertions below. With an isolated test database and a running app configured per the README, run `npm run test:e2e -- tests/e2e/gallery.spec.ts`; expect all assertions to pass. The Playwright config does not start a server. Do not run this persistent create/delete workflow against a user's populated instance.
- **Feel check**: inspect normal speed first, then DevTools Animations playback at 10% and frame-by-frame. Verify smooth reversal rather than restarting, no initial fully-visible flash, no animated layout/blur, and no input blocked by an entrance. Emulate `prefers-reduced-motion: reduce`: no scaling, gentle opacity only. Keyboard-triggered actions and Escape must remain immediate in both preferences. Check Chromium and Safari; on a touch device verify taps do not introduce sticky hover or double activation.
- These are executor verification requirements, not checks already run while writing this plan.
- **Specific checks**: open from both prompt and group pages; the image stays centered and sharp. Close during the first frame and midway through entry, then reopen. There must be no ghost backdrop, stuck modal, stale timeout closing the new opening, or focus loss. Tab/Shift+Tab remain trapped while modal; focus returns to its trigger after dismissal.
- **Done when**: ordinary pointer open/close is visibly bridged, all keyboard paths are immediate, reduced motion uses only opacity, and native dialog behavior remains correct under interruption.

## Execution result — 2026-10-03

Implemented in an isolated worktree and integrated into the main checkout. `npm run typecheck` and `npm run lint` passed. The expanded Chromium `tests/e2e/gallery.spec.ts` workflow passed (31.9s) against disposable database `gallery_motion_test`, covering both galleries, all deletion kinds, focus restoration, early cancellation, stale-close/reopen handling, panel interruptions, and keyboard/reduced-motion rules. Existing upload, cover selection, reordering and deletion behavior passed in that same workflow. Source review found no blocking motion issues.

Plan adjustment: panel lifecycle is isolated in `src/components/use-panel-motion.ts` rather than inlining it into ImageGallery. Timing and behavior remain as specified. Safari, real-touch-device, and manual slow-motion feel checks remain unverified; this status is intentionally not DONE.
