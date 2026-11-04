var dataPengguna = [
    {
        id: 1,
        nama: "Fadli Mabrur Nahari",
        email: "fadli@gmail.com",
        password: "fadli123",
        role: "User",
    },
    {
        id: 2,
        nama: "Agus Pranoto",
        email: "agus@gmail.com",
        password: "agus123",
        role: "User",
    },
    {
        id: 3,
        nama: "Siti Marlina",
        email: "siti@gmail.com",
        password: "siti123",
        role: "Admin",
    },
    {
        id: 4,
        nama: "Rina Wulandari",
        email: "rina@gmail.com",
        password: "rina123",
        role: "User",
    },
]

var dataKatalogBuku = [
    {
        kodeBarang: "ASIP4301",
        namaBarang: "Pengantar Ilmu Komunikasi",
        jenisBarang: "Buku Ajar",
        edisi: "2",
        stok: 548,
        harga: "Rp 180.000",
        cover: "img/pengantar_komunikasi.jpg"
    },
    {
        kodeBarang: "EKMA4002",
        namaBarang: "Manajemen Keuangan",
        jenisBarang: "Buku Ajar",
        edisi: "3",
        stok: 392,
        harga: "Rp 220.000",
        cover: "img/manajemen_keuangan.jpg"
    },
    {
        kodeBarang: "EKMA4310",
        namaBarang: "Kepemimpinan",
        jenisBarang: "Buku Ajar",
        edisi: "1",
        stok: 278,
        harga: "Rp 150.000",
        cover: "img/kepemimpinan.jpg"
    },
    {
        kodeBarang: "BIOL4211",
        namaBarang: "Mikrobiologi Dasar",
        jenisBarang: "Buku Ajar",
        edisi: "2",
        stok: 165,
        harga: "Rp 200.000",
        cover: "img/mikrobiologi.jpg"
    },
    {
        kodeBarang: "PAUD4401",
        namaBarang: "Perkembangan Anak Usia Dini",
        jenisBarang: "Buku Ajar",
        edisi: "4",
        stok: 204,
        harga: "Rp 250.000",
        cover: "img/paud_perkembangan.jpg"
    }
]

var dataTracking = {
    "20230012": {
        nomorDO: "20230012",
        nama: "Rina Wulandari",
        status: "Dalam Perjalanan",
        ekspedisi: "JNE",
        tanggalKirim: "2025-08-25",
        paket: "0JKT01",
        total: "Rp 180.000",
        perjalanan:[
            {
                waktu: "2025-08-25 10:12:20",
                keterangan: "Penerimaan di Loket: TANGERANG SELATAN. Pengirim: Universitas Terbuka"
            },
            {
                waktu: "2025-08 25 14:07:56",
                keterangan: "Tiba di Hub: TANGERANG SELATAN"
            },
            {
                waktu: "2025-08-25 10:12:20",
                keterangan: "Diteruskan ke Kantor Jakarta Selatan"
            },
        ]
    },
    "20230013": {
        nomorDO: "20230013",
        nama: "Agus Pranoto",
        status: "Dikirim",
        ekspedisi: "Pos Indonesia",
        tanggalKirim: "2025-08-25",
        paket: "0UPBJJBDG",
        total: "Rp 220.000",
        perjalanan:[
            {
                waktu: "2025-08-25 10:12:20",
                keterangan: "Penerimaan di Loket: TANGERANG SELATAN. Pengirim: Universitas Terbuka"
            },
            {
                waktu: "2025-08-25 14:07:56",
                keterangan: "Tiba di Hub: TANGERANG SELATAN"
            },      
            {
                waktu: "2025-08-25 16:30:10",
                keterangan: "Diteruskan ke Kantor Kota Bandung"
            },
            {
                waktu: "2025-08-26 12:15:33",
                keterangan: "Tiba di Hub: Kota BANDUNG"
            },
            {
                waktu: "2025-08-26 15:06:12",
                keterangan: "Proses antar ke Cimahi"
            },
            {
                waktu: "2025-08-26 20:00:00",
                keterangan: "Selesai Antar. Penerima: Agus Pranoto"
            }
        ]
    }
}

/* ---------- Data pendukung toko (ekspedisi, pembayaran, pesanan) ---------- */
var dataEkspedisi = [
    { nama: "JNE",           jenis: "Reguler",             ongkir: 18000 },
    { nama: "J&T Express",   jenis: "Ekonomi",             ongkir: 16000 },
    { nama: "SiCepat",       jenis: "BEST (Besok Sampai)", ongkir: 20000 },
    { nama: "Pos Indonesia", jenis: "Kilat Khusus",        ongkir: 14000 },
    { nama: "GoSend",        jenis: "Same Day",            ongkir: 35000 }
]

var dataMetodeBayar = ["Transfer Bank", "QRIS", "Kartu Kredit", "COD"]

