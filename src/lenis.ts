import Lenis from "lenis";

export const lenis = new Lenis({
  duration: 0.6,
  easing: (t: number) => 1 - Math.pow(1 - t, 3),
  smoothWheel: true,
  lerp: 0.06,
  wheelMultiplier: 1,
  touchMultiplier: 1.5,
});

export function scrollTo(target: string | number) {
  if (typeof target === "string") {
    const el = document.querySelector(target);
    if (el) lenis.scrollTo(el as HTMLElement);
  } else {
    lenis.scrollTo(target);
  }
}

export function isNearBottom(threshold = 120) {
  return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - threshold;
}
