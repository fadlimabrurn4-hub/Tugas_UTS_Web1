/* =========================================================
   Toko Buku – script.js
   Satu file JS untuk semua halaman. Setiap halaman memiliki
   atribut <body data-page="..."> yang menentukan fungsi init-nya.
   Data dummy berasal dari js/data.js.
   ========================================================= */
"use strict";

/* =========================================================
   1. UTILITAS
   ========================================================= */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const KEY = {
  user: "tb_user",           // sessionStorage – sesi login
  users: "tb_users",         // localStorage – akun hasil pendaftaran
  katalog: "tb_katalog_v2",     // localStorage – katalog (stok dapat berubah)
  pesanan: "tb_pesanan_v2",     // localStorage – daftar pesanan
  keranjang: "tb_keranjang"  // localStorage – isi keranjang
};

const STATUS = ["Pesanan Diterima", "Diproses", "Dikemas", "Dalam Pengiriman", "Terkirim"];
const reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const reTelp  = /^(\+62|62|0)8\d{8,11}$/;

const klon   = (o) => JSON.parse(JSON.stringify(o));
const rupiah = (n) => "Rp " + Number(n).toLocaleString("id-ID");
const esc    = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad    = (n) => String(n).padStart(2, "0");

const store = {
  get(k, def) {
    try { const v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); }
    catch (_) { return def; }
  },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* penyimpanan penuh / diblokir */ }
  }
};

/* ----- Tanggal ----- */
const hariIni = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const tambahHari = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(y, m - 1, d + n);
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
};
const tglPanjang = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};
const tglPendek = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};
const bulanLabel = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
};

/* ----- Pembuat elemen DOM ----- */
function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === false || v == null) continue;
    if (k === "class") n.className = v;
    else if (k === "dataset") Object.assign(n.dataset, v);
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (v === true) n.setAttribute(k, "");
    else n.setAttribute(k, v);
  }
  kids.flat().forEach((c) => {
    if (c == null || c === false) return;
    n.append(c.nodeType ? c : document.createTextNode(c));
  });
  return n;
}

/* ----- Akses data (localStorage dengan fallback ke data.js) ----- */
/* Data di data.js memakai nama kolom: kodeBarang, namaBarang, jenisBarang, edisi, stok, harga ("Rp 180.000"), cover.
   Di sini diubah ke bentuk kerja: kode, judul, kategori, edisi, stok, harga (angka), cover. */
const hargaAngka = (h) => parseInt(String(h).replace(/\D/g, ""), 10) || 0;
const normBuku = (b) => ({ kode: b.kodeBarang, judul: b.namaBarang, kategori: b.jenisBarang, edisi: b.edisi, stok: b.stok, harga: hargaAngka(b.harga), cover: b.cover });
const getKatalog   = () => store.get(KEY.katalog, null) || dataKatalogBuku.map(normBuku);
const saveKatalog  = (l) => store.set(KEY.katalog, l);
const getPesanan   = () => store.get(KEY.pesanan, null) || klon(dataPesanan);
const savePesanan  = (l) => store.set(KEY.pesanan, l);
const getKeranjang = () => store.get(KEY.keranjang, []);
const saveKeranjang = (l) => store.set(KEY.keranjang, l);
const getUsers     = () => dataPengguna.concat(store.get(KEY.users, []));

const subtotalPesanan = (p) => p.items.reduce((s, i) => s + i.harga * i.qty, 0);
const totalBayar      = (p) => Math.max(0, subtotalPesanan(p) + p.ongkir - (p.diskon || 0));
const jumlahItem      = (p) => p.items.reduce((s, i) => s + i.qty, 0);
const tglStatus       = (p, i) => tambahHari(p.tanggal, i < 4 ? i : 5);   // tanggal tiap tahap
const badgeStatus     = (s) => `<span class="badge st-${s}">${STATUS[s]}</span>`;

function statusStok(n) {
  if (n <= 0) return { kelas: "habis", teks: "Habis" };
  if (n <= 5) return { kelas: "menipis", teks: `Menipis (${n})` };
  return { kelas: "tersedia", teks: `Tersedia (${n})` };
}

function tambahKeKeranjang(kode) {
  const b = getKatalog().find((x) => x.kode === kode);
  if (!b || b.stok < 1) return "habis";
  const k = getKeranjang();
  const it = k.find((i) => i.kode === kode);
  if (it) { if (it.qty >= b.stok) return "maks"; it.qty++; }
  else k.push({ kode, qty: 1 });
  saveKeranjang(k);
  updateBadgeKeranjang();
  return "ok";
}

function updateBadgeKeranjang() {
  const n = getKeranjang().reduce((s, i) => s + i.qty, 0);
  $$(".badge-cart").forEach((b) => { b.textContent = n; b.hidden = n === 0; });
}

/* ----- Sampul buku: pakai file gambar (b.cover); jika tidak ada, SVG dibuat dari data ----- */
function bungkus(teks, maks = 11) {
  const baris = []; let cur = "";
  teks.split(" ").forEach((k) => {
    if (cur && (cur + " " + k).length > maks) { baris.push(cur); cur = k; }
    else cur = (cur ? cur + " " : "") + k;
  });
  if (cur) baris.push(cur);
  return baris.slice(0, 4);
}
function coverBuku(b) {
  if (b.cover) return b.cover;
  const [a, c] = b.warna || ["#1e4038", "#d9a441"];
  const teks = bungkus(b.judul).map((t, i) =>
    `<text x='60' y='${52 + i * 17}' text-anchor='middle' font-family='Georgia,serif' font-size='14' font-weight='bold' fill='#fffbf1'>${esc(t)}</text>`).join("");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 170'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${c}'/></linearGradient></defs>
    <rect width='120' height='170' fill='url(#g)'/><rect width='9' height='170' fill='rgba(0,0,0,.22)'/>
    <rect x='20' y='20' width='84' height='1.5' fill='rgba(255,255,255,.7)'/>${teks}
    <rect x='40' y='${60 + bungkus(b.judul).length * 17}' width='40' height='1.5' fill='rgba(255,255,255,.6)'/>
    <text x='60' y='156' text-anchor='middle' font-family='Georgia,serif' font-size='8' fill='rgba(255,251,241,.85)'>${esc(b.edisi ? "Edisi " + b.edisi : "")}</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/* =========================================================
   2. KOMPONEN UI: toast, alert/konfirmasi, modal, validasi
   ========================================================= */
function toast(pesan, tipe = "info") {
  let w = $("#toasts");
  if (!w) { w = el("div", { id: "toasts", class: "toasts", "aria-live": "polite" }); document.body.append(w); }
  const t = el("div", { class: `toast toast-${tipe}` }, pesan);
  w.append(t);
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 320); }, 2800);
}