/* status: 0 Pesanan Diterima | 1 Diproses | 2 Dikemas | 3 Dalam Pengiriman | 4 Terkirim */
var dataPesanan = [
    {
        id: "DO-20261001", tanggal: "2026-10-02", nama: "Rina Kartika", email: "rina.k@mail.com", telepon: "081234567801",
        alamat: "Jl. Melati No. 12, Bandung 40115", ekspedisi: "JNE", jenisPaket: "Reguler", metode: "Transfer Bank",
        ongkir: 18000, diskon: 0, status: 4,
        items: [ { kode: "ASIP4301", judul: "Pengantar Ilmu Komunikasi", harga: 180000, qty: 1 }, { kode: "EKMA4002", judul: "Manajemen Keuangan", harga: 220000, qty: 1 } ]
    },
    {
        id: "DO-20261002", tanggal: "2026-10-09", nama: "Budi Santoso", email: "budi.s@mail.com", telepon: "081234567802",
        alamat: "Jl. Kenanga No. 5, Surabaya 60271", ekspedisi: "J&T Express", jenisPaket: "Ekonomi", metode: "QRIS",
        ongkir: 16000, diskon: 0, status: 3,
        items: [ { kode: "EKMA4310", judul: "Kepemimpinan", harga: 150000, qty: 2 } ]
    },
    {
        id: "DO-20261003", tanggal: "2026-10-15", nama: "Citra Lestari", email: "citra.l@mail.com", telepon: "081234567803",
        alamat: "Jl. Anggrek No. 8, Yogyakarta 55281", ekspedisi: "SiCepat", jenisPaket: "BEST (Besok Sampai)", metode: "Kartu Kredit",
        ongkir: 20000, diskon: 0, status: 2,
        items: [ { kode: "BIOL4211", judul: "Mikrobiologi Dasar", harga: 200000, qty: 1 }, { kode: "PAUD4401", judul: "Perkembangan Anak Usia Dini", harga: 250000, qty: 1 } ]
    },
    {
        id: "DO-20261004", tanggal: "2026-10-20", nama: "Dimas Pratama", email: "dimas.p@mail.com", telepon: "081234567804",
        alamat: "Jl. Cempaka No. 21, Bekasi 17145", ekspedisi: "Pos Indonesia", jenisPaket: "Kilat Khusus", metode: "COD",
        ongkir: 14000, diskon: 0, status: 1,
        items: [ { kode: "EKMA4002", judul: "Manajemen Keuangan", harga: 220000, qty: 1 } ]
    },
    {
        id: "DO-20261005", tanggal: "2026-10-27", nama: "Eka Wulandari", email: "eka.w@mail.com", telepon: "081234567805",
        alamat: "Jl. Dahlia No. 3, Semarang 50134", ekspedisi: "JNE", jenisPaket: "Reguler", metode: "Transfer Bank",
        ongkir: 18000, diskon: 0, status: 0,
        items: [ { kode: "PAUD4401", judul: "Perkembangan Anak Usia Dini", harga: 250000, qty: 1 }, { kode: "EKMA4310", judul: "Kepemimpinan", harga: 150000, qty: 1 } ]
    },
    {
        id: "DO-20261006", tanggal: "2026-09-18", nama: "Fajar Nugroho", email: "fajar.n@mail.com", telepon: "081234567806",
        alamat: "Jl. Mawar No. 17, Malang 65145", ekspedisi: "J&T Express", jenisPaket: "Ekonomi", metode: "QRIS",
        ongkir: 16000, diskon: 0, status: 4,
        items: [ { kode: "BIOL4211", judul: "Mikrobiologi Dasar", harga: 200000, qty: 1 }, { kode: "ASIP4301", judul: "Pengantar Ilmu Komunikasi", harga: 180000, qty: 2 } ]
    },
    {
        id: "DO-20261007", tanggal: "2026-09-25", nama: "Gita Permata", email: "gita.p@mail.com", telepon: "081234567807",
        alamat: "Jl. Flamboyan No. 9, Depok 16424", ekspedisi: "GoSend", jenisPaket: "Same Day", metode: "QRIS",
        ongkir: 35000, diskon: 0, status: 4,
        items: [ { kode: "EKMA4002", judul: "Manajemen Keuangan", harga: 220000, qty: 1 }, { kode: "PAUD4401", judul: "Perkembangan Anak Usia Dini", harga: 250000, qty: 1 } ]
    },
    {
        id: "DO-20261008", tanggal: "2026-11-01", nama: "Hendra Wijaya", email: "hendra.w@mail.com", telepon: "081234567808",
        alamat: "Jl. Seruni No. 30, Medan 20112", ekspedisi: "SiCepat", jenisPaket: "BEST (Besok Sampai)", metode: "Transfer Bank",
        ongkir: 20000, diskon: 20000, status: 1,
        items: [ { kode: "ASIP4301", judul: "Pengantar Ilmu Komunikasi", harga: 180000, qty: 1 }, { kode: "EKMA4310", judul: "Kepemimpinan", harga: 150000, qty: 1 }, { kode: "BIOL4211", judul: "Mikrobiologi Dasar", harga: 200000, qty: 1 } ]
    }
]
