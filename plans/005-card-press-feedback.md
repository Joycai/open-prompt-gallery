# 005 — Add pointer press feedback to gallery cards

- **Status**: IMPLEMENTED — typecheck, lint and Chromium workflow passed; manual Safari/physical-device/slow-motion checks pending
- **Commit**: 6aefe6e
- **Severity**: LOW
- **Category**: Missed opportunities / feedback; accessibility
- **Estimated scope**: 4 files; new small client link, server cards, global CSS, existing gallery E2E workflow
- **Prepared**: 2026-10-03

## Problem

Repository root: `/Users/caizhengxu/github/open-prompt-gallery`. All paths below resolve under that root.

Both cards in `/Users/caizhengxu/github/open-prompt-gallery/src/components/cards.tsx` are server-rendered Next links. PromptCard at line 15 uses:

```tsx
    <Link
      href={
        "/prompts/" + p.id + (back ? "?back=" + encodeURIComponent(back) : "")
      }
      className="prompt-card"
    >
```

GroupCard at line 66 uses `<Link href={"/groups/" + g.id} className="prompt-card">`.

In `/Users/caizhengxu/github/open-prompt-gallery/src/app/globals.css:566`:

```css
  transition:
    box-shadow 0.18s,
    transform 0.18s;
}
.prompt-card:hover {
  box-shadow: 0 8px 23px #263c5910;
  transform: translateY(-2px);
}
```

Global press feedback at lines 131–134 applies to buttons and `.button`, not `.prompt-card`. Card clicks have no corresponding feedback. Ungated hover also permits sticky touch hover. Tens/day use calls for a small press response, not a route transition.

## Target

- Primary mouse/pen/touch press: `transform: translateY(0) scale(0.98)` with **100ms cubic-bezier(0.23, 1, 0.32, 1)**. Release/cancellation retargets to settled scale 1 (and desktop hover translateY(-2px) if applicable) with **160ms cubic-bezier(0.23, 1, 0.32, 1)**. No bounce.
- Hover translation applies only under `@media (hover: hover) and (pointer: fine)`. Preserve its existing 180ms timing and curve for hover-only interactions; do not expand this into a hover audit. Shadow changes can be immediate; new transitions animate only transform/opacity.
- Reduced motion: no transform; primary press opacity 1 → 0.9 → 1 with **100ms cubic-bezier(0.23, 1, 0.32, 1)**. Keyboard activation remains immediate, without simulated press feedback.
- Navigation, browser link behaviors, focus rings, href/back query, previews, and server-side translated content remain intact. Never delay navigation to show the press animation.

## Repo conventions to follow

- Next.js 16.3.8/React 19.3.0; native Next links and CSS transitions, no motion library.
- Before source edits read `/Users/caizhengxu/github/open-prompt-gallery/node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` and the installed Link guide at `01-app/03-api-reference/02-components/link.md` under the same docs root.
- Reuse `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` in `src/app/globals.css:49`. Match existing `.button` press scale 0.98 at line 133.
- Keep `cards.tsx` async server components. A small client link can receive server-rendered children; do not convert fetching/translations or the entire gallery to client rendering.
- Reduced-motion default at `globals.css:1524` remains in place. Append only card-scoped opacity exceptions after it. Existing dialogs/panels already use scoped preference exceptions.

## Steps