/* Alert box / confirm box kustom (pengganti alert() & confirm() bawaan) */
function dialogNotif({ judul, pesan, tipe = "info", konfirmasi = false, teksOk = "OK" }) {
  return new Promise((resolve) => {
    let d = $("#dlgNotif");
    if (!d) { d = el("dialog", { id: "dlgNotif", class: "modal modal-sm", "aria-live": "assertive" }); document.body.append(d); }
    const ikon = { error: "!", success: "✓", info: "i", warn: "?" }[tipe] || "i";
    d.innerHTML = `<div class="modal-body notif notif-${tipe}">
        <div class="notif-ico" aria-hidden="true">${ikon}</div>
        <h3>${esc(judul)}</h3>
        <p>${esc(pesan).replace(/\n/g, "<br>")}</p>
        <div class="modal-actions">
          ${konfirmasi ? '<button type="button" class="btn btn-ghost" data-v="0">Batal</button>' : ""}
          <button type="button" class="btn btn-primary" data-v="1">${esc(teksOk)}</button>
        </div></div>`;
    let selesai = false;
    const akhiri = (v) => { if (selesai) return; selesai = true; if (d.open) d.close(); resolve(v); };
    $$("button", d).forEach((b) => b.addEventListener("click", () => akhiri(b.dataset.v === "1")));
    d.addEventListener("cancel", () => akhiri(false), { once: true });
    d.showModal();
    $('button[data-v="1"]', d).focus();
  });
}

/* Modal <dialog>: buka via [data-open], tutup via [data-close] / klik latar */
function pasangModal() {
  $$("[data-open]").forEach((b) => b.addEventListener("click", () => { const d = $("#" + b.dataset.open); if (d) d.showModal(); }));
  $$("[data-close]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));
  $$("dialog").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));
}

/* Validasi form: tandai error di bawah field */
function salahField(input, pesan) {
  const f = input.closest(".field");
  if (!f) return;
  f.classList.add("invalid");
  const m = $(".error-msg", f);
  if (m) m.textContent = pesan;
  input.setAttribute("aria-invalid", "true");
}
function bersihField(input) {
  const f = input.closest(".field");
  if (!f) return;
  f.classList.remove("invalid");
  const m = $(".error-msg", f);
  if (m) m.textContent = "";
  input.removeAttribute("aria-invalid");
}
function pasangBersih(form) {
  form.addEventListener("input", (e) => { if (e.target.matches("input, select, textarea")) bersihField(e.target); });
}
function resetError(form) { $$("input, select, textarea", form).forEach(bersihField); }
function fokusError(form) { const x = $(".invalid input, .invalid select, .invalid textarea", form); if (x) x.focus(); }

/* =========================================================
   3. LAYOUT BERSAMA (header, logout, badge keranjang)
   ========================================================= */
function initLayout(page, user) {
  const nm = $("#namaUser"); if (nm) nm.textContent = user.nama;
  const av = $("#avatar");   if (av) av.textContent = user.nama.trim().charAt(0).toUpperCase();
  $$(".nav a").forEach((a) => { if (a.dataset.page === page) a.setAttribute("aria-current", "page"); });
  const out = $("#btnLogout");
  if (out) out.addEventListener("click", async () => {
    const ya = await dialogNotif({ judul: "Keluar dari akun?", pesan: "Anda akan kembali ke halaman login.", tipe: "warn", konfirmasi: true, teksOk: "Ya, keluar" });
    if (ya) { sessionStorage.removeItem(KEY.user); location.href = "index.html"; }
  });
  updateBadgeKeranjang();
}

/* =========================================================
   4. HALAMAN LOGIN (index.html)
   ========================================================= */
