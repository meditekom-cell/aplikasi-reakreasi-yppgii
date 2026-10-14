export type Role = 'ADMIN' | 'OPERATOR';

export interface AdminUser {
  id: string;
  username: string;
  nama: string;
  role: Role;
  lastLogin?: string;
}

export interface AnggotaKeluarga {
  id: string;
  nama: string;
  hubungan: 'Suami' | 'Istri' | 'Anak 1' | 'Anak 2' | 'Anak 3' | 'Orang Tua' | 'Lainnya';
  kategoriUsia: 'Dewasa' | 'Anak-anak' | 'Balita';
  usia?: number | string;
  ukuranKaosId?: string;
  ukuranKaosNama: string;
  catatan?: string;
}

export interface DokumenLampiran {
  id: string;
  namaFile: string;
  tipe: string; // 'application/pdf' | 'image/jpeg' | 'image/png'
  ukuranBytes: number;
  base64Data?: string;
  driveFileId?: string;
  driveViewUrl?: string;
  uploadedAt: string;
}

export interface Peserta {
  id: string;
  nomorAgenda: string; // e.g. REG-PNG-2026-0001 or REG-PGII-2026-0001
  namaLengkap: string;
  nikNip: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  statusPernikahan?: 'Menikah' | 'Belum Menikah' | 'Cerai Hidup' | 'Cerai Mati' | string;
  unitKerjaId: string;
  unitKerjaNama: string;
  jabatanId: string;
  jabatanNama: string;
  noHpWa: string;
  email: string;
  ukuranKaosId: string;
  ukuranKaosNama: string;
  bisId: string;
  bisNama: string;
  nomorKursi?: string;
  namaSupir?: string;
  noHpSopir?: string;
  tourLeader?: string;
  noHpTourLeader?: string;
  kursi1?: string;
  kursi2?: string;
  kursi3?: string;
  kursi4?: string;
  kursi5?: string;
  kursi6?: string;
  kursi7?: string;
  hotelId: string;
  hotelNama: string;
  noHpHotel?: string;
  lantaiHotel?: string;
  noKamar: string;
  tipeKamar?: string;
  tempatMakanId: string;
  tempatMakanNama: string;
  sesiMakan?: string;
  tempatAcaraId: string;
  tempatAcaraNama: string;
  tempatAcara?: string;
  catatanKhusus?: string;
  riwayatPenyakit?: string;
  keluarga: AnggotaKeluarga[];
  dokumen: DokumenLampiran[];
  status: 'DITERIMA' | 'MENUNGGU_VERIFIKASI' | 'DIBATALKAN';
  createdAt: string;
  updatedAt: string;
}

export interface MasterUnitKerja {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
}

export interface MasterJabatan {
  id: string;
  nama: string;
  level: string;
}

export interface MasterKaos {
  id: string;
  ukuran: string;
  kategori: string;
  kuotaTotal: number;
}

export interface MasterBis {
  id: string;
  nomorBis: string;
  namaBis: string;
  kapasitas: number;
  nomorPolisi: string;
  namaKoordinator: string;
  kontakKoordinator: string;
  namaSupir?: string;
  noHpSopir?: string;
  keterangan?: string;
}

export interface KamarHotel {
  noKamar: string;
  lantai?: string;
  tipe: 'Standard' | 'Deluxe' | 'Family Suite' | 'Cottage' | string;
  kapasitas: number;
  keterangan?: string;
}

export interface MasterHotel {
  id: string;
  namaHotel: string;
  lokasi: string;
  tipeKamar: string[];
  daftarKamar: KamarHotel[];
  kontakHotel: string;
}

export interface MasterTempatMakan {
  id: string;
  namaTempat: string;
  lokasi: string;
  sesiMakan: string[];
  kapasitas: number;
  menuUtama: string;
}

export interface MasterTempatAcara {
  id: string;
  namaTempat: string;
  lokasi: string;
  kapasitas: number;
  kegiatan: string;
  keterangan?: string;
}

export interface AktivitasLog {
  id: string;
  timestamp: string;
  adminUser: string;
  aksi: string;
  kategori: 'PESERTA' | 'MASTER_DATA' | 'AUTH' | 'DOKUMEN' | 'SISTEM';
  rincian: string;
  ipAddress?: string;
  nomorAgendaTerkait?: string;
}

export interface GoogleDriveConfig {
  folderId: string;
  folderName: string;
  backupEnabled: boolean;
  lastBackupTime?: string;
  driveEmail: string;
  syncedFilesCount: number;
}

export interface KaosQuotaItem {
  id: string;
  ukuran: string;
  kategori: string;
  kuotaTotal: number;
  terpakai: number;
  sisa: number;
  persentase: number;
  status: 'AMAN' | 'MENIPIS' | 'HABIS';
}

export interface KaosSummary {
  totalKuota: number;
  totalTerpakai: number;
  totalSisa: number;
  persentaseTerpakai: number;
  items: KaosQuotaItem[];
}

export interface HotelAllocationItem {
  id: string;
  namaHotel: string;
  lokasi: string;
  totalKamar: number;
  kamarTerisi: number;
  kamarKosong: number;
  kapasitasTamu: number;
  tamuTerisi: number;
  sisaKapasitasTamu: number;
  persentaseKamar: number;
  persentaseTamu: number;
}

export interface HotelSummary {
  totalKamar: number;
  totalKamarTerisi: number;
  totalKamarKosong: number;
  totalKapasitasTamu: number;
  totalTamuTerisi: number;
  totalSisaKapasitasTamu: number;
  persentaseOkupansiKamar: number;
  persentaseOkupansiTamu: number;
  items: HotelAllocationItem[];
}

export interface BisAllocationItem {
  id: string;
  nomorBis: string;
  namaBis: string;
  kapasitas: number;
  terisi: number;
  sisa: number;
  persentase: number;
  status: 'TERSEDIA' | 'HAMPIR_PENUH' | 'PENUH';
}

export interface BisSummary {
  totalArmada: number;
  totalKapasitas: number;
  totalTerisi: number;
  totalSisaKursi: number;
  persentaseTerisi: number;
  items: BisAllocationItem[];
}

export interface DemografiSummary {
  pesertaLakiLaki: number;
  pesertaPerempuan: number;
  statusDiterima: number;
  statusMenunggu: number;
  statusDibatalkan: number;
  keluargaDewasa: number;
  keluargaAnak: number;
  keluargaBalita: number;
}

export interface DatabaseSchema {
  peserta: Peserta[];
  unitKerja: MasterUnitKerja[];
  jabatan: MasterJabatan[];
  kaos: MasterKaos[];
  bis: MasterBis[];
  hotel: MasterHotel[];
  tempatMakan: MasterTempatMakan[];
  tempatAcara: MasterTempatAcara[];
  logs: AktivitasLog[];
  driveConfig: GoogleDriveConfig;
  agendaCounter: number;
  adminUsers: {
    id: string;
    username: string;
    nama: string;
    role: Role;
    salt: string;
    passwordHash: string;
    createdAt: string;
    lastLogin?: string;
  }[];
}

export type NavTab = 
  | 'pendaftaran'
  | 'cek-status'
  | 'dashboard'
  | 'peserta'
  | 'keluarga'
  | 'master-data'
  | 'google-drive'
  | 'log-aktivitas';
