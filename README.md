# HSGQ RMA & WhatsApp Log Book — Local Setup

Web app internal untuk logbook RMA, WhatsApp Case, dashboard, dan weekly report. Storage-nya pakai **Firebase Firestore**.

---

## 1. Install Node.js (kalau belum ada)

Download dari https://nodejs.org (pilih versi LTS). Cek sudah terinstall:

```bash
node -v
npm -v
```

## 2. Install dependency project

Buka terminal di folder project ini, jalankan:

```bash
npm install
```

## 3. Setup Firebase (sekali saja)

1. Buka https://console.firebase.google.com → **Add project** → beri nama (mis. `hsgq-rma`) → ikuti langkah sampai selesai.
2. Di dashboard project, klik ikon **`</>`** (Web) untuk menambahkan web app → beri nickname → **Register app**.
3. Firebase akan menampilkan kode config seperti ini:
   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "hsgq-rma.firebaseapp.com",
     projectId: "hsgq-rma",
     storageBucket: "hsgq-rma.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef",
   };
   ```
4. Salin nilai-nilai itu ke file **`src/firebase.js`** di project ini, gantikan tulisan `"GANTI_..."`.
5. Di menu kiri Firebase Console, buka **Build → Firestore Database → Create database** → pilih lokasi (mis. `asia-southeast2` / Jakarta terdekat) → mulai di **test mode** dulu supaya cepat jalan (lihat catatan keamanan di bawah).

### ⚠️ Soal keamanan (penting sebelum dipakai beneran oleh tim)

"Test mode" di Firestore artinya **siapa saja yang tahu URL/config bisa baca-tulis data** selama 30 hari, lalu otomatis terkunci total. Untuk pemakaian tim jangka panjang, ganti rules-nya (di tab **Rules** pada Firestore) minimal jadi seperti ini (butuh Firebase Authentication kalau mau membatasi siapa saja yang boleh akses — belum ada di versi ini):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /hsgq_rma_app/{document=**} {
      allow read, write: if true; // sementara — ganti dengan auth check kalau sudah siap
    }
  }
}
```

Kalau tim kamu mau login dulu sebelum bisa akses data (lebih aman), kabari saya — saya bisa tambahkan Firebase Authentication (email/password atau Google login) ke project ini.

## 4. Jalankan di browser

```bash
npm run dev
```

Terminal akan menampilkan link seperti `http://localhost:5173` — buka itu di browser. Vite otomatis reload kalau ada perubahan kode.

## 5. (Opsional) Build untuk hosting sungguhan

Kalau nanti mau tim akses lewat internet (bukan cuma localhost), bisa deploy gratis ke Firebase Hosting:

```bash
npm run build
npm install -g firebase-tools
firebase login
firebase init hosting   # pilih folder "dist" sebagai public directory
firebase deploy
```

Firebase akan kasih link `https://hsgq-rma.web.app` yang bisa diakses tim dari mana saja.

---

## Struktur Data di Firestore

Semua data tersimpan di collection `hsgq_rma_app` dengan 3 dokumen:
- `rma_entries_v2` — array semua tiket RMA
- `wa_entries_v2` — array semua case WhatsApp
- `master_data_v2` — daftar Engineer, Status, dsb (Pengaturan)

Kamu bisa lihat/edit langsung datanya lewat Firebase Console → Firestore Database kalau perlu.
