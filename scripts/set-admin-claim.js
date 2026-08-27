/**
 * scripts/set-admin-claim.js
 * Script sekali-jalan untuk menetapkan Custom User Claim { admin: true } pada akun Firebase Auth.
 *
 * CARA MENDAPATKAN SERVICE ACCOUNT KEY:
 * 1. Buka Firebase Console (https://console.firebase.google.com).
 * 2. Pilih project Anda ("hsgq-rma").
 * 3. Buka Project Settings (ikon gerigi) -> Tab "Service accounts".
 * 4. Klik tombol "Generate new private key" -> Simpan file .json yang diunduh ke komputer Anda.
 *
 * ?? PERINGATAN KEAMANAN PENTING:
 * File Service Account Key (.json) memberikan akses administratif PENUH ke seluruh Firebase project Anda.
 * JANGAN PERNAH meng-commit file JSON service account ke Git/GitHub.
 * Simpan file di luar folder repo atau pastikan file berekstensi *.json di folder scripts/ sudah terdaftar di .gitignore.
 *
 * CARA MENJALANKAN SCRIPT:
 * 1. Install dependency firebase-admin (jika belum terpasang):
 *    npm install firebase-admin --save-dev
 *
 * 2. Set environment variable path ke file service account:
 *    - PowerShell:
 *      $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\ke\service-account-file.json"
 *    - Bash / Linux / macOS:
 *      export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-file.json"
 *
 * 3. Jalankan script dengan menyertakan UID user target:
 *    node scripts/set-admin-claim.js <TARGET_USER_UID>
 *
 *    Contoh:
 *    node scripts/set-admin-claim.js WzQ1K9abc...
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";

async function main() {
  const targetUid = process.argv[2];

  if (!targetUid) {
    console.error("\n? Error: UID user target wajib disertakan!");
    console.log("Penggunaan: node scripts/set-admin-claim.js <TARGET_USER_UID>\n");
    process.exit(1);
  }

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!credPath) {
    console.error("\n? Error: Environment variable GOOGLE_APPLICATION_CREDENTIALS belum di-set!");
    console.log("Silakan set environment variable terlebih dahulu:");
    console.log('PowerShell: $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\path\\ke\\service-account.json"');
    console.log('Bash:       export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"\n');
    process.exit(1);
  }

  const resolvedPath = path.resolve(credPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(\n? Error: File service account tidak ditemukan di path: \n);
    process.exit(1);
  }

  let serviceAccount;
  try {
    const raw = fs.readFileSync(resolvedPath, "utf-8");
    serviceAccount = JSON.parse(raw);
  } catch (err) {
    console.error(\n? Error: Gagal membaca/parsing file service account JSON: \n);
    process.exit(1);
  }

  try {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }

    const auth = getAuth();

    // Verifikasi keberadaan user
    const userRecord = await auth.getUser(targetUid);
    console.log(\n?? Menemukan user:  () [UID: ]);

    // Set custom claims { admin: true }
    const existingClaims = userRecord.customClaims || {};
    const updatedClaims = { ...existingClaims, admin: true };

    await auth.setCustomUserClaims(targetUid, updatedClaims);

    console.log(? SUKSES: Custom claim { admin: true } berhasil disematkan ke user .);
    console.log("?? Catatan: Pengguna perlu logout dan login kembali ke web app agar token sesi baru dengan claim admin aktif.\n");
  } catch (err) {
    console.error(\n? Gagal menetapkan custom claim: \n);
    process.exit(1);
  }
}

main();
