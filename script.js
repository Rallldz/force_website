/* ═══════════════════════════════════════════════════
   FORCE — Admin JavaScript
   Semua logika panel admin: login, render tabel,
   filter, update status, modal detail, toast.
   ═══════════════════════════════════════════════════ */

// ── KONFIGURASI ADMIN ─────────────────────────────────
// Ganti sesuai kebutuhan sekolah
const ADMIN_ACCOUNTS = [
  { username: 'admin',      password: 'admin25/26',  nama: 'Administrator' },
  { username: 'kesiswaan',  password: 'kesiswaan25/26',  nama: 'Ms. Ocha (Kesiswaan)' },
  { username: 'sarpras', password: 'sarpras25/26', nama: 'Ms. Dhiyas (Administrasi)' },
  { username: 'kurikulum',  password: 'kurikulum25/26',   nama: 'Mr.Rudi (Kurikulum)' },
];


// ── STATE ─────────────────────────────────────────────
let currentView     = 'dashboard';
let currentLaporan  = null;  // laporan yang sedang dibuka di modal


// ── AMBIL & SIMPAN DATA ───────────────────────────────
function getData() {
  return JSON.parse(localStorage.getItem('force_laporan') || '[]');
}
function saveData(data) {
  localStorage.setItem('force_laporan', JSON.stringify(data));
}


// ── LOGIN ─────────────────────────────────────────────
function doLogin() {
  const username = document.getElementById('input-user').value.trim();
  const password = document.getElementById('input-pass').value;
  const errBox   = document.getElementById('login-error');
  const errMsg   = document.getElementById('login-error-msg');

  if (!username || !password) {
    errMsg.textContent = 'Username dan password wajib diisi!';
    errBox.style.display = 'flex';
    return;
  }

  const akun = ADMIN_ACCOUNTS.find(
    a => a.username === username && a.password === password
  );

  if (!akun) {
    errMsg.textContent = 'Username atau password salah.';
    errBox.style.display = 'flex';
    document.getElementById('input-pass').value = '';
    return;
  }

  // Simpan sesi
  sessionStorage.setItem('force_admin_nama', akun.nama);
  sessionStorage.setItem('force_admin_login', '1');

  errBox.style.display = 'none';
  masukAdmin(akun.nama);
}

function masukAdmin(nama) {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('admin-wrap').classList.add('show');
  document.getElementById('topbar-username').textContent = nama;
  renderSemua();
}

function doLogout() {
  sessionStorage.removeItem('force_admin_login');
  sessionStorage.removeItem('force_admin_nama');
  document.getElementById('admin-wrap').classList.remove('show');
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('input-user').value = '';
  document.getElementById('input-pass').value = '';
  const icon = document.getElementById('password-toggle-icon');
  const passInput = document.getElementById('input-pass');
  if (icon && passInput) {
    passInput.type = 'password';
    icon.className = 'ti ti-eye';
    icon.parentElement?.setAttribute('aria-label', 'Tampilkan password');
  }
}

function togglePasswordVisibility() {
  const passInput = document.getElementById('input-pass');
  const icon = document.getElementById('password-toggle-icon');
  if (!passInput || !icon) return;

  const isHidden = passInput.type === 'password';
  passInput.type = isHidden ? 'text' : 'password';
  icon.className = isHidden ? 'ti ti-eye-off' : 'ti ti-eye';
  icon.parentElement?.setAttribute('aria-label', isHidden ? 'Sembunyikan password' : 'Tampilkan password');
}

// Auto-login jika sesi masih aktif
window.addEventListener('DOMContentLoaded', () => {
  const nama = sessionStorage.getItem('force_admin_nama');
  if (sessionStorage.getItem('force_admin_login') === '1' && nama) {
    masukAdmin(nama);
  }
});


// ── NAVIGASI VIEW ─────────────────────────────────────
const JUDUL_VIEW = {
  dashboard: 'Dashboard',
  semua:     'Semua Laporan',
  menunggu:  'Laporan Menunggu',
  diproses:  'Sedang Diproses',
  selesai:   'Laporan Selesai',
};

