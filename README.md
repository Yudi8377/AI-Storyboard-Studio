# AI Storyboard Studio

Studio storyboard berbantuan AI, berbahasa Indonesia terlebih dahulu, untuk mengubah brief/naskah menjadi shot list yang bisa ditinjau, disimpan, dan diekspor. Alur kerja storyboard terinspirasi dari konsep di `beatra-ai/ai-storyboard-generator-skill` (MIT-0), tetapi layanan render Beatra tidak dijadikan ketergantungan produksi karena render hosted menggunakan credits.

## Keputusan arsitektur

- **Kode sumber kanonis:** GitHub, repositori ini.
- **Pilot yang sedang berjalan:** [AI Storyboard Studio di Hatchable](https://ai-storyboard-studio.hatchable.site).
- **Skema PostgreSQL target produksi:** Neon, proyek `shy-shadow-71251136`, branch `br-cool-shadow-b5ozmaxq`, database `neondb`.
- **Batas penting:** pilot Hatchable menggunakan runtime/auth/database yang dikelola Hatchable. Neon telah disiapkan terpisah dan belum terbukti tersambung ke runtime aplikasi. Jangan menyatakan keduanya satu sistem sampai koneksi, migrasi, dan pengujian berhasil.
- **Strategi render:** pertahankan UI dan generator storyboard yang sudah ada; pisahkan render gambar/video ke worker mandiri dengan model terbuka yang lisensinya telah diperiksa. Jangan hapus pekerjaan yang berfungsi untuk mengganti dengan skill yang tetap memerlukan kredit eksternal.

## Status implementasi per 2026-10-28

- UI responsif untuk brief, pengaturan format/gaya/bahasa/jumlah shot, pemilihan frame kunci, penyimpanan proyek, dan ekspor.
- Endpoint generator teks AI dan autentikasi email tersedia pada pilot. Smoke test sebelumnya berhasil untuk pembuatan storyboard 3 shot dan CRUD proyek; akses anonim ke endpoint terlindungi ditolak.
- Endpoint gambar `app/api/generate-image.js` sudah ada, tetapi permintaan terbaru mendapat HTTP 429 dari provider. Render gambar end-to-end yang sukses **belum terverifikasi**; jangan anggap masalah sudah selesai.
- Worker video mandiri belum diterapkan.
- Validasi sumber GitHub Actions untuk commit `9aafd5cfc39c0bd19442069531fe8763d0884dc2` lulus.
- Aplikasi **belum boleh dinyatakan siap produksi komersial** sampai koneksi database runtime diputuskan dan diuji, render nyata diverifikasi, pengujian E2E/isolasi data/keamanan dilakukan, serta monitoring, backup/restore, dan kendali biaya tersedia.

## Dokumen arsitektur

Lihat [Independent Image & Video Generation Workers](docs/GENERATION_WORKERS.md) untuk kontrak job API, state machine, worker adapter, keamanan, strategi biaya, tahapan rollout, dan release gates. Dokumen tersebut adalah rancangan integrasi, bukan klaim bahwa worker GPU telah diterapkan atau dideploy.

## Struktur

- `migrations/`: skema PostgreSQL target.
- `app/`: snapshot implementasi pilot Hatchable (API, UI, login, konfigurasi, dan migrasi Hatchable).
- `docs/DEPLOYMENT.md`: gerbang deployment dan prosedur rilis.
- `docs/GENERATION_WORKERS.md`: rancangan worker gambar/video independen.

## Keamanan dan biaya

Jangan pernah menaruh URL koneksi database, API key model, token, atau kredensial dalam source control. Semua query produksi harus menggunakan parameter, otorisasi server-side, dan batas kepemilikan per pengguna. File media sebaiknya privat dengan signed URL berumur pendek. Jangan otomatis mengulang error kuota/biaya. Open-source tidak berarti operasi tanpa biaya: GPU, listrik, penyimpanan, bandwidth, dan pemeliharaan tetap membutuhkan sumber daya. Jangan menjanjikan generasi tanpa batas sebelum kapasitas dan pendanaannya nyata.

## Lisensi

Repo upstream `beatra-ai/ai-storyboard-generator-skill` menyatakan MIT-0 untuk skill. Lisensi tersebut tidak mencakup layanan render pihak ketiga, model, checkpoint, custom nodes, font, aset, atau output terms. Verifikasi lisensi tiap komponen sebelum penggunaan komersial.