function initLogin() {
  const form = $("#formLogin"), email = $("#email"), pass = $("#password"), card = $(".login-card");
  pasangBersih(form);

  $("#togglePass").addEventListener("click", (e) => {
    const tampil = pass.type === "password";
    pass.type = tampil ? "text" : "password";
    e.currentTarget.textContent = tampil ? "Sembunyikan" : "Tampilkan";
    e.currentTarget.setAttribute("aria-pressed", String(tampil));
  });

  $("#isiDemo").addEventListener("click", () => {
    email.value = dataPengguna[0].email;
    pass.value = dataPengguna[0].password;
    resetError(form);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    resetError(form);
    let ok = true;
    const v = email.value.trim();
    if (!v) { salahField(email, "Email wajib diisi."); ok = false; }
    else if (!reEmail.test(v)) { salahField(email, "Format email tidak valid."); ok = false; }
    if (!pass.value) { salahField(pass, "Password wajib diisi."); ok = false; }
    if (!ok) { fokusError(form); return; }

    const u = getUsers().find((x) => x.email.toLowerCase() === v.toLowerCase() && x.password === pass.value);
    if (!u) {
      card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
      await dialogNotif({ judul: "Login gagal", pesan: "Email/password yang anda masukkan salah", tipe: "error" });
      pass.value = ""; pass.focus();
      return;
    }
    sessionStorage.setItem(KEY.user, JSON.stringify({ nama: u.nama, email: u.email }));
    location.href = "dashboard.html";
  });

  /* ----- Modal: Lupa Password ----- */
  const fLupa = $("#formLupa"), hasil = $("#lupaHasil");
  pasangBersih(fLupa);
  $('[data-open="dlgLupa"]').addEventListener("click", () => { fLupa.reset(); resetError(fLupa); hasil.hidden = true; });
  fLupa.addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = $("#lupaEmail"), v = inp.value.trim();
    hasil.hidden = true;
    if (!reEmail.test(v)) { salahField(inp, "Masukkan email yang valid."); return; }
    const ada = getUsers().some((x) => x.email.toLowerCase() === v.toLowerCase());
    hasil.hidden = false;
    hasil.className = "notice " + (ada ? "notice-ok" : "notice-err");
    hasil.textContent = ada
      ? `Tautan reset password (simulasi) telah dikirim ke ${v}. Periksa kotak masuk Anda.`
      : "Email belum terdaftar. Silakan daftar akun baru terlebih dahulu.";
  });

  /* ----- Modal: Daftar ----- */
  const fDaftar = $("#formDaftar");
  pasangBersih(fDaftar);
  $('[data-open="dlgDaftar"]').addEventListener("click", () => { fDaftar.reset(); resetError(fDaftar); });
  fDaftar.addEventListener("submit", (e) => {
    e.preventDefault();
    resetError(fDaftar);
    const nama = $("#dNama"), em = $("#dEmail"), p1 = $("#dPass"), p2 = $("#dPass2");
    let ok = true;
    if (nama.value.trim().length < 3) { salahField(nama, "Nama minimal 3 karakter."); ok = false; }
    if (!reEmail.test(em.value.trim())) { salahField(em, "Format email tidak valid."); ok = false; }
    else if (getUsers().some((x) => x.email.toLowerCase() === em.value.trim().toLowerCase())) { salahField(em, "Email sudah terdaftar."); ok = false; }
    if (p1.value.length < 6) { salahField(p1, "Password minimal 6 karakter."); ok = false; }
    if (p2.value !== p1.value) { salahField(p2, "Konfirmasi password tidak sama."); ok = false; }
    if (!ok) { fokusError(fDaftar); return; }

    const baru = store.get(KEY.users, []);
    baru.push({ id: dataPengguna.length + baru.length + 1, nama: nama.value.trim(), email: em.value.trim(), password: p1.value, role: "User" });
    store.set(KEY.users, baru);
    $("#dlgDaftar").close();
    email.value = em.value.trim(); pass.value = "";
    pass.focus();
    toast("Pendaftaran berhasil! Silakan login.", "success");
  });
}

/* =========================================================
   5. DASHBOARD (dashboard.html)
   ========================================================= */
function sapaan(jam = new Date().getHours()) {
  if (jam >= 4 && jam < 11) return { kunci: "pagi", teks: "Selamat pagi" };
  if (jam >= 11 && jam < 15) return { kunci: "siang", teks: "Selamat siang" };
  if (jam >= 15 && jam < 18) return { kunci: "sore", teks: "Selamat sore" };
  return { kunci: "malam", teks: "Selamat malam" };
}

function hitungNaik(elm, target, fmt = (v) => v.toLocaleString("id-ID")) {
  const dur = 900, t0 = performance.now();
  const langkah = (t) => {
    const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    elm.textContent = fmt(Math.round(target * e));
    if (p < 1) requestAnimationFrame(langkah);
  };
  requestAnimationFrame(langkah);
}

function initDashboard(user) {
  const tick = () => {
    const now = new Date(), s = sapaan(now.getHours());
    document.body.dataset.waktu = s.kunci;
    $("#sapaan").textContent = `${s.teks}, ${user.nama.split(" ")[0]}!`;
    $("#jam").textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    $("#tanggal").textContent = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };
  tick(); setInterval(tick, 1000);
  $("#zona").textContent = "Waktu lokal  :  Cikarang (WIB)";
  const katalog = getKatalog(), pesanan = getPesanan();
  hitungNaik($("#statJudul"), katalog.length);
  hitungNaik($("#statStok"), katalog.reduce((s, b) => s + b.stok, 0));
  hitungNaik($("#statPesanan"), pesanan.length);
  hitungNaik($("#statOmzet"), pesanan.reduce((s, p) => s + totalBayar(p), 0), rupiah);

  const terbaru = [...pesanan].sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.id.localeCompare(a.id)).slice(0, 4);
  $("#listTerbaru").replaceChildren(...terbaru.map((p) => {
    const li = el("li");
    li.innerHTML = `<div><a href="tracking.html?do=${encodeURIComponent(p.id)}">${esc(p.id)}</a>
        <span class="muted"> · ${esc(p.nama)} · ${tglPendek(p.tanggal)}</span></div>
      <div>${badgeStatus(p.status)} <strong>${rupiah(totalBayar(p))}</strong></div>`;
    return li;
  }));
}

/* =========================================================
   6. KATALOG / STOK (stok.html)
   ========================================================= */