function showView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(b => b.classList.remove('active'));

  document.getElementById('view-' + view).classList.add('active');
  document.getElementById('nav-' + view).classList.add('active');
  document.getElementById('topbar-title').textContent = JUDUL_VIEW[view];

  currentView = view;
  renderSemua();
}


// ── RENDER SEMUA DATA ─────────────────────────────────
function renderSemua() {
  const data = getData();

  // Hitung statistik
  const total    = data.length;
  const menunggu = data.filter(d => d.status === 'Menunggu' || d.status === 'Dibaca').length;
  const diproses = data.filter(d => d.status === 'Diproses').length;
  const selesai  = data.filter(d => d.status === 'Selesai').length;

  setText('sc-total',    total);
  setText('sc-menunggu', menunggu);
  setText('sc-diproses', diproses);
  setText('sc-selesai',  selesai);
  setText('count-menunggu-nav', menunggu > 0 ? menunggu : '');

  // Tabel dashboard
  const perhatian = data.filter(d => d.status === 'Menunggu').reverse().slice(0, 5);
  renderTabel('tbl-perhatian', perhatian, 'perhatian');

  const terbaru = [...data].reverse().slice(0, 5);
  renderTabel('tbl-terbaru', terbaru, 'terbaru');

  // Tabel per view
  renderTabel('tbl-semua',     [...data].reverse(), 'semua');
  renderTabel('tbl-menunggu',  data.filter(d => d.status === 'Menunggu' || d.status === 'Dibaca').reverse(), 'menunggu');
  renderTabel('tbl-diproses',  data.filter(d => d.status === 'Diproses').reverse(), 'diproses');
  renderTabel('tbl-selesai',   data.filter(d => d.status === 'Selesai').reverse(), 'selesai');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}


