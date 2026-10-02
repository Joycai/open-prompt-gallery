# 004 — Make segment selection respond immediately

- **Status**: IMPLEMENTED — typecheck, lint and Chromium workflow passed; manual Safari/physical-device/slow-motion checks pending
- **Commit**: 6aefe6e
- **Severity**: LOW
- **Category**: Missed opportunities / state indication
- **Estimated scope**: 4 files; two client components, global CSS, existing gallery E2E workflow
- **Prepared**: 2026-10-03

## Problem

Repository root: `/Users/caizhengxu/github/open-prompt-gallery`. All paths in this plan resolve under that root.

`/Users/caizhengxu/github/open-prompt-gallery/src/components/filters.tsx:73` derives selection from committed URL parameters, so a type selection waits for route completion:

```tsx
              className={(params.get("kind") || "") === v ? "active" : ""}
              aria-pressed={(params.get("kind") || "") === v}
              onClick={() => update("kind", v)}
```

Its `update` function at line 16 constructs a URL from committed parameters and calls `start(() => router.push("/?" + next))`. Rapid requests can construct URLs from an outdated selection. The local grid/list switch in `/Users/caizhengxu/github/open-prompt-gallery/src/components/gallery-layout.tsx:35` already changes state immediately:

```tsx
              onClick={() => {
                setView(value);
                persist("view", value);
              }}
```

Both use `/Users/caizhengxu/github/open-prompt-gallery/src/app/globals.css:412`:

```css
.segments button.active {
  background: var(--surface);
  box-shadow: 0 1px 4px #30425a18;
  color: var(--accent-text);
}
```

Selection jumps without a visual bridge. These controls are used tens of times per day: only subtle feedback is justified. Do not animate results or layout.

## Target

- Logical selection and `aria-pressed` update immediately for every activation. Results remain governed by the server/URL; optimistic selection is feedback, not a claim that new results have arrived.
- Each option has a decorative background layer. Pointer/touch selection crossfades layer opacity 0 ↔ 1 using **120ms cubic-bezier(0.23, 1, 0.32, 1)**. No sliding indicator, animated width, text fade, or layout movement.
- Reduced motion: layer opacity 0.7 ↔ 1 using **100ms cubic-bezier(0.23, 1, 0.32, 1)**. Keyboard/assistive activation (`event.detail === 0`) always settles immediately, including any ongoing pointer transition.
- CSS transitions retarget smoothly on rapid input. No keyframes, timers, request delays, or animation queues. Initial render and browser Back/Forward do not replay a selection animation.
- Preserve existing URL filters, pagination reset, browser history, cookies, translations, native button semantics, and focus rings.

## Repo conventions to follow

- Next.js 16.3.8, React 19.3.0, TypeScript, plain global CSS, no motion dependency.
- Before implementation, read installed guides `/Users/caizhengxu/github/open-prompt-gallery/node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md` and `01-app/01-getting-started/05-server-and-client-components.md` under the same docs root. Use `next/navigation`; do not await `router.push` as if it returned a request promise.
- Reuse `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` at `src/app/globals.css:49`.
- Exemplar: `src/app/globals.css:1113` uses scoped data attributes and CSS transitions; `src/components/image-gallery.tsx:108` distinguishes pointer activation with `event.detail > 0`.
- The global reduced-motion rule at `globals.css:1524` disables transitions with `!important`. Append scoped exceptions after it; instant-mode rules must override those exceptions. Leave unrelated segments in preferences unchanged.

## Steps

