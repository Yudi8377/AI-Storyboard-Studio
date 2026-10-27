# AI Storyboard Studio

Studio storyboard berbantuan AI, berbahasa Indonesia terlebih dahulu, untuk mengubah brief/naskah menjadi shot list yang bisa ditinjau, disimpan, dan diekspor. Proyek ini terinspirasi dari konsep di `beatra-ai/ai-storyboard-generator-skill` (MIT-0); rendering eksternal tetap terpisah dan tidak berjalan otomatis.

## Keputusan arsitektur

- **Kode sumber kanonis:** GitHub, repositori ini.
- **Skema PostgreSQL target produksi:** Neon, proyek `shy-shadow-71251136`, branch `br-cool-shadow-b5ozmaxq`, database `neondb`.
- **Aplikasi pilot yang sedang berjalan:** [AI Storyboard Studio di Hatchable](https://ai-storyboard-studio.hatchable.site). Implementasi Hatchable disimpan sebagai snapshot di `app/`; ia memakai database terkelola milik Hatchable, bukan Neon. Keduanya belum diklaim sebagai satu koneksi database.
- **Jalur menuju produksi:** pindahkan/port API dari SDK Hatchable ke runtime backend yang mendukung koneksi server-side Neon, lalu aktifkan deployment dari repo dan CI. Jangan masukkan kredensial Neon ke frontend atau Git.

## Status implementasi

- Workspace responsif untuk brief, pengaturan format/gaya/bahasa/jumlah shot, pemilihan hingga empat frame kunci, penyimpanan proyek, dan ekspor JSON.
- Generator teks AI terhubung melalui endpoint server-side pada pilot Hatchable; penggunaan dicatat oleh ledger AI platform. Ketersediaan generasi bergantung pada konfigurasi provider/kredit.
- Autentikasi email satu kali, dan query proyek di pilot dibatasi oleh `owner_id`.
- Pengujian smoke pilot: akses anonim ke API terlindungi ditolak (401); akses pengguna sah ke daftar proyek berhasil (200); validasi brief kosong ditolak (400); siklus simpan/baca/hapus fixture QA berhasil.
- Render gambar belum diintegrasikan. Setiap layanan render berbayar harus melalui persetujuan eksplisit per pekerjaan dan menampilkan estimasi biaya terlebih dahulu.
- **Belum siap disebut produksi komersial:** visibility Hatchable masih private; database Neon belum terhubung ke runtime aplikasi; belum ada E2E browser test, CI quality gate penuh, backup/restore drill, monitoring operasional, atau pengujian keamanan independen.

## Struktur

- `migrations/`: skema Neon yang dinormalisasi untuk proyek, shot, dan generation jobs.
- `app/`: snapshot implementasi pilot Hatchable (API, UI, login, konfigurasi, migrasi Hatchable).
- `docs/DEPLOYMENT.md`: gerbang deployment dan prosedur rilis.

## Pengembangan dan keamanan

Jangan pernah menaruh URL koneksi Neon, API key model, token, atau kredensial dalam source control. Semua query produksi harus menggunakan parameter, otorisasi server-side, dan batas kepemilikan per pengguna. Periksa semua dependensi/aset dan lisensinya sebelum rilis komersial.

## Lisensi

Repositori upstream `beatra-ai/ai-storyboard-generator-skill` menyatakan MIT-0. Lisensi upstream tidak memberikan hak atas layanan rendering pihak ketiga, model, font, aset, atau kebijakan output mereka. Lisensi dan atribusi komponen tambahan harus diverifikasi secara terpisah.
