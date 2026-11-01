// D. INPUT — tilt 3D kartu ikut pointer (desktop) / gyro (HP, jika diizinkan).
let cleanups = [];
export function init() {
  if (motionOff() || liteMode()) return;
  const cards = document.querySelectorAll(".portcard");
  if (matchMedia("(pointer: fine)").matches) {
    cards.forEach((card) => {
      const move = (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(700px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateZ(6px)`;
      };
      const leave = () => { card.style.transform = ""; };
      card.addEventListener("pointermove", move);
      card.addEventListener("pointerleave", leave);
      cleanups.push(() => {
        card.removeEventListener("pointermove", move);
        card.removeEventListener("pointerleave", leave);
      });
    });
  } else if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
    // iOS: butuh gestur — aktifkan saat kartu pertama disentuh
    const enable = () => {
      DeviceOrientationEvent.requestPermission().catch(() => {});
      document.removeEventListener("touchstart", enable);
    };
    document.addEventListener("touchstart", enable, { once: true });
  }
}
export function destroy() {
  cleanups.forEach((fn) => fn()); cleanups = [];
  document.querySelectorAll(".portcard").forEach((c) => (c.style.transform = ""));
}
function motionOff() { return document.documentElement.classList.contains("no-motion"); }
function liteMode() { return document.documentElement.classList.contains("lite"); }
