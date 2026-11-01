// A. KAMERA — fly-through: scale + translate + rotate terscrub sepanjang section.
let triggers = [];
export function init() {
  if (!window.gsap || motionOff()) return;
  gsap.registerPlugin(ScrollTrigger);
  document.querySelectorAll(".fly").forEach((el, i) => {
    const dir = i % 2 === 0 ? 1 : -1;
    const tw = gsap.fromTo(el,
      { scale: 0.94, rotation: -1.6 * dir, y: 40 },
      { scale: 1.1, rotation: 1.6 * dir, y: -40, ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1.2 } });
    triggers.push(tw.scrollTrigger);
  });
}
export function destroy() {
  triggers.forEach((t) => t.kill()); triggers = [];
  gsap.set(".fly", { clearProps: "all" });
}
function motionOff() {
  return document.documentElement.classList.contains("no-motion");
}
