"use client";

import gsap from "gsap";
import { useLayoutEffect, useRef, type RefObject } from "react";

function motionIsAllowed() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useWorkspaceMotion(
  root: RefObject<HTMLDivElement | null>,
  stagedCount: number,
  activeId: string | null,
  reviewedCount: number,
) {
  const previousStagedCount = useRef(stagedCount);
  const previousReviewedCount = useRef(reviewedCount);

  // Pointer spotlight on review cards (CSS reads --px/--py), plus in-view reveals for everything below the fold.
  useLayoutEffect(() => {
    const host = root.current;
    if (!host || !motionIsAllowed()) return;
    const cleanups: Array<() => void> = [];
    if (window.matchMedia("(hover: hover)").matches) {
      const onMove = (event: PointerEvent) => {
        const card = (event.target as HTMLElement | null)?.closest<HTMLElement>(".review-card");
        if (!card) return;
        const box = card.getBoundingClientRect();
        card.style.setProperty("--px", `${event.clientX - box.left}px`);
        card.style.setProperty("--py", `${event.clientY - box.top}px`);
      };
      host.addEventListener("pointermove", onMove, { passive: true });
      cleanups.push(() => host.removeEventListener("pointermove", onMove));
    }
    if ("IntersectionObserver" in window) {
      const targets = host.querySelectorAll<HTMLElement>(".reality-metrics article, .tool-chip, .live-source-card, .case-loader, .activity-log > *");
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          gsap.fromTo(entry.target, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, delay: Math.min(index, 5) * 0.04, ease: "power2.out", clearProps: "transform,opacity" });
        });
      }, { rootMargin: "0px 0px -10% 0px", threshold: 0.15 });
      targets.forEach((target) => observer.observe(target));
      cleanups.push(() => observer.disconnect());
    }
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [root]);

  useLayoutEffect(() => {
    if (!root.current || !motionIsAllowed()) return;
    const context = gsap.context(() => {
      gsap.fromTo(".case-heading-row h1 span", { y: 26, opacity: 0 }, {
        y: 0,
        opacity: 1,
        duration: 0.62,
        stagger: 0.09,
        ease: "power3.out",
        clearProps: "transform,opacity",
      });
      gsap.fromTo(".site-header", { y: -12, opacity: 0 }, {
        y: 0,
        opacity: 1,
        duration: 0.38,
        ease: "power2.out",
        clearProps: "transform,opacity",
      });
      gsap.fromTo(".case-reveal", { y: 22, opacity: 0 }, {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.055,
        ease: "power3.out",
        clearProps: "transform,opacity",
      });
      gsap.fromTo(".source-strip > div", { y: 14, opacity: 0 }, {
        y: 0,
        opacity: 1,
        duration: 0.36,
        delay: 0.16,
        stagger: 0.04,
        ease: "power2.out",
        clearProps: "transform,opacity",
      });
    }, root);
    return () => context.revert();
  }, [root]);

  useLayoutEffect(() => {
    const hasNewProposals = stagedCount > previousStagedCount.current;
    previousStagedCount.current = stagedCount;
    if (!root.current || !hasNewProposals || !motionIsAllowed()) return;
    const cards = Array.from(root.current.querySelectorAll<HTMLElement>(".review-card"));
    const fresh = cards.slice(-Math.max(1, stagedCount - (previousStagedCount.current - (stagedCount - previousStagedCount.current))));
    fresh.forEach((card) => { card.removeAttribute("data-fresh"); void card.offsetWidth; card.setAttribute("data-fresh", ""); });
    const timer = window.setTimeout(() => fresh.forEach((card) => card.removeAttribute("data-fresh")), 1100);
    const context = gsap.context(() => {
      gsap.fromTo(".review-card", { y: 14, opacity: 0 }, {
        y: 0,
        opacity: 1,
        duration: 0.32,
        stagger: 0.045,
        ease: "power2.out",
        clearProps: "transform,opacity",
      });
    }, root);
    return () => { window.clearTimeout(timer); context.revert(); };
  }, [root, stagedCount]);

  useLayoutEffect(() => {
    if (!root.current || !activeId || !motionIsAllowed()) return;
    const context = gsap.context(() => {
      gsap.fromTo(".evidence-content > *", { x: 8, opacity: 0.55 }, {
        x: 0,
        opacity: 1,
        duration: 0.24,
        stagger: 0.035,
        ease: "power2.out",
        clearProps: "transform,opacity",
      });
    }, root);
    return () => context.revert();
  }, [root, activeId]);

  useLayoutEffect(() => {
    const previous = previousReviewedCount.current;
    const hasNewDecision = reviewedCount > previous;
    const countChanged = reviewedCount !== previous;
    previousReviewedCount.current = reviewedCount;
    if (!root.current || !countChanged || !motionIsAllowed()) return;
    const badge = root.current.querySelector<HTMLElement>(".connection-badge");
    badge?.removeAttribute("data-bump"); void badge?.offsetWidth; badge?.setAttribute("data-bump", "");
    const chip = previous === 0 && reviewedCount > 0 ? root.current.querySelector<HTMLElement>('[data-tool="export_review_receipt"]') : null;
    chip?.setAttribute("data-unlocked", "");
    const timer = window.setTimeout(() => { badge?.removeAttribute("data-bump"); chip?.removeAttribute("data-unlocked"); }, 2500);
    if (!hasNewDecision) return () => window.clearTimeout(timer);
    const context = gsap.context(() => {
      gsap.fromTo([".hero-action-stack p", ".connection-badge"], { scale: 0.96, opacity: 0.55 }, {
        scale: 1,
        opacity: 1,
        duration: 0.34,
        stagger: 0.045,
        ease: "back.out(1.7)",
        clearProps: "transform,opacity",
      });
    }, root);
    return () => { window.clearTimeout(timer); context.revert(); };
  }, [root, reviewedCount]);
}
