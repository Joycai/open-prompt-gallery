# 003 — Fade the image-management mode in and out

- **Status**: IMPLEMENTED — automated verification passed; manual feel checks pending
- **Commit**: 2a5cba0
- **Severity**: LOW
- **Category**: Missed opportunities / state indication
- **Estimated scope**: 3 files; image gallery, CSS, focused E2E assertions

## Problem

`/Users/caizhengxu/github/open-prompt-gallery/src/components/image-gallery.tsx:174` toggles a management mode:

```tsx
            <button className="text-button" onClick={() => setManage(!manage)}>
              {manage ? t("Done") : t("Manage images")}
            </button>
```

At lines 193–196 the panel mounts/unmounts immediately:

```tsx
      {manage && (
        <div className="image-manager">
          {images.map((img, n) => (
            <div key={img.id} className="image-manager-row">
```

The occasional mode change has no visual bridge. An opacity transition can clarify it without moving controls or animating the images users inspect. It does not promise to smooth the panel's layout insertion/removal.

## Target

- Pointer/touch toggle: panel opacity 0 ↔ 1, **150ms cubic-bezier(0.23, 1, 0.32, 1)**. No transform, height transition, row animation, stagger, or image blending.
- Reduced motion: panel opacity 0.7 ↔ 1, **100ms cubic-bezier(0.23, 1, 0.32, 1)**, then hide on completion of exit. No movement.
- Keyboard/assistive activation (`click.detail === 0`): immediate open/close. Update button wording and `aria-expanded` immediately on every toggle, even while visual exit is finishing.
- Hidden or exiting controls must not receive pointer events or keyboard focus. On interruption, transition from the current opacity rather than remounting or restarting.

## Repo conventions to follow

- Repository root: `/Users/caizhengxu/github/open-prompt-gallery`. All paths below are relative to this root unless absolute.
- Next.js 16.3.8, React 19.3.0, TypeScript, plain global CSS; no motion library. Interactive components use `"use client"`, native controls, React refs/state, and translated labels.
- Read the installed guide at `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` before source edits, as required by AGENTS.md. Keep browser APIs inside client event handlers/effects.
- CSS lives in `src/app/globals.css`. Its `:root` block at line 47 already centralizes `--radius`; use that block for motion tokens. Existing `.button` at lines 309–311 uses CSS transitions for feedback; extend this approach without changing button behavior.
- No named motion tokens exist at the stamped commit. Introduce or reuse exactly `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`. This deliberately replaces the preliminary opportunity report's default CSS `ease` for these new entrances, following the improve-animations playbook. Do not migrate unrelated transitions.
- `globals.css:1398` currently disables all transitions under reduced motion using `!important`. Retain that default; append exceptions scoped only to the new motion surfaces, with enough specificity and `!important` to allow their opacity transition. Keyboard/immediate-mode selectors must override those exceptions too.

## Steps

1. In `src/components/image-gallery.tsx`, keep `manage` as logical visibility and add separate rendered-presence state, a phase/instant-mode value, a trigger ref, a stable panel ID using `useId`, and refs for pending frames/close completion. The panel must render while logically open or while an exit is finishing. Do not change its image-row contents or keys.
2. Replace `setManage(!manage)` with a toggle handler that derives desired visibility reliably from the latest state. For pointer opening from absent: mount at initial opacity and use two animation frames to set opacity 1. For pointer closing: keep mounted, set target opacity 0 (0.7 under reduced motion), and remove after the panel's own opacity transition ends, with a matching 150ms/100ms fallback. When reopened during exit, cancel removal and retarget the mounted panel to 1; do not reset it to the entry opacity. Filter child transition events, guard callbacks with an operation ID, and clean up listeners/frames/timers on unmount. Closing before the initial paint should complete immediately. Preference changes must not strand rendered presence.
3. For `event.detail === 0`, cancel pending work and synchronously settle to requested visibility without transition. Add `aria-expanded={manage}` and `aria-controls` on the trigger, and the matching ID on the panel. While exiting, set `inert` and `aria-hidden` and block pointer events. If focus is inside when hiding, restore it to the trigger before making the panel inert. Remove those restrictions immediately on reopening; do not disable entrance interactions.
4. In `src/app/globals.css`, add scoped `.image-manager` phase styles with only opacity transitions and the exact target values. Add or reuse `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` in the existing token block. Add a scoped reduced-motion override after the global disable rule; instant-mode rules must still win. Preserve the existing border, padding, margin, and row layout. Layout insertion happens on mount, removal after fade; never animate those dimensions.
5. Extend `tests/e2e/gallery.spec.ts` around the existing Manage images interaction: verify `aria-expanded`, hidden/exiting controls being unavailable, pointer close/open interruption, keyboard instant toggle, and reduced-motion behavior. Reorder, make-cover, and remove actions still refresh the data as before; an image refresh must not replay panel entrance or reset management mode.

