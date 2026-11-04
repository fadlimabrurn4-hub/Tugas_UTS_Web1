# Tugas UTS Pemrograman Web - MyBook's Store

## Identitas Mahasiswa
Nama : Fadli Mabrur Nahari  
NIM : 312510294  
Kelas : I251A  
Mata Kuliah : Pemrograman Web

## Struktur File
```
tugas-uts-web1/
├── index.html        # Halaman login
├── dashboard.html    # Halaman utama setelah login
├── stok.html         # Informasi stok / katalog buku
├── checkout.html     # Pemesanan dan history transaksi
├── tracking.html     # Tracking pengiriman
├── css/style.css     # Seluruh tampilan (palet maroon, beige, cream, blue)
├── js/data.js        # Data awal: pengguna, katalog buku, tracking contoh
├── js/script.js      # Logika seluruh halaman
├── img/              # Cover buku
└── assets/           # Gambar halaman login
```

## Akun Bawaan   

| Email | Password | Role |
|-------|----------|------|
| fadli@gmail.com | fadli123 | User |
| rina@gmail.com | rina123 | User |
| agus@gmail.com | agus123 | User |
| siti@gmail.com | siti123 | Admin |


## Alur Halaman
```
index.html (Login) → dashboard.html → stok.html
                                    → checkout.html (Pemesanan + History)
                                    → tracking.html
```

## Penjelasan Per Halaman

### 1. Halaman Login (`index.html`)
Halaman awal website dengan tampilan dua kolom: kotak login di kiri dan ilustrasi buku di kanan, berlatar gambar bertema buku.

- **Form login:** pengguna mengisi email dan password. Data dicocokkan dengan daftar akun di `data.js` ditambah akun yang didaftarkan sendiri. Jika cocok, sesi login disimpan lalu pengguna diarahkan ke dashboard. Jika salah, muncul peringatan "email/password yang anda masukkan salah".
- **Lupa Password:** membuka jendela modal untuk memasukkan email. Jika kolom kosong, muncul peringatan bahwa email harus diisi. Jika terisi, muncul pesan bahwa petunjuk reset akan dikirim.
- **Daftar:** membuka modal pendaftaran dengan nama lengkap, email, dan password. Semua kolom wajib diisi dan email tidak boleh sudah terdaftar. Akun baru otomatis berperan sebagai `User` dan bisa langsung dipakai login.
- Tampilan menyesuaikan layar kecil (gambar samping disembunyikan pada layar sempit).   

<img src="foto/Halaman_login.png">

### 2. Halaman Dashboard (`dashboard.html`)
Halaman utama setelah login.

- **Sapaan dinamis:** menampilkan "Selamat pagi/siang/sore/malam" sesuai jam saat ini, diikuti nama pengguna yang sedang login.
- **Tanggal hari ini:** ditampilkan dalam format Indonesia, misalnya hari, tanggal, bulan, dan tahun.
- **Menu utama** berupa empat kartu:
  - **Informasi Stok / Katalog**: menuju halaman katalog buku.
  - **Tracking Pengiriman**: menuju halaman pelacakan pesanan.
  - **Laporan Pemesanan**: menuju halaman pemesanan.
  - **History Transaksi**: menuju bagian riwayat pada halaman pemesanan.
- **Tombol Keluar:** menghapus data akun yang sedang login lalu kembali ke halaman login.   

<img src="foto/Halaman_Utama.png">


### 3. Halaman Informasi Stok / Katalog (`stok.html`)
Menampilkan daftar buku yang tersedia dalam bentuk tabel.

- **Tabel katalog:** kolom No, Cover, Kode, Nama Buku, Jenis, Edisi, Stok, dan Harga. Terdapat lima buku awal: Pengantar Ilmu Komunikasi, Manajemen Keuangan, Kepemimpinan, Mikrobiologi Dasar, dan Perkembangan Anak Usia Dini.
- **Tombol Pesan Buku** di bagian atas mengarahkan langsung ke halaman pemesanan.
- **Form Tambah Buku Baru:** pengguna mengisi kode barang, nama buku, jenis, edisi, jumlah stok, dan harga. Kode barang harus unik, jika sudah ada akan muncul peringatan. Harga otomatis diformat menjadi format rupiah (misalnya `Rp 150.000`). Buku baru langsung muncul di tabel dan juga tersedia pada pilihan di halaman pemesanan.   

<img src="foto/Halaman_Stok.png">   
<img src="foto/Halaman_stok1.png">

### 4. Halaman Pemesanan dan History Transaksi (`checkout.html`)
Halaman untuk membuat pesanan, terdiri dari tiga bagian.

- **Daftar Pesanan:**
  - Pilih buku dari dropdown (berisi seluruh buku di katalog) dan isi jumlahnya, lalu klik **Tambah Buku**.
  - Jika buku yang sama ditambahkan lagi, jumlahnya digabung, bukan dibuat baris baru.
  - Jumlah pada tabel bisa diubah langsung (minimal 1) dan tombol **Hapus** menghapus buku dari pesanan.
  - Subtotal tiap buku serta **Total** harga dihitung otomatis.
- **Informasi Pemesan dan Pembayaran:** nama dan email terisi otomatis dari akun yang login. Pengguna mengisi alamat pengiriman dan memilih metode pembayaran (Transfer Bank, COD, atau E-Wallet). Saat **Buat Pesanan** diklik, sistem memastikan keranjang tidak kosong, membuat nomor Delivery Order baru (`DO1001`, `DO1002`, dan seterusnya), menampilkan nomor tersebut, lalu mengosongkan keranjang dan form.
- **History Transaksi:** tabel berisi No. DO, Nama, Total, dan metode Pembayaran dari setiap pesanan yang sudah dibuat.   

<img src="foto/Halaman_checkout.png">   
<img src="foto/Halaman_checkout1.png">


### 5. Halaman Tracking Pengiriman (`tracking.html`)
Halaman untuk melacak status pesanan berdasarkan nomor Delivery Order.

- **Form pencarian:** masukkan nomor DO lalu klik **Cari**. Nomor yang dapat dicoba:
  - `20261001`: atas nama Rina Kartika, status *Terkirim*, ekspedisi JNE.
  - `20261002`: atas nama Budi Santoso, status *Dikirim*, ekspedisi Pos Indonesia.
  - Nomor DO dari pesanan yang dibuat sendiri (misalnya `DO1001`) dengan status *Pesanan Terkirim*.
- **Hasil pencarian:** menampilkan nomor DO, nama pemesan, status beserta bar progres, ekspedisi, tanggal kirim, jenis paket, total pembayaran, dan **riwayat perjalanan** paket secara berurutan.
- **Nomor tidak ditemukan:** muncul pesan "Data tidak ditemukan" agar pengguna memeriksa kembali nomor DO.   

<img src="foto/Halaman_tracking.png">
<img src="foto/Halaman_tracking1.png">