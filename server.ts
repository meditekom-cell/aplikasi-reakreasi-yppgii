import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { DatabaseSchema, Peserta, MasterUnitKerja, MasterJabatan, MasterKaos, MasterBis, MasterHotel, MasterTempatMakan, MasterTempatAcara, AktivitasLog, AnggotaKeluarga, DokumenLampiran } from './src/types';

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ----------------------------------------------------
// Security Helpers: SHA-256 + Salt & XSS Sanitization
// ----------------------------------------------------
function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password: string, salt: string): string {
  return crypto.createHash('sha256').update(password + ':' + salt).digest('hex');
}

function sanitizeInput(str: any): any {
  if (typeof str === 'string') {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .trim();
  }
  if (Array.isArray(str)) {
    return str.map(sanitizeInput);
  }
  if (typeof str === 'object' && str !== null) {
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(str)) {
      cleaned[key] = sanitizeInput(str[key]);
    }
    return cleaned;
  }
  return str;
}

// ----------------------------------------------------
// Initial Default Database Seeder
// ----------------------------------------------------
function getInitialDatabase(): DatabaseSchema {
  const defaultSalt = 'pangandaran2026secure_salt';
  const defaultPasswordHash = hashPassword('admin123', defaultSalt);

  const unitKerja: MasterUnitKerja[] = [
    { id: 'uk-1', kode: 'SDM', nama: 'Divisi Sumber Daya Manusia', deskripsi: 'Pengelolaan kepegawaian & talenta' },
    { id: 'uk-2', kode: 'KEU', nama: 'Divisi Keuangan & Akuntansi', deskripsi: 'Penganggaran dan perbendaharaan' },
    { id: 'uk-3', kode: 'TI', nama: 'Divisi Teknologi Informasi', deskripsi: 'Infrastruktur dan aplikasi digital' },
    { id: 'uk-4', kode: 'OPS', nama: 'Divisi Operasional & Pelayanan', deskripsi: 'Pelayanan lapangan dan operasional' },
    { id: 'uk-5', kode: 'SEK', nama: 'Sekretariat & Tata Usaha', deskripsi: 'Administrasi umum dan persuratan' },
    { id: 'uk-6', kode: 'LOG', nama: 'Divisi Logistik & Aset', deskripsi: 'Perlengkapan dan pengelolaan aset' },
  ];

  const jabatan: MasterJabatan[] = [
    { id: 'jb-1', nama: 'Kepala Divisi', level: 'Eselon I / Manajerial' },
    { id: 'jb-2', nama: 'Manajer / Sub-Koordinator', level: 'Eselon II' },
    { id: 'jb-3', nama: 'Supervisor / Ahli Muda', level: 'Supervisor' },
    { id: 'jb-4', nama: 'Staff Pelaksana Senior', level: 'Staff' },
    { id: 'jb-5', nama: 'Staff Pelaksana / Fungsional', level: 'Staff' },
    { id: 'jb-6', nama: 'Tenaga Pendukung / Operasional', level: 'Support' },
  ];

  const kaos: MasterKaos[] = [
    { id: 'ks-1', ukuran: 'S', kategori: 'Standar', kuotaTotal: 100 },
    { id: 'ks-2', ukuran: 'M', kategori: 'Standar', kuotaTotal: 250 },
    { id: 'ks-3', ukuran: 'L', kategori: 'Standar', kuotaTotal: 300 },
    { id: 'ks-4', ukuran: 'XL', kategori: 'Standar', kuotaTotal: 250 },
    { id: 'ks-5', ukuran: 'XXL', kategori: 'Standar', kuotaTotal: 150 },
    { id: 'ks-6', ukuran: '3XL', kategori: 'Standar', kuotaTotal: 50 },
  ];

  const bis: MasterBis[] = [
    { id: 'bis-1', nomorBis: 'Bis 01', namaBis: 'Executive Arwana (Full AC + Audio)', kapasitas: 48, nomorPolisi: 'B 7123 PND', namaKoordinator: 'Budi Santoso', kontakKoordinator: '081234567890', namaSupir: 'Pak Asep Sunandar', noHpSopir: '081311223344', keterangan: 'Rombongan VIP & Divisi SDM/Sekretariat' },
    { id: 'bis-2', nomorBis: 'Bis 02', namaBis: 'Executive Barakuda (Full AC + Karaoke)', kapasitas: 48, nomorPolisi: 'B 7124 PND', namaKoordinator: 'Hendri Pratama', kontakKoordinator: '081298765432', namaSupir: 'Pak Dadang Sudrajat', noHpSopir: '081322334455', keterangan: 'Rombongan Keuangan & TI' },
    { id: 'bis-3', nomorBis: 'Bis 03', namaBis: 'Executive Cakalang (Full AC + Reclining)', kapasitas: 48, nomorPolisi: 'B 7125 PND', namaKoordinator: 'Ahmad Fauzi', kontakKoordinator: '081345678901', namaSupir: 'Pak Cecep Supriatna', noHpSopir: '081333445566', keterangan: 'Rombongan Operasional & Logistik' },
    { id: 'bis-4', nomorBis: 'Bis 04', namaBis: 'Executive Dolphin (Full AC + Toilet)', kapasitas: 45, nomorPolisi: 'B 7126 PND', namaKoordinator: 'Dewi Lestari', kontakKoordinator: '081389012345', namaSupir: 'Pak Yayan Mulyana', noHpSopir: '081344556677', keterangan: 'Rombongan Keluarga & Peserta Umum' },
    { id: 'bis-5', nomorBis: 'Bis 05', namaBis: 'Executive Marlin (Full AC + Toilet)', kapasitas: 45, nomorPolisi: 'B 7127 PND', namaKoordinator: 'Rian Hidayat', kontakKoordinator: '081223344556', namaSupir: 'Pak Dedi Kusnadi', noHpSopir: '081355667788', keterangan: 'Rombongan Tambahan & Panitia' },
  ];

  const hotel: MasterHotel[] = [
    {
      id: 'htl-1',
      namaHotel: 'Hotel Laut Biru Pangandaran (Pantai Barat)',
      lokasi: 'Jl. E. Bahari No.68, Pantai Barat Pangandaran',
      kontakHotel: '(0265) 639375',
      tipeKamar: ['Superior Sea View', 'Deluxe Pool View', 'Family Suite 4 Orang'],
      daftarKamar: [
        { noKamar: '101', lantai: '1', tipe: 'Deluxe', kapasitas: 2, keterangan: 'Lt 1 Pool View' },
        { noKamar: '102', lantai: '1', tipe: 'Deluxe', kapasitas: 2, keterangan: 'Lt 1 Pool View' },
        { noKamar: '103', lantai: '1', tipe: 'Deluxe', kapasitas: 2, keterangan: 'Lt 1 Pool View' },
        { noKamar: '201', lantai: '2', tipe: 'Deluxe', kapasitas: 2, keterangan: 'Lt 2 Sea View' },
        { noKamar: '202', lantai: '2', tipe: 'Deluxe', kapasitas: 2, keterangan: 'Lt 2 Sea View' },
        { noKamar: '205', lantai: '2', tipe: 'Family Suite', kapasitas: 4, keterangan: 'Lt 2 Family Bed' },
        { noKamar: '206', lantai: '2', tipe: 'Family Suite', kapasitas: 4, keterangan: 'Lt 2 Family Bed' },
        { noKamar: '301', lantai: '3', tipe: 'Standard', kapasitas: 2, keterangan: 'Lt 3 City View' },
        { noKamar: '302', lantai: '3', tipe: 'Standard', kapasitas: 2, keterangan: 'Lt 3 City View' },
        { noKamar: '305', lantai: '3', tipe: 'Cottage', kapasitas: 4, keterangan: 'Villa Private' },
      ],
    },
    {
      id: 'htl-2',
      namaHotel: 'The Allure Villas Managed by Sahid',
      lokasi: 'Kawasan Grand Pangandaran Kav. 15',
      kontakHotel: '(0265) 630000',
      tipeKamar: ['One Bedroom Villa', 'Two Bedroom Suite Villa', 'Suite Deluxe'],
      daftarKamar: [
        { noKamar: 'Villa-A1', lantai: '1', tipe: 'Deluxe', kapasitas: 2, keterangan: 'Villa Garden' },
        { noKamar: 'Villa-A2', lantai: '1', tipe: 'Deluxe', kapasitas: 2, keterangan: 'Villa Garden' },
        { noKamar: 'Villa-B1', lantai: '2', tipe: 'Family Suite', kapasitas: 4, keterangan: '2 Bedroom Villa' },
        { noKamar: 'Villa-B2', lantai: '2', tipe: 'Family Suite', kapasitas: 4, keterangan: '2 Bedroom Villa' },
        { noKamar: 'Villa-C1', lantai: '1', tipe: 'Cottage', kapasitas: 6, keterangan: '3 Bedroom Villa' },
      ],
    },
    {
      id: 'htl-3',
      namaHotel: 'Horison Palma Pangandaran',
      lokasi: 'Jl. Pantai Barat No. 91, Pangandaran',
      kontakHotel: '(0265) 630555',
      tipeKamar: ['Deluxe Ocean', 'Junior Suite', 'Executive Family'],
      daftarKamar: [
        { noKamar: 'HP-301', lantai: '3', tipe: 'Deluxe', kapasitas: 2, keterangan: 'Balcony Ocean' },
        { noKamar: 'HP-302', lantai: '3', tipe: 'Deluxe', kapasitas: 2, keterangan: 'Balcony Ocean' },
        { noKamar: 'HP-401', lantai: '4', tipe: 'Family Suite', kapasitas: 4, keterangan: 'Junior Suite' },
        { noKamar: 'HP-402', lantai: '4', tipe: 'Family Suite', kapasitas: 4, keterangan: 'Executive Family' },
      ],
    },
  ];

  const tempatMakan: MasterTempatMakan[] = [
    {
      id: 'tm-1',
      namaTempat: 'Resto Seafood Karya Bahari 3 (Pantai Timur)',
      lokasi: 'Komplek Pasar Ikan Pantai Timur Pangandaran',
      sesiMakan: ['Makan Siang Hari 1', 'Makan Malam Seafood Gala Dinner Hari 1'],
      kapasitas: 350,
      menuUtama: 'Ikan Bakar Kakap, Udang Saus Padang, Cumi Goreng Tepung, Kepiting Soka',
    },
    {
      id: 'tm-2',
      namaTempat: 'Kampung Turis Pangandaran Beachfront',
      lokasi: 'Jl. Pamugaran Pantai Barat, Wonoharjo',
      sesiMakan: ['Makan Malam Sunset Gathering Hari 2', 'Snack & Coffee Break'],
      kapasitas: 400,
      menuUtama: 'Live BBQ Grilled Seafood, Kelapa Muda, Tradisional Sundanese Buffet',
    },
    {
      id: 'tm-3',
      namaTempat: 'Resto RM Saung Lesehan Pangandaran',
      lokasi: 'Jl. Raya Cijulang Pangandaran',
      sesiMakan: ['Makan Siang Hari 2 (Perjalanan Wisata Green Canyon)'],
      kapasitas: 300,
      menuUtama: 'Ayam Bakar Madu, Nasi Liwet Kastrol, Gurame Asam Manis, Lalapan Sambal Terasi',
    },
  ];

  const tempatAcara: MasterTempatAcara[] = [
    {
      id: 'ta-1',
      namaTempat: 'Panggung Utama Pantai Timur Pangandaran',
      lokasi: 'Area Terbuka Pantai Timur Pangandaran',
      kapasitas: 600,
      kegiatan: 'Gala Dinner, Malam Keakraban, Pentas Seni & Pembagian Doorprize',
      keterangan: 'Panggung rigging utama dengan sound system, lighting & panggung apresiasi',
    },
    {
      id: 'ta-2',
      namaTempat: 'Pantai Barat Pangandaran (Fun Outbound Area)',
      lokasi: 'Pesisir Pantai Barat Depan Hotel Laut Biru',
      kapasitas: 500,
      kegiatan: 'Fun Games Karyawan, Senam Pagi, Team Building & Lomba Anak',
      keterangan: 'Area pasir pantai barat dengan tenda sarnavil medis, instruktur & konsumsi',
    },
    {
      id: 'ta-3',
      namaTempat: 'Cagar Alam & Green Canyon Pangandaran',
      lokasi: 'Kawasan Wisata Alam & Sungai Cijulang',
      kapasitas: 400,
      kegiatan: 'Eksplorasi Wisata Alam, Body Rafting, Edukasi Hayati & Foto Bersama',
      keterangan: 'Dilengkapi pelampung keselamatan & pemandu lokal bersertifikat',
    },
    {
      id: 'ta-4',
      namaTempat: 'Ballroom Hotel Laut Biru Pangandaran',
      lokasi: 'Lt. 2 Hotel Laut Biru Resort Pangandaran',
      kapasitas: 450,
      kegiatan: 'Seremoni Pembukaan, Rapat Pleno Yayasan & Indoor Gathering Cadangan',
      keterangan: 'Ruangan indoor full AC berkapasitas 450 orang dengan proyektor LED & audio',
    },
  ];

  const initialPeserta: Peserta[] = [
    {
      id: 'pst-1',
      nomorAgenda: 'REG-PNG-2026-0001',
      namaLengkap: 'Ir. Danang Prasetyo, M.T.',
      nikNip: '198204152008121002',
      jenisKelamin: 'Laki-laki',
      unitKerjaId: 'uk-3',
      unitKerjaNama: 'Divisi Teknologi Informasi',
      jabatanId: 'jb-1',
      jabatanNama: 'Kepala Divisi',
      noHpWa: '081234567890',
      email: 'danang.prasetyo@company.id',
      ukuranKaosId: 'ks-3',
      ukuranKaosNama: 'L',
      bisId: 'bis-2',
      bisNama: 'Executive Barakuda (Full AC + Karaoke)',
      hotelId: 'htl-1',
      hotelNama: 'Hotel Laut Biru Pangandaran (Pantai Barat)',
      noKamar: '201',
      tipeKamar: 'Deluxe',
      tempatMakanId: 'tm-1',
      tempatMakanNama: 'Resto Seafood Karya Bahari 3 (Pantai Timur)',
      sesiMakan: 'Makan Malam Seafood Gala Dinner Hari 1',
      tempatAcaraId: 'ta-1',
      tempatAcaraNama: 'Panggung Utama Pantai Timur Pangandaran',
      tempatAcara: 'Panggung Utama Pantai Timur Pangandaran',
      catatanKhusus: 'Tidak makan kerang/alergi seafood kerang',
      riwayatPenyakit: 'Alergi dingin ringan',
      keluarga: [
        {
          id: 'fam-1',
          nama: 'Siti Rahmawati',
          hubungan: 'Istri',
          kategoriUsia: 'Dewasa',
          ukuranKaosId: 'ks-2',
          ukuranKaosNama: 'M',
          catatan: 'Pendamping',
        },
        {
          id: 'fam-2',
          nama: 'Farhan Dwi Prasetyo',
          hubungan: 'Anak 1',
          kategoriUsia: 'Anak-anak',
          ukuranKaosId: '',
          ukuranKaosNama: 'Tanpa Kaos',
          catatan: 'Usia 7 tahun',
        },
      ],
      dokumen: [
        {
          id: 'doc-1',
          namaFile: 'KTP_Danang_Prasetyo.pdf',
          tipe: 'application/pdf',
          ukuranBytes: 245000,
          driveFileId: '1DRIVE_DEMO_KTP_001',
          driveViewUrl: 'https://drive.google.com/file/d/demo_ktp_001/view',
          uploadedAt: '2026-08-20T08:30:00.000Z',
        },
      ],
      status: 'DITERIMA',
      createdAt: '2026-08-20T08:30:00.000Z',
      updatedAt: '2026-08-20T08:30:00.000Z',
    },
    {
      id: 'pst-2',
      nomorAgenda: 'REG-PNG-2026-0002',
      namaLengkap: 'Anisa Nuraini, S.E., M.Ak.',
      nikNip: '198907122014022003',
      jenisKelamin: 'Perempuan',
      unitKerjaId: 'uk-2',
      unitKerjaNama: 'Divisi Keuangan & Akuntansi',
      jabatanId: 'jb-2',
      jabatanNama: 'Manajer / Sub-Koordinator',
      noHpWa: '081298765432',
      email: 'anisa.nuraini@company.id',
      ukuranKaosId: 'ks-2',
      ukuranKaosNama: 'M',
      bisId: 'bis-2',
      bisNama: 'Executive Barakuda (Full AC + Karaoke)',
      hotelId: 'htl-1',
      hotelNama: 'Hotel Laut Biru Pangandaran (Pantai Barat)',
      noKamar: '205',
      tipeKamar: 'Family Suite',
      tempatMakanId: 'tm-1',
      tempatMakanNama: 'Resto Seafood Karya Bahari 3 (Pantai Timur)',
      sesiMakan: 'Makan Malam Seafood Gala Dinner Hari 1',
      tempatAcaraId: 'ta-1',
      tempatAcaraNama: 'Panggung Utama Pantai Timur Pangandaran',
      tempatAcara: 'Panggung Utama Pantai Timur Pangandaran',
      catatanKhusus: 'Vegetarian friendly jika ada',
      riwayatPenyakit: 'Tidak ada',
      keluarga: [
        {
          id: 'fam-3',
          nama: 'Bambang Triyono',
          hubungan: 'Suami',
          kategoriUsia: 'Dewasa',
          ukuranKaosId: 'ks-4',
          ukuranKaosNama: 'XL',
          catatan: 'Pendamping',
        },
      ],
      dokumen: [
        {
          id: 'doc-2',
          namaFile: 'Identitas_Anisa_Keuangan.png',
          tipe: 'image/png',
          ukuranBytes: 520000,
          driveFileId: '1DRIVE_DEMO_IMG_002',
          driveViewUrl: 'https://drive.google.com/file/d/demo_id_002/view',
          uploadedAt: '2026-08-21T09:15:00.000Z',
        },
      ],
      status: 'DITERIMA',
      createdAt: '2026-08-21T09:15:00.000Z',
      updatedAt: '2026-08-21T09:15:00.000Z',
    },
    {
      id: 'pst-3',
      nomorAgenda: 'REG-PNG-2026-0003',
      namaLengkap: 'Rahmat Hidayatullah, S.Kom.',
      nikNip: '199511032020121004',
      jenisKelamin: 'Laki-laki',
      unitKerjaId: 'uk-3',
      unitKerjaNama: 'Divisi Teknologi Informasi',
      jabatanId: 'jb-4',
      jabatanNama: 'Staff Pelaksana Senior',
      noHpWa: '081377889900',
      email: 'rahmat.hidayat@company.id',
      ukuranKaosId: 'ks-4',
      ukuranKaosNama: 'XL',
      bisId: 'bis-1',
      bisNama: 'Executive Arwana (Full AC + Audio)',
      hotelId: 'htl-2',
      hotelNama: 'The Allure Villas Managed by Sahid',
      noKamar: 'Villa-A1',
      tipeKamar: 'Deluxe',
      tempatMakanId: 'tm-2',
      tempatMakanNama: 'Kampung Turis Pangandaran Beachfront',
      sesiMakan: 'Makan Malam Sunset Gathering Hari 2',
      tempatAcaraId: 'ta-2',
      tempatAcaraNama: 'Pantai Barat Pangandaran (Fun Outbound Area)',
      tempatAcara: 'Pantai Barat Pangandaran (Fun Outbound Area)',
      catatanKhusus: 'Membawa perlengkapan dokumentasi & drone',
      keluarga: [],
      dokumen: [],
      status: 'DITERIMA',
      createdAt: '2026-08-22T10:00:00.000Z',
      updatedAt: '2026-08-22T10:00:00.000Z',
    },
  ];

  const logs: AktivitasLog[] = [
    {
      id: 'log-1',
      timestamp: new Date().toISOString(),
      adminUser: 'SYSTEM',
      aksi: 'INISIALISASI_SISTEM',
      kategori: 'SISTEM',
      rincian: 'Sistem Registrasi Rekreasi Pangandaran 2026 berhasil diinisialisasi.',
      ipAddress: '127.0.0.1',
    },
    {
      id: 'log-2',
      timestamp: new Date().toISOString(),
      adminUser: 'SuperAdmin',
      aksi: 'LOGIN_ADMIN',
      kategori: 'AUTH',
      rincian: 'Admin master berhasil masuk ke sistem manajemen.',
      ipAddress: '127.0.0.1',
    },
  ];

  return {
    peserta: initialPeserta,
    unitKerja,
    jabatan,
    kaos,
    bis,
    hotel,
    tempatMakan,
    tempatAcara,
    logs,
    driveConfig: {
      folderId: '10K_PANGANDARAN_2026_DRIVE_BACKUP',
      folderName: 'Gathering Pangandaran 2026 - Berkas & Dokumen',
      backupEnabled: true,
      lastBackupTime: new Date().toISOString(),
      driveEmail: 'gathering.pangandaran2026@gmail.com',
      syncedFilesCount: 4,
    },
    agendaCounter: 3,
    adminUsers: [
      {
        id: 'usr-admin-1',
        username: 'admin',
        nama: 'Administrator Utama',
        role: 'ADMIN',
        salt: defaultSalt,
        passwordHash: defaultPasswordHash,
        createdAt: '2026-08-01T00:00:00.000Z',
      },
    ],
  };
}

