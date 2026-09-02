"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

function motionIsAllowed() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Replays a CSS animation class whenever `token` changes (the evidence drawer, the decision notice). */
export function useRestart<T extends HTMLElement>(ref: RefObject<T | null>, token: unknown, className: string) {
  useEffect(() => {
    const element = ref.current;
    if (!element || token === null || token === undefined || token === "" || !motionIsAllowed()) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
  }, [ref, token, className]);
}

/**
 * Entrance motion lives in CSS (it starts at first paint, before hydration). This hook only adds the
 * state-change feedback CSS cannot know about: which review cards just arrived, when the tool count
 * flips between 7 and 8, and where the pointer is over a card.
 */
export function useWorkspaceMotion(root: RefObject<HTMLDivElement | null>, stagedCount: number, reviewedCount: number) {
  const previousStagedCount = useRef(stagedCount);
  const previousReviewedCount = useRef(reviewedCount);

  // Pointer spotlight on review cards, coalesced to at most one layout read per frame.
  useEffect(() => {
    const host = root.current;
    if (!host || !motionIsAllowed() || !window.matchMedia("(hover: hover)").matches) return;
    let frame = 0;
    let latest: PointerEvent | null = null;
    const paint = () => {
      frame = 0;
      const event = latest;
      const card = (event?.target as HTMLElement | null)?.closest<HTMLElement>(".review-card");
      if (!event || !card) return;
      const box = card.getBoundingClientRect();
      card.style.setProperty("--px", `${event.clientX - box.left}px`);
      card.style.setProperty("--py", `${event.clientY - box.top}px`);
    };
    const onMove = (event: PointerEvent) => {
      latest = event;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    host.addEventListener("pointermove", onMove, { passive: true });
    return () => { host.removeEventListener("pointermove", onMove); if (frame) cancelAnimationFrame(frame); };
  }, [root]);

  // Exactly the cards that just arrived get the one-shot sheen.
  useLayoutEffect(() => {
    const previous = previousStagedCount.current;
    previousStagedCount.current = stagedCount;
    if (!root.current || stagedCount <= previous || !motionIsAllowed()) return;
    const fresh = Array.from(root.current.querySelectorAll<HTMLElement>(".review-card")).slice(-(stagedCount - previous));
    fresh.forEach((card) => { card.removeAttribute("data-fresh"); void card.offsetWidth; card.setAttribute("data-fresh", ""); });
    const timer = window.setTimeout(() => fresh.forEach((card) => card.removeAttribute("data-fresh")), 1100);
    return () => window.clearTimeout(timer);
  }, [root, stagedCount]);

  // The badge rings and the receipt chip inks only when the tool count really flips (0 ↔ some reviewed work).
  useLayoutEffect(() => {
    const previous = previousReviewedCount.current;
    previousReviewedCount.current = reviewedCount;
    const gateChanged = (previous > 0) !== (reviewedCount > 0);
    if (!root.current || !gateChanged || !motionIsAllowed()) return;
    const badge = root.current.querySelector<HTMLElement>(".connection-badge");
    badge?.removeAttribute("data-bump"); void badge?.offsetWidth; badge?.setAttribute("data-bump", "");
    const chip = reviewedCount > 0 ? root.current.querySelector<HTMLElement>('[data-tool="export_review_receipt"]') : null;
    chip?.setAttribute("data-unlocked", "");
    const timer = window.setTimeout(() => { badge?.removeAttribute("data-bump"); chip?.removeAttribute("data-unlocked"); }, 1600);
    return () => window.clearTimeout(timer);
  }, [root, reviewedCount]);
}