function initStok() {
  let katalog = getKatalog();
  const tbody = $("#tbodyStok");
  const palet = [["#1e4038", "#d9a441"], ["#7a2e1d", "#e0a458"], ["#14213d", "#5f7adb"], ["#8c2f39", "#f4d58d"], ["#0f4c5c", "#7fc8d6"], ["#3a2a5e", "#e6b800"]];

  const kategoriList = () => [...new Set(katalog.map((b) => b.kategori))].sort((a, b) => a.localeCompare(b));
  function isiKategori() {
    const sel = $("#filterKategori"), cur = sel.value;
    sel.replaceChildren(el("option", { value: "" }, "Semua kategori"), ...kategoriList().map((k) => el("option", { value: k }, k)));
    sel.value = kategoriList().includes(cur) ? cur : "";
    $("#daftarKategori").replaceChildren(...kategoriList().map((k) => el("option", { value: k })));
  }
  const kodeBerikut = () => {
    const maks = katalog.reduce((m, b) => Math.max(m, parseInt(b.kode.replace(/\D/g, ""), 10) || 0), 0);
    return "BUKU" + (maks + 1);
  };

  /* Membuat satu baris tabel dengan DOM API */
  function baris(b) {
    const st = statusStok(b.stok);
    return el("tr", { dataset: { kode: b.kode } },
      el("td", { "data-label": "Buku" },
        el("div", { class: "buku-cell" },
          el("img", { src: coverBuku(b), alt: `Sampul buku ${b.judul}`, width: 44, height: 62, loading: "lazy" }),
          el("div", {}, el("strong", {}, b.judul), el("span", { class: "muted" }, `Edisi ${b.edisi}`)))),
      el("td", { "data-label": "Kode" }, b.kode),
      el("td", { "data-label": "Kategori" }, b.kategori),
      el("td", { class: "num", "data-label": "Harga" }, rupiah(b.harga)),
      el("td", { "data-label": "Stok" }, el("span", { class: `badge ${st.kelas}` }, st.teks)),
      el("td", { "data-label": "Aksi" },
        el("div", { class: "actions" },
          el("button", { type: "button", class: "btn btn-sm", disabled: b.stok < 1, onclick: () => pesanBuku(b) }, "+ Keranjang"),
          el("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: () => bukaForm(b) }, "Ubah"),
          el("button", { type: "button", class: "btn btn-danger btn-sm", onclick: () => hapusBuku(b) }, "Hapus"))));
  }

  function ringkasan() {
    $("#sumJudul").textContent = katalog.length;
    $("#sumStok").textContent = katalog.reduce((s, b) => s + b.stok, 0).toLocaleString("id-ID");
    $("#sumNilai").textContent = rupiah(katalog.reduce((s, b) => s + b.stok * b.harga, 0));
    $("#sumMenipis").textContent = katalog.filter((b) => b.stok <= 5).length;
  }

  function render(sorotKode) {
    const q = $("#cari").value.trim().toLowerCase(), k = $("#filterKategori").value, u = $("#urut").value;
    const pengurut = {
      judul: (a, b) => a.judul.localeCompare(b.judul),
      hargaAsc: (a, b) => a.harga - b.harga,
      hargaDesc: (a, b) => b.harga - a.harga,
      stokAsc: (a, b) => a.stok - b.stok,
      stokDesc: (a, b) => b.stok - a.stok
    };
    const list = katalog
      .filter((b) => (!k || b.kategori === k) && (!q || `${b.judul} ${b.kategori} ${b.kode}`.toLowerCase().includes(q)))
      .sort(pengurut[u] || pengurut.judul);
    tbody.replaceChildren(...list.map(baris));
    $("#kosongStok").hidden = list.length > 0;
    $("#infoJumlah").textContent = `Menampilkan ${list.length} dari ${katalog.length} judul`;
    ringkasan();
    if (sorotKode) {
      const tr = tbody.querySelector(`[data-kode="${sorotKode}"]`);
      if (tr) { tr.classList.add("baru"); tr.scrollIntoView({ block: "center", behavior: "smooth" }); }
    }
  }

  function pesanBuku(b) {
    const r = tambahKeKeranjang(b.kode);
    if (r === "ok") toast(`"${b.judul}" masuk keranjang.`, "success");
    else if (r === "maks") toast("Jumlah di keranjang sudah mencapai stok.", "error");
    else toast("Stok buku ini habis.", "error");
  }

  async function hapusBuku(b) {
    const ya = await dialogNotif({ judul: "Hapus buku?", pesan: `"${b.judul}" akan dihapus dari katalog.`, tipe: "warn", konfirmasi: true, teksOk: "Hapus" });
    if (!ya) return;
    katalog = katalog.filter((x) => x.kode !== b.kode);
    saveKatalog(katalog);
    saveKeranjang(getKeranjang().filter((i) => i.kode !== b.kode));
    updateBadgeKeranjang(); isiKategori(); render();
    toast("Buku dihapus dari katalog.");
  }

  /* ----- Form tambah / ubah (dialog) ----- */
  const dlg = $("#dlgBuku"), form = $("#formBuku");
  pasangBersih(form);
  function bukaForm(buku) {
    form.reset(); resetError(form);
    const f = form.elements;
    form.dataset.mode = buku ? "ubah" : "tambah";
    $("#judulDlg").textContent = buku ? "Ubah data buku" : "Tambah buku baru";
    $("#btnSimpanBuku").textContent = buku ? "Simpan perubahan" : "Tambah ke katalog";
    if (buku) {
      f.kode.value = buku.kode; f.judul.value = buku.judul; f.edisi.value = buku.edisi;
      f.kategori.value = buku.kategori; f.harga.value = buku.harga; f.stok.value = buku.stok;
    } else {
      f.kode.value = kodeBerikut();
      f.edisi.value = 1;
      f.kategori.value = "Buku Ajar";
    }
    dlg.showModal();
    f.judul.focus();
  }
  $("#btnTambah").addEventListener("click", () => bukaForm(null));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    resetError(form);
    const f = form.elements;
    let ok = true;
    const cek = (inp, kondisi, pesan) => { if (!kondisi) { salahField(inp, pesan); ok = false; } };
    const harga = Number(f.harga.value), stok = Number(f.stok.value), edisi = Number(f.edisi.value);
    cek(f.judul, f.judul.value.trim().length >= 3, "Judul minimal 3 karakter.");
    cek(f.kategori, f.kategori.value.trim() !== "", "Kategori wajib diisi.");
    cek(f.harga, f.harga.value !== "" && Number.isInteger(harga) && harga >= 1000, "Harga minimal Rp 1.000 (bilangan bulat).");
    cek(f.stok, f.stok.value !== "" && Number.isInteger(stok) && stok >= 0, "Stok harus bilangan bulat ≥ 0.");
    cek(f.edisi, Number.isInteger(edisi) && edisi >= 1, "Edisi harus bilangan bulat ≥ 1.");
    if (!ok) { fokusError(form); return; }

    const data = {
      kode: f.kode.value, judul: f.judul.value.trim(),
      kategori: f.kategori.value.trim(), edisi: String(edisi), harga, stok
    };
    if (form.dataset.mode === "ubah") {
      const i = katalog.findIndex((b) => b.kode === data.kode);
      katalog[i] = { ...katalog[i], ...data };
      toast("Data buku diperbarui.", "success");
    } else {
      data.warna = palet[Math.floor(Math.random() * palet.length)];
      katalog.push(data);
      $("#cari").value = ""; $("#filterKategori").value = "";
      toast(`"${data.judul}" ditambahkan ke katalog.`, "success");
    }
    saveKatalog(katalog);
    dlg.close();
    isiKategori();
    render(data.kode);
  });

  ["input", "change"].forEach((ev) => {
    $("#cari").addEventListener(ev, () => render());
    $("#filterKategori").addEventListener(ev, () => render());
    $("#urut").addEventListener(ev, () => render());
  });
  isiKategori();
  render();
}

