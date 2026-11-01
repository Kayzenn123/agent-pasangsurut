// B. MARQUEE — dua ring melingkar (path SVG), kecepatan ikut velocity scroll.
let raf = 0, rotA = 0, rotB = 0, vel = 0, running = true, lastY = 0;
let ringA = null, ringB = null;
function tick() {
  const y = window.scrollY;
  vel = vel * 0.92 + Math.min(Math.abs(y - lastY) * 0.25, 6) * 0.08;
  lastY = y;
  if (running) {
    rotA += 0.25 + vel * 0.9;
    rotB -= 0.18 + vel * 0.6;
    ringA.style.transform = `rotate(${rotA}deg)`;
    ringB.style.transform = `rotate(${rotB}deg)`;
  }
  raf = requestAnimationFrame(tick);
}
function onVis() {
  cancelAnimationFrame(raf);
  if (!document.hidden && !motionOff()) { lastY = window.scrollY; raf = requestAnimationFrame(tick); }
}
export function init() {
  ringA = document.querySelector(".ring-a"); ringB = document.querySelector(".ring-b");
  if (!ringA || motionOff()) return;
  lastY = window.scrollY;
  raf = requestAnimationFrame(tick);
  document.addEventListener("visibilitychange", onVis);
}
export function setRunning(v) { running = v; }
export function destroy() {
  cancelAnimationFrame(raf);
  document.removeEventListener("visibilitychange", onVis);
}
function motionOff() {
  return document.documentElement.classList.contains("no-motion");
}
