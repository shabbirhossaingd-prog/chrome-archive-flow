import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealElement = HTMLDivElement;
const revealCallbacks = new WeakMap<Element, () => void>();
let sharedObserver: IntersectionObserver | null = null;

function getRevealObserver() {
  if (sharedObserver || typeof IntersectionObserver === "undefined") {
    return sharedObserver;
  }

  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const show = revealCallbacks.get(entry.target);
        show?.();
        sharedObserver?.unobserve(entry.target);
        revealCallbacks.delete(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
  );

  return sharedObserver;
}

export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "span" | "li";
}) {
  const ref = useRef<RevealElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }

    const observer = getRevealObserver();
    if (!observer) {
      setVisible(true);
      return;
    }

    revealCallbacks.set(el, () => setVisible(true));
    observer.observe(el);

    return () => {
      observer.unobserve(el);
      revealCallbacks.delete(el);
    };
  }, []);

  const Component = Tag as "div";

  return (
    <Component
      ref={ref}
      data-visible={visible}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn("reveal", className)}
    >
      {children}
    </Component>
  );
}