// ── RENDER TABEL ──────────────────────────────────────
function renderTabel(tbodyId, rows, tipe) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  if (rows.length === 0) {
    const colspan = tipe === 'semua' ? 8 : 7;
    tbody.innerHTML = `
      <tr>
        <td colspan="${colspan}">
          <div class="table-empty">
            <i class="ti ti-clipboard-off"></i>
            <p>Tidak ada laporan.</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  const katClass  = { Kesiswaan: 'kp-blue', Administrasi: 'kp-green', Kurikulum: 'kp-amber' };
  const badgeClass = { Menunggu: 'b-gray', Dibaca: 'b-blue', Diproses: 'b-yellow', Selesai: 'b-green' };

  tbody.innerHTML = rows.map(l => {
    const nama    = l.anonim ? 'Anonim' : (l.nama || '-');
    const rowCls  = l.status === 'Menunggu' ? 'row-menunggu' : '';
    const katPill = `<span class="kat-pill ${katClass[l.kategori] || ''}">${l.kategori}</span>`;
    const badge   = `<span class="badge ${badgeClass[l.status] || 'b-gray'}">${l.status}</span>`;
    const aksi    = `<button class="btn-detail" onclick="bukaModal('${l.nomor_tiket}')">Detail →</button>`;

    if (tipe === 'perhatian') return `
      <tr class="${rowCls}">
        <td><span class="ticket-code">${l.nomor_tiket}</span></td>
        <td><div class="judul-cell">${l.judul}</div></td>
        <td>${katPill}</td>
        <td style="font-size:12px">${nama}</td>
        <td style="font-size:12px;color:var(--text3)">${l.tanggal}</td>
        <td>${aksi}</td>
      </tr>`;

    if (tipe === 'terbaru') return `
      <tr class="${rowCls}">
        <td><span class="ticket-code">${l.nomor_tiket}</span></td>
        <td><div class="judul-cell">${l.judul}</div></td>
        <td>${katPill}</td>
        <td>${badge}</td>
        <td style="font-size:12px;color:var(--text3)">${l.tanggal}</td>
        <td>${aksi}</td>
      </tr>`;

    if (tipe === 'semua') return `
      <tr class="${rowCls}">
        <td><span class="ticket-code">${l.nomor_tiket}</span></td>
        <td><div class="judul-cell">${l.judul}</div></td>
        <td>${katPill}</td>
        <td style="font-size:12px;color:var(--text2)">${l.jenis}</td>
        <td style="font-size:12px">${nama}</td>
        <td style="font-size:12px;color:var(--text3)">${l.tanggal}</td>
        <td>${badge}</td>
        <td>${aksi}</td>
      </tr>`;

    if (tipe === 'menunggu') return `
      <tr class="${rowCls}">
        <td><span class="ticket-code">${l.nomor_tiket}</span></td>
        <td><div class="judul-cell">${l.judul}</div></td>
        <td>${katPill}</td>
        <td style="font-size:12px">${nama}</td>
        <td style="font-size:12px;color:var(--text3)">${l.tanggal}</td>
        <td>${badge}</td>
        <td>${aksi}</td>
      </tr>`;

    if (tipe === 'diproses') return `
      <tr>
        <td><span class="ticket-code">${l.nomor_tiket}</span></td>
        <td><div class="judul-cell">${l.judul}</div></td>
        <td>${katPill}</td>
        <td style="font-size:12px">${nama}</td>
        <td style="font-size:12px;color:var(--text3)">${l.tanggal_proses || l.tanggal}</td>
        <td>${aksi}</td>
      </tr>`;

    if (tipe === 'selesai') return `
      <tr>
        <td><span class="ticket-code">${l.nomor_tiket}</span></td>
        <td><div class="judul-cell">${l.judul}</div></td>
        <td>${katPill}</td>
        <td style="font-size:12px">${nama}</td>
        <td style="font-size:12px;color:var(--text3)">${l.tanggal_selesai || '-'}</td>
        <td>${aksi}</td>
      </tr>`;

    return '';
  }).join('');
}


// ── FILTER SEMUA LAPORAN ──────────────────────────────
function filterLaporan() {
  const keyword = document.getElementById('search-input').value.toLowerCase();
  const kat     = document.getElementById('filter-kat').value;
  const data    = getData();

  const filtered = data.filter(l => {
    const cocokKat  = !kat || l.kategori === kat;
    const cocokKey  = !keyword ||
      l.nomor_tiket.toLowerCase().includes(keyword) ||
      l.judul.toLowerCase().includes(keyword) ||
      (l.nama || '').toLowerCase().includes(keyword);
    return cocokKat && cocokKey;
  }).reverse();

  renderTabel('tbl-semua', filtered, 'semua');
}


// ── MODAL DETAIL ──────────────────────────────────────
function bukaModal(nomor_tiket) {
  const data    = getData();
  const laporan = data.find(d => d.nomor_tiket === nomor_tiket);
  if (!laporan) return;

  currentLaporan = laporan;

  // Auto tandai "Dibaca" jika masih Menunggu
  if (laporan.status === 'Menunggu') {
    laporan.status     = 'Dibaca';
    laporan.tanggal_baca = tglSekarang();
    const idx = data.findIndex(d => d.nomor_tiket === nomor_tiket);
    data[idx] = laporan;
    saveData(data);
    renderSemua();
    currentLaporan = laporan;
  }

  // Isi header modal
  const badgeClass = { Menunggu:'b-gray', Dibaca:'b-blue', Diproses:'b-yellow', Selesai:'b-green' };
  setText('md-tiket', laporan.nomor_tiket);
  setText('md-judul', laporan.judul);
  setText('md-kat',   laporan.kategori + ' · ' + laporan.jenis);
  const badge = document.getElementById('md-badge');
  badge.textContent  = laporan.status;
  badge.className    = 'badge ' + (badgeClass[laporan.status] || 'b-gray');

  // Tabel info pelapor
  document.getElementById('md-info-table').innerHTML = `
    <tr><td>Pelapor</td><td><strong>${laporan.anonim ? 'Anonim' : (laporan.nama || '-')}</strong></td></tr>
    <tr><td>Kelas / Jabatan</td><td>${laporan.kelas || '-'}</td></tr>
    <tr><td>No. WhatsApp</td><td>${laporan.wa || '-'}</td></tr>
    <tr><td>Email</td><td>${laporan.email || '-'}</td></tr>
    <tr><td>Tanggal kirim</td><td>${laporan.tanggal}</td></tr>
  `;

  // Uraian
  setText('md-uraian', laporan.uraian);

  // Timeline
  const steps = [
    { label: 'Laporan diterima',              tgl: laporan.tanggal,          done: true },
    { label: 'Sudah dibaca penanggung jawab', tgl: laporan.tanggal_baca,     done: !!laporan.tanggal_baca },
    { label: 'Sedang ditindaklanjuti',        tgl: laporan.tanggal_proses,   done: !!laporan.tanggal_proses },
    { label: 'Selesai',                       tgl: laporan.tanggal_selesai,  done: !!laporan.tanggal_selesai },
  ];
  document.getElementById('md-timeline').innerHTML = steps.map((s, i) => {
    const isLast = i === steps.length - 1;
    let dotClass  = 'td-pending';
    if (s.done) dotClass = 'td-done';
    else if (steps.slice(0, i).every(p => p.done)) dotClass = 'td-active';
    const icon = s.done ? 'ti-check' : (dotClass === 'td-active' ? 'ti-loader' : 'ti-circle');
    return `
      <div class="tl-row">
        <div class="tl-col">
          <div class="tl-dot ${dotClass}"><i class="ti ${icon}"></i></div>
          ${!isLast ? `<div class="tl-line ${s.done ? 'done' : ''}"></div>` : ''}
        </div>
        <div class="tl-body">
          <div class="tl-name ${!s.done && dotClass === 'td-pending' ? 'muted' : ''}">${s.label}</div>
          <div class="tl-detail">${s.tgl || (dotClass === 'td-active' ? 'Sedang diproses...' : 'Menunggu')}</div>
        </div>
      </div>`;
  }).join('');

  // Preset form update
  document.getElementById('md-status-select').value = laporan.status;
  document.getElementById('md-catatan').value        = laporan.catatan_admin || '';

  document.getElementById('modal-detail').classList.add('show');
}

function tutupModal() {
  document.getElementById('modal-detail').classList.remove('show');
  currentLaporan = null;
}

// Tutup modal klik di luar
document.getElementById('modal-detail').addEventListener('click', function(e) {
  if (e.target === this) tutupModal();
});


// ── UPDATE STATUS ─────────────────────────────────────
function updateStatus() {
  if (!currentLaporan) return;

  const statusBaru = document.getElementById('md-status-select').value;
  const catatan    = document.getElementById('md-catatan').value.trim();
  const data       = getData();
  const idx        = data.findIndex(d => d.nomor_tiket === currentLaporan.nomor_tiket);
  if (idx === -1) return;

  const sekarang = tglSekarang();
  data[idx].status        = statusBaru;
  data[idx].catatan_admin = catatan;

  if (statusBaru === 'Dibaca'   && !data[idx].tanggal_baca)    data[idx].tanggal_baca    = sekarang;
  if (statusBaru === 'Diproses' && !data[idx].tanggal_proses)  data[idx].tanggal_proses  = sekarang;
  if (statusBaru === 'Selesai'  && !data[idx].tanggal_selesai) data[idx].tanggal_selesai = sekarang;

  saveData(data);
  currentLaporan = data[idx];

  // Refresh modal badge & timeline
  bukaModal(currentLaporan.nomor_tiket);

  // Refresh tabel
  renderSemua();

  // Toast sukses
  showToast('success', 'Status berhasil diperbarui ke: ' + statusBaru);
}


// ── TOAST ─────────────────────────────────────────────
function showToast(tipe, pesan) {
  const toast = document.getElementById('toast');
  const icon  = tipe === 'success' ? 'ti-circle-check' : 'ti-alert-circle';
  toast.className   = 'toast ' + tipe;
  toast.innerHTML   = `<i class="ti ${icon}"></i> ${pesan}`;
  toast.style.display = 'flex';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.display = 'none'; }, 3000);
}


// ── HELPER ────────────────────────────────────────────
function tglSekarang() {
  return new Date().toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  }) + ', ' + new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit'
  });
}