## Boundaries

- No changes to upload, cancellation, image ordering/removal APIs, native image-deletion confirmation, thumbnails, or the lightbox lifecycle.
- No row entry/exit motion, animated reordering, or slide/accordion height animation. This plan only bridges management mode visibility.
- No new dependencies or global accessibility preference changes.
- Apply after 001 and 002 to avoid overlapping edits to image-gallery.tsx and globals.css. The only shared requirement is the ease-out token, whose complete value is specified here; no dialog hook is needed.
- Expected drift includes earlier plans' lightbox changes. If management logic differs incompatibly from the cited code, stop and report.

## Verification

- **Mechanical**: from the repository root run `npm run typecheck` and `npm run lint`; both must exit 0. Extend `tests/e2e/gallery.spec.ts` for the behavioral assertions below. With an isolated test database and a running app configured per the README, run `npm run test:e2e -- tests/e2e/gallery.spec.ts`; expect all assertions to pass. The Playwright config does not start a server. Do not run this persistent create/delete workflow against a user's populated instance.
- **Feel check**: inspect normal speed first, then DevTools Animations playback at 10% and frame-by-frame. Verify smooth reversal rather than restarting, no initial fully-visible flash, no animated layout/blur, and no input blocked by an entrance. Emulate `prefers-reduced-motion: reduce`: no scaling, gentle opacity only. Keyboard-triggered actions and Escape must remain immediate in both preferences. Check Chromium and Safari; on a touch device verify taps do not introduce sticky hover or double activation.
- These are executor verification requirements, not checks already run while writing this plan.
- **Specific checks**: toggle repeatedly faster than 150ms. Final state must follow the last input with no flash, stranded panel, or lost buttons. Tab must never reach exiting/hidden row controls. Cover selection, reorder, deletion, and upload refreshes must remain usable and must not replay the mode fade. In reduced motion, opacity stays between 0.7 and 1 before the final hide. Check both prompt and group galleries.
- **Done when**: the mode change is gently legible, toggles are reversible, inactive controls cannot be focused, and data updates preserve state without new movement.

## Execution result — 2026-10-03

Implemented in an isolated worktree and integrated into the main checkout. `npm run typecheck` and `npm run lint` passed. The expanded Chromium `tests/e2e/gallery.spec.ts` workflow passed (31.9s) against disposable database `gallery_motion_test`, covering both galleries, all deletion kinds, focus restoration, early cancellation, stale-close/reopen handling, panel interruptions, and keyboard/reduced-motion rules. Existing upload, cover selection, reordering and deletion behavior passed in that same workflow. Source review found no blocking motion issues.

Plan adjustment: panel lifecycle is isolated in `src/components/use-panel-motion.ts` rather than inlining it into ImageGallery. Timing and behavior remain as specified. Safari, real-touch-device, and manual slow-motion feel checks remain unverified; this status is intentionally not DONE.
