# PASANGSURUT — Papan Pasang Surut 12 Pelabuhan Indonesia

**Live:** https://kayzenn123.github.io/agent-pasangsurut/
**Hari 23** — 30 Days of Code (2026-11-01)

Satu tiang ukur beton setinggi halaman: pilih pelabuhan + tanggal, baca kurva pasang surut hari itu, fase bulan, dan jam melaut — dengan suara Pak Jaga Dermaga.

## Fitur
- Kurva pasang surut harian dari **mesin harmonik** (konstituen M2 · S2 · K1 · O1) + deteksi peristiwa (pasang purnama/perbani, surut terendah) — **model edukasi berlabel CONTOH, bukan untuk navigasi**
- **Fase bulan astronomi riil** (sinodik 29,53059 hari, epoch terverifikasi) + penanda spring/neap tide
- Rekomendasi **jam melaut** dari model + 5 nasihat Pak Jaga Dermaga
- 12 pelabuhan Indonesia (nama + koordinat asli), pencarian + empty state
- Deep-link `?pelabuhan=ambon&tanggal=2026-11-01`, riwayat localStorage `pasangsurut.v1`
- Ekspor: salin ringkasan WA, unduh CSV/JSON
- Kamus dermaga (8 istilah) + easter egg: ketik `rob`
- Toggle gerak + jeda marquee, hormat `prefers-reduced-motion`, mode ringan otomatis

## Tech
- Tanpa build: HTML + CSS + ES modules. GSAP 3.12.5 + ScrollTrigger (self-host, lisensi gratis Webflow)
- Font self-host woff2 latin (88 KB): Beiruti (display), Noto Sans Thai Looped (body), Risque (aksen) — ketiganya OFL
- Ikon: SVG digambar sendiri (gaya stiker outline putih)
- Tekstur beton: SVG `feTurbulence` + `feDiffuseLighting`

## Skor
- Lighthouse mobile **93/97/100/100**, desktop **100/97/100/100** (performance/accessibility/best-practices/seo)
- FPS 60.4 @ CPU throttle 4x · LCP 1.9 dtk · CLS 0.005
- Kontras AA terverifikasi via skrip (teks/bg 8.14:1, muted/bg 5.64:1)

## Cara jalanin
```bash
cd site && python3 -m http.server 8931
# buka http://localhost:8931/
```

## Seed (2026-12-01)
domain pasang surut · layout timeline satu sumbu · ref brutalism beton · constraint 2 ukuran font · gerak fly-through/ring marquee/scramble/tilt/curtain · font Beiruti/Noto Sans Thai Looped/Risque · palet mid-analogous hue 153 · ikon stiker outline putih.

## Sumber metode
- Kusuma et al., JAGI Vol 5 No 2 (2021) — analisis harmonik & prediksi pasang surut Teluk Jakarta
- Tabel periode konstituen standar (Pond & Pickard)
- Epoch bulan: timeanddate.com (bulan baru 9 Nov 2026 07:02 UTC)
