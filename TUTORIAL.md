# Finish Good Analysis – Tutorial Pemasangan

## Isi folder
```
finish-good-analysis/
├── index.html
├── manifest.webmanifest
├── service-worker.js
├── .nojekyll
├── TUTORIAL.md
└── icons/ (icon-192, icon-512, maskable-512, apple-touch-icon)
```

## A. Upload ke GitHub (lewat HP / browser)
1. Buka github.com, daftar atau login.
2. Klik tanda **+** (kanan atas) → **New repository**.
3. Repository name: `finish-good-analysis`. Pilih **Public**. Klik **Create repository**.
4. Klik **uploading an existing file**.
5. Ekstrak ZIP dulu. Upload **isi** folder (bukan foldernya): `index.html`, `manifest.webmanifest`, `service-worker.js`, `.nojekyll`, dan folder `icons`.
   - Di HP, upload folder `icons` sulit. Alternatif: **Add file → Create new file**, ketik nama `icons/icon-192.png` lalu upload satu per satu; atau pakai browser mode "Situs desktop"/komputer.
6. Klik **Commit changes**.

## B. Aktifkan GitHub Pages
1. Di repository: **Settings → Pages**.
2. Source: **Deploy from a branch**. Branch: **main**, folder **/(root)**. Klik **Save**.
3. Tunggu 1–3 menit. Alamat aplikasi: `https://USERNAME.github.io/finish-good-analysis/`
4. Buka alamat itu di Chrome HP dan pastikan tampil.

## C. Pasang di Android
1. Buka alamat di **Chrome**.
2. Menu **⋮** → **Install app** (atau **Add to Home screen**).
3. Ikon "FG" muncul di layar utama dan terbuka seperti aplikasi (tanpa bar browser). Chrome memasangnya sebagai WebAPK.

## D. (Opsional) Jadikan file APK sungguhan
1. Buka **pwabuilder.com**, tempel alamat GitHub Pages, klik **Start**.
2. Pilih **Package for stores → Android → Generate**, unduh ZIP berisi `.apk`.
3. Pasang APK di HP (izinkan "instal dari sumber tidak dikenal").

## E. Cara pakai
1. Buka tab **Foto & OCR**, pilih foto (Galeri/Kamera), tekan **PROSES FOTO**.
2. Periksa tabel hasil, perbaiki sel kuning, tekan **GUNAKAN DATA**.
3. Di **Buku Digital**, isi kolom manual. Nilai awal "-" dan "8" diatur di **Pengaturan**.
4. Di **Ekspor**: PNG, PDF, Cetak, atau Bagikan ke WhatsApp.

Tips foto: tabel lurus (tidak miring), terang, tanpa bayangan, seluruh tabel masuk frame (header "Flavour/Output" harus terlihat).

## F. Catatan penting
- OCR butuh internet saat pertama kali (mengunduh mesin Tesseract ±15 MB), setelah itu tersimpan di cache.
- Baris dengan 2 flavour dalam satu sel (mis. GSSJ dan GAPJ) otomatis ditulis `GSSJ/GAPJ`, dan nilai awal menjadi `-/-` dan `8/8`.
- Data tersimpan di HP (localStorage), tidak dikirim ke server.
- Update aplikasi: upload ulang file yang berubah, lalu ubah `const V='fga-v2'` di `service-worker.js` menjadi `fga-v5` agar cache diperbarui.
- Jika halaman kosong/404: pastikan `index.html` ada di root repository, bukan di dalam subfolder.

## G. Jika sudah pernah memasang versi lama
Upload ulang semua file (timpa), lalu di HP buka aplikasi, tutup penuh, dan buka lagi 2 kali. Jika masih tampil versi lama: Chrome → Setelan situs → Hapus data situs untuk alamat GitHub Pages Anda, lalu buka lagi.

## H. Cara kerja OCR versi ini
1. Foto diubah hitam-putih adaptif, garis tabel dihapus agar tidak mengganggu.
2. Tahap 1: seluruh halaman dibaca untuk menemukan label Line I–XI dan header Flavour (posisi X/Y).
3. Tahap 2: setiap sel Flavour (11 Line × 3 Shift) dipotong dan dibaca sendiri, lalu dicocokkan dengan daftar kode dikenal (SKGA, IHJR, RGSA 120, dst).
4. Sel kuning = hasil perlu diperiksa (koreksi otomatis ke kode terdekat, atau tidak dikenal).
Proses memakan waktu sekitar 30–90 detik di HP.

## I. Cara memastikan versi terbaru
Di bawah judul aplikasi harus tertulis **versi 2.3 · OCR per sel**. Jika tidak tertulis, berarti HP masih memakai versi lama:
1. Pastikan file di GitHub sudah ter-upload (buka repository, lihat tanggal commit terakhir) dan tab **Actions** menunjukkan deploy Pages berwarna hijau.
2. Di Chrome HP: buka alamat GitHub Pages → menu ⋮ → Setelan → Setelan situs → Semua situs → cari alamat tersebut → **Hapus & reset**.
3. Jika terpasang di layar utama: hapus ikon aplikasi, buka alamat lagi di Chrome, lalu **Install app** ulang.
