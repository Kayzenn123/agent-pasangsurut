// PASANGSURUT — orkestrasi utama.
import { PORTS, PATTERN_LABEL, GLOSSARY, FISH_TIPS } from "./ports.js";
import { tideHeight, tideEvents, moonInfo, fishAdvice, fmtTime, fmtHeight } from "./tide.js";
import * as camera from "./camera.js";
import * as marquee from "./marquee.js";
import * as textfx from "./textfx.js";
import * as input from "./input.js";
import * as reveal from "./reveal.js";

const LS_KEY = "pasangsurut.v1";
const $ = (s) => document.querySelector(s);

const state = { port: PORTS[0], date: todayStr() };
let motionOn = !matchMedia("(prefers-reduced-motion: reduce)").matches;
let marqueeOn = true;

function todayStr(d = new Date()) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function parseDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3] ? d : null;
}
function inRange(d) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const lo = new Date(now); lo.setDate(lo.getDate() - 30);
  const hi = new Date(now); hi.setFullYear(hi.getFullYear() + 1);
  return d >= lo && d <= hi;
}
const fmtID = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });

// ---------- persistence ----------
function loadLS() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { v: 1, history: [] };
    const o = JSON.parse(raw);
    return o && o.v === 1 && Array.isArray(o.history) ? o : { v: 1, history: [] };
  } catch { return { v: 1, history: [] }; }
}
function saveHistory() {
  try {
    const s = loadLS();
    s.history.unshift({ port: state.port.id, date: $("#dateInput").value, ts: Date.now() });
    s.history = s.history.slice(0, 20);
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch { /* mode privat — biarin */ }
}

// ---------- deep link ----------
function readDeepLink() {
  const q = new URLSearchParams(location.search);
  const p = PORTS.find((x) => x.id === q.get("pelabuhan"));
  const d = parseDate(q.get("tanggal"));
  if (p) state.port = p;
  if (d && inRange(d)) state.date = todayStr(d);
}
function writeDeepLink() {
  const q = new URLSearchParams({ pelabuhan: state.port.id, tanggal: state.date });
  history.replaceState(null, "", "?" + q.toString());
}

// ---------- render ----------
function renderPorts(filter = "") {
  const grid = $("#portGrid");
  grid.innerHTML = "";
  const list = PORTS.filter((p) => (p.name + " " + p.region).toLowerCase().includes(filter.toLowerCase()));
  if (!list.length) {
    const li = document.createElement("li");
    li.innerHTML = "<p><strong>Tak ada pelabuhan bernama itu, Cak.</strong><br>Coba kata lain — misal “makassar”.</p>";
    li.setAttribute("role", "status");
    grid.appendChild(li);
    return;
  }
  list.forEach((p) => {
    const li = document.createElement("li");
    li.className = "portcard";
    li.innerHTML = `<h3>${esc(p.name)}</h3>
      <p class="coords">${p.lat.toFixed(2)}°, ${p.lon.toFixed(2)}° · ${esc(p.region)}</p>
      <p class="ptype">${esc(PATTERN_LABEL[p.pattern])}</p>
      <button type="button" data-port="${p.id}">PAKAI PELABUHAN INI</button>`;
    grid.appendChild(li);
  });
  grid.querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => {
      state.port = PORTS.find((x) => x.id === b.dataset.port);
      $("#portSelect").value = state.port.id;
      recalc(true);
      $("#kurva").scrollIntoView({ behavior: motionOn ? "smooth" : "auto" });
    })
  );
  input.destroy(); input.init(); // tilt untuk kartu baru
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function drawCurve() {
  const cv = $("#tideCanvas"), ctx = cv.getContext("2d");
  const W = cv.width, H = cv.height, PAD = 70;
  ctx.clearRect(0, 0, W, H);
  const N = 240, vals = [];
  let mn = 1e9, mx = -1e9;
  const d = parseDate(state.date);
  for (let i = 0; i <= N; i++) {
    const v = tideHeight(state.port, d, (i / N) * 24);
    vals.push(v); mn = Math.min(mn, v); mx = Math.max(mx, v);
  }
  const pad = (mx - mn) * 0.15 || 0.1; mn -= pad; mx += pad;
  const X = (t) => PAD + (t / 24) * (W - PAD * 1.4);
  const Y = (v) => H - PAD - ((v - mn) / (mx - mn)) * (H - PAD * 1.6);
  const css = getComputedStyle(document.documentElement);
  const text = css.getPropertyValue("--text").trim() || "#1a2b22";

  // grid jam
  ctx.strokeStyle = "rgba(0,0,0,.18)"; ctx.lineWidth = 2;
  ctx.fillStyle = text; ctx.font = "700 22px 'Noto Sans Thai Looped', sans-serif";
  for (let h = 0; h <= 24; h += 3) {
    ctx.beginPath(); ctx.moveTo(X(h), PAD * 0.6); ctx.lineTo(X(h), H - PAD * 0.7); ctx.stroke();
    ctx.fillText(String(h).padStart(2, "0"), X(h) - 12, H - PAD * 0.25);
  }
  // garis nol
  if (mn < 0 && mx > 0) {
    ctx.setLineDash([10, 8]); ctx.strokeStyle = "rgba(0,0,0,.4)";
    ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(24), Y(0)); ctx.stroke();
    ctx.setLineDash([]);
  }
  // batas rob
  const robY = Y(mx - (mx - mn) * 0.08);
  ctx.setLineDash([14, 10]); ctx.strokeStyle = "#c21725"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(X(0), robY); ctx.lineTo(X(24), robY); ctx.stroke();
  ctx.setLineDash([]); ctx.fillStyle = "#c21725";
  ctx.fillText("BATAS ROB", X(24) - 150, robY - 12);

  // kurva
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "rgba(20,60,50,.35)"); grad.addColorStop(1, "rgba(20,60,50,.02)");
  ctx.beginPath(); ctx.moveTo(X(0), Y(vals[0]));
  for (let i = 1; i <= N; i++) ctx.lineTo(X(i / N * 24), Y(vals[i]));
  ctx.strokeStyle = text; ctx.lineWidth = 5; ctx.stroke();
  ctx.lineTo(X(24), H - PAD * 0.7); ctx.lineTo(X(0), H - PAD * 0.7); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  // penanda peristiwa
  const ev = tideEvents(state.port, d);
  ev.forEach((e) => {
    ctx.beginPath(); ctx.arc(X(e.t), Y(e.h), 11, 0, 7);
    ctx.fillStyle = e.type === "high" ? "#0d5c46" : "#c21725";
    ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = "#fff"; ctx.stroke();
  });
  // garis "sekarang"
  if (state.date === todayStr()) {
    const now = new Date(), t = now.getHours() + now.getMinutes() / 60;
    ctx.setLineDash([8, 8]); ctx.strokeStyle = text; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(X(t), PAD * 0.6); ctx.lineTo(X(t), H - PAD * 0.7); ctx.stroke();
    ctx.setLineDash([]);
  }
  return ev;
}