/* =========================================================
   7. PEMESANAN (checkout.html)
   ========================================================= */
function initCheckout(user) {
  let katalog = getKatalog();
  let keranjang = getKeranjang().filter((i) => katalog.some((b) => b.kode === i.kode));
  let kupon = null;
  const form = $("#formCheckout"), f = form.elements;
  const cari = (kode) => katalog.find((b) => b.kode === kode);
  pasangBersih(form);

  const prefill = () => { f.nama.value = user.nama; f.email.value = user.email; };
  prefill();

  f.ekspedisi.replaceChildren(el("option", { value: "" }, "Pilih ekspedisi…"),
    ...dataEkspedisi.map((e, i) => el("option", { value: i }, `${e.nama} – ${e.jenis} (${rupiah(e.ongkir)})`)));
  $("#metodeBayar").replaceChildren(...dataMetodeBayar.map((m) =>
    el("label", { class: "pay" }, el("input", { type: "radio", name: "metode", value: m }), el("span", {}, m))));

  function isiPilihan() {
    $("#pilihBuku").replaceChildren(el("option", { value: "" }, "Pilih buku…"),
      ...katalog.filter((b) => b.stok > 0).map((b) => el("option", { value: b.kode }, `${b.judul} — ${rupiah(b.harga)} (stok ${b.stok})`)));
  }
  const simpan = () => { saveKeranjang(keranjang); updateBadgeKeranjang(); };

  function hitung() {
    const sub = keranjang.reduce((s, i) => s + cari(i.kode).harga * i.qty, 0);
    const e = dataEkspedisi[f.ekspedisi.value];
    const ongkir = e ? e.ongkir : 0;
    let diskon = 0;
    if (kupon === "BUKUBARU") diskon = Math.round(sub * 0.1);
    if (kupon === "ONGKIRGRATIS") diskon = ongkir;
    return { sub, ongkir, diskon, total: Math.max(0, sub + ongkir - diskon) };
  }

  function renderRingkasan() {
    const h = hitung();
    $("#rItem").textContent = keranjang.reduce((s, i) => s + i.qty, 0);
    $("#rSub").textContent = rupiah(h.sub);
    $("#rOngkir").textContent = rupiah(h.ongkir);
    $("#rDiskon").textContent = h.diskon ? "− " + rupiah(h.diskon) : rupiah(0);
    $("#rTotal").textContent = rupiah(h.total);
  }

  function renderKeranjang() {
    const tbody = $("#tbodyKeranjang");
    tbody.replaceChildren(...keranjang.map((i) => {
      const b = cari(i.kode);
      return el("tr", {},
        el("td", { "data-label": "Buku" }, el("div", { class: "buku-cell" },
          el("img", { src: coverBuku(b), alt: `Sampul ${b.judul}`, width: 44, height: 62 }),
          el("div", {}, el("strong", {}, b.judul), el("span", { class: "muted" }, `Edisi ${b.edisi}`)))),
        el("td", { class: "num", "data-label": "Harga" }, rupiah(b.harga)),
        el("td", { "data-label": "Jumlah" }, el("div", { class: "qty" },
          el("button", { type: "button", class: "qty-btn", "data-aksi": "minus", "data-kode": b.kode, "aria-label": `Kurangi ${b.judul}` }, "−"),
          el("input", { type: "number", min: 1, max: b.stok, value: i.qty, "data-aksi": "set", "data-kode": b.kode, "aria-label": `Jumlah ${b.judul}` }),
          el("button", { type: "button", class: "qty-btn", "data-aksi": "plus", "data-kode": b.kode, "aria-label": `Tambah ${b.judul}` }, "+"))),
        el("td", { class: "num", "data-label": "Subtotal" }, rupiah(b.harga * i.qty)),
        el("td", { "data-label": "Aksi" }, el("button", { type: "button", class: "btn btn-danger btn-sm", "data-aksi": "hapus", "data-kode": b.kode }, "Hapus")));
    }));
    const kosong = keranjang.length === 0;
    $("#kosongKeranjang").hidden = !kosong;
    $("#tabelKeranjang").hidden = kosong;
    renderRingkasan();
  }

  function ubahQty(kode, qty) {
    const it = keranjang.find((i) => i.kode === kode), b = cari(kode);
    if (!it || !b) return;
    if (!Number.isFinite(qty) || qty < 1) qty = 1;
    if (qty > b.stok) { qty = b.stok; toast(`Stok "${b.judul}" hanya ${b.stok}.`, "error"); }
    it.qty = qty; simpan(); renderKeranjang();
  }

  $("#tbodyKeranjang").addEventListener("click", (e) => {
    const t = e.target.closest("[data-aksi]");
    if (!t) return;
    const kode = t.dataset.kode, it = keranjang.find((i) => i.kode === kode);
    if (t.dataset.aksi === "plus") ubahQty(kode, it.qty + 1);
    if (t.dataset.aksi === "minus") ubahQty(kode, it.qty - 1);
    if (t.dataset.aksi === "hapus") { keranjang = keranjang.filter((i) => i.kode !== kode); simpan(); renderKeranjang(); toast("Item dihapus dari pesanan."); }
  });
  $("#tbodyKeranjang").addEventListener("change", (e) => {
    if (e.target.dataset.aksi === "set") ubahQty(e.target.dataset.kode, parseInt(e.target.value, 10));
  });

  $("#btnTambahItem").addEventListener("click", () => {
    const kode = $("#pilihBuku").value, qty = parseInt($("#qtyTambah").value, 10);
    if (!kode) { toast("Pilih buku terlebih dahulu.", "error"); return; }
    if (!Number.isInteger(qty) || qty < 1) { toast("Jumlah minimal 1.", "error"); return; }
    const b = cari(kode), it = keranjang.find((i) => i.kode === kode);
    const baru = (it ? it.qty : 0) + qty;
    if (baru > b.stok) { toast(`Stok "${b.judul}" hanya ${b.stok}.`, "error"); return; }
    if (it) it.qty = baru; else keranjang.push({ kode, qty });
    simpan(); renderKeranjang();
    $("#pilihBuku").value = ""; $("#qtyTambah").value = 1;
    toast(`"${b.judul}" ditambahkan.`, "success");
  });

  f.ekspedisi.addEventListener("change", renderRingkasan);

  $("#btnKupon").addEventListener("click", () => {
    const kode = $("#kupon").value.trim().toUpperCase(), pesan = $("#pesanKupon");
    pesan.hidden = false;
    if (kode === "BUKUBARU" || kode === "ONGKIRGRATIS") {
      kupon = kode; pesan.className = "notice notice-ok";
      pesan.textContent = kode === "BUKUBARU" ? "Kupon aktif: diskon 10% dari subtotal." : "Kupon aktif: gratis ongkos kirim.";
    } else {
      kupon = null; pesan.className = "notice notice-err";
      pesan.textContent = kode ? "Kode kupon tidak dikenal." : "Masukkan kode kupon terlebih dahulu.";
    }
    renderRingkasan();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    resetError(form);
    if (!keranjang.length) {
      await dialogNotif({ judul: "Keranjang kosong", pesan: "Tambahkan minimal satu buku sebelum membuat pesanan.", tipe: "error" });
      return;
    }
    let ok = true;
    const cek = (inp, kondisi, pesan) => { if (!kondisi) { salahField(inp, pesan); ok = false; } };
    cek(f.nama, f.nama.value.trim().length >= 3, "Nama minimal 3 karakter.");
    cek(f.email, reEmail.test(f.email.value.trim()), "Format email tidak valid.");
    cek(f.telepon, reTelp.test(f.telepon.value.replace(/[\s-]/g, "")), "Nomor telepon tidak valid (contoh: 081234567890).");
    cek(f.alamat, f.alamat.value.trim().length >= 10, "Alamat minimal 10 karakter.");
    cek(f.kota, f.kota.value.trim().length >= 3, "Kota wajib diisi.");
    cek(f.kodepos, /^\d{5}$/.test(f.kodepos.value.trim()), "Kode pos harus 5 digit angka.");
    cek(f.ekspedisi, f.ekspedisi.value !== "", "Pilih ekspedisi pengiriman.");
    const metode = $('input[name="metode"]:checked', form);
    if (!metode) { salahField($('input[name="metode"]', form), "Pilih metode pembayaran."); ok = false; }
    if (!ok) { toast("Periksa kembali isian yang ditandai merah.", "error"); fokusError(form); return; }

    const h = hitung();
    const lanjut = await dialogNotif({
      judul: "Buat pesanan sekarang?",
      pesan: `${keranjang.reduce((s, i) => s + i.qty, 0)} buku · Total ${rupiah(h.total)}\nDikirim ke ${f.kota.value.trim()} via ${dataEkspedisi[f.ekspedisi.value].nama}.`,
      tipe: "info", konfirmasi: true, teksOk: "Ya, pesan"
    });
    if (!lanjut) return;

    const daftar = getPesanan(), eks = dataEkspedisi[f.ekspedisi.value];
    let n = 1001 + daftar.length, id;
    do { id = "DO-2026" + n++; } while (daftar.some((p) => p.id === id));
    daftar.unshift({
      id, tanggal: hariIni(), nama: f.nama.value.trim(), email: f.email.value.trim(),
      telepon: f.telepon.value.trim(), alamat: `${f.alamat.value.trim()}, ${f.kota.value.trim()} ${f.kodepos.value.trim()}`,
      ekspedisi: eks.nama, jenisPaket: eks.jenis, metode: metode.value, catatan: f.catatan.value.trim(),
      ongkir: h.ongkir, diskon: h.diskon, status: 0,
      items: keranjang.map((i) => { const b = cari(i.kode); return { kode: b.kode, judul: b.judul, harga: b.harga, qty: i.qty }; })
    });
    savePesanan(daftar);
    keranjang.forEach((i) => { cari(i.kode).stok -= i.qty; });   // kurangi stok katalog
    saveKatalog(katalog);
    keranjang = []; kupon = null; simpan();
    form.reset(); prefill(); $("#pesanKupon").hidden = true; $("#kupon").value = "";
    isiPilihan(); renderKeranjang();

    $("#noDO").textContent = id;
    $("#linkLacak").href = "tracking.html?do=" + encodeURIComponent(id);
    $("#dlgSukses").showModal();
  });

  isiPilihan();
  renderKeranjang();
}