1. Create `/Users/caizhengxu/github/open-prompt-gallery/src/components/card-link.tsx` with `"use client"`, Next `Link`, and a `CardLink` component accepting `href: string` and `children: ReactNode`. Render one Link with `className="prompt-card"`, `data-pressed="false"`, and initial `data-press-motion="idle"`. Idle preserves existing desktop hover; animated means a pointer press occurred, and instant means keyboard activation cancelled any pointer transition. No extra DOM wrapper or custom navigation handler.
2. Use native pointer handlers on the link to change its own data attributes synchronously. On primary `onPointerDown` (`event.isPrimary && event.button === 0`) set mode to `animated` and pressed to `true`. On `onPointerUp`, `onPointerCancel`, `onPointerLeave`, and `onBlur` clear pressed. On `onKeyDown` set mode to `instant` and clear pressed before native activation. Do not prevent default, stop propagation, capture pointers, add global listeners, or replace `onClick` navigation. Clearing on leave handles drag/scroll cancellation without trapping touch scrolling. Set attributes directly on `event.currentTarget`; there is no rerender/keyframe restart or timer to outlive navigation.
3. Replace both opening/closing Link tags in `src/components/cards.tsx` with CardLink. Remove its Next Link import if unused. Preserve each href expression and all children verbatim. Cover both prompt and group cards.
4. In `src/app/globals.css`, move the existing `.prompt-card:hover` block inside the exact fine-pointer hover media query. Remove animated box-shadow from the base card transition (keep the existing shadow states). Retain idle hover-only `transform 0.18s`. Add `.prompt-card[data-press-motion="animated"]` with `transform 160ms var(--ease-out)`; its `[data-pressed="true"]` variant uses `translateY(0) scale(0.98)` and 100ms. These rules follow hover styles so press wins. Add `.prompt-card[data-press-motion="instant"] { transition: none !important; }` afterward. On primary `onPointerEnter`, change instant mode back to idle while keeping pressed false, so returning to pointer browsing restores the existing hover behavior. Never clear animated mode during a held primary press.
5. After the global reduced-motion rule, scope `.prompt-card[data-press-motion="animated"]` to `transform: none` and `transition: opacity 100ms var(--ease-out) !important`; pressed opacity is 0.9, settled opacity is 1. The instant keyboard-settle selector comes afterward with `transition: none !important`. No movement survives reduced motion. Do not apply these rules to unrelated links/buttons.
6. Extend `tests/e2e/gallery.spec.ts` with primary pointer down/up feedback, pointer cancellation/leave reset, keyboard native navigation without scaling, coarse/touch hover gating, and reduced-motion behavior. Reuse existing prompt/group fixtures. Preserve href and browser modified-click behavior; do not intercept normal navigation for animation.

## Boundaries

- No changes to card content, async translations, data access, routes, image fitting, gallery reflow, copy success, sidebar, button motion, dialogs, or panels.
- No whole-card entry animations, image zoom, route transitions, layout animation, shadow animation, new dependencies, touch-action restrictions, or `will-change` on every card.
- Plan 004 and this plan share CSS/test files: execute sequentially. There is no functional dependency on its segment state logic.
- If source has drifted incompatibly from commit 6aefe6e, stop and report before editing.

## Verification

- **Mechanical**: from repository root run `npm run typecheck` and `npm run lint`; expect exit 0. With an isolated test server/disposable database configured per `README.md`, run `npm run test:e2e -- tests/e2e/gallery.spec.ts`. This workflow creates/deletes fixtures; do not run it against the personal library. Playwright does not start the app server.
- **Behavior**: hold primary pointer down and inspect scale; release retargets or navigates immediately. Press then leave/cancel: no stuck pressed state. Right/middle clicks do not press-scale. Keyboard Enter keeps normal link navigation with no animated press. Tab focus remains visible. Reloaded prompt/group cards retain correct href and back query.
- **Feel check**: at normal speed the press is barely noticeable and navigation never waits. At 10% playback/frame-by-frame confirm 100ms press and 160ms release retarget from current transform. Test after hover and during quick cancellation. Emulate reduced motion: only 100ms opacity feedback remains; keyboard settles instantly. On a real touch device tap and scroll across cards: no sticky upward hover, trapped scrolling, or double activation. Check Chromium and Safari, recording unavailable checks explicitly.
- **Done when**: both card types respond consistently, existing workflow passes, motion targets are verified, and manual browser/device checks are recorded honestly.

## Execution notes — 2026-10-03

Implemented in an isolated worktree and integrated into the primary checkout. React state owns activation mode and card press feedback rather than imperative data-attribute mutation, preserving feedback across rerenders. Segment buttons bypass the global button press transform so keyboard activation remains immediate. Plan 004 also keeps a latest-intent query ref for event handlers arriving before optimistic renders and settles URL changes before paint.

TypeScript, ESLint and the expanded Chromium gallery workflow passed (final touchscreen regression run: 41.3s). Coverage includes delayed RSC requests, rapid mixed filters, model/query/tag retention and pagination reset, unsent search text, keyboard and Back/Forward, pointer press/leave/cancel, secondary-pointer exclusion, native card navigation, emulated touch taps, and reduced-motion feedback. Dark-grid and light-list settled screenshots were inspected. Manual Safari, physical touch-device and DevTools slow-motion checks remain unverified; status is IMPLEMENTED rather than DONE. No dependencies added.