function drawMoon() {
  const cv = $("#moonCanvas"), ctx = cv.getContext("2d");
  const R = 150, C = 180;
  ctx.clearRect(0, 0, 360, 360);
  const d = parseDate(state.date);
  const info = moonInfo(d);
  const p = info.age / 29.530588853;
  // piringan gelap
  ctx.beginPath(); ctx.arc(C, C, R, 0, 7); ctx.fillStyle = "#24352e"; ctx.fill();
  // bagian terang
  ctx.save();
  ctx.beginPath(); ctx.arc(C, C, R, 0, 7); ctx.clip();
  ctx.fillStyle = "#f2e9c8";
  const rx = Math.abs(Math.cos(2 * Math.PI * p)) * R;
  if (p < 0.5) { // membesar: terang kanan
    ctx.beginPath(); ctx.ellipse(C + (R - rx) / 2 * 0 + R - rx, C, Math.max(rx, 2), R, 0, 0, 7); ctx.fill();
    if (rx < R * 0.95) { ctx.beginPath(); ctx.arc(C, C, R, -Math.PI / 2, Math.PI / 2); ctx.fill(); }
  } else { // mengecil: terang kiri
    ctx.beginPath(); ctx.ellipse(C - R + rx, C, Math.max(rx, 2), R, 0, 0, 7); ctx.fill();
    if (rx < R * 0.95) { ctx.beginPath(); ctx.arc(C, C, R, Math.PI / 2, Math.PI * 1.5); ctx.fill(); }
  }
  ctx.restore();
  ctx.lineWidth = 6; ctx.strokeStyle = "#f2e9c8"; ctx.beginPath(); ctx.arc(C, C, R, 0, 7); ctx.stroke();
  return info;
}

function renderEvents(ev) {
  const ul = $("#eventList");
  ul.innerHTML = "";
  const d = parseDate(state.date);
  ev.forEach((e) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.innerHTML = `<span class="elabel">${esc(e.label)}</span><span class="etime">${fmtTime(e.t)}</span><span class="eh">${fmtHeight(e.h)} rel. muka laut rata-rata</span>`;
    b.addEventListener("click", () => showEventDetail(e, d));
    li.appendChild(b); ul.appendChild(li);
  });
  $("#eventDetail").hidden = true;
}

