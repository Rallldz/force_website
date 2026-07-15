/* ═══════════════════════════════════════════════════
   FORCE — JavaScript
   Data disimpan di localStorage browser.
   Kalau sudah ada backend, ganti bagian getData() &
   saveData() dengan fetch() ke server.
   ═══════════════════════════════════════════════════ */


// ── PENYIMPANAN DATA ─────────────────────────────────
function getData() {
  return JSON.parse(localStorage.getItem('force_laporan') || '[]');
}
function saveData(data) {
  localStorage.setItem('force_laporan', JSON.stringify(data));
}


// ── NAVIGASI HALAMAN ─────────────────────────────────
function showPage(page, kategoriPreset) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  document.getElementById('pg-' + page).classList.add('active');
  const navBtn = document.getElementById('nav-' + page);
  if (navBtn) navBtn.classList.add('active');

  // Hero hanya muncul di beranda
  document.getElementById('hero-wrap').style.display = page === 'beranda' ? 'block' : 'none';

  // Preset kategori jika datang dari cat-card
  if (page === 'lapor' && kategoriPreset) {
    document.getElementById('f-kategori').value = kategoriPreset;
  }

  if (page === 'beranda') renderBeranda();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMenu() {
  document.getElementById('mobile-menu').classList.toggle('open');
}


// ── RENDER BERANDA ────────────────────────────────────
function renderBeranda() {
  const data = getData();

  // Statistik
  const total    = data.length;
  const diproses = data.filter(d => d.status === 'Diproses').length;
  const selesai  = data.filter(d => d.status === 'Selesai').length;
  const menunggu = data.filter(d => d.status === 'Menunggu' || d.status === 'Dibaca').length;

  animateCounter('s-total',    total);
  animateCounter('s-diproses', diproses);
  animateCounter('s-selesai',  selesai);
  animateCounter('s-menunggu', menunggu);

  // Jumlah per kategori
  ['kesiswaan', 'administrasi', 'kurikulum'].forEach(k => {
    const n = data.filter(d => d.kategori.toLowerCase() === k).length;
    document.getElementById('count-' + k).textContent = n + ' laporan';
  });

  // Daftar laporan terbaru (5 terakhir)
  const container = document.getElementById('list-laporan');
  const terbaru   = [...data].reverse().slice(0, 5);

  if (terbaru.length === 0) {
    container.innerHTML = `
      <div class="empty-box">
        <i class="ti ti-clipboard-off"></i>
        <p>Belum ada laporan.</p>
        <small>
          <button onclick="showPage('lapor')"
            style="color:#2563eb;background:none;border:none;cursor:pointer;font-size:12px">
            Jadilah yang pertama melapor!
          </button>
        </small>
      </div>`;
    return;
  }

  const ikonMap  = { Kesiswaan: 'ti-users', Sarpras: 'ti-file-text', Kurikulum: 'ti-book' };
  const warnaMap = { Kesiswaan: 'ci-blue',  Sarpras: 'ci-green',     Kurikulum: 'ci-amber' };
  const badgeMap = { Selesai: 'b-green', Diproses: 'b-yellow', Dibaca: 'b-blue', Menunggu: 'b-gray' };

  container.innerHTML = terbaru.map(l => `
    <div class="report-card">
      <div class="report-icon ${warnaMap[l.kategori] || 'ci-blue'}">
        <i class="ti ${ikonMap[l.kategori] || 'ti-file'}"></i>
      </div>
      <div class="report-body">
        <div class="report-ticket">${l.nomor_tiket}</div>
        <div class="report-title">${l.judul}</div>
        <div class="report-meta">${l.kategori} · ${l.jenis} · ${l.tanggal}</div>
      </div>
      <span class="badge ${badgeMap[l.status] || 'b-gray'}">${l.status}</span>
    </div>`
  ).join('');
}


// ── ANIMASI COUNTER ───────────────────────────────────
function animateCounter(id, target, duration = 900) {
  const el = document.getElementById(id);
  if (!el) return;
  let start = 0;
  const step = target / (duration / 16);
  clearInterval(el._timer);
  el._timer = setInterval(() => {
    start = Math.min(start + step, target);
    el.textContent = Math.floor(start);
    if (start >= target) clearInterval(el._timer);
  }, 16);
}