/* =========================================================
   8. TRACKING PENGIRIMAN (tracking.html)
   ========================================================= */
function initTracking() {
  const form = $("#formTracking"), inp = $("#nomorDO"), hasil = $("#hasilTracking"), btn = $("#btnCari");
  const pesanan = getPesanan();
  pasangBersih(form);

  $("#contohDO").replaceChildren(...pesanan.slice(0, 5).map((p) =>
    el("button", { type: "button", class: "chip", onclick: () => { inp.value = p.id; form.requestSubmit(); } }, p.id)));

  const pesanTahap = (p) => [
    "Pesanan diterima dan menunggu verifikasi pembayaran.",
    "Pembayaran terverifikasi, pesanan sedang disiapkan gudang.",
    "Buku dikemas dengan aman dan siap diserahkan ke kurir.",
    `Paket diserahkan ke ${p.ekspedisi} dan sedang dalam perjalanan.`,
    "Paket sudah diterima oleh pemesan. Selamat membaca!"
  ];

  function tampil(p) {
    const jejak = pesanTahap(p).slice(0, p.status + 1).map((m, i) => ({ tgl: tglStatus(p, i), judul: STATUS[i], pesan: m })).reverse();
    hasil.innerHTML = `<article class="card result" aria-live="polite">
      <header class="result-head">
        <div><p class="eyebrow">Nomor Delivery Order</p><h2>${esc(p.id)}</h2>
          <p class="muted">Atas nama <strong>${esc(p.nama)}</strong></p></div>
        ${badgeStatus(p.status)}
      </header>
      <ol class="stepper" style="--p:${p.status / 4}" aria-label="Progres pengiriman">
        ${STATUS.map((s, i) => `<li class="${i < p.status ? "done" : i === p.status ? "current" : ""}" ${i === p.status ? 'aria-current="step"' : ""}>
          <span class="dot">${i < p.status ? "✓" : i + 1}</span><span>${s}</span></li>`).join("")}
      </ol>
      <dl class="detail-grid">
        <div><dt>Nama pemesan</dt><dd>${esc(p.nama)}</dd></div>
        <div><dt>Ekspedisi</dt><dd>${esc(p.ekspedisi)}</dd></div>
        <div><dt>Jenis paket</dt><dd>${esc(p.jenisPaket)}</dd></div>
        <div><dt>Tanggal kirim${p.status < 3 ? " (estimasi)" : ""}</dt><dd>${tglPanjang(tglStatus(p, 3))}</dd></div>
        <div><dt>Metode pembayaran</dt><dd>${esc(p.metode)}</dd></div>
        <div><dt>Alamat tujuan</dt><dd>${esc(p.alamat)}</dd></div>
        <div><dt>Total pembayaran</dt><dd class="big">${rupiah(totalBayar(p))}</dd></div>
      </dl>
      <div class="table-wrap"><table class="responsive"><thead><tr><th scope="col">Buku</th><th scope="col" class="num">Harga</th><th scope="col" class="num">Qty</th><th scope="col" class="num">Subtotal</th></tr></thead>
        <tbody>${p.items.map((i) => `<tr><td data-label="Buku">${esc(i.judul)}</td><td class="num" data-label="Harga">${rupiah(i.harga)}</td><td class="num" data-label="Qty">${i.qty}</td><td class="num" data-label="Subtotal">${rupiah(i.harga * i.qty)}</td></tr>`).join("")}</tbody></table></div>
      <h3 style="margin-top:1.75rem">Riwayat perjalanan paket</h3>
      <ul class="timeline">${jejak.map((j) => `<li><time datetime="${j.tgl}">${tglPanjang(j.tgl)}</time><strong>${esc(j.judul)}</strong><span class="muted">${esc(j.pesan)}</span></li>`).join("")}</ul>
    </article>`;
    hasil.hidden = false;
    hasil.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    bersihField(inp);
    const v = inp.value.trim().toUpperCase();
    if (!v) { salahField(inp, "Nomor Delivery Order wajib diisi."); hasil.hidden = true; inp.focus(); return; }
    btn.disabled = true; btn.textContent = "Mencari…";
    setTimeout(async () => {                       // simulasi proses pencarian ke server
      btn.disabled = false; btn.textContent = "Cari";
      const p = getPesanan().find((x) => x.id.toUpperCase() === v);
      if (!p) {
        hasil.hidden = true;
        await dialogNotif({ judul: "Pesanan tidak ditemukan", pesan: `Nomor Delivery Order "${v}" tidak terdaftar.\nPeriksa kembali nomor Anda.`, tipe: "error" });
        inp.focus();
        return;
      }
      tampil(p);
    }, 500);
  });

  const awal = new URLSearchParams(location.search).get("do");
  if (awal) { inp.value = awal; form.requestSubmit(); }
}

