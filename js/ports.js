// Data 12 pelabuhan — nama & koordinat asli. Pola pasang = pola umum wilayah (edukasi).
export const PORTS = [
  { id: "priok",     name: "Tanjung Priok",  region: "Jakarta",        lat: -6.105, lon: 106.880, pattern: "jawa"  },
  { id: "perak",     name: "Tanjung Perak",  region: "Surabaya",       lat: -7.197, lon: 112.725, pattern: "jawa"  },
  { id: "belawan",   name: "Belawan",        region: "Medan",          lat:  3.780, lon:  98.680, pattern: "selat" },
  { id: "makassar",  name: "Makassar",       region: "Makassar",       lat: -5.130, lon: 119.405, pattern: "selat" },
  { id: "benoa",     name: "Benoa",          region: "Bali",           lat: -8.750, lon: 115.215, pattern: "jawa"  },
  { id: "bitung",    name: "Bitung",         region: "Sulawesi Utara", lat: -1.445, lon: 125.190, pattern: "timur" },
  { id: "ambon",     name: "Ambon",          region: "Maluku",         lat: -3.695, lon: 128.180, pattern: "timur" },
  { id: "sorong",    name: "Sorong",         region: "Papua Barat",    lat: -0.880, lon: 131.285, pattern: "timur" },
  { id: "pontianak", name: "Pontianak",      region: "Kalbar",         lat: -0.025, lon: 109.335, pattern: "selat" },
  { id: "banjarmasin", name: "Banjarmasin",  region: "Kalsel",         lat: -3.320, lon: 114.590, pattern: "selat" },
  { id: "balikpapan", name: "Balikpapan",    region: "Kaltim",         lat: -1.275, lon: 116.835, pattern: "timur" },
  { id: "cirebon",   name: "Cirebon",        region: "Jawa Barat",     lat: -6.710, lon: 108.570, pattern: "jawa"  },
];

export const PATTERN_LABEL = {
  jawa:  "campuran condong harian",
  selat: "campuran",
  timur: "campuran condong ganda",
};

export const GLOSSARY = [
  ["Pasang purnama", "Air naik paling tinggi dalam sehari. Perahu gampang keluar, tapi arus kencang."],
  ["Pasang perbani", "Pasang yang lebih kecil — terjadi saat bulan setengah. Air naiknya malu-malu."],
  ["Air mati", "Saat pasang dan surut bedanya tipis. Laut seperti mikir dulu mau ke mana."],
  ["Surut terendah", "Air paling rendah. Karang dan tubir kelihatan — jangan melaut buta."],
  ["Rob", "Banjir pesisir karena air laut naik melewati tanggul. Sering datang saat purnama."],
  ["Palung", "Lekukan dalam di dasar laut. Tempat ikan ngumpul, tempat jangkar nyangkut."],
  ["Tubir", "Tebing bawah laut yang curam. Batas aman perahu kecil saat surut."],
  ["Kolong", "Ruang di bawah dermaga. Jangan parkir perahu di sini saat rob mengintai."],
];

export const FISH_TIPS = [
  "Ikan makan rakus 2 jam sebelum pasang purnama — itu jam emas kailmu.",
  "Jangan ke tubir pas surut terendah. Pulang bawa karang, bukan ikan.",
  "Bulan purnama = arus kencang. Jangkar ganda, jangan satu.",
  "Air mati itu waktunya betulin jaring, bukan maksa melaut jauh.",
  "Catat jam pasangmu sendiri tiap hari — tiang ukur terbaik adalah pengalamanmu.",
];