// ── BUAT NOMOR TIKET ──────────────────────────────────
function buatNomorTiket() {
  const tahun = new Date().getFullYear();
  const urut  = String(getData().length + 1).padStart(3, '0');
  const acak  = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `FC-${tahun}-${urut}${acak}`;
}


// ── KIRIM LAPORAN ─────────────────────────────────────
function kirimLaporan() {
  const nama     = document.getElementById('f-nama').value.trim();
  const kelas    = document.getElementById('f-kelas').value.trim();
  const wa       = document.getElementById('f-wa').value.trim();
  const email    = document.getElementById('f-email').value.trim();
  const anonim   = document.getElementById('f-anonim').checked;
  const kategori = document.getElementById('f-kategori').value;
  const jenis    = document.getElementById('f-jenis').value;
  const judul    = document.getElementById('f-judul').value.trim();
  const uraian   = document.getElementById('f-uraian').value.trim();

  // Validasi
  if (!nama || !kelas) { alert('Nama dan kelas/jabatan wajib diisi!'); return; }
  if (!kategori)       { alert('Pilih kategori laporan!'); return; }
  if (!jenis)          { alert('Pilih jenis laporan!'); return; }
  if (!judul)          { alert('Judul laporan wajib diisi!'); return; }
  if (!uraian)         { alert('Uraian laporan wajib diisi!'); return; }

  // Loading
  const btn = document.getElementById('btn-kirim');
  btn.disabled = true;
  btn.innerHTML = '<i class="ti ti-loader ti-spin"></i> Mengirim...';

  // Simpan laporan
  const laporan = {
    nomor_tiket:     buatNomorTiket(),
    nama, kelas, wa, email, anonim,
    kategori, jenis, judul, uraian,
    status:          'Menunggu',
    catatan_admin:   '',
    tanggal:         new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    tanggal_baca:    null,
    tanggal_proses:  null,
    tanggal_selesai: null,
  };

  setTimeout(() => {
    const data = getData();
    data.push(laporan);
    saveData(data);

    // Reset form
    ['f-nama','f-kelas','f-wa','f-email','f-judul','f-uraian']
      .forEach(id => document.getElementById(id).value = '');
    document.getElementById('f-kategori').value = '';
    document.getElementById('f-jenis').value    = '';
    document.getElementById('f-anonim').checked = false;

    btn.disabled = false;
    btn.innerHTML = '<i class="ti ti-send"></i> Kirim laporan';

    // Tampilkan modal sukses
    document.getElementById('modal-tiket').textContent = laporan.nomor_tiket;
    document.getElementById('modal-sukses').classList.add('show');
  }, 800);
}


// ── MODAL SUKSES ──────────────────────────────────────
function salinTiket() {
  const tiket = document.getElementById('modal-tiket').textContent;
  navigator.clipboard.writeText(tiket)
    .then(() => alert('Nomor tiket disalin: ' + tiket));
}

function lihatStatus() {
  const tiket = document.getElementById('modal-tiket').textContent;
  document.getElementById('modal-sukses').classList.remove('show');
  showPage('status');
  document.getElementById('tiket-input').value = tiket;
  cekStatus();
}

// Tutup modal saat klik di luar
document.getElementById('modal-sukses').addEventListener('click', function(e) {
  if (e.target === this) this.classList.remove('show');
});


