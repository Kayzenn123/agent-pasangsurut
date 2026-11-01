// E. REVEAL — curtain wipe: tirai beton menyibak tiap .card saat masuk viewport.
let observers = [];
export function init() {
  const cards = document.querySelectorAll(".card");
  if (motionOff() || !window.gsap) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      io.unobserve(el);
      const curtain = document.createElement("div");
      Object.assign(curtain.style, {
        position: "absolute", inset: "0", background: "var(--text)", zIndex: 5, pointerEvents: "none",
      });
      el.style.position = "relative";
      el.style.overflow = "hidden";
      el.appendChild(curtain);
      gsap.to(curtain, {
        scaleY: 0, transformOrigin: "top", duration: 0.7, ease: "power3.inOut",
        onComplete: () => curtain.remove(),
      });
      gsap.from(el.querySelectorAll("h2"), { y: 40, opacity: 0, duration: 0.6, ease: "power2.out", delay: 0.35 });
    });
  }, { threshold: 0.25 });
  cards.forEach((c) => io.observe(c));
  observers.push(io);
}
export function destroy() {
  observers.forEach((o) => o.disconnect());
  observers = [];
  document.querySelectorAll(".card").forEach((c) => { c.style.overflow = ""; });
}
function motionOff() { return document.documentElement.classList.contains("no-motion"); }
