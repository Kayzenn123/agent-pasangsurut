// C. TEKS — scramble/decode + outline terisi saat scroll.
const CHARS = "01/\\<>#*+░▒▓";
let observers = [];

export function scramble(el, finalText, dur = 900) {
  if (motionOff() || !window.gsap) { el.textContent = finalText; return; }
  const start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / dur, 1);
    const done = Math.floor(p * finalText.length);
    let s = finalText.slice(0, done);
    for (let i = done; i < finalText.length; i++) {
      s += finalText[i] === " " || finalText[i] === ":" ? finalText[i] : CHARS[(Math.random() * CHARS.length) | 0];
    }
    el.textContent = s;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Outline-fill: teks dengan -webkit-text-stroke terisi warna saat discroll. */
export function outlineFill(el) {
  el.style.webkitTextStroke = "2px currentColor";
  el.style.color = "transparent";
  if (motionOff() || !window.gsap) { el.style.color = ""; return; }
  gsap.registerPlugin(ScrollTrigger);
  const st = ScrollTrigger.create({
    trigger: el, start: "top 85%", end: "top 35%", scrub: true,
    onUpdate: (self) => {
      const p = Math.round(self.progress * 100);
      el.style.background = `linear-gradient(currentColor, currentColor) 0 100% / 100% ${p}% no-repeat`;
      el.style.webkitTextFillColor = "transparent";
      el.style.backgroundClip = "text";
    },
  });
  observers.push(st);
}

export function init() {
  if (motionOff()) return;
  // scramble otomatis untuk [data-scramble] saat masuk viewport
  const els = document.querySelectorAll("[data-scramble]");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        scramble(e.target, e.target.dataset.scramble);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });
  els.forEach((el) => io.observe(el));
  observers.push(io);
}

export function destroy() {
  observers.forEach((o) => (o.kill ? o.kill() : o.disconnect()));
  observers = [];
}
function motionOff() {
  return document.documentElement.classList.contains("no-motion");
}
