# Kalkulator Harian

Kumpulan kalkulator statis berbahasa Indonesia untuk kebutuhan sehari-hari: matematika, keuangan, kesehatan, konversi satuan, usia, dan IPK. Dibuat tanpa framework, tanpa build step, dan tanpa backend.

## Fitur

- 13 kalkulator dalam satu halaman dengan hash router (`#/kalkulator/:id`).
- Pencarian kalkulator langsung dari header (pintasan `/`).
- Tema terang dan gelap, tersimpan di `localStorage` dan mengikuti preferensi sistem saat pertama dibuka.
- Format angka dan mata uang Indonesia (`1.234.567,89` dan `Rp 1.234.568`).
- Responsif untuk ponsel, tablet, dan desktop.
- Rumus kalkulator dipisahkan dari tampilan sehingga bisa diuji dengan Node.js.
- Hasil dihitung langsung saat input berubah.
- Aplikasi tetap berjalan tanpa koneksi internet setelah halaman dimuat.

## Daftar kalkulator

| Kalkulator | Kategori | Fungsi utama |
| --- | --- | --- |
| Kalkulator Ilmiah | Matematika | Ekspresi, trigonometri, logaritma, akar, pangkat |
| Kalkulator Persentase | Matematika | Persentase, proporsi, perubahan, kenaikan, penurunan |
| Kalkulator Pecahan | Matematika | Operasi pecahan, penyederhanaan, desimal, bentuk campuran |
| Kalkulator Statistik | Matematika | Mean, median, modus, kuartil, varians, simpangan baku |
| Kalkulator Cicilan & KPR | Keuangan | Cicilan anuitas, total bunga, total pembayaran |
| Kalkulator Bunga Majemuk | Keuangan | Nilai akhir investasi dan bunga efektif |
| Kalkulator Tip & Bagi Tagihan | Keuangan | Tip, pajak, pembagian per orang |
| Kalkulator Diskon | Keuangan | Harga akhir setelah diskon dan pajak |
| Kalkulator BMI | Kesehatan | IMT, kategori, rentang berat sehat |
| Kalkulator Kalori (BMR/TDEE) | Kesehatan | Kebutuhan kalori harian dan target berat |
| Konverter Satuan | Konversi | Panjang, massa, suhu, luas, volume, kecepatan, waktu, data |
| Kalkulator Usia | Lainnya | Usia dalam tahun/bulan/hari dan ulang tahun berikutnya |
| Kalkulator IPK / GPA | Lainnya | IPK berbobot SKS skala 4.0 |

## Struktur proyek

```
.
├── index.html
├── assets
│   ├── css
│   │   └── style.css
│   └── js
│       ├── app.js
│       ├── core
│       │   ├── format.js
│       │   ├── registry.js
│       │   └── ui.js
│       └── calculators
│           ├── age.js
│           ├── bmi.js
│           ├── calorie.js
│           ├── compound.js
│           ├── discount.js
│           ├── fraction.js
│           ├── gpa.js
│           ├── loan.js
│           ├── percentage.js
│           ├── scientific.js
│           ├── statistics.js
│           ├── tip.js
│           └── unitconverter.js
├── tests
│   └── calculators.test.js
├── opencode.json
└── README.md
```

Setiap file di `assets/js/calculators/` mendaftarkan kalkulator ke `CalcApp.register()`. Objek pendaftaran berisi metadata, fungsi `compute` murni untuk perhitungan, dan `render` untuk membangun antarmuka.

## Menjalankan secara lokal

Karena situs ini statis, cukup buka `index.html` di browser. Untuk hasil terbaik, jalankan server lokal:

```bash
python -m http.server 8000
```

lalu buka `http://localhost:8000`.

Alternatif dengan Node.js:

```bash
npx serve .
```

## Menjalankan pengujian

Pengujian memakai test runner bawaan Node.js (Node 18+):

```bash
node --test
```

Tes memuat file kalkulator ke dalam konteks `vm`, lalu memverifikasi rumus utama, validasi input, format angka, pencarian, dan integritas registry.

## Rumus yang dipakai

- Cicilan pinjaman: anuitas `M = P × r × (1 + r)^n / ((1 + r)^n − 1)`.
- Bunga majemuk: `A = P × (1 + r/n)^(n × t)` dan `A = P × e^(r × t)` untuk majemuk kontinu.
- BMI: `berat / tinggi²` dengan tinggi dalam meter, kategori WHO untuk dewasa.
- Kalori: Mifflin-St Jeor, lalu dikalikan faktor aktivitas.
- IPK: jumlah `bobot grade × SKS` dibagi total SKS.

## Deploy ke GitHub Pages

Repositori ini disiapkan untuk GitHub Pages dari branch `main` dan folder root:

1. Buka **Settings → Pages** pada repositori GitHub.
2. Pada **Build and deployment**, pilih **Deploy from a branch**.
3. Pilih branch `main` dan folder `/ (root)`, lalu simpan.

Situs akan tersedia di `https://<username>.github.io/<nama-repo>/`.

## Konfigurasi opencode

`opencode.json` menonaktifkan `doom_loop`:

```json
{
  "permission": {
    "doom_loop": "deny"
  }
}
```