const cleanKaosText = (val: any): string => {
  if (!val || typeof val !== 'string') return '';
  return val.replace(/\s*Dewasa/gi, '').trim();
};

function deduplicateMaster<T extends { id: string }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  const map = new Map<string, T>();
  for (const item of items) {
    if (item && item.id && !map.has(item.id)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

// ----------------------------------------------------
// Database Engine (JSON NoSQL with Atomic LockService)
// ----------------------------------------------------
class DatabaseEngine {
  private db: DatabaseSchema;
  private isWriting = false;
  private lockQueue: (() => void)[] = [];

  constructor() {
    this.db = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed: DatabaseSchema = JSON.parse(raw);
        parsed.unitKerja = deduplicateMaster(parsed.unitKerja);
        parsed.jabatan = deduplicateMaster(parsed.jabatan);
        parsed.kaos = deduplicateMaster(parsed.kaos).map((k) => ({
          ...k,
          ukuran: cleanKaosText(k.ukuran),
          kategori: (k.kategori && k.kategori.toLowerCase() === 'dewasa') ? 'Standar' : (k.kategori || 'Standar'),
        }));
        parsed.bis = deduplicateMaster(parsed.bis);
        parsed.hotel = deduplicateMaster(parsed.hotel);
        parsed.tempatMakan = deduplicateMaster(parsed.tempatMakan);
        const initAcara = getInitialDatabase().tempatAcara;
        parsed.tempatAcara = Array.isArray(parsed.tempatAcara) && parsed.tempatAcara.length > 0
          ? deduplicateMaster(parsed.tempatAcara)
          : initAcara;
        if (Array.isArray(parsed.peserta)) {
          const defaultAcara = (parsed.tempatAcara && parsed.tempatAcara[0]) || initAcara[0];
          parsed.peserta.forEach((p) => {
            if (p.ukuranKaosNama) p.ukuranKaosNama = cleanKaosText(p.ukuranKaosNama);
            if (!p.tempatAcaraId) p.tempatAcaraId = defaultAcara.id;
            if (!p.tempatAcaraNama) p.tempatAcaraNama = defaultAcara.namaTempat;
            if (!p.tempatAcara) p.tempatAcara = p.tempatAcaraNama;
            if (Array.isArray(p.keluarga)) {
              p.keluarga.forEach((f) => {
                if (f.ukuranKaosNama) f.ukuranKaosNama = cleanKaosText(f.ukuranKaosNama);
              });
            }
          });
        }
        this.saveDatabaseSync(parsed);
        return parsed;
      }
    } catch (e) {
      console.error('Error loading DB, creating default:', e);
    }
    const initial = getInitialDatabase();
    this.saveDatabaseSync(initial);
    return initial;
  }

  private saveDatabaseSync(data: DatabaseSchema) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  public async acquireLock(): Promise<() => void> {
    return new Promise((resolve) => {
      const execute = () => {
        this.isWriting = true;
        resolve(() => {
          this.isWriting = false;
          if (this.lockQueue.length > 0) {
            const next = this.lockQueue.shift();
            if (next) next();
          }
        });
      };

      if (!this.isWriting) {
        execute();
      } else {
        this.lockQueue.push(execute);
      }
    });
  }

  public getRead(): DatabaseSchema {
    return this.db;
  }

  public async getNextAgendaNumber(): Promise<string> {
    const unlock = await this.acquireLock();
    try {
      this.db.agendaCounter = (this.db.agendaCounter || 0) + 1;
      const counterStr = String(this.db.agendaCounter).padStart(4, '0');
      const agendaNo = `REG-PNG-2026-${counterStr}`;
      this.saveDatabaseSync(this.db);
      return agendaNo;
    } finally {
      unlock();
    }
  }

  public async mutate<T>(mutationFn: (db: DatabaseSchema) => T): Promise<T> {
    const unlock = await this.acquireLock();
    try {
      const result = mutationFn(this.db);
      this.saveDatabaseSync(this.db);
      return result;
    } finally {
      unlock();
    }
  }

  public logActivity(log: Omit<AktivitasLog, 'id' | 'timestamp'>) {
    const newLog: AktivitasLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      ...log,
    };
    this.db.logs.unshift(newLog);
    if (this.db.logs.length > 500) {
      this.db.logs = this.db.logs.slice(0, 500);
    }
    this.saveDatabaseSync(this.db);
  }
}