// ── CEK STATUS ────────────────────────────────────────
function cekStatus() {
  const tiket  = document.getElementById('tiket-input').value.trim().toUpperCase();
  const hasil  = document.getElementById('hasil-status');
  if (!tiket) return;

  const laporan = getData().find(d => d.nomor_tiket === tiket);

  if (!laporan) {
    hasil.innerHTML = `
      <div class="result-card">
        <div class="empty-box" style="padding:32px">
          <i class="ti ti-file-x"></i>
          <p>Nomor tiket <strong>${tiket}</strong> tidak ditemukan.</p>
          <small>Pastikan nomor tiket sudah benar.</small>
        </div>
      </div>`;
    return;
  }

  const steps = [
    { label: 'Laporan diterima',              tgl: laporan.tanggal,          done: true },
    { label: 'Sudah dibaca penanggung jawab', tgl: laporan.tanggal_baca,     done: !!laporan.tanggal_baca },
    { label: 'Sedang ditindaklanjuti',        tgl: laporan.tanggal_proses,   done: !!laporan.tanggal_proses },
    { label: 'Selesai',                       tgl: laporan.tanggal_selesai,  done: !!laporan.tanggal_selesai },
  ];

  const badgeMap = { Selesai: 'b-green', Diproses: 'b-yellow', Dibaca: 'b-blue', Menunggu: 'b-gray' };

  const timelineHTML = steps.map((s, i) => {
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

  hasil.innerHTML = `
    <div class="result-card">
      <div class="result-header">
        <div class="result-tiket-label">NOMOR TIKET</div>
        <div class="result-tiket-num">${laporan.nomor_tiket}</div>
        <div class="result-judul">${laporan.judul}</div>
        <div class="result-meta">
          <span class="result-cat">${laporan.kategori} · ${laporan.jenis}</span>
          <span class="result-badge">${laporan.status}</span>
        </div>
      </div>
      <div class="result-body">
        ${laporan.catatan_admin ? `
        <div class="catatan-box">
          <div class="catatan-label"><i class="ti ti-message-circle"></i> Catatan penanggung jawab</div>
          <div class="catatan-text">${laporan.catatan_admin}</div>
        </div>` : ''}
        <div class="sec-label" style="margin-bottom:12px">Riwayat penanganan</div>
        <div class="timeline">${timelineHTML}</div>
      </div>
    </div>`;
}

// Enter di input tiket
document.getElementById('tiket-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') cekStatus();
});


// ── DATA CONTOH BAWAAN ────────────────────────────────
// Supaya langsung ada isi saat pertama dibuka
if (getData().length === 0) {
  saveData([
    {
      nomor_tiket: 'FC-2024-001AA',
      nama: 'Andi Pratama', kelas: 'XI IPA 2',
      wa: '081234567890', email: 'andi@sekolah.sch.id', anonim: false,
      kategori: 'Kesiswaan', jenis: 'Aduan / Keluhan',
      judul: 'Jadwal ekskul bentrok dengan jam pelajaran',
      uraian: 'Jadwal ekskul basket setiap Selasa ternyata bersamaan dengan jam pelajaran Matematika.',
      status: 'Diproses',
      catatan_admin: 'Sedang dikoordinasikan dengan wali kelas.',
      tanggal: '02 Des 2024', tanggal_baca: '02 Des 2024',
      tanggal_proses: '03 Des 2024', tanggal_selesai: null,
    },
    {
      nomor_tiket: 'FC-2024-002BB',
      nama: 'Siti Rahayu', kelas: 'XII IPS 1',
      wa: '', email: '', anonim: true,
      kategori: 'Administrasi', jenis: 'Kritik',
      judul: 'Proses penerbitan surat keterangan terlalu lama',
      uraian: 'Mengurus surat keterangan aktif membutuhkan waktu lebih dari seminggu.',
      status: 'Menunggu',
      catatan_admin: '',
      tanggal: '01 Des 2024', tanggal_baca: null,
      tanggal_proses: null, tanggal_selesai: null,
    },
    {
      nomor_tiket: 'FC-2024-003CC',
      nama: 'Budi Santoso', kelas: 'X IPA 1',
      wa: '082345678901', email: 'budi@sekolah.sch.id', anonim: false,
      kategori: 'Kurikulum', jenis: 'Saran / Aspirasi',
      judul: 'Usulan penambahan jam remedial Matematika',
      uraian: 'Banyak siswa kesulitan mengikuti materi Matematika sehingga perlu tambahan jam bimbingan.',
      status: 'Selesai',
      catatan_admin: 'Sudah disetujui, mulai berlaku semester depan.',
      tanggal: '28 Nov 2024', tanggal_baca: '28 Nov 2024',
      tanggal_proses: '29 Nov 2024', tanggal_selesai: '01 Des 2024',
    },
  ]);
}

// Render awal
renderBeranda();
