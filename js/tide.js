// Mesin harmonik pasang surut (model edukasi) + fase bulan astronomi riil.
// Metode: sintesis harmonik — Kusuma et al., JAGI Vol 5 No 2 (2021), Teluk Jakarta.
// Periode konstituen: tabel standar (Pond & Pickard): M2 12,4206 j · S2 12,0 j · K1 23,9344 j · O1 25,8194 j.

export const CONSTITUENTS = [
  { name: "M2", hours: 12.4206 },
  { name: "S2", hours: 12.0 },
  { name: "K1", hours: 23.9344 },
  { name: "O1", hours: 25.8194 },
];

// Amplitudo = POLA UMUM wilayah (estimasi edukasi, bukan konstanta ukur pelabuhan).
const PATTERNS = {
  jawa:  { K1: 0.42, O1: 0.28, M2: 0.13, S2: 0.10, seed: 11 }, // campuran condong harian
  selat: { K1: 0.33, O1: 0.22, M2: 0.26, S2: 0.17, seed: 47 }, // campuran
  timur: { K1: 0.22, O1: 0.14, M2: 0.38, S2: 0.30, seed: 83 }, // campuran condong ganda
};

const SYNODIC = 29.530588853; // hari
// Epoch: bulan baru 9 Nov 2026 07:02 UTC (timeanddate.com) — epoch terkini
// meminimalkan drift algoritma rata-rata untuk rentang tanggal situs (±1 thn).
const MOON_EPOCH = Date.UTC(2026, 10, 9, 7, 2);

/** Umur bulan (hari) untuk sebuah Date — algoritma astronomi standar. */
export function moonAge(date) {
  const d = (date.getTime() - MOON_EPOCH) / 86400000;
  return ((d % SYNODIC) + SYNODIC) % SYNODIC;
}

export function moonInfo(date) {
  const age = moonAge(date);
  const illum = Math.round(((1 - Math.cos((2 * Math.PI * age) / SYNODIC)) / 2) * 100);
  const idx = Math.floor(((age + SYNODIC / 16) % SYNODIC) / (SYNODIC / 8));
  const names = ["Bulan baru", "Sabit awal", "Perempat awal", "Cembung awal", "Purnama", "Cembung akhir", "Perempat akhir", "Sabit akhir"];
  const spring = Math.min(age, SYNODIC - age) < 3.4 || Math.abs(age - SYNODIC / 2) < 3.4;
  return { age: +age.toFixed(1), illum, name: names[idx], spring };
}

function phaseFor(portId, cname, seed) {
  let h = seed * 31 + portId.length * 7;
  for (const ch of portId + cname) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  return (h % 628) / 100; // 0..2π deterministik per pelabuhan
}

/** Tinggi relatif (meter, relatif thd muka laut rata-rata) pada jam t (0..24) di tanggal tsb. */
export function tideHeight(port, date, tHours) {
  const p = PATTERNS[port.pattern];
  const { spring } = moonInfo(date);
  const boost = spring ? 1.18 : 1.0; // pasang perbani/purnama memperkuat komponen ganda
  let h = 0;
  for (const c of CONSTITUENTS) {
    const amp = p[c.name] * (c.name === "M2" || c.name === "S2" ? boost : 1);
    h += amp * Math.cos((2 * Math.PI * tHours) / c.hours + phaseFor(port.id, c.name, p.seed));
  }
  return h;
}

/** Daftar peristiwa (pasang/surut) dalam satu hari lokal. */
export function tideEvents(port, date) {
  const N = 288, vals = [];
  for (let i = 0; i <= N; i++) vals.push(tideHeight(port, date, (i / N) * 24));
  const raw = [];
  for (let i = 1; i < N; i++) {
    if (vals[i] > vals[i - 1] && vals[i] > vals[i + 1]) raw.push({ type: "high", i });
    if (vals[i] < vals[i - 1] && vals[i] < vals[i + 1]) raw.push({ type: "low", i });
  }
  // saring yang terlalu berdekatan (< 3 jam)
  const ev = [];
  for (const r of raw) {
    const t = (r.i / N) * 24;
    if (!ev.length || t - ev[ev.length - 1].t > 3) ev.push({ ...r, t, h: vals[r.i] });
    else if ((r.type === "high" && vals[r.i] > ev[ev.length - 1].h) || (r.type === "low" && vals[r.i] < ev[ev.length - 1].h)) {
      ev[ev.length - 1] = { ...r, t, h: vals[r.i] };
    }
  }
  const highs = ev.filter((e) => e.type === "high").sort((a, b) => b.h - a.h);
  const lows = ev.filter((e) => e.type === "low").sort((a, b) => a.h - b.h);
  ev.forEach((e, k) => {
    if (e.type === "high") e.label = highs[0] === e ? "Pasang purnama" : "Pasang perbani";
    else e.label = lows[0] === e ? "Surut terendah" : "Surut";
    e.id = "ev" + k;
  });
  return ev.sort((a, b) => a.t - b.t);
}

export function fmtTime(t) {
  const h = Math.floor(t), m = Math.round((t - h) * 60);
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

export function fmtHeight(h) {
  return (h >= 0 ? "+" : "") + h.toFixed(2) + " m";
}

/** Rekomendasi jam melaut dari peristiwa hari itu — panduan umum. */
export function fishAdvice(events, moon) {
  const highs = events.filter((e) => e.type === "high");
  const lows = events.filter((e) => e.type === "low");
  const out = [];
  if (highs.length) {
    const h = highs[0];
    out.push({ t: h.t - 2, text: `Berangkat ${fmtTime(h.t - 2)} — 2 jam sebelum ${h.label.toLowerCase()} ${fmtTime(h.t)}. Air naik, perahu gampang keluar.` });
  }
  if (lows.length) {
    const l = lows[0];
    out.push({ t: l.t, text: `Waspada ${fmtTime(Math.max(0, l.t - 1))}–${fmtTime(Math.min(24, l.t + 1))} — sekitar surut terendah ${fmtTime(l.t)}. Karang dangkal, jangan maksa ke tubir.` });
  }
  if (moon.spring) out.push({ t: 12, text: `Bulan ${moon.name.toLowerCase()} — pasang besar, arus kencang. Jangkar ganda, Cak.` });
  else out.push({ t: 12, text: `Bulan ${moon.name.toLowerCase()} — pasang tenang. Waktu aman untuk yang baru belajar melaut.` });
  return out.sort((a, b) => a.t - b.t);
}