const dbEngine = new DatabaseEngine();

// ----------------------------------------------------
// Express Server Setup
// ----------------------------------------------------
async function startServer() {
  const app = express();

  // Middleware: JSON with 10MB limit for base64 file payloads
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Serve static assets from public folder directly (favicon, etc.)
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Global XSS Sanitization Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeInput(req.body);
    }
    next();
  });

  // --------------------------------------------------
  // Public API Endpoints
  // --------------------------------------------------
  app.get('/api/public/master', (req: Request, res: Response) => {
    const db = dbEngine.getRead();
    // Calculate next sequence for Nomor Peserta (e.g. NP-2026-0004)
    const existingNumbers = (db.peserta || []).map(p => {
      const match = p.nikNip?.match(/NP-2026-(\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxNum = existingNumbers.length > 0 ? Math.max(0, ...existingNumbers) : 0;
    const nextNum = Math.max(maxNum + 1, (db.peserta || []).length + 1);
    const nextNomorPeserta = `NP-2026-${String(nextNum).padStart(4, '0')}`;

    const regStart = new Date('2026-08-09T00:00:00+07:00').getTime();
    const regEnd = new Date('2026-09-20T23:59:59+07:00').getTime();
    const now = Date.now();
    const isRegistrationClosed = now > regEnd;
    const isRegistrationUpcoming = now < regStart;

    res.json({
      nextNomorPeserta,
      unitKerja: deduplicateMaster(db.unitKerja),
      jabatan: deduplicateMaster(db.jabatan),
      kaos: deduplicateMaster(db.kaos),
      bis: deduplicateMaster(db.bis),
      hotel: deduplicateMaster(db.hotel),
      tempatMakan: deduplicateMaster(db.tempatMakan),
      tempatAcara: deduplicateMaster(db.tempatAcara || []),
      registrationPeriod: {
        startDate: '2026-08-09T00:00:00+07:00',
        endDate: '2026-09-20T23:59:59+07:00',
        startDateStr: '9 Agustus 2026',
        endDateStr: '20 September 2026',
        isClosed: isRegistrationClosed,
        isUpcoming: isRegistrationUpcoming,
      },
    });
  });

  // Participant Registration with LockService Agenda Number
  app.post('/api/public/register', async (req: Request, res: Response) => {
    try {
      // Cek Masa Pendaftaran: 9 Agustus 2026 - 20 September 2026 (WIB / UTC+7)
      const REGISTRATION_START = new Date('2026-08-09T00:00:00+07:00').getTime();
      const REGISTRATION_END = new Date('2026-09-20T23:59:59+07:00').getTime();
      const now = Date.now();
      if (now > REGISTRATION_END) {
        return res.status(400).json({ 
          error: 'Pendaftaran Sudah Ditutup. Batas akhir pendaftaran peserta (20 September 2026) telah berakhir.' 
        });
      }
      if (now < REGISTRATION_START) {
        return res.status(400).json({ 
          error: 'Pendaftaran Belum Dibuka. Periode pendaftaran dimulai pada 9 Agustus 2026.' 
        });
      }

      const data = req.body;

      // Server-side validation
      if (!data.namaLengkap || data.namaLengkap.trim().length < 3) {
        return res.status(400).json({ error: 'Nama lengkap wajib diisi minimal 3 karakter' });
      }

      // Check upload size limit (5MB per document)
      if (Array.isArray(data.dokumen)) {
        for (const doc of data.dokumen) {
          if (doc.ukuranBytes && doc.ukuranBytes > 5 * 1024 * 1024) {
            return res.status(400).json({ error: `File ${doc.namaFile || ''} melebihi batas maksimal 5 MB` });
          }
        }
      }

      // Automatic Nomor Peserta if not provided
      let nikNip = (data.nikNip || '').trim();
      if (!nikNip) {
        const existingNumbers = (dbEngine.getRead().peserta || []).map(p => {
          const match = p.nikNip?.match(/NP-2026-(\d+)/i);
          return match ? parseInt(match[1], 10) : 0;
        });
        const maxNum = existingNumbers.length > 0 ? Math.max(0, ...existingNumbers) : 0;
        const nextNum = Math.max(maxNum + 1, (dbEngine.getRead().peserta || []).length + 1);
        nikNip = `NP-2026-${String(nextNum).padStart(4, '0')}`;
      }

      // Atomic lock for Agenda Number
      const nomorAgenda = await dbEngine.getNextAgendaNumber();

      const newPeserta: Peserta = {
        id: 'pst-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        nomorAgenda,
        namaLengkap: data.namaLengkap.trim(),
        nikNip,
        jenisKelamin: data.jenisKelamin || 'Laki-laki',
        statusPernikahan: data.statusPernikahan || 'Menikah',
        unitKerjaId: data.unitKerjaId || '',
        unitKerjaNama: (data.unitKerjaNama || '').replace(/\s*\([^)]*\)/g, '').trim(),
        jabatanId: data.jabatanId || '',
        jabatanNama: (data.jabatanNama || '').replace(/\s*\([^)]*\)/g, '').trim(),
        noHpWa: data.noHpWa ? data.noHpWa.trim() : '',
        email: data.email || '',
        ukuranKaosId: data.ukuranKaosId || '',
        ukuranKaosNama: data.ukuranKaosNama || '',
        bisId: data.bisId || '',
        bisNama: data.bisNama || '',
        hotelId: data.hotelId || '',
        hotelNama: data.hotelNama || '',
        noKamar: data.noKamar || '',
        lantaiHotel: data.lantaiHotel || (data.noKamar && data.noKamar.length >= 3 ? data.noKamar.charAt(0) : '1'),
        tipeKamar: data.tipeKamar || '',
        tempatMakanId: data.tempatMakanId || '',
        tempatMakanNama: data.tempatMakanNama || '',
        sesiMakan: data.sesiMakan || '',
        tempatAcaraId: data.tempatAcaraId || (dbEngine.getRead().tempatAcara && dbEngine.getRead().tempatAcara[0]?.id) || '',
        tempatAcaraNama: data.tempatAcaraNama || (dbEngine.getRead().tempatAcara && dbEngine.getRead().tempatAcara.find((a: any) => a.id === data.tempatAcaraId)?.namaTempat) || '',
        tempatAcara: data.tempatAcaraNama || data.tempatAcara || '',
        catatanKhusus: data.catatanKhusus || '',
        riwayatPenyakit: data.riwayatPenyakit || '',
        keluarga: Array.isArray(data.keluarga)
          ? data.keluarga.map((k: any) => {
              const isSpouse = k.hubungan === 'Suami' || k.hubungan === 'Istri' || (k.hubungan && (k.hubungan.toLowerCase() === 'suami' || k.hubungan.toLowerCase() === 'istri'));
              return {
                id: k.id || 'fam-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
                nama: k.nama || '',
                hubungan: k.hubungan || 'Lainnya',
                kategoriUsia: k.kategoriUsia || 'Dewasa',
                ukuranKaosId: isSpouse ? (k.ukuranKaosId || '') : '',
                ukuranKaosNama: isSpouse ? (k.ukuranKaosNama || '-') : 'Tanpa Kaos',
                catatan: k.catatan || '',
              };
            })
          : [],
        dokumen: Array.isArray(data.dokumen)
          ? data.dokumen.map((d: any) => ({
              id: d.id || 'doc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
              namaFile: d.namaFile || 'lampiran.pdf',
              tipe: d.tipe || 'application/pdf',
              ukuranBytes: d.ukuranBytes || 0,
              base64Data: d.base64Data || undefined,
              driveFileId: 'DRV-' + Math.random().toString(36).substring(2, 10),
              driveViewUrl: 'https://drive.google.com/file/d/' + Math.random().toString(36).substring(2, 12),
              uploadedAt: new Date().toISOString(),
            }))
          : [],
        status: 'DITERIMA',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dbEngine.mutate((db) => {
        db.peserta.push(newPeserta);
        db.driveConfig.syncedFilesCount += newPeserta.dokumen.length;
      });

      dbEngine.logActivity({
        adminUser: 'PESERTA_MANDIRI',
        aksi: 'PENDAFTARAN_BARU',
        kategori: 'PESERTA',
        rincian: `Pendaftaran berhasil untuk ${newPeserta.namaLengkap} (${newPeserta.nomorAgenda}) bersama ${newPeserta.keluarga.length} anggota keluarga.`,
        nomorAgendaTerkait: newPeserta.nomorAgenda,
        ipAddress: req.ip || '127.0.0.1',
      });

      res.json({ success: true, peserta: newPeserta });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Gagal memproses pendaftaran: ' + err.message });
    }
  });

  // Helper to normalize WhatsApp phone numbers into canonical '8xxxxxxxxxx' format
  const normalizeWaNumber = (phone: string): string => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('628')) return digits.slice(2);
    if (digits.startsWith('08')) return digits.slice(1);
    if (digits.startsWith('8')) return digits;
    return digits;
  };

  // Participant Status Check strictly by Registered WhatsApp Number (or exact Agenda Number)
  app.get('/api/public/check-status/:query', (req: Request, res: Response) => {
    const rawQuery = req.params.query ? req.params.query.trim() : '';
    const queryNormalizedWa = normalizeWaNumber(rawQuery);
    const queryLower = rawQuery.toLowerCase();

    const db = dbEngine.getRead();
    const found = db.peserta.filter((p) => {
      // 1. Strict exact match by registered WhatsApp number (normalized)
      if (queryNormalizedWa && queryNormalizedWa.length >= 8) {
        const pNormalizedWa = normalizeWaNumber(p.noHpWa || '');
        if (pNormalizedWa === queryNormalizedWa) {
          return true;
        }
      }

      // 2. Strict exact match by Nomor Agenda only (e.g. REG-PGII-2026-0001)
      if (p.nomorAgenda && p.nomorAgenda.toLowerCase() === queryLower) {
        return true;
      }

      return false;
    });

    if (found.length === 0) {
      return res.status(404).json({
        error: 'Nomor WhatsApp tidak ditemukan. Pastikan Nomor WhatsApp yang dimasukkan sesuai dengan nomor yang Anda daftarkan.',
      });
    }

    const hasil = found.map((p) => {
      const matchedBis = db.bis.find((b) => b.id === p.bisId || b.namaBis === p.bisNama || (p.bisNama && (p.bisNama.includes(b.nomorBis) || p.bisNama.includes(b.namaBis))));
      const matchedHotel = db.hotel.find((h) => h.id === p.hotelId || h.namaHotel === p.hotelNama || (p.hotelNama && p.hotelNama.toLowerCase().includes(h.namaHotel.toLowerCase())));
      return {
        ...p,
        namaSupir: p.namaSupir || matchedBis?.namaSupir || 'Pak Supir',
        noHpSopir: p.noHpSopir || matchedBis?.noHpSopir || '-',
        tourLeader: p.tourLeader || matchedBis?.namaKoordinator || 'Tour Leader',
        noHpTourLeader: p.noHpTourLeader || matchedBis?.kontakKoordinator || '081234567890',
        noHpHotel: p.noHpHotel || matchedHotel?.kontakHotel || '(0265) 639001',
      };
    });

    res.json({ success: true, hasil });
  });

  // --------------------------------------------------
  // Authentication Endpoints (SHA-256 + Salt)
  // --------------------------------------------------
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan kata sandi wajib diisi' });
    }

    const db = dbEngine.getRead();
    const user = db.adminUsers.find((u) => u.username.toLowerCase() === username.toLowerCase());

    if (!user) {
      dbEngine.logActivity({
        adminUser: username,
        aksi: 'LOGIN_GAGAL',
        kategori: 'AUTH',
        rincian: `Percobaan login gagal dengan username "${username}"`,
        ipAddress: req.ip || '127.0.0.1',
      });
      return res.status(401).json({ error: 'Username atau kata sandi tidak sesuai' });
    }

    const computedHash = hashPassword(password, user.salt);
    if (computedHash !== user.passwordHash) {
      dbEngine.logActivity({
        adminUser: username,
        aksi: 'LOGIN_GAGAL',
        kategori: 'AUTH',
        rincian: `Kata sandi salah untuk user "${username}"`,
        ipAddress: req.ip || '127.0.0.1',
      });
      return res.status(401).json({ error: 'Username atau kata sandi tidak sesuai' });
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    await dbEngine.mutate((d) => {
      const idx = d.adminUsers.findIndex((u) => u.id === user.id);
      if (idx !== -1) d.adminUsers[idx].lastLogin = user.lastLogin;
    });

    dbEngine.logActivity({
      adminUser: user.username,
      aksi: 'LOGIN_BERHASIL',
      kategori: 'AUTH',
      rincian: `Admin ${user.nama} (${user.role}) berhasil masuk ke sistem.`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        nama: user.nama,
        role: user.role,
        lastLogin: user.lastLogin,
      },
      token: 'tok_' + crypto.randomBytes(24).toString('hex'),
    });
  });

  // --------------------------------------------------
  // Admin Auth: Ubah Kata Sandi Admin
  // --------------------------------------------------
  app.post('/api/admin/change-password', async (req: Request, res: Response) => {
    try {
      const { oldPassword, newPassword, confirmPassword, username: reqUsername } = req.body;
      const currentUsername = (req.headers['x-admin-user'] as string) || reqUsername || 'admin';

      if (!oldPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: 'Kata sandi lama, kata sandi baru, dan konfirmasi kata sandi wajib diisi.' });
      }

      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({ error: 'Kata sandi baru minimal harus 6 karakter.' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'Konfirmasi kata sandi baru tidak cocok.' });
      }

      if (oldPassword === newPassword) {
        return res.status(400).json({ error: 'Kata sandi baru tidak boleh sama dengan kata sandi lama.' });
      }

      const db = dbEngine.getRead();
      const user = db.adminUsers.find((u) => u.username.toLowerCase() === currentUsername.toLowerCase())
        || db.adminUsers[0];

      if (!user) {
        return res.status(404).json({ error: 'Pengguna akun admin tidak ditemukan.' });
      }

      // Verifikasi kata sandi lama
      const oldComputedHash = hashPassword(oldPassword, user.salt);
      if (oldComputedHash !== user.passwordHash) {
        dbEngine.logActivity({
          adminUser: user.username,
          aksi: 'UBAH_PASSWORD_GAGAL',
          kategori: 'AUTH',
          rincian: `Gagal memperbarui kata sandi untuk admin "${user.username}": Kata sandi lama salah.`,
          ipAddress: req.ip || '127.0.0.1',
        });
        return res.status(401).json({ error: 'Kata sandi lama yang Anda masukkan salah.' });
      }

      // Buat salt baru dan hash kata sandi baru
      const newSalt = generateSalt();
      const newHash = hashPassword(newPassword, newSalt);

      await dbEngine.mutate((d) => {
        const idx = d.adminUsers.findIndex((u) => u.id === user.id);
        if (idx !== -1) {
          d.adminUsers[idx].salt = newSalt;
          d.adminUsers[idx].passwordHash = newHash;
        }
      });

      dbEngine.logActivity({
        adminUser: user.username,
        aksi: 'UBAH_PASSWORD_BERHASIL',
        kategori: 'AUTH',
        rincian: `Admin ${user.nama} (@${user.username}) berhasil memperbarui kata sandi akunnya.`,
        ipAddress: req.ip || '127.0.0.1',
      });

      res.json({
        success: true,
        message: 'Kata sandi admin berhasil diperbarui! Silakan gunakan kata sandi baru untuk login berikutnya.',
      });
    } catch (err: any) {
      console.error('Error in change-password endpoint:', err);
      res.status(500).json({ error: 'Terjadi kesalahan internal saat memperbarui kata sandi.' });
    }
  });

  // --------------------------------------------------
  // Admin Dashboard & Overview
  // --------------------------------------------------
  app.get('/api/admin/dashboard', (req: Request, res: Response) => {
    const db = dbEngine.getRead();
    const totalPeserta = db.peserta.length;
    let totalKeluarga = 0;
    const distribusiKaos: Record<string, number> = {};
    const distribusiBis: Record<string, number> = {};
    const distribusiHotel: Record<string, number> = {};
    const distribusiUnit: Record<string, number> = {};
    const distribusiJabatan: Record<string, number> = {};
    const distribusiTempatMakan: Record<string, number> = {};
    const distribusiTempatAcara: Record<string, number> = {};

    let pesertaLakiLaki = 0;
    let pesertaPerempuan = 0;
    let statusDiterima = 0;
    let statusMenunggu = 0;
    let statusDibatalkan = 0;
    let keluargaDewasa = 0;
    let keluargaAnak = 0;
    let keluargaBalita = 0;

    db.peserta.forEach((p) => {
      totalKeluarga += p.keluarga.length;

      if (p.jenisKelamin === 'Laki-laki') pesertaLakiLaki++;
      else if (p.jenisKelamin === 'Perempuan') pesertaPerempuan++;

      if (p.status === 'DITERIMA') statusDiterima++;
      else if (p.status === 'MENUNGGU_VERIFIKASI') statusMenunggu++;
      else if (p.status === 'DIBATALKAN') statusDibatalkan++;

      // Kaos peserta (hanya peserta/pegawai ybs)
      if (p.ukuranKaosNama && p.ukuranKaosNama !== '-' && !p.ukuranKaosNama.toLowerCase().includes('tanpa')) {
        distribusiKaos[p.ukuranKaosNama] = (distribusiKaos[p.ukuranKaosNama] || 0) + 1;
      }
      // Kaos keluarga (hanya suami / istri) & demografi keluarga
      p.keluarga.forEach((k) => {
        const isSpouse = k.hubungan === 'Suami' || k.hubungan === 'Istri' || (k.hubungan && (k.hubungan.toLowerCase() === 'suami' || k.hubungan.toLowerCase() === 'istri'));
        if (isSpouse && k.ukuranKaosNama && k.ukuranKaosNama !== '-' && !k.ukuranKaosNama.toLowerCase().includes('tanpa')) {
          distribusiKaos[k.ukuranKaosNama] = (distribusiKaos[k.ukuranKaosNama] || 0) + 1;
        }
        if (k.kategoriUsia === 'Dewasa') keluargaDewasa++;
        else if (k.kategoriUsia === 'Anak-anak') keluargaAnak++;
        else if (k.kategoriUsia === 'Balita') keluargaBalita++;
      });

      // Bis (peserta + keluarga naik bis yang sama)
      const totalRombongan = 1 + p.keluarga.length;
      if (p.bisNama) {
        distribusiBis[p.bisNama] = (distribusiBis[p.bisNama] || 0) + totalRombongan;
      }
      // Hotel
      if (p.hotelNama) {
        distribusiHotel[p.hotelNama] = (distribusiHotel[p.hotelNama] || 0) + totalRombongan;
      }
      // Unit
      if (p.unitKerjaNama) {
        distribusiUnit[p.unitKerjaNama] = (distribusiUnit[p.unitKerjaNama] || 0) + 1;
      }
      // Jabatan
      if (p.jabatanNama) {
        distribusiJabatan[p.jabatanNama] = (distribusiJabatan[p.jabatanNama] || 0) + 1;
      }
      // Makan
      if (p.tempatMakanNama) {
        distribusiTempatMakan[p.tempatMakanNama] = (distribusiTempatMakan[p.tempatMakanNama] || 0) + totalRombongan;
      }
      // Tempat Acara setelah Tempat Makan
      if (p.tempatAcaraNama) {
        distribusiTempatAcara[p.tempatAcaraNama] = (distribusiTempatAcara[p.tempatAcaraNama] || 0) + totalRombongan;
      }
    });

    const totalOrang = totalPeserta + totalKeluarga;

    // Detailed Kaos Quota Analytics (Hanya Peserta + Suami/Istri)
    let totalKuotaKaos = 0;
    let totalKaosTerpakai = 0;
    const normalizeKaos = (str: string) => str.trim().toUpperCase().replace(/\s*DEWASA$/, '').trim();
    const kaosItems = (db.kaos || []).map((ks) => {
      const kuotaTotal = ks.kuotaTotal || 0;
      totalKuotaKaos += kuotaTotal;
      const ksNorm = normalizeKaos(ks.ukuran);
      let terpakai = 0;
      Object.entries(distribusiKaos).forEach(([name, count]) => {
        if (name === ks.ukuran || normalizeKaos(name) === ksNorm) {
          terpakai += count;
        }
      });
      totalKaosTerpakai += terpakai;
      const sisa = Math.max(0, kuotaTotal - terpakai);
      const persentase = kuotaTotal > 0 ? Math.round((terpakai / kuotaTotal) * 100) : 0;
      const status: 'AMAN' | 'MENIPIS' | 'HABIS' = sisa === 0 ? 'HABIS' : sisa <= 15 ? 'MENIPIS' : 'AMAN';
      return {
        id: ks.id,
        ukuran: ks.ukuran,
        kategori: ks.kategori,
        kuotaTotal,
        terpakai,
        sisa,
        persentase,
        status,
      };
    });

    const kaosSummary = {
      totalKuota: totalKuotaKaos,
      totalTerpakai: totalKaosTerpakai,
      totalSisa: Math.max(0, totalKuotaKaos - totalKaosTerpakai),
      persentaseTerpakai: totalKuotaKaos > 0 ? Math.round((totalKaosTerpakai / totalKuotaKaos) * 100) : 0,
      items: kaosItems,
    };

    // Detailed Hotel Allocation Analytics
    let totalKamarCount = 0;
    let totalKamarTerisiCount = 0;
    let totalKapasitasTamuCount = 0;
    let totalTamuTerisiCount = 0;

    const hotelItems = (db.hotel || []).map((htl) => {
      const daftarKamar = htl.daftarKamar || [];
      const totalKamar = daftarKamar.length;
      const kapasitasTamu = daftarKamar.reduce((acc, k) => acc + (k.kapasitas || 2), 0);
      totalKamarCount += totalKamar;
      totalKapasitasTamuCount += kapasitasTamu;

      const pesertaInHotel = db.peserta.filter(
        (p) => p.hotelId === htl.id || p.hotelNama?.toLowerCase() === htl.namaHotel?.toLowerCase()
      );

      // Kamar terisi (dihitung dari nomor kamar unik yang dialokasikan)
      const occupiedRooms = new Set<string>();
      pesertaInHotel.forEach((p) => {
        if (p.noKamar && p.noKamar.trim() !== '' && p.noKamar !== '-') {
          occupiedRooms.add(p.noKamar.trim().toLowerCase());
        }
      });

      const kamarTerisi = occupiedRooms.size;
      const kamarKosong = Math.max(0, totalKamar - kamarTerisi);
      const tamuTerisi = pesertaInHotel.reduce((acc, p) => acc + 1 + p.keluarga.length, 0);
      const sisaKapasitasTamu = Math.max(0, kapasitasTamu - tamuTerisi);

      totalKamarTerisiCount += kamarTerisi;
      totalTamuTerisiCount += tamuTerisi;

      const persentaseKamar = totalKamar > 0 ? Math.round((kamarTerisi / totalKamar) * 100) : 0;
      const persentaseTamu = kapasitasTamu > 0 ? Math.round((tamuTerisi / kapasitasTamu) * 100) : 0;

      return {
        id: htl.id,
        namaHotel: htl.namaHotel,
        lokasi: htl.lokasi,
        totalKamar,
        kamarTerisi,
        kamarKosong,
        kapasitasTamu,
        tamuTerisi,
        sisaKapasitasTamu,
        persentaseKamar,
        persentaseTamu,
      };
    });

    const hotelSummary = {
      totalKamar: totalKamarCount,
      totalKamarTerisi: totalKamarTerisiCount,
      totalKamarKosong: Math.max(0, totalKamarCount - totalKamarTerisiCount),
      totalKapasitasTamu: totalKapasitasTamuCount,
      totalTamuTerisi: totalTamuTerisiCount,
      totalSisaKapasitasTamu: Math.max(0, totalKapasitasTamuCount - totalTamuTerisiCount),
      persentaseOkupansiKamar: totalKamarCount > 0 ? Math.round((totalKamarTerisiCount / totalKamarCount) * 100) : 0,
      persentaseOkupansiTamu: totalKapasitasTamuCount > 0 ? Math.round((totalTamuTerisiCount / totalKapasitasTamuCount) * 100) : 0,
      items: hotelItems,
    };

    // Detailed Bis Allocation Analytics
    let totalKapasitasBis = 0;
    let totalBisTerisi = 0;

    const bisItems = (db.bis || []).map((b) => {
      const kapasitas = b.kapasitas || 48;
      totalKapasitasBis += kapasitas;

      const pesertaInBis = db.peserta.filter(
        (p) => p.bisId === b.id || p.bisNama?.toLowerCase().includes(b.nomorBis.toLowerCase()) || p.bisNama?.toLowerCase() === b.namaBis.toLowerCase()
      );
      const terisi = pesertaInBis.reduce((acc, p) => acc + 1 + p.keluarga.length, 0);
      totalBisTerisi += terisi;
      const sisa = Math.max(0, kapasitas - terisi);
      const persentase = kapasitas > 0 ? Math.round((terisi / kapasitas) * 100) : 0;
      const status: 'TERSEDIA' | 'HAMPIR_PENUH' | 'PENUH' = sisa === 0 ? 'PENUH' : sisa <= 6 ? 'HAMPIR_PENUH' : 'TERSEDIA';

      return {
        id: b.id,
        nomorBis: b.nomorBis,
        namaBis: b.namaBis,
        kapasitas,
        terisi,
        sisa,
        persentase,
        status,
      };
    });

    const bisSummary = {
      totalArmada: db.bis.length,
      totalKapasitas: totalKapasitasBis,
      totalTerisi: totalBisTerisi,
      totalSisaKursi: Math.max(0, totalKapasitasBis - totalBisTerisi),
      persentaseTerisi: totalKapasitasBis > 0 ? Math.round((totalBisTerisi / totalKapasitasBis) * 100) : 0,
      items: bisItems,
    };

    const demografi = {
      pesertaLakiLaki,
      pesertaPerempuan,
      statusDiterima,
      statusMenunggu,
      statusDibatalkan,
      keluargaDewasa,
      keluargaAnak,
      keluargaBalita,
    };

    res.json({
      totalPeserta,
      totalKeluarga,
      totalOrang,
      distribusiKaos,
      distribusiBis,
      distribusiHotel,
      distribusiUnit,
      distribusiJabatan,
      distribusiTempatMakan,
      distribusiTempatAcara,
      totalBis: db.bis.length,
      totalHotel: db.hotel.length,
      totalUnit: db.unitKerja.length,
      totalTempatMakan: (db.tempatMakan || []).length,
      totalTempatAcara: (db.tempatAcara || []).length,
      recentLogs: db.logs.slice(0, 10),
      driveConfig: db.driveConfig,
      kaosSummary,
      hotelSummary,
      bisSummary,
      demografi,
    });
  });

  // --------------------------------------------------
  // CRUD Peserta & Anggota Keluarga
  // --------------------------------------------------
  app.get('/api/admin/peserta', (req: Request, res: Response) => {
    const db = dbEngine.getRead();
    let result = [...db.peserta];

    const { unit, jabatan, kaos, bis, hotel, kamar, makan, acara, status, statusPernikahan, search } = req.query;

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.namaLengkap.toLowerCase().includes(q) ||
          p.nomorAgenda.toLowerCase().includes(q) ||
          p.nikNip.toLowerCase().includes(q) ||
          p.noHpWa.includes(q) ||
          p.noKamar.toLowerCase().includes(q)
      );
    }
    if (unit && typeof unit === 'string') {
      result = result.filter((p) => p.unitKerjaId === unit || p.unitKerjaNama.includes(unit));
    }
    if (jabatan && typeof jabatan === 'string') {
      result = result.filter((p) => p.jabatanId === jabatan || p.jabatanNama.includes(jabatan));
    }
    if (kaos && typeof kaos === 'string') {
      result = result.filter((p) => p.ukuranKaosId === kaos || p.ukuranKaosNama.includes(kaos));
    }
    if (bis && typeof bis === 'string') {
      result = result.filter((p) => p.bisId === bis || p.bisNama.includes(bis));
    }
    if (hotel && typeof hotel === 'string') {
      result = result.filter((p) => p.hotelId === hotel || p.hotelNama.includes(hotel));
    }
    if (kamar && typeof kamar === 'string') {
      result = result.filter((p) => p.noKamar.toLowerCase().includes(kamar.toLowerCase()));
    }
    if (makan && typeof makan === 'string') {
      result = result.filter((p) => p.tempatMakanId === makan || p.tempatMakanNama.includes(makan));
    }
    if (acara && typeof acara === 'string') {
      result = result.filter((p) => p.tempatAcaraId === acara || (p.tempatAcaraNama && p.tempatAcaraNama.includes(acara)));
    }
    if (status && typeof status === 'string') {
      result = result.filter((p) => p.status === status);
    }
    if (statusPernikahan && typeof statusPernikahan === 'string') {
      result = result.filter((p) => (p.statusPernikahan || 'Menikah') === statusPernikahan);
    }

    const data = result.map((p) => {
      const matchedBis = db.bis.find((b) => b.id === p.bisId || b.namaBis === p.bisNama || (p.bisNama && (p.bisNama.includes(b.nomorBis) || p.bisNama.includes(b.namaBis))));
      return {
        ...p,
        namaSupir: p.namaSupir || matchedBis?.namaSupir || '-',
        noHpSopir: p.noHpSopir || matchedBis?.noHpSopir || '-',
        tourLeader: p.tourLeader || matchedBis?.namaKoordinator || 'Tour Leader',
        noHpTourLeader: p.noHpTourLeader || matchedBis?.kontakKoordinator || '081234567890',
      };
    });

    res.json({ total: data.length, data });
  });

  app.post('/api/admin/peserta', async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const nomorAgenda = data.nomorAgenda || (await dbEngine.getNextAgendaNumber());

      // Auto-generate Nomor Peserta if not provided
      let nikNip = (data.nikNip || '').trim();
      if (!nikNip) {
        const existingNumbers = (dbEngine.getRead().peserta || []).map(p => {
          const match = p.nikNip?.match(/NP-2026-(\d+)/i);
          return match ? parseInt(match[1], 10) : 0;
        });
        const maxNum = existingNumbers.length > 0 ? Math.max(0, ...existingNumbers) : 0;
        const nextNum = Math.max(maxNum + 1, (dbEngine.getRead().peserta || []).length + 1);
        nikNip = `NP-2026-${String(nextNum).padStart(4, '0')}`;
      }

      const newPeserta: Peserta = {
        id: 'pst-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        nomorAgenda,
        namaLengkap: data.namaLengkap.trim(),
        nikNip,
        jenisKelamin: data.jenisKelamin || 'Laki-laki',
        statusPernikahan: data.statusPernikahan || 'Menikah',
        unitKerjaId: data.unitKerjaId || '',
        unitKerjaNama: (data.unitKerjaNama || '').replace(/\s*\([^)]*\)/g, '').trim(),
        jabatanId: data.jabatanId || '',
        jabatanNama: (data.jabatanNama || '').replace(/\s*\([^)]*\)/g, '').trim(),
        noHpWa: data.noHpWa || '',
        email: data.email || '',
        ukuranKaosId: data.ukuranKaosId || '',
        ukuranKaosNama: data.ukuranKaosNama || '',
        bisId: data.bisId || '',
        bisNama: data.bisNama || '',
        nomorKursi: data.nomorKursi || data.kursi1 || '',
        namaSupir: data.namaSupir || '',
        noHpSopir: data.noHpSopir || '',
        tourLeader: data.tourLeader || '',
        noHpTourLeader: data.noHpTourLeader || '',
        kursi1: data.kursi1 || data.nomorKursi || '',
        kursi2: data.kursi2 || '',
        kursi3: data.kursi3 || '',
        kursi4: data.kursi4 || '',
        kursi5: data.kursi5 || '',
        kursi6: data.kursi6 || '',
        kursi7: data.kursi7 || '',
        hotelId: data.hotelId || '',
        hotelNama: data.hotelNama || '',
        noKamar: data.noKamar || '',
        lantaiHotel: data.lantaiHotel || (data.noKamar && data.noKamar.length >= 3 ? data.noKamar.charAt(0) : '1'),
        tipeKamar: data.tipeKamar || '',
        tempatMakanId: data.tempatMakanId || '',
        tempatMakanNama: data.tempatMakanNama || '',
        sesiMakan: data.sesiMakan || '',
        tempatAcaraId: data.tempatAcaraId || (dbEngine.getRead().tempatAcara && dbEngine.getRead().tempatAcara[0]?.id) || '',
        tempatAcaraNama: data.tempatAcaraNama || (dbEngine.getRead().tempatAcara && dbEngine.getRead().tempatAcara.find((a: any) => a.id === data.tempatAcaraId)?.namaTempat) || '',
        tempatAcara: data.tempatAcaraNama || data.tempatAcara || '',
        catatanKhusus: data.catatanKhusus || '',
        riwayatPenyakit: data.riwayatPenyakit || '',
        keluarga: Array.isArray(data.keluarga)
          ? data.keluarga.map((k: any) => {
              const isSpouse = k.hubungan === 'Suami' || k.hubungan === 'Istri' || (k.hubungan && (k.hubungan.toLowerCase() === 'suami' || k.hubungan.toLowerCase() === 'istri'));
              return {
                ...k,
                ukuranKaosId: isSpouse ? (k.ukuranKaosId || '') : '',
                ukuranKaosNama: isSpouse ? (k.ukuranKaosNama || '-') : 'Tanpa Kaos',
              };
            })
          : [],
        dokumen: data.dokumen || [],
        status: data.status || 'DITERIMA',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dbEngine.mutate((db) => {
        db.peserta.push(newPeserta);
      });

      dbEngine.logActivity({
        adminUser: req.headers['x-admin-user']?.toString() || 'ADMIN',
        aksi: 'TAMBAH_PESERTA',
        kategori: 'PESERTA',
        rincian: `Admin menambahkan peserta baru ${newPeserta.namaLengkap} (${newPeserta.nomorAgenda})`,
        nomorAgendaTerkait: newPeserta.nomorAgenda,
        ipAddress: req.ip || '127.0.0.1',
      });

      res.json({ success: true, peserta: newPeserta });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/admin/peserta/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const updates = req.body;

      if (updates.keluarga && Array.isArray(updates.keluarga)) {
        updates.keluarga = updates.keluarga.map((k: any) => {
          const isSpouse = k.hubungan === 'Suami' || k.hubungan === 'Istri' || (k.hubungan && (k.hubungan.toLowerCase() === 'suami' || k.hubungan.toLowerCase() === 'istri'));
          return {
            ...k,
            ukuranKaosId: isSpouse ? (k.ukuranKaosId || '') : '',
            ukuranKaosNama: isSpouse ? (k.ukuranKaosNama || '-') : 'Tanpa Kaos',
          };
        });
      }

      let updatedPeserta: Peserta | null = null;
      await dbEngine.mutate((db) => {
        const index = db.peserta.findIndex((p) => p.id === id);
        if (index !== -1) {
          db.peserta[index] = {
            ...db.peserta[index],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          updatedPeserta = db.peserta[index];
        }
      });

      if (!updatedPeserta) {
        return res.status(404).json({ error: 'Peserta tidak ditemukan' });
      }

      dbEngine.logActivity({
        adminUser: req.headers['x-admin-user']?.toString() || 'ADMIN',
        aksi: 'UPDATE_PESERTA',
        kategori: 'PESERTA',
        rincian: `Pembaruan data peserta ${(updatedPeserta as Peserta).namaLengkap} (${(updatedPeserta as Peserta).nomorAgenda})`,
        nomorAgendaTerkait: (updatedPeserta as Peserta).nomorAgenda,
        ipAddress: req.ip || '127.0.0.1',
      });

      res.json({ success: true, peserta: updatedPeserta });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admin/peserta/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      let deletedName = '';
      let deletedAgenda = '';

      await dbEngine.mutate((db) => {
        const index = db.peserta.findIndex((p) => p.id === id);
        if (index !== -1) {
          deletedName = db.peserta[index].namaLengkap;
          deletedAgenda = db.peserta[index].nomorAgenda;
          db.peserta.splice(index, 1);
        }
      });

      if (!deletedName) {
        return res.status(404).json({ error: 'Peserta tidak ditemukan' });
      }

      dbEngine.logActivity({
        adminUser: req.headers['x-admin-user']?.toString() || 'ADMIN',
        aksi: 'HAPUS_PESERTA',
        kategori: 'PESERTA',
        rincian: `Menghapus peserta ${deletedName} (${deletedAgenda})`,
        nomorAgendaTerkait: deletedAgenda,
        ipAddress: req.ip || '127.0.0.1',
      });

      res.json({ success: true, message: 'Peserta berhasil dihapus' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Bulk Import Excel Endpoint
  app.post('/api/admin/peserta/bulk-import', async (req: Request, res: Response) => {
    try {
      const { items, updateExisting } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Data peserta tidak valid atau kosong' });
      }

      let importedCount = 0;
      let updatedCount = 0;
      const errors: string[] = [];

      await dbEngine.mutate((d) => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (!item.namaLengkap || !item.nikNip) {
            errors.push(`Baris ${i + 1}: Nama Lengkap dan Nomor Peserta wajib diisi`);
            continue;
          }

          const cleanNik = item.nikNip.toString().trim();
          const cleanAgenda = item.nomorAgenda ? item.nomorAgenda.toString().trim().toLowerCase() : '';

          const existingIndex = d.peserta.findIndex(
            (p) =>
              (cleanNik && p.nikNip.trim() === cleanNik) ||
              (cleanAgenda && p.nomorAgenda.toLowerCase() === cleanAgenda)
          );

          // Resolve master relations if possible
          const unit = d.unitKerja.find(
            (u) =>
              (item.unitKerjaId && u.id === item.unitKerjaId) ||
              (item.unitKerjaNama &&
                (u.nama.toLowerCase() === item.unitKerjaNama.toString().toLowerCase().trim() ||
                  u.kode.toLowerCase() === item.unitKerjaNama.toString().toLowerCase().trim()))
          );

          const jbtn = d.jabatan.find(
            (j) =>
              (item.jabatanId && j.id === item.jabatanId) ||
              (item.jabatanNama && j.nama.toLowerCase() === item.jabatanNama.toString().toLowerCase().trim())
          );

          const ks = d.kaos.find(
            (k) =>
              (item.ukuranKaosId && k.id === item.ukuranKaosId) ||
              (item.ukuranKaosNama && k.ukuran.toLowerCase() === item.ukuranKaosNama.toString().toLowerCase().trim())
          );

          const bs = d.bis.find(
            (b) =>
              (item.bisId && b.id === item.bisId) ||
              (item.bisNama &&
                (b.nomorBis.toLowerCase() === item.bisNama.toString().toLowerCase().trim() ||
                  b.namaBis.toLowerCase().includes(item.bisNama.toString().toLowerCase().trim())))
          );

          const htl = d.hotel.find(
            (h) =>
              (item.hotelId && h.id === item.hotelId) ||
              (item.hotelNama && h.namaHotel.toLowerCase().includes(item.hotelNama.toString().toLowerCase().trim()))
          );

          const tm = d.tempatMakan.find(
            (t) =>
              (item.tempatMakanId && t.id === item.tempatMakanId) ||
              (item.tempatMakanNama && t.namaTempat.toLowerCase().includes(item.tempatMakanNama.toString().toLowerCase().trim()))
          );

          const ta = (d.tempatAcara || []).find(
            (a) =>
              (item.tempatAcaraId && a.id === item.tempatAcaraId) ||
              (item.tempatAcaraNama && a.namaTempat.toLowerCase().includes(item.tempatAcaraNama.toString().toLowerCase().trim())) ||
              (item.tempatAcara && a.namaTempat.toLowerCase().includes(item.tempatAcara.toString().toLowerCase().trim()))
          );

          if (existingIndex !== -1 && updateExisting) {
            d.peserta[existingIndex] = {
              ...d.peserta[existingIndex],
              namaLengkap: item.namaLengkap.toString().trim(),
              nikNip: cleanNik,
              jenisKelamin: item.jenisKelamin || d.peserta[existingIndex].jenisKelamin,
              unitKerjaId: unit?.id || d.peserta[existingIndex].unitKerjaId,
              unitKerjaNama: unit?.nama || item.unitKerjaNama || d.peserta[existingIndex].unitKerjaNama,
              jabatanId: jbtn?.id || d.peserta[existingIndex].jabatanId,
              jabatanNama: jbtn?.nama || item.jabatanNama || d.peserta[existingIndex].jabatanNama,
              noHpWa: item.noHpWa ? item.noHpWa.toString().trim() : d.peserta[existingIndex].noHpWa,
              email: item.email || d.peserta[existingIndex].email,
              ukuranKaosId: ks?.id || d.peserta[existingIndex].ukuranKaosId,
              ukuranKaosNama: ks?.ukuran || item.ukuranKaosNama || d.peserta[existingIndex].ukuranKaosNama,
              bisId: bs?.id || d.peserta[existingIndex].bisId,
              bisNama: bs?.namaBis ? `${bs.nomorBis} - ${bs.namaBis}` : (item.bisNama || d.peserta[existingIndex].bisNama),
              namaSupir: item.namaSupir || d.peserta[existingIndex].namaSupir,
              noHpSopir: item.noHpSopir || d.peserta[existingIndex].noHpSopir,
              tourLeader: item.tourLeader || d.peserta[existingIndex].tourLeader,
              noHpTourLeader: item.noHpTourLeader || d.peserta[existingIndex].noHpTourLeader,
              kursi1: item.kursi1 || d.peserta[existingIndex].kursi1,
              kursi2: item.kursi2 || d.peserta[existingIndex].kursi2,
              kursi3: item.kursi3 || d.peserta[existingIndex].kursi3,
              kursi4: item.kursi4 || d.peserta[existingIndex].kursi4,
              kursi5: item.kursi5 || d.peserta[existingIndex].kursi5,
              kursi6: item.kursi6 || d.peserta[existingIndex].kursi6,
              kursi7: item.kursi7 || d.peserta[existingIndex].kursi7,
              hotelId: htl?.id || d.peserta[existingIndex].hotelId,
              hotelNama: htl?.namaHotel || item.hotelNama || d.peserta[existingIndex].hotelNama,
              noKamar: item.noKamar || d.peserta[existingIndex].noKamar,
              lantaiHotel: item.lantaiHotel || (item.noKamar && htl?.daftarKamar?.find(k => k.noKamar === item.noKamar)?.lantai) || d.peserta[existingIndex].lantaiHotel || (item.noKamar && item.noKamar.length >= 3 ? item.noKamar.charAt(0) : '1'),
              tempatMakanId: tm?.id || d.peserta[existingIndex].tempatMakanId,
              tempatMakanNama: tm?.namaTempat || item.tempatMakanNama || d.peserta[existingIndex].tempatMakanNama,
              tempatAcaraId: ta?.id || item.tempatAcaraId || d.peserta[existingIndex].tempatAcaraId || (d.tempatAcara && d.tempatAcara[0]?.id) || '',
              tempatAcaraNama: ta?.namaTempat || item.tempatAcaraNama || item.tempatAcara || d.peserta[existingIndex].tempatAcaraNama || (d.tempatAcara && d.tempatAcara[0]?.namaTempat) || '',
              tempatAcara: ta?.namaTempat || item.tempatAcaraNama || item.tempatAcara || d.peserta[existingIndex].tempatAcaraNama || (d.tempatAcara && d.tempatAcara[0]?.namaTempat) || '',
              status: item.status || d.peserta[existingIndex].status,
              updatedAt: new Date().toISOString(),
            };
            updatedCount++;
          } else if (existingIndex === -1) {
            const agendaNum = item.nomorAgenda
              ? item.nomorAgenda.toString().trim()
              : `PG26-${String(d.peserta.length + 1).padStart(4, '0')}`;

            const newP: Peserta = {
              id: 'pst-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6) + '-' + i,
              nomorAgenda: agendaNum,
              namaLengkap: item.namaLengkap.toString().trim(),
              nikNip: cleanNik,
              jenisKelamin: item.jenisKelamin || 'Laki-laki',
              unitKerjaId: unit?.id || item.unitKerjaId || '',
              unitKerjaNama: unit?.nama || item.unitKerjaNama || '',
              jabatanId: jbtn?.id || item.jabatanId || '',
              jabatanNama: jbtn?.nama || item.jabatanNama || '',
              noHpWa: item.noHpWa ? item.noHpWa.toString().trim() : '-',
              email: item.email || '',
              ukuranKaosId: ks?.id || item.ukuranKaosId || '',
              ukuranKaosNama: ks?.ukuran || cleanKaosText(item.ukuranKaosNama) || 'L',
              bisId: bs?.id || item.bisId || '',
              bisNama: bs?.namaBis ? `${bs.nomorBis} - ${bs.namaBis}` : (item.bisNama || ''),
              nomorKursi: item.nomorKursi || item.kursi1 || '',
              namaSupir: item.namaSupir || (bs?.namaSupir || ''),
              noHpSopir: item.noHpSopir || (bs?.noHpSopir || ''),
              tourLeader: item.tourLeader || (bs?.namaKoordinator || ''),
              noHpTourLeader: item.noHpTourLeader || (bs?.kontakKoordinator || ''),
              kursi1: item.kursi1 || item.nomorKursi || '',
              kursi2: item.kursi2 || '',
              kursi3: item.kursi3 || '',
              kursi4: item.kursi4 || '',
              kursi5: item.kursi5 || '',
              kursi6: item.kursi6 || '',
              kursi7: item.kursi7 || '',
              hotelId: htl?.id || item.hotelId || '',
              hotelNama: htl?.namaHotel || item.hotelNama || '',
              noKamar: item.noKamar || '',
              lantaiHotel: item.lantaiHotel || (item.noKamar && htl?.daftarKamar?.find(k => k.noKamar === item.noKamar)?.lantai) || (item.noKamar && item.noKamar.length >= 3 ? item.noKamar.charAt(0) : '1'),
              tipeKamar: item.tipeKamar || '',
              tempatMakanId: tm?.id || item.tempatMakanId || '',
              tempatMakanNama: tm?.namaTempat || item.tempatMakanNama || '',
              sesiMakan: item.sesiMakan || '',
              tempatAcaraId: ta?.id || item.tempatAcaraId || (d.tempatAcara && d.tempatAcara[0]?.id) || '',
              tempatAcaraNama: ta?.namaTempat || item.tempatAcaraNama || item.tempatAcara || (d.tempatAcara && d.tempatAcara[0]?.namaTempat) || '',
              tempatAcara: ta?.namaTempat || item.tempatAcaraNama || item.tempatAcara || (d.tempatAcara && d.tempatAcara[0]?.namaTempat) || '',
              catatanKhusus: item.catatanKhusus || '',
              riwayatPenyakit: item.riwayatPenyakit || '',
              keluarga: Array.isArray(item.keluarga) ? item.keluarga : [],
              dokumen: [],
              status: item.status || 'DITERIMA',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            d.peserta.push(newP);
            importedCount++;
          }
        }
      });

      dbEngine.logActivity({
        adminUser: req.headers['x-admin-user']?.toString() || 'ADMIN',
        aksi: 'IMPORT_EXCEL',
        kategori: 'PESERTA',
        rincian: `Upload Excel: ${importedCount} peserta baru ditambahkan, ${updatedCount} data diperbarui dari ${items.length} total baris.`,
        ipAddress: req.ip || '127.0.0.1',
      });

      res.json({
        success: true,
        importedCount,
        updatedCount,
        totalProcessed: items.length,
        errors,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Gagal mengimpor data peserta: ' + err.message });
    }
  });

  // --------------------------------------------------
  // CRUD Master Data Routes
  // --------------------------------------------------
  app.get('/api/admin/master/:type', (req: Request, res: Response) => {
    const type = req.params.type;
    const db = dbEngine.getRead();
    if (type === 'unit-kerja') return res.json(db.unitKerja);
    if (type === 'jabatan') return res.json(db.jabatan);
    if (type === 'kaos') return res.json(db.kaos);
    if (type === 'bis') return res.json(db.bis);
    if (type === 'hotel') return res.json(db.hotel);
    if (type === 'tempat-makan') return res.json(db.tempatMakan);
    if (type === 'tempat-acara') return res.json(db.tempatAcara || []);
    res.status(404).json({ error: 'Tipe master data tidak valid' });
  });

  app.post('/api/admin/master/:type', async (req: Request, res: Response) => {
    const type = req.params.type;
    const item = req.body;
    item.id = item.id || `mst-${type}-${Date.now()}`;

    await dbEngine.mutate((db) => {
      if (type === 'unit-kerja') db.unitKerja.push(item);
      else if (type === 'jabatan') db.jabatan.push(item);
      else if (type === 'kaos') db.kaos.push(item);
      else if (type === 'bis') db.bis.push(item);
      else if (type === 'hotel') db.hotel.push(item);
      else if (type === 'tempat-makan') db.tempatMakan.push(item);
      else if (type === 'tempat-acara') (db.tempatAcara = db.tempatAcara || []).push(item);
    });

    dbEngine.logActivity({
      adminUser: req.headers['x-admin-user']?.toString() || 'ADMIN',
      aksi: 'TAMBAH_MASTER',
      kategori: 'MASTER_DATA',
      rincian: `Menambahkan master data ${type}: ${item.nama || item.ukuran || item.namaBis || item.namaHotel || item.namaTempat}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({ success: true, item });
  });

  app.put('/api/admin/master/:type/:id', async (req: Request, res: Response) => {
    const { type, id } = req.params;
    const updates = req.body;

    await dbEngine.mutate((db) => {
      const updateList = (list: any[]) => {
        const idx = list.findIndex((i) => i.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updates };
        }
      };

      if (type === 'unit-kerja') updateList(db.unitKerja);
      else if (type === 'jabatan') updateList(db.jabatan);
      else if (type === 'kaos') updateList(db.kaos);
      else if (type === 'bis') updateList(db.bis);
      else if (type === 'hotel') updateList(db.hotel);
      else if (type === 'tempat-makan') updateList(db.tempatMakan);
      else if (type === 'tempat-acara') updateList(db.tempatAcara = db.tempatAcara || []);
    });

    dbEngine.logActivity({
      adminUser: req.headers['x-admin-user']?.toString() || 'ADMIN',
      aksi: 'UPDATE_MASTER',
      kategori: 'MASTER_DATA',
      rincian: `Memperbarui master data ${type} ID: ${id}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({ success: true });
  });

  app.delete('/api/admin/master/:type/:id', async (req: Request, res: Response) => {
    try {
      const { type, id } = req.params;
      let found = false;
      let deletedLabel = '';

      await dbEngine.mutate((db) => {
        const remove = (list: any[]) => {
          const idx = list.findIndex((i) => i.id === id);
          if (idx !== -1) {
            found = true;
            deletedLabel = list[idx].nama || list[idx].ukuran || list[idx].namaBis || list[idx].namaHotel || list[idx].namaTempat || id;
            list.splice(idx, 1);
          }
        };

        if (type === 'unit-kerja') remove(db.unitKerja);
        else if (type === 'jabatan') remove(db.jabatan);
        else if (type === 'kaos') remove(db.kaos);
        else if (type === 'bis') remove(db.bis);
        else if (type === 'hotel') remove(db.hotel);
        else if (type === 'tempat-makan') remove(db.tempatMakan);
        else if (type === 'tempat-acara') remove(db.tempatAcara = db.tempatAcara || []);
      });

      if (!found) {
        return res.status(404).json({ error: `Master data ${type} dengan ID ${id} tidak ditemukan` });
      }

      dbEngine.logActivity({
        adminUser: req.headers['x-admin-user']?.toString() || 'ADMIN',
        aksi: 'HAPUS_MASTER',
        kategori: 'MASTER_DATA',
        rincian: `Menghapus master data ${type}: ${deletedLabel} (ID: ${id})`,
        ipAddress: req.ip || '127.0.0.1',
      });

      res.json({ success: true, message: `Master data ${type} berhasil dihapus` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --------------------------------------------------
  // Logs & Google Drive Configuration
  // --------------------------------------------------
  app.get('/api/admin/logs', (req: Request, res: Response) => {
    const db = dbEngine.getRead();
    res.json({ logs: db.logs });
  });

  app.get('/api/admin/drive-config', (req: Request, res: Response) => {
    const db = dbEngine.getRead();
    res.json(db.driveConfig);
  });

  app.post('/api/admin/drive-config', async (req: Request, res: Response) => {
    const updates = req.body;
    await dbEngine.mutate((db) => {
      db.driveConfig = { ...db.driveConfig, ...updates };
    });

    dbEngine.logActivity({
      adminUser: req.headers['x-admin-user']?.toString() || 'ADMIN',
      aksi: 'UPDATE_DRIVE_CONFIG',
      kategori: 'DOKUMEN',
      rincian: `Konfigurasi Google Drive diperbarui: Folder ID "${dbEngine.getRead().driveConfig.folderId}"`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({ success: true, config: dbEngine.getRead().driveConfig });
  });

  app.post('/api/admin/drive-sync', async (req: Request, res: Response) => {
    await dbEngine.mutate((db) => {
      db.driveConfig.lastBackupTime = new Date().toISOString();
      let totalDocs = 0;
      db.peserta.forEach((p) => {
        totalDocs += p.dokumen.length;
      });
      db.driveConfig.syncedFilesCount = totalDocs;
    });

    dbEngine.logActivity({
      adminUser: req.headers['x-admin-user']?.toString() || 'ADMIN',
      aksi: 'SYNC_GOOGLE_DRIVE',
      kategori: 'DOKUMEN',
      rincian: `Sinkronisasi dokumen peserta ke Google Drive folder "${dbEngine.getRead().driveConfig.folderName}" berhasil.`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({ success: true, message: 'Sinkronisasi Google Drive Berhasil', config: dbEngine.getRead().driveConfig });
  });

  // --------------------------------------------------
  // Vite Middleware integration
  // --------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gathering Pangandaran 2026 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