function showEventDetail(e, d) {
  const box = $("#eventDetail");
  const advice = e.type === "high"
    ? "Air naik — perahu gampang keluar, tapi awas arus kencang di muara."
    : "Air turun — cek karang dan tubir sebelum melaut. Jangan maksa.";
  box.innerHTML = `<p><strong>${esc(e.label)}</strong> · ${fmtTime(e.t)} · ${fmtHeight(e.h)}</p><p>${advice}</p><p class="note">Jam = waktu setempat pelabuhan (model edukasi). Selalu cocokkan dengan info resmi pelabuhan.</p>`;
  box.hidden = false;
  textfx.scramble(box.querySelector("strong"), e.label);
}

function renderMoonFish() {
  const d = parseDate(state.date);
  const info = drawMoon();
  textfx.scramble($("#moonName"), info.name.toUpperCase());
  $("#moonAge").textContent = info.age;
  $("#moonIllum").textContent = info.illum;
  $("#springNote").textContent = info.spring
    ? "Bulan baru/purnama dekat — pasang besar (spring tide). Arus kencang, Cak."
    : "Bulan setengah — pasang tenang (neap tide). Air bersahabat.";
  const ev = tideEvents(state.port, d);
  const ul = $("#fishList");
  ul.innerHTML = "";
  fishAdvice(ev, info).forEach((a) => {
    const li = document.createElement("li");
    li.textContent = a.text;
    ul.appendChild(li);
  });
}

function renderGlossary() {
  const dl = $("#glossList");
  dl.innerHTML = "";
  GLOSSARY.forEach(([t, def]) => {
    const wrap = document.createElement("div");
    const dt = document.createElement("dt"); dt.textContent = t;
    const dd = document.createElement("dd"); dd.textContent = def;
    if (t === "Rob") dd.textContent += " (ketik R-O-B di mana saja untuk membuka slab peringatan)";
    wrap.append(dt, dd); dl.appendChild(wrap);
  });
  const wrap = document.createElement("div");
  const dt = document.createElement("dt"); dt.textContent = "Nasihat hari ini";
  const dd = document.createElement("dd"); dd.textContent = FISH_TIPS[new Date().getDate() % FISH_TIPS.length];
  wrap.append(dt, dd); dl.appendChild(wrap);
}

function summaryText(ev) {
  const d = parseDate(state.date);
  const info = moonInfo(d);
  const lines = ev.map((e) => `${e.label} ${fmtTime(e.t)} (${fmtHeight(e.h)})`);
  return `PASANGSURUT — ${state.port.name}, ${fmtID.format(d)}: ${lines.join(" · ")}. Bulan: ${info.name} (${info.illum}%). (Model edukasi)`;
}

function recalc(fromUser = false) {
  const portSel = $("#portSelect"), dateIn = $("#dateInput");
  const errBox = $("#formError");
  const p = PORTS.find((x) => x.id === portSel.value) || PORTS[0];
  const d = parseDate(dateIn.value);
  if (!d || !inRange(d)) {
    if (errBox) {
      errBox.hidden = false;
      errBox.textContent = !d
        ? "Tanggalnya nggak kebaca, Cak. Pakai format kalender yang benar."
        : "Tanggalnya kebablasan, Cak. Maksimal 30 hari ke belakang, setahun ke depan.";
    }
    dateIn.focus();
    return;
  }
  if (errBox) errBox.hidden = true;
  state.port = p; state.date = todayStr(d);
  $("#curvePortName").textContent = p.name;
  $("#curveDate").textContent = fmtID.format(d);
  $("#nowPort").textContent = p.name.toUpperCase();
  // loading state jujur: tandai sibuk selama hitung+render aktual
  const card = $("#kurva .card");
  card.setAttribute("aria-busy", "true");
  requestAnimationFrame(() => {
    const ev = drawCurve();
    renderEvents(ev);
    renderMoonFish();
    card.setAttribute("aria-busy", "false");
  });
  writeDeepLink();
  if (fromUser) saveHistory();
}