1. In `src/components/filters.tsx`, import React `useOptimistic`. Use committed `params.toString()` as the base, with an optimistic replacement URL string; derive a fresh `URLSearchParams` from that string. Read the displayed kind and selected tags from this working parameter set. Keep the search input's `defaultValue` and key based on committed parameters so selection feedback does not remount the input or discard unsent typing.
2. Consolidate URL submission in this component: each update/tag/clear-tags handler constructs its next parameters from the optimistic working parameters, deletes `page`, then runs both the optimistic setter and `router.push` inside the existing transition. Use the complete next query string as the optimistic value. This preserves repeated `tag` values and pending kind/search changes across rapid requests. Do not implement a separate timeout-based rollback: committed parameters remain the base and supersede optimism when the transition settles. Preserve `router.push` history behavior. Verify the installed router's interruption behavior using the checks below; do not assume request completion order.
3. Give only the type `.segments` group a scoped class such as `motion-segments` and initial `data-motion="instant"`. In its option click handler set the group's mode directly from `event.detail > 0` before submitting the state change. Pointer clicks set `animated`; keyboard clicks set `instant`. Keep `aria-pressed` and the active class based on the same displayed value. Add no tab roles or arrow-key semantics: this is a native button group.
4. In `src/components/gallery-layout.tsx`, add the same scoped group class/mode and activation discriminator before the existing `setView` and `persist` calls. Do not change gallery classes, columns, cookie persistence, `aria-controls`, or children. Grid/list layout changes remain immediate.
5. In `src/app/globals.css`, scope all new selectors to `.motion-segments`. Give each button `position: relative; isolation: isolate`; use a noninteractive `::before` layer with `position: absolute; inset: 0; border-radius: inherit; z-index: -1; pointer-events: none`, the existing surface background and selection shadow. Override the real active button background/shadow only in these groups to prevent doubling. The layer targets opacity 0 for inactive and 1 for active. Under `[data-motion="animated"]`, transition only opacity for 120ms using `var(--ease-out)`; under instant mode use no transition. Keep text/color selection immediate. Test stacking in both light and dark themes; the layer must remain visible behind content.
6. Append reduced-motion exceptions scoped to animated motion-segment layers: inactive opacity 0.7, active opacity 1, transition `opacity 100ms var(--ease-out) !important`. Append instant-mode `transition: none !important` after the exceptions. The reduced-motion inactive layer must not carry the active shadow; switch shadow presence instantly with selection so the chosen option remains unambiguous. This is decorative only, with `aria-pressed` authoritative.
7. Extend `tests/e2e/gallery.spec.ts` with behavioral checks for immediate selection under delayed navigation, rapid type changes, and preservation of pending filters. Use a bounded interception of the relevant same-origin RSC navigation in an isolated test instance, releasing it after asserting selection changed while results are still pending. Do not add artificial delays to application code. Add keyboard/Back/Forward and reduced-motion assertions; retain the existing full workflow.

## Boundaries

- No changes to database/actions, result content, pagination UI, sidebar, preferences, copy feedback, image thumbnails, or existing dialog/panel hooks.
- No whole-grid fades, card staggering, FLIP/layout transitions, sliding indicator, new dependencies, or View Transition API.
- No waiting for motion before navigation and no disabling buttons during pending work.
- If source has drifted incompatibly from commit 6aefe6e, stop and report before editing. Existing implemented plans 001–003 are conventions, not work to redo.

## Verification

- **Mechanical**: from the repository root run `npm run typecheck` and `npm run lint`; expect exit 0. Against a running isolated test server and disposable database configured per `README.md`, run `npm run test:e2e -- tests/e2e/gallery.spec.ts`. Playwright does not start a server. Do not run its create/delete workflow against a populated personal library.
- **Behavior**: with a navigation held pending, selection updates before results; releasing navigation leaves URL, result type, and selected option consistent. Rapidly select Full → Pieces → All, then combine a type click with tag and search actions: latest intended kind, repeated tags, query, and model survive; page resets. Back/Forward and reload derive selection from committed URL. Test empty results too.
- **Feel check**: at normal speed selection feels immediate. At 10% playback in DevTools Animations, only the background layer changes opacity; labels and cards remain stationary. Rapid reversals transition from current opacity without remount flashes. Keyboard Enter/Space settles instantly, including midway through a pointer fade. Reduced motion keeps only gentle 100ms opacity feedback. Check touch taps and Chromium/Safari; record unavailable checks explicitly.
- **Done when**: all assertions pass, no unintended preference segment changes or animated layout occur, and manual checks are recorded honestly.

## Execution notes — 2026-10-03

Implemented in an isolated worktree and integrated into the primary checkout. React state owns activation mode and card press feedback rather than imperative data-attribute mutation, preserving feedback across rerenders. Segment buttons bypass the global button press transform so keyboard activation remains immediate. Plan 004 also keeps a latest-intent query ref for event handlers arriving before optimistic renders and settles URL changes before paint.

TypeScript, ESLint and the expanded Chromium gallery workflow passed (final touchscreen regression run: 41.3s). Coverage includes delayed RSC requests, rapid mixed filters, model/query/tag retention and pagination reset, unsent search text, keyboard and Back/Forward, pointer press/leave/cancel, secondary-pointer exclusion, native card navigation, emulated touch taps, and reduced-motion feedback. Dark-grid and light-list settled screenshots were inspected. Manual Safari, physical touch-device and DevTools slow-motion checks remain unverified; status is IMPLEMENTED rather than DONE. No dependencies added.
