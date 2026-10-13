import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSchema, Peserta, MasterUnitKerja, MasterJabatan, MasterKaos, MasterBis, MasterHotel, MasterTempatMakan, AktivitasLog, AnggotaKeluarga } from '../src/types';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function runImport() {
  const csvPath = path.join(process.cwd(), 'data', 'peserta_raw.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

  // Header line
  // No,Unit Kerja,Nama,Jabatan,Jenis Kelamin,Status,No HP,Ukuran Kaos,,Suami/Istri,Kaos2,Anak ke1,Anak ke2,Anak ke3,Anak ke4,Anak ke5,,Bis,K1,K2,K3,K4,K5,K6,K7,Tour Leader,NoTL,,Nama Hotel,Lantai,No Kamar,,,,
  const dataRows = lines.slice(1);
  console.log(`Processing ${dataRows.length} rows...`);

  // Master Unit Kerja
  const unitKerjaMap = new Map<string, MasterUnitKerja>();
  const defaultUnits = [
    { id: 'uk-sma1', kode: 'SMA1', nama: 'SMA PGII 1', deskripsi: 'SMA PGII 1 Bandung' },
    { id: 'uk-sma2', kode: 'SMA2', nama: 'SMA PGII 2', deskripsi: 'SMA PGII 2 Bandung' },
    { id: 'uk-smp1', kode: 'SMP1', nama: 'SMP PGII 1', deskripsi: 'SMP PGII 1 Bandung' },
    { id: 'uk-smp2', kode: 'SMP2', nama: 'SMP PGII 2', deskripsi: 'SMP PGII 2 Bandung' },
    { id: 'uk-yayasan', kode: 'YYS', nama: 'Yayasan', deskripsi: 'Yayasan PGII Bandung' },
    { id: 'uk-kantin', kode: 'KTN', nama: 'Kantin Sekolah', deskripsi: 'Pengelola Kantin PGII' },
  ];
  defaultUnits.forEach((u) => unitKerjaMap.set(u.nama, u));

  // Master Jabatan
  const jabatanMap = new Map<string, MasterJabatan>();
  const defaultJabatan = [
    { id: 'jb-ks', nama: 'Kepala Sekolah', level: 'Pimpinan' },
    { id: 'jb-wks', nama: 'Wakil Kepala Sekolah', level: 'Pimpinan' },
    { id: 'jb-guru', nama: 'Guru', level: 'Pendidik' },
    { id: 'jb-karyawan', nama: 'Karyawan', level: 'Tenaga Kependidikan' },
    { id: 'jb-pementor', nama: 'Pementor', level: 'Pendukung' },
    { id: 'jb-tahfidz', nama: 'Pembimbing Tahfidz', level: 'Pendukung' },
    { id: 'jb-ekskul', nama: 'Pembina Ekstrakurikuler', level: 'Pendukung' },
    { id: 'jb-stafyys', nama: 'Staf Yayasan', level: 'Yayasan' },
    { id: 'jb-pembina', nama: 'Pembina', level: 'Yayasan' },
    { id: 'jb-pengawas', nama: 'Pengawas', level: 'Yayasan' },
    { id: 'jb-pengurus', nama: 'Pengurus', level: 'Yayasan' },
    { id: 'jb-kantin', nama: 'Petugas Kantin', level: 'Mitra' },
    { id: 'jb-tamu', nama: 'Tamu', level: 'Tamu Kehormatan' },
  ];
  defaultJabatan.forEach((j) => jabatanMap.set(j.nama, j));

  // Master Kaos
  const kaosMap = new Map<string, MasterKaos>();
  const defaultKaos = [
    { id: 'ks-s', ukuran: 'S', kategori: 'Dewasa' as const, kuotaTotal: 50 },
    { id: 'ks-m', ukuran: 'M', kategori: 'Dewasa' as const, kuotaTotal: 150 },
    { id: 'ks-l', ukuran: 'L', kategori: 'Dewasa' as const, kuotaTotal: 250 },
    { id: 'ks-xl', ukuran: 'XL', kategori: 'Dewasa' as const, kuotaTotal: 250 },
    { id: 'ks-xxl', ukuran: 'XXL', kategori: 'Dewasa' as const, kuotaTotal: 150 },
    { id: 'ks-xxxl', ukuran: 'XXXL', kategori: 'Dewasa' as const, kuotaTotal: 80 },
    { id: 'ks-xxxxl', ukuran: 'XXXXL', kategori: 'Dewasa' as const, kuotaTotal: 30 },
    { id: 'ks-xxxxxl', ukuran: 'XXXXXL', kategori: 'Dewasa' as const, kuotaTotal: 20 },
    { id: 'ks-anak-s', ukuran: 'S Anak', kategori: 'Anak' as const, kuotaTotal: 40 },
    { id: 'ks-anak-m', ukuran: 'M Anak', kategori: 'Anak' as const, kuotaTotal: 50 },
    { id: 'ks-anak-l', ukuran: 'L Anak', kategori: 'Anak' as const, kuotaTotal: 50 },
    { id: 'ks-anak-xl', ukuran: 'XL Anak', kategori: 'Anak' as const, kuotaTotal: 40 },
  ];
  defaultKaos.forEach((k) => kaosMap.set(k.ukuran.toUpperCase(), k));

  // Master Bis
  const bisMap = new Map<string, MasterBis>();
  const tourLeadersInfo: Record<string, { tl: string; phone: string }> = {
    '1': { tl: 'Trio Harnoto, S.Pd.', phone: '081214278148' },
    '2': { tl: 'Dadang Sunjaya,S.Pd.', phone: '081320452075' },
    '3': { tl: 'Andi Muhhamad Hafiz, S.Pd', phone: '08997384304' },
    '4': { tl: 'Rofi Rosydi, S.Pd', phone: '089526560058' },
    '5': { tl: 'Fikri Lukmanul Hakim, M.Pd', phone: '081281127276' },
    '6': { tl: 'Didik Darmansyah, S.Pd.', phone: '085221000314' },
    '7': { tl: 'Yovan Fuji Wangga, S.Pd.', phone: '087818454664' },
    '8': { tl: 'Faris Faikar Rachman, M.I.Kom', phone: '08112266005' },
    '9': { tl: 'Hj. Atin Nurhayati, S.Pd', phone: '08122106693' },
    '10': { tl: 'Iwan Setiawan, S.Kom.', phone: '081321805350' },
    '11': { tl: 'Nidal Nadia, S.Pd.', phone: '085740554008' },
    '12': { tl: 'Rachmat Ramdhan', phone: '082120978819' },
    '13': { tl: 'Dicky Azhar A, S.Pd.', phone: '081321561042' },
  };

  for (let b = 1; b <= 13; b++) {
    const numStr = String(b);
    const padded = numStr.padStart(2, '0');
    const info = tourLeadersInfo[numStr] || { tl: 'Tour Leader PGII', phone: '-' };
    const bisObj: MasterBis = {
      id: `bis-${padded}`,
      nomorBis: `Bis ${padded}`,
      namaBis: `Executive Armada ${padded} (Full AC + Audio)`,
      kapasitas: 50,
      nomorPolisi: `D 71${padded} PGII`,
      namaKoordinator: info.tl,
      kontakKoordinator: info.phone,
      keterangan: `Tour Leader: ${info.tl} (${info.phone})`,
    };
    bisMap.set(numStr, bisObj);
    bisMap.set(`Bis ${padded}`, bisObj);
    bisMap.set(`Bis ${b}`, bisObj);
  }

  // Kendaraan Pribadi
  const privateCarBis: MasterBis = {
    id: 'bis-pribadi',
    nomorBis: 'Mobil Sendiri',
    namaBis: 'Kendaraan Pribadi / Mandiri',
    kapasitas: 99,
    nomorPolisi: 'PRIBADI',
    namaKoordinator: 'Koordinasi Mandiri',
    kontakKoordinator: '-',
    keterangan: 'Peserta membawa kendaraan pribadi',
  };
  bisMap.set('Bawa Mobil Sendiri', privateCarBis);

  // Master Hotels
  const hotelMap = new Map<string, MasterHotel>();
  const defaultHotels: MasterHotel[] = [
    {
      id: 'htl-sr1',
      namaHotel: 'Sinar Rahayu 1',
      lokasi: 'Pantai Barat Pangandaran',
      kontakHotel: '(0265) 639001',
      tipeKamar: ['Standard', 'Deluxe', 'Family Suite'],
      daftarKamar: [],
    },
    {
      id: 'htl-sr2',
      namaHotel: 'Sinar Rahayu 2',
      lokasi: 'Pantai Barat Pangandaran',
      kontakHotel: '(0265) 639002',
      tipeKamar: ['Standard', 'Deluxe', 'Family Suite'],
      daftarKamar: [],
    },
    {
      id: 'htl-sr3',
      namaHotel: 'Sinar Rahayu 3',
      lokasi: 'Pantai Barat Pangandaran',
      kontakHotel: '(0265) 639003',
      tipeKamar: ['Standard', 'Deluxe', 'Family Suite'],
      daftarKamar: [],
    },
    {
      id: 'htl-sr4',
      namaHotel: 'Sinar Rahayu 4',
      lokasi: 'Pantai Barat Pangandaran',
      kontakHotel: '(0265) 639004',
      tipeKamar: ['Standard', 'Deluxe', 'Family Suite'],
      daftarKamar: [],
    },
    {
      id: 'htl-gc',
      namaHotel: 'Grand Cahaya',
      lokasi: 'Pantai Barat Pangandaran (VIP Suite)',
      kontakHotel: '(0265) 639888',
      tipeKamar: ['VIP Suite', 'Executive Room'],
      daftarKamar: [],
    },
    {
      id: 'htl-sw1',
      namaHotel: 'Suligar Wangi 1',
      lokasi: 'Kawasan Wisata Pantai Pangandaran',
      kontakHotel: '(0265) 639777',
      tipeKamar: ['Standard', 'Deluxe'],
      daftarKamar: [],
    },
  ];
  defaultHotels.forEach((h) => hotelMap.set(h.namaHotel, h));

  // Master Tempat Makan
  const tempatMakanList: MasterTempatMakan[] = [
    {
      id: 'tm-1',
      namaTempat: 'Resto Seafood Karya Bahari 3 (Pantai Timur)',
      lokasi: 'Komplek Pasar Ikan Pantai Timur Pangandaran',
      sesiMakan: ['Makan Siang Hari 1', 'Makan Malam Seafood Gala Dinner Hari 1'],
      kapasitas: 500,
      menuUtama: 'Ikan Bakar Kakap, Cumi Saus Padang, Udang Goreng Tepung, Kepiting Soka',
    },
    {
      id: 'tm-2',
      namaTempat: 'Kampung Turis Pangandaran Beachfront',
      lokasi: 'Jl. Pamugaran Pantai Barat, Wonoharjo',
      sesiMakan: ['Makan Malam Sunset Gathering Hari 2', 'Snack & Coffee Break'],
      kapasitas: 500,
      menuUtama: 'Live BBQ Grilled Seafood, Kelapa Muda Segar, Nasi Liwet Tradisional Sunda',
    },
    {
      id: 'tm-3',
      namaTempat: 'Resto RM Saung Lesehan Pangandaran',
      lokasi: 'Jl. Raya Cijulang Pangandaran',
      sesiMakan: ['Makan Siang Hari 2 (Wisata Green Canyon)'],
      kapasitas: 450,
      menuUtama: 'Ayam Bakar Madu, Gurame Goreng Kering, Sambal Dadak & Lalapan Segar',
    },
  ];

  const parsedPeserta: Peserta[] = [];

  for (let idx = 0; idx < dataRows.length; idx++) {
    const row = parseCSVLine(dataRows[idx]);
    if (row.length < 5) continue;

    const noVal = row[0]?.trim();
    const no = parseInt(noVal) || (idx + 1);
    const unitKerjaRaw = row[1]?.trim() || 'SMA PGII 1';
    const namaRaw = row[2]?.trim() || '';
    const jabatanRaw = row[3]?.trim() || 'Guru';
    const jkRaw = row[4]?.trim() || 'Laki-Laki';
    const statusPernikahanRaw = row[5]?.trim() || 'Menikah';
    const noHpRaw = row[6]?.trim() || '';
    const ukuranKaosRaw = row[7]?.trim() || 'L';
    
    // Family / Spouse columns
    const suamiIstriRaw = row[9]?.trim() || '';
    const kaos2Raw = row[10]?.trim() || '';
    const anak1 = row[11]?.trim() || '';
    const anak2 = row[12]?.trim() || '';
    const anak3 = row[13]?.trim() || '';
    const anak4 = row[14]?.trim() || '';
    const anak5 = row[15]?.trim() || '';

    // Bis & Kursi
    const bisRaw = row[17]?.trim() || '';
    const k1 = row[18]?.trim() || '';
    const k2 = row[19]?.trim() || '';
    const k3 = row[20]?.trim() || '';
    const k4 = row[21]?.trim() || '';
    const k5 = row[22]?.trim() || '';
    const k6 = row[23]?.trim() || '';
    const k7 = row[24]?.trim() || '';
    const tourLeaderRaw = row[25]?.trim() || '';
    const noTlRaw = row[26]?.trim() || '';

    // Hotel & Kamar
    const hotelRaw = row[28]?.trim() || 'Sinar Rahayu 1';
    const lantaiRaw = row[29]?.trim() || '1';
    const noKamarRaw = row[30]?.trim() || '';

    // Normalizations
    const formattedHp = noHpRaw && noHpRaw !== '0' 
      ? (noHpRaw.startsWith('0') ? noHpRaw : '0' + noHpRaw)
      : '-';

    const formattedNoTl = noTlRaw && noTlRaw !== '0'
      ? (noTlRaw.startsWith('0') ? noTlRaw : '0' + noTlRaw)
      : '';

    const jenisKelamin: 'Laki-laki' | 'Perempuan' = 
      jkRaw.toLowerCase().includes('perempuan') || jkRaw.toLowerCase().includes('wanita') 
        ? 'Perempuan' 
        : 'Laki-laki';

    const statusPernikahan: 'Menikah' | 'Belum Menikah' = 
      statusPernikahanRaw.toLowerCase().includes('belum') 
        ? 'Belum Menikah' 
        : 'Menikah';

    // Unit Kerja lookup or create
    let unitObj = unitKerjaMap.get(unitKerjaRaw);
    if (!unitObj) {
      unitObj = {
        id: `uk-${unitKerjaRaw.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        kode: unitKerjaRaw.substring(0, 4).toUpperCase(),
        nama: unitKerjaRaw,
        deskripsi: unitKerjaRaw,
      };
      unitKerjaMap.set(unitKerjaRaw, unitObj);
    }

    // Jabatan lookup or create
    let jabatanObj = jabatanMap.get(jabatanRaw);
    if (!jabatanObj) {
      jabatanObj = {
        id: `jb-${jabatanRaw.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        nama: jabatanRaw,
        level: 'Staff',
      };
      jabatanMap.set(jabatanRaw, jabatanObj);
    }

    // Kaos lookup
    const kaosUpper = ukuranKaosRaw.toUpperCase();
    let kaosObj = kaosMap.get(kaosUpper) || kaosMap.get(kaosUpper.replace(' DEWASA', ''));
    if (!kaosObj) {
      kaosObj = {
        id: `ks-${kaosUpper.toLowerCase()}`,
        ukuran: ukuranKaosRaw,
        kategori: 'Dewasa',
        kuotaTotal: 100,
      };
      kaosMap.set(kaosUpper, kaosObj);
    }

    // Bis lookup
    let bisObj: MasterBis | undefined;
    if (bisRaw.toLowerCase().includes('mobil') || bisRaw.toLowerCase().includes('sendiri')) {
      bisObj = privateCarBis;
    } else if (bisRaw) {
      bisObj = bisMap.get(bisRaw) || bisMap.get(`Bis ${bisRaw.padStart(2, '0')}`);
    }

    if (!bisObj) {
      bisObj = bisMap.get('1') || {
        id: 'bis-01',
        nomorBis: 'Bis 01',
        namaBis: 'Armada Bis 01',
        kapasitas: 50,
        nomorPolisi: 'D 7101 PGII',
        namaKoordinator: tourLeaderRaw || 'Koordinator Bis',
        kontakKoordinator: formattedNoTl || '-',
      };
    }

    // Kursi string
    const kursiList = [k1, k2, k3, k4, k5, k6, k7].filter((k) => k && k !== '0' && k !== '');
    const nomorKursi = kursiList.length > 0 ? kursiList.join(', ') : (bisRaw.toLowerCase().includes('mobil') ? 'Bawa Mobil Sendiri' : '-');

    // Hotel lookup
    let hotelObj = hotelMap.get(hotelRaw);
    if (!hotelObj) {
      hotelObj = {
        id: `htl-${hotelRaw.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        namaHotel: hotelRaw,
        lokasi: 'Pangandaran',
        kontakHotel: '-',
        tipeKamar: ['Standard', 'Deluxe', 'Family Suite'],
        daftarKamar: [],
      };
      hotelMap.set(hotelRaw, hotelObj);
    }

    // Tipe Kamar inference
    let tipeKamar = 'Deluxe';
    if (hotelRaw.includes('Grand Cahaya') || lantaiRaw === 'IST') {
      tipeKamar = 'VIP Suite';
    } else if (noKamarRaw.includes('-') || kursiList.length >= 4) {
      tipeKamar = 'Family Suite';
    }

    // Keluarga array
    const keluarga: AnggotaKeluarga[] = [];
    
    // Spouse if present
    if (suamiIstriRaw && suamiIstriRaw !== '0' && suamiIstriRaw.toLowerCase() !== 'tidak ada') {
      const rel = jenisKelamin === 'Laki-laki' ? 'Istri' : 'Suami';
      const k2Size = kaos2Raw && kaos2Raw !== '0' ? kaos2Raw : 'M';
      keluarga.push({
        id: `fam-${no}-spouse`,
        nama: suamiIstriRaw === 'A' || suamiIstriRaw === 'Suami' ? `${rel} dari ${namaRaw}` : suamiIstriRaw,
        hubungan: rel,
        kategoriUsia: 'Dewasa',
        ukuranKaosId: `ks-${k2Size.toLowerCase()}`,
        ukuranKaosNama: `${k2Size} Dewasa`,
        catatan: `Pendamping Resmi (Alokasi Kursi: ${k2 || '-'})`,
      });
    }

    // Children if present
    const anakList = [
      { val: anak1, idx: 1, kursi: k3 },
      { val: anak2, idx: 2, kursi: k4 },
      { val: anak3, idx: 3, kursi: k5 },
      { val: anak4, idx: 4, kursi: k6 },
      { val: anak5, idx: 5, kursi: k7 },
    ];

    anakList.forEach((a) => {
      if (a.val && a.val !== '0' && a.val !== '') {
        const isSize = ['S', 'M', 'L', 'XL', 'XXL', '3', '4', '5'].includes(a.val.toUpperCase());
        const childKaos = isSize ? a.val : 'M Anak';
        keluarga.push({
          id: `fam-${no}-ch${a.idx}`,
          nama: `Anak ke-${a.idx} (${namaRaw})`,
          hubungan: (a.idx === 1 ? 'Anak 1' : a.idx === 2 ? 'Anak 2' : 'Anak 3') as any,
          kategoriUsia: 'Anak-anak',
          ukuranKaosId: `ks-anak-${childKaos.toLowerCase()}`,
          ukuranKaosNama: childKaos.includes('Anak') ? childKaos : `${childKaos} Anak`,
          catatan: `Alokasi Kursi Bis: ${a.kursi || a.val}`,
        });
      }
    });

    const emailSlug = namaRaw
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '.')
      .replace(/\.+/g, '.')
      .replace(/^\.|\.$/g, '');

    const pesertaObj: Peserta = {
      id: `pst-${no}`,
      nomorAgenda: `REG-PGII-2026-${String(no).padStart(4, '0')}`,
      namaLengkap: namaRaw,
      nikNip: `PGII-2026-${String(no).padStart(4, '0')}`,
      jenisKelamin,
      statusPernikahan,
      unitKerjaId: unitObj.id,
      unitKerjaNama: unitObj.nama,
      jabatanId: jabatanObj.id,
      jabatanNama: jabatanObj.nama,
      noHpWa: formattedHp,
      email: `${emailSlug}@pgii.sch.id`,
      ukuranKaosId: kaosObj.id,
      ukuranKaosNama: `${ukuranKaosRaw} Dewasa`,
      bisId: bisObj.id,
      bisNama: bisObj.nomorBis,
      nomorKursi,
      tourLeader: tourLeaderRaw || bisObj.namaKoordinator,
      noHpTourLeader: formattedNoTl || bisObj.kontakKoordinator,
      hotelId: hotelObj.id,
      hotelNama: hotelObj.namaHotel,
      lantaiHotel: lantaiRaw,
      noKamar: noKamarRaw || 'Plotting Panitia',
      tipeKamar,
      tempatMakanId: 'tm-1',
      tempatMakanNama: 'Resto Seafood Karya Bahari 3 (Pantai Timur)',
      sesiMakan: 'Makan Malam Seafood Gala Dinner Hari 1',
      tempatAcaraId: 'ta-1',
      tempatAcaraNama: 'Pantai Barat Pangandaran',
      tempatAcara: 'Pantai Barat Pangandaran',
      catatanKhusus: keluarga.length > 0 ? `Membawa ${keluarga.length} anggota keluarga` : 'Peserta Mandiri',
      riwayatPenyakit: 'Tidak Ada Catatan Khusus',
      keluarga,
      dokumen: [
        {
          id: `doc-${no}-1`,
          namaFile: `ID_Card_${namaRaw.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          tipe: 'application/pdf',
          ukuranBytes: 185000,
          driveFileId: `DRIVE_PGII_2026_${String(no).padStart(4, '0')}`,
          driveViewUrl: `https://drive.google.com/file/d/pgii_2026_${String(no).padStart(4, '0')}/view`,
          uploadedAt: '2026-08-25T08:00:00.000Z',
        },
      ],
      status: 'DITERIMA',
      createdAt: '2026-08-25T08:00:00.000Z',
      updatedAt: '2026-08-25T08:00:00.000Z',
    };

    parsedPeserta.push(pesertaObj);
  }

  console.log(`Parsed ${parsedPeserta.length} peserta successfully.`);

  const defaultSalt = 'pangandaran2026secure_salt';
  const defaultPasswordHash = crypto.createHash('sha256').update('admin123:' + defaultSalt).digest('hex');

  const logs: AktivitasLog[] = [
    {
      id: 'log-seed-pgii',
      timestamp: new Date().toISOString(),
      adminUser: 'SYSTEM',
      aksi: 'IMPORT_MASTER_CSV',
      kategori: 'PESERTA',
      rincian: `Berhasil mengimpor dan mengintegrasikan ${parsedPeserta.length} data peserta resmi Gathering PGII Pangandaran 2026 beserta alokasi Bis, Hotel, Kaos, dan Keluarga.`,
      ipAddress: '127.0.0.1',
    },
  ];

  const fullDb: DatabaseSchema = {
    peserta: parsedPeserta,
    unitKerja: Array.from(new Map(Array.from(unitKerjaMap.values()).map((u) => [u.id, u])).values()),
    jabatan: Array.from(new Map(Array.from(jabatanMap.values()).map((j) => [j.id, j])).values()),
    kaos: Array.from(new Map(Array.from(kaosMap.values()).map((k) => [k.id, k])).values()),
    bis: Array.from(new Map(Array.from(bisMap.values()).map((b) => [b.id, b])).values()),
    hotel: Array.from(new Map(Array.from(hotelMap.values()).map((h) => [h.id, h])).values()),
    tempatMakan: tempatMakanList,
    tempatAcara: [
      {
        id: 'ta-1',
        namaTempat: 'Pantai Barat Pangandaran',
        lokasi: 'Kawasan Wisata Pantai Barat Pangandaran',
        kapasitas: 500,
        kegiatan: 'Titik Kumpul, Senam Pagi, Outbound Fun Games, dan Panggung Utama Gathering',
      },
    ],
    logs,
    driveConfig: {
      folderId: '10K_PGII_PANGANDARAN_2026_DRIVE_BACKUP',
      folderName: 'Gathering PGII Pangandaran 2026 - Berkas & Dokumen',
      backupEnabled: true,
      lastBackupTime: new Date().toISOString(),
      driveEmail: 'gathering.pgii2026@gmail.com',
      syncedFilesCount: parsedPeserta.length,
    },
    agendaCounter: parsedPeserta.length,
    adminUsers: [
      {
        id: 'usr-admin-1',
        username: 'admin',
        nama: 'Administrator Utama PGII',
        role: 'ADMIN',
        salt: defaultSalt,
        passwordHash: defaultPasswordHash,
        createdAt: '2026-08-01T00:00:00.000Z',
      },
    ],
  };

  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  fs.writeFileSync(dbPath, JSON.stringify(fullDb, null, 2), 'utf-8');
  console.log(`Successfully written database to ${dbPath}`);
}

runImport();