// ---------- export ----------
async function copyWA() {
  const d = parseDate(state.date);
  const txt = summaryText(tideEvents(state.port, d));
  try {
    await navigator.clipboard.writeText(txt);
    flashBtn("#btnCopy", "TERSALIN!");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = txt; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); flashBtn("#btnCopy", "TERSALIN!"); }
    catch { flashBtn("#btnCopy", "GAGAL — SALIN MANUAL"); }
    ta.remove();
  }
}
function flashBtn(sel, txt) {
  const b = $(sel), old = b.textContent;
  b.textContent = txt;
  setTimeout(() => (b.textContent = old), 1600);
}
function download(name, content, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// ---------- easter egg ----------
function initEgg() {
  let buf = "";
  addEventListener("keydown", (e) => {
    if (e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-3);
    if (buf === "rob") {
      const slab = $("#robSlab");
      if (slab.hidden) {
        slab.hidden = false;
        textfx.scramble($("#hRob"), "WASPADA ROB");
        slab.scrollIntoView({ behavior: motionOn ? "smooth" : "auto" });
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }
    }
  });
}

// ---------- motion toggles ----------
function applyMotion() {
  document.documentElement.classList.toggle("no-motion", !motionOn);
  $("#btnMotion").textContent = "Gerak: " + (motionOn ? "Nyala" : "Mati");
  $("#btnMotion").setAttribute("aria-pressed", String(motionOn));
  camera.destroy(); marquee.destroy(); textfx.destroy(); input.destroy(); reveal.destroy();
  if (motionOn) { camera.init(); marquee.init(); textfx.init(); input.init(); reveal.init(); }
  else document.querySelectorAll("[data-scramble]").forEach((el) => (el.textContent = el.dataset.scramble));
  if (window.ScrollTrigger) ScrollTrigger.refresh();
}
function initToggles() {
  $("#btnMotion").addEventListener("click", () => { motionOn = !motionOn; applyMotion(); });
  $("#btnMarquee").addEventListener("click", () => {
    marqueeOn = !marqueeOn;
    marquee.setRunning(marqueeOn && motionOn);
    $("#btnMarquee").textContent = "Marquee: " + (marqueeOn ? "Jalan" : "Jeda");
    $("#btnMarquee").setAttribute("aria-pressed", String(marqueeOn));
  });
}

// ---------- jam (WIB, Asia/Jakarta) ----------
const wibFmt = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false });
function tickClock() {
  const s = wibFmt.format(new Date()).replace(".", ":");
  const el = $("#nowClock");
  if (el.dataset.scramble !== s) { el.dataset.scramble = s; textfx.scramble(el, s, 600); }
}

// ---------- boot ----------
function boot() {
  // mode ringan
  if ((navigator.hardwareConcurrency || 8) <= 4 || (navigator.connection && navigator.connection.saveData)) {
    document.documentElement.classList.add("lite");
  }
  // lite via fps jatuh: pantau 2 detik pertama
  let frames = 0; const t0 = performance.now();
  const watch = () => {
    frames++;
    if (performance.now() - t0 < 2000) requestAnimationFrame(watch);
    else if (frames / 2 < 40) document.documentElement.classList.add("lite");
  };
  requestAnimationFrame(watch);

  readDeepLink();
  const sel = $("#portSelect");
  PORTS.forEach((p) => {
    const o = document.createElement("option");
    o.value = p.id; o.textContent = `${p.name} — ${p.region}`;
    sel.appendChild(o);
  });
  sel.value = state.port.id;
  const di = $("#dateInput");
  di.value = state.date;
  const err = document.createElement("p");
  err.id = "formError"; err.className = "note"; err.hidden = true;
  err.setAttribute("role", "alert"); err.style.color = "var(--pop)";
  $("#pickForm").appendChild(err);

  $("#pickForm").addEventListener("submit", (e) => { e.preventDefault(); recalc(true); });
  sel.addEventListener("change", () => recalc(true));
  di.addEventListener("change", () => recalc(true));
  $("#portSearch").addEventListener("input", (e) => renderPorts(e.target.value));
  $("#btnCopy").addEventListener("click", copyWA);
  $("#btnCSV").addEventListener("click", () => {
    const d = parseDate(state.date);
    const rows = ["jam,peristiwa,tinggi_m", ...tideEvents(state.port, d).map((e) => `${fmtTime(e.t)},"${e.label}",${e.h.toFixed(3)}`)];
    download(`pasangsurut-${state.port.id}-${state.date}.csv`, rows.join("\n"), "text/csv");
  });
  $("#btnJSON").addEventListener("click", () => {
    const d = parseDate(state.date);
    download(`pasangsurut-${state.port.id}-${state.date}.json`, JSON.stringify({
      pelabuhan: state.port, tanggal: state.date,
      peristiwa: tideEvents(state.port, d),
      bulan: moonInfo(d), model: "harmonik edukasi M2/S2/K1/O1",
    }, null, 2), "application/json");
  });

  renderPorts();
  renderGlossary();
  recalc(false);
  initToggles();
  initEgg();
  applyMotion();
  tickClock();
  setInterval(tickClock, 30000);
  // outline-fill untuk judul section
  document.querySelectorAll(".card h2").forEach((h) => textfx.outlineFill(h));
}

document.addEventListener("DOMContentLoaded", boot);
