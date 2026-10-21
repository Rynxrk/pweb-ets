/* LibraryReg – logika front end (JavaScript + localStorage + Bootstrap JS) */

// Tema terang/gelap mengikuti pengaturan perangkat
const mq = window.matchMedia('(prefers-color-scheme: dark)');
const setTheme = () => document.documentElement.setAttribute('data-bs-theme', mq.matches ? 'dark' : 'light');
setTheme(); mq.addEventListener('change', setTheme);

// ---------- Data & localStorage ----------
const KEY = 'libraryreg_anggota';
const seed = [
  {id:1,nama:'Andi Pratama',nim:'230101001',prodi:'Informatika',jenis:'Mahasiswa',telp:'081234567890',email:'andi@email.com',alamat:'Jl. Melati 12, Surabaya'},
  {id:2,nama:'Siti Rahma',nim:'230101002',prodi:'Sistem Informasi',jenis:'Mahasiswa',telp:'081234567891',email:'siti@email.com',alamat:'Jl. Kenanga 5, Sidoarjo'},
  {id:3,nama:'Budi Santoso',nim:'19881234',prodi:'Manajemen',jenis:'Dosen',telp:'081234567892',email:'budi@email.com',alamat:'Jl. Mawar 8, Surabaya'}
];
let data = load();
function load(){ try{ const r = localStorage.getItem(KEY); if(r) return JSON.parse(r); }catch(e){} return seed.slice(); }
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(data)); }catch(e){} }

// ---------- Helper ----------
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const modalEl = $('#appModal');
const bsModal = () => bootstrap.Modal.getOrCreateInstance(modalEl);
function showModal(html){ $('#modalBody').innerHTML = html; bsModal().show(); }
function hideModal(){ bsModal().hide(); }

function toast(msg, error=false){
  const el = document.createElement('div');
  el.className = `toast align-items-center border-0 text-bg-${error ? 'danger' : 'success'}`;
  el.setAttribute('role','alert');
  el.innerHTML = `<div class="d-flex"><div class="toast-body">${esc(msg)}</div><button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Tutup"></button></div>`;
  $('#toasts').append(el);
  el.addEventListener('hidden.bs.toast', () => el.remove());
  new bootstrap.Toast(el, {delay:3200}).show();
}

// ---------- Navigasi (hash) ----------
function route(){
  const h = (location.hash || '#beranda').slice(1);
  const view = h === 'daftar' ? 'daftar' : h === 'anggota' ? 'anggota' : 'home';
  ['home','daftar','anggota'].forEach(v => $('#v-'+v).hidden = (v !== view));
  $$('.nav-link').forEach(a => a.classList.toggle('active', a.dataset.v === h));
  const col = bootstrap.Collapse.getInstance($('#nav')); if(col) col.hide();
  if(view === 'home' && h !== 'beranda') setTimeout(() => { const e = document.getElementById(h); if(e) e.scrollIntoView(); }, 0);
  else window.scrollTo(0,0);
  if(view === 'anggota') render();
}
window.addEventListener('hashchange', route);

// ---------- Validasi ----------
const rules = {
  nama:  v => v.trim() ? '' : 'Nama lengkap wajib diisi.',
  nim:   v => v.trim() ? '' : 'NIM/NIP wajib diisi.',
  prodi: v => v ? '' : 'Pilih program studi.',
  jenis: v => v ? '' : 'Pilih jenis keanggotaan.',
  telp:  v => !v.trim() ? 'Nomor telepon wajib diisi.' : /^08\d{8,11}$/.test(v.trim()) ? '' : 'Gunakan format 08xxxxxxxxxx (10–13 digit).',
  email: v => !v.trim() ? 'Email wajib diisi.' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Format email tidak valid, contoh: nama@email.com.',
  alamat:v => v.trim() ? '' : 'Alamat wajib diisi.'
};
function validate(form, ignoreId){
  let ok = true;
  for(const k in rules){
    const el = form.elements[k];
    let msg = rules[k](el.value);
    if(!msg && k === 'nim' && data.some(d => d.nim === el.value.trim() && d.id !== ignoreId)) msg = 'NIM/NIP ini sudah terdaftar.';
    el.classList.toggle('is-invalid', !!msg);
    const fb = el.nextElementSibling; if(fb) fb.textContent = msg;
    if(msg) ok = false;
  }
  return ok;
}

// ---------- Formulir pendaftaran ----------
$('#f').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  if(!validate(f)){ toast('Periksa kembali kolom yang bertanda merah.', true); return; }
  const o = {id: Date.now()};
  for(const k in rules) o[k] = f.elements[k].value.trim();
  data.push(o); save(); f.reset();
  toast('Pendaftaran berhasil. Data tersimpan di daftar anggota.');
  location.hash = '#anggota';
});
$('#f').addEventListener('reset', () => $$('#f .is-invalid').forEach(x => x.classList.remove('is-invalid')));

