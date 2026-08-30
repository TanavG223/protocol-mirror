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

  useLayoutEffect(() => {
    if (!root.current || !motionIsAllowed()) return;
    const context = gsap.context(() => {
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
    return () => context.revert();
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
    const hasNewDecision = reviewedCount > previousReviewedCount.current;
    previousReviewedCount.current = reviewedCount;
    if (!root.current || !hasNewDecision || !motionIsAllowed()) return;
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
    return () => context.revert();
  }, [root, reviewedCount]);
}