/* =========================================================
   9. LAPORAN PEMESANAN (laporan.html)
   ========================================================= */
function initLaporan() {
  const semua = getPesanan(), katalog = getKatalog();
  const kategoriDari = (kode) => (katalog.find((b) => b.kode === kode) || {}).kategori || "Lainnya";
  const bulanList = [...new Set(semua.map((p) => p.tanggal.slice(0, 7)))].sort();
  const sel = $("#filterBulan");
  sel.replaceChildren(el("option", { value: "" }, "Semua periode"), ...bulanList.map((b) => el("option", { value: b }, bulanLabel(b))));

  const baris = (label, nilai, maks, teks) =>
    `<div class="bar-row"><span class="bar-label" title="${esc(label)}">${esc(label)}</span>
     <div class="bar-track"><div class="bar-fill" style="--w:${maks ? Math.max(3, nilai / maks * 100) : 0}%"></div></div>
     <span class="bar-val">${teks}</span></div>`;

  function dataTerfilter() { return sel.value ? semua.filter((p) => p.tanggal.startsWith(sel.value)) : semua; }

  function render() {
    const list = dataTerfilter();
    const omzet = list.reduce((s, p) => s + totalBayar(p), 0);
    const terjual = list.reduce((s, p) => s + jumlahItem(p), 0);
    $("#rpPesanan").textContent = list.length;
    $("#rpOmzet").textContent = rupiah(omzet);
    $("#rpRata").textContent = rupiah(list.length ? Math.round(omzet / list.length) : 0);
    $("#rpTerjual").textContent = terjual;

    // per bulan (selalu seluruh periode)
    const perBulan = {};
    semua.forEach((p) => { const k = p.tanggal.slice(0, 7); perBulan[k] = (perBulan[k] || 0) + totalBayar(p); });
    const mb = Math.max(...Object.values(perBulan), 0);
    $("#chartBulan").innerHTML = bulanList.map((b) => baris(bulanLabel(b), perBulan[b], mb, rupiah(perBulan[b]))).join("");

    // per kategori & per buku (mengikuti filter)
    const perKat = {}, perBuku = {};
    list.forEach((p) => p.items.forEach((i) => {
      const k = kategoriDari(i.kode);
      perKat[k] = (perKat[k] || 0) + i.harga * i.qty;
      perBuku[i.kode] = perBuku[i.kode] || { judul: i.judul, kategori: k, qty: 0, omzet: 0 };
      perBuku[i.kode].qty += i.qty; perBuku[i.kode].omzet += i.harga * i.qty;
    }));
    const kat = Object.entries(perKat).sort((a, b) => b[1] - a[1]);
    const mk = kat.length ? kat[0][1] : 0;
    $("#chartKategori").innerHTML = kat.length ? kat.map(([k, v]) => baris(k, v, mk, rupiah(v))).join("") : '<p class="muted">Belum ada data.</p>';

    const stat = STATUS.map((s, i) => [s, list.filter((p) => p.status === i).length]);
    const ms = Math.max(...stat.map((x) => x[1]), 0);
    $("#chartStatus").innerHTML = stat.map(([s, n]) => baris(s, n, ms, n + " pesanan")).join("");

    const buku = Object.values(perBuku).sort((a, b) => b.omzet - a.omzet);
    $("#tbodyLaporan").innerHTML = buku.map((b, i) =>
      `<tr><td data-label="#">${i + 1}</td><td data-label="Judul"><strong>${esc(b.judul)}</strong></td><td data-label="Kategori">${esc(b.kategori)}</td>
       <td class="num" data-label="Terjual">${b.qty}</td><td class="num" data-label="Pendapatan">${rupiah(b.omzet)}</td></tr>`).join("");
    $("#kosongLaporan").hidden = buku.length > 0;
  }

  sel.addEventListener("change", render);
  $("#btnCetak").addEventListener("click", () => window.print());
  $("#btnCSV").addEventListener("click", () => {
    const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [["No DO", "Tanggal", "Pemesan", "Status", "Ekspedisi", "Kode Buku", "Judul", "Qty", "Harga", "Total Pesanan"]];
    dataTerfilter().forEach((p) => p.items.forEach((i) =>
      rows.push([p.id, p.tanggal, p.nama, STATUS[p.status], p.ekspedisi, i.kode, i.judul, i.qty, i.harga, totalBayar(p)])));
    const blob = new Blob(["﻿" + rows.map((r) => r.map(q).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const a = el("a", { href: URL.createObjectURL(blob), download: "laporan-pemesanan.csv" });
    document.body.append(a); a.click(); a.remove();
    toast("Laporan CSV diunduh.", "success");
  });
  render();
}

/* =========================================================
   10. HISTORY TRANSAKSI (riwayat.html)
   ========================================================= */
function initRiwayat() {
  const tbody = $("#tbodyRiwayat");
  $("#filterStatus").append(...STATUS.map((s, i) => el("option", { value: i }, s)));

  function detail(p) {
    $("#detailIsi").innerHTML = `
      <div class="modal-head"><div><p class="eyebrow">Detail transaksi</p><h2>${esc(p.id)}</h2></div>
        <button type="button" class="modal-x" data-close aria-label="Tutup">×</button></div>
      <p>${badgeStatus(p.status)} <span class="muted">· ${tglPanjang(p.tanggal)}</span></p>
      <dl class="detail-grid">
        <div><dt>Pemesan</dt><dd>${esc(p.nama)}</dd></div>
        <div><dt>Kontak</dt><dd>${esc(p.telepon || "-")}<br><span class="muted">${esc(p.email || "")}</span></dd></div>
        <div><dt>Alamat</dt><dd>${esc(p.alamat)}</dd></div>
        <div><dt>Pengiriman</dt><dd>${esc(p.ekspedisi)} · ${esc(p.jenisPaket)}</dd></div>
        <div><dt>Pembayaran</dt><dd>${esc(p.metode)}</dd></div>
        ${p.catatan ? `<div><dt>Catatan</dt><dd>${esc(p.catatan)}</dd></div>` : ""}
      </dl>
      <div class="table-wrap"><table><thead><tr><th scope="col">Buku</th><th scope="col" class="num">Qty</th><th scope="col" class="num">Subtotal</th></tr></thead><tbody>
        ${p.items.map((i) => `<tr><td>${esc(i.judul)}</td><td class="num">${i.qty}</td><td class="num">${rupiah(i.harga * i.qty)}</td></tr>`).join("")}
        <tr><td colspan="2">Ongkos kirim</td><td class="num">${rupiah(p.ongkir)}</td></tr>
        ${p.diskon ? `<tr><td colspan="2">Diskon</td><td class="num">− ${rupiah(p.diskon)}</td></tr>` : ""}
        <tr><td colspan="2"><strong>Total</strong></td><td class="num"><strong>${rupiah(totalBayar(p))}</strong></td></tr>
      </tbody></table></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" id="btnSalin">Salin nomor DO</button>
        <a class="btn btn-primary" href="tracking.html?do=${encodeURIComponent(p.id)}">Lacak paket</a>
      </div>`;
    $("#btnSalin").addEventListener("click", () => {
      if (navigator.clipboard) navigator.clipboard.writeText(p.id).then(() => toast("Nomor DO disalin.", "success"), () => toast("Gagal menyalin.", "error"));
      else toast("Browser tidak mendukung salin otomatis.", "error");
    });
    $("#detailIsi [data-close]").addEventListener("click", () => $("#dlgDetail").close());
    $("#dlgDetail").showModal();
  }

  function render() {
    const q = $("#cariRiwayat").value.trim().toLowerCase(), s = $("#filterStatus").value;
    const list = getPesanan()
      .filter((p) => (s === "" || p.status === Number(s)) && (!q || `${p.id} ${p.nama}`.toLowerCase().includes(q)))
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.id.localeCompare(a.id));
    tbody.replaceChildren(...list.map((p) => {
      const tr = el("tr", {},
        el("td", { "data-label": "Tanggal" }, tglPendek(p.tanggal)),
        el("td", { "data-label": "No. DO" }, el("strong", {}, p.id)),
        el("td", { "data-label": "Pemesan" }, p.nama),
        el("td", { class: "num", "data-label": "Item" }, `${jumlahItem(p)} buku`),
        el("td", { class: "num", "data-label": "Total" }, rupiah(totalBayar(p))),
        el("td", { "data-label": "Status" }), el("td", { "data-label": "Aksi" },
          el("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: () => detail(p) }, "Detail")));
      tr.children[5].innerHTML = badgeStatus(p.status);
      return tr;
    }));
    $("#kosongRiwayat").hidden = list.length > 0;
    $("#infoRiwayat").textContent = `${list.length} transaksi`;
  }
  ["input", "change"].forEach((ev) => { $("#cariRiwayat").addEventListener(ev, render); $("#filterStatus").addEventListener(ev, render); });
  render();
}

/* =========================================================
   11. BOOT – jalankan init sesuai halaman
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  let user = null;
  try { user = JSON.parse(sessionStorage.getItem(KEY.user) || "null"); } catch (_) { /* abaikan */ }

  if (page === "login") {
    if (user) { location.replace("dashboard.html"); return; }
    initLogin(); pasangModal();
    return;
  }
  if (!user) { location.replace("index.html"); return; }   // halaman lain wajib login

  initLayout(page, user);
  const peta = { dashboard: initDashboard, stok: initStok, checkout: initCheckout, tracking: initTracking, laporan: initLaporan, riwayat: initRiwayat };
  if (peta[page]) peta[page](user);
  pasangModal();
});