// ---------- Tabel anggota ----------
function render(){
  const q = $('#q').value.toLowerCase().trim();
  const rows = data.filter(d => !q || d.nama.toLowerCase().includes(q) || d.nim.toLowerCase().includes(q));
  $('#tb').innerHTML = rows.map((d,i) => `<tr>
    <td>${i+1}</td><td>${esc(d.nama)}</td><td>${esc(d.nim)}</td><td>${esc(d.prodi)}</td>
    <td><span class="badge badge-jenis">${esc(d.jenis)}</span></td><td>${esc(d.telp)}</td>
    <td class="text-nowrap">
      <button class="btn btn-sm btn-outline-pine" data-a="v" data-id="${d.id}">Detail</button>
      <button class="btn btn-sm btn-pine" data-a="e" data-id="${d.id}">Edit</button>
      <button class="btn btn-sm btn-danger" data-a="d" data-id="${d.id}">Hapus</button>
    </td></tr>`).join('');
  $('#empty').hidden = rows.length > 0;
  $('#cnt').textContent = `Menampilkan ${rows.length} dari ${data.length} data`;
  $('#stAnggota').textContent = data.length;
}
$('#q').addEventListener('input', render);
$('#tb').addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  const d = data.find(x => x.id == b.dataset.id); if(!d) return;
  if(b.dataset.a === 'v') detail(d); else if(b.dataset.a === 'e') edit(d); else hapus(d);
});

function detail(d){
  showModal(`<h3>Detail anggota</h3>
  <dl class="row mb-3">
    <dt class="col-4 fw-normal text-secondary">Nama</dt><dd class="col-8">${esc(d.nama)}</dd>
    <dt class="col-4 fw-normal text-secondary">NIM/NIP</dt><dd class="col-8">${esc(d.nim)}</dd>
    <dt class="col-4 fw-normal text-secondary">Program studi</dt><dd class="col-8">${esc(d.prodi)}</dd>
    <dt class="col-4 fw-normal text-secondary">Jenis</dt><dd class="col-8">${esc(d.jenis)}</dd>
    <dt class="col-4 fw-normal text-secondary">Telepon</dt><dd class="col-8">${esc(d.telp)}</dd>
    <dt class="col-4 fw-normal text-secondary">Email</dt><dd class="col-8">${esc(d.email)}</dd>
    <dt class="col-4 fw-normal text-secondary">Alamat</dt><dd class="col-8 mb-0">${esc(d.alamat)}</dd>
  </dl>
  <div class="text-end"><button class="btn btn-pine" data-bs-dismiss="modal">Tutup</button></div>`);
}
function hapus(d){
  showModal(`<h3>Hapus anggota?</h3>
  <p>Data <b>${esc(d.nama)}</b> (${esc(d.nim)}) akan dihapus dan tidak bisa dikembalikan.</p>
  <div class="text-end"><button class="btn btn-outline-pine me-2" data-bs-dismiss="modal">Batal</button><button class="btn btn-danger" id="yes">Hapus data</button></div>`);
  $('#yes').onclick = () => { data = data.filter(x => x.id !== d.id); save(); hideModal(); render(); toast('Data anggota dihapus.'); };
}
function edit(d){
  const opt = (arr,v) => arr.map(x => `<option${x===v?' selected':''}>${x}</option>`).join('');
  showModal(`<h3>Edit anggota</h3><form id="ef" novalidate class="vstack gap-2">
    <div><label class="form-label">Nama lengkap</label><input class="form-control" name="nama" value="${esc(d.nama)}"><div class="invalid-feedback"></div></div>
    <div><label class="form-label">NIM/NIP</label><input class="form-control" name="nim" value="${esc(d.nim)}"><div class="invalid-feedback"></div></div>
    <div><label class="form-label">Program studi</label><select class="form-select" name="prodi">${opt(['Informatika','Sistem Informasi','Manajemen','Akuntansi','Hukum','Pendidikan Bahasa'],d.prodi)}</select><div class="invalid-feedback"></div></div>
    <div><label class="form-label">Jenis keanggotaan</label><select class="form-select" name="jenis">${opt(['Mahasiswa','Dosen','Tenaga Kependidikan'],d.jenis)}</select><div class="invalid-feedback"></div></div>
    <div><label class="form-label">Nomor telepon</label><input class="form-control" name="telp" value="${esc(d.telp)}"><div class="invalid-feedback"></div></div>
    <div><label class="form-label">Email</label><input class="form-control" name="email" value="${esc(d.email)}"><div class="invalid-feedback"></div></div>
    <div><label class="form-label">Alamat</label><textarea class="form-control" name="alamat" rows="2">${esc(d.alamat)}</textarea><div class="invalid-feedback"></div></div>
    <div class="text-end mt-2"><button type="button" class="btn btn-outline-pine me-2" data-bs-dismiss="modal">Batal</button><button class="btn btn-saf">Simpan perubahan</button></div>
  </form>`);
  $('#ef').onsubmit = e => {
    e.preventDefault(); const f = e.target;
    if(!validate(f, d.id)){ toast('Periksa kembali kolom yang bertanda merah.', true); return; }
    for(const k in rules) d[k] = f.elements[k].value.trim();
    save(); hideModal(); render(); toast('Perubahan disimpan.');
  };
}

// ---------- Login petugas (simulasi) ----------
$('#loginBtn').onclick = () => {
  showModal(`<h3>Login petugas</h3><p class="text-secondary">Simulasi antarmuka, belum terhubung ke server.</p>
  <form id="lf" class="vstack gap-2"><div><label class="form-label">Username</label><input class="form-control" id="lu"></div>
  <div><label class="form-label">Kata sandi</label><input class="form-control" type="password" id="lp"></div>
  <div class="text-end mt-2"><button type="button" class="btn btn-outline-pine me-2" data-bs-dismiss="modal">Batal</button><button class="btn btn-saf">Masuk</button></div></form>`);
  $('#lf').onsubmit = e => {
    e.preventDefault();
    if(!$('#lu').value || !$('#lp').value){ toast('Username dan kata sandi wajib diisi.', true); return; }
    hideModal(); toast('Berhasil masuk sebagai petugas.'); location.hash = '#anggota';
  };
};

// ---------- Jalankan ----------
route(); render();