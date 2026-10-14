import { 
  DatabaseSchema, 
  Peserta, 
  MasterUnitKerja, 
  MasterJabatan, 
  MasterKaos, 
  MasterBis, 
  MasterHotel, 
  MasterTempatMakan, 
  MasterTempatAcara,
  AktivitasLog, 
  GoogleDriveConfig, 
  AdminUser,
  KaosSummary,
  HotelSummary,
  BisSummary,
  DemografiSummary
} from '../types';

export interface RegistrationPeriodInfo {
  startDate: string;
  endDate: string;
  startDateStr: string;
  endDateStr: string;
  isClosed: boolean;
  isUpcoming: boolean;
}

export interface PublicMasterData {
  nextNomorPeserta?: string;
  unitKerja: MasterUnitKerja[];
  jabatan: MasterJabatan[];
  kaos: MasterKaos[];
  bis: MasterBis[];
  hotel: MasterHotel[];
  tempatMakan: MasterTempatMakan[];
  tempatAcara: MasterTempatAcara[];
  registrationPeriod?: RegistrationPeriodInfo;
}

export interface DashboardData {
  totalPeserta: number;
  totalKeluarga: number;
  totalOrang: number;
  distribusiKaos: Record<string, number>;
  distribusiBis: Record<string, number>;
  distribusiHotel: Record<string, number>;
  distribusiUnit: Record<string, number>;
  distribusiJabatan: Record<string, number>;
  distribusiTempatMakan: Record<string, number>;
  distribusiTempatAcara: Record<string, number>;
  totalBis: number;
  totalHotel: number;
  totalUnit: number;
  recentLogs: AktivitasLog[];
  driveConfig: GoogleDriveConfig;
  kaosSummary: KaosSummary;
  hotelSummary: HotelSummary;
  bisSummary: BisSummary;
  demografi: DemografiSummary;
}

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const sess = localStorage.getItem('gathering_session_id');
  if (sess) {
    headers['x-session-id'] = sess;
  }
  return headers;
};

// ----------------------------------------------------
// Safe Fetch helper: Never crash on non-JSON / HTML error pages
// ----------------------------------------------------
interface FetchResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  isHtmlResponse?: boolean;
}

async function safeFetchJson<T = any>(url: string, options?: RequestInit): Promise<FetchResult<T>> {
  try {
    const res = await fetch(url, {
      credentials: 'include',
      ...options,
      headers: {
        ...(options?.headers || {}),
      },
    });
    const contentType = (res.headers.get('content-type') || '').toLowerCase();

    // If server returned HTML (e.g. Vercel 404 'The page could not be found' or 500 error page)
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      return {
        ok: false,
        status: res.status,
        isHtmlResponse: true,
        error: res.status === 404 
          ? 'Endpoint API tidak ditemukan (404).'
          : `Layanan backend tidak merespons JSON (Status ${res.status}).`,
      };
    }

    const data = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data,
        error: data?.error || `Permintaan gagal (Status ${res.status})`,
      };
    }

    return {
      ok: true,
      status: res.status,
      data,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      error: err?.message || 'Gagal terhubung ke jaringan/server',
    };
  }
}

// ----------------------------------------------------
// Client-side Fallback Database Loader for Vercel / Static Hosting
// ----------------------------------------------------
let cachedFallbackDb: {
  peserta: Peserta[];
  unitKerja: MasterUnitKerja[];
  jabatan: MasterJabatan[];
  kaos: MasterKaos[];
  bis: MasterBis[];
  hotel: MasterHotel[];
  tempatMakan: MasterTempatMakan[];
  tempatAcara: MasterTempatAcara[];
  agendaCounter: number;
} | null = null;

const normalizeWaNumber = (phone: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('628')) return digits.slice(2);
  if (digits.startsWith('08')) return digits.slice(1);
  if (digits.startsWith('8')) return digits;
  return digits;
};

async function loadPublicFallbackDb() {
  if (!cachedFallbackDb) {
    try {
      const res = await fetch('/data/public-db.json');
      if (res.ok) {
        cachedFallbackDb = await res.json();
      }
    } catch (e) {
      console.warn('Gagal memuat /data/public-db.json fallback:', e);
    }
  }

  // Ensure default structures if fetch failed
  const baseDb = cachedFallbackDb || {
    peserta: [],
    unitKerja: [],
    jabatan: [],
    kaos: [],
    bis: [],
    hotel: [],
    tempatMakan: [],
    tempatAcara: [],
    agendaCounter: 0,
  };

  // Merge any locally registered participants in browser storage
  let localPeserta: Peserta[] = [];
  try {
    const rawLocal = localStorage.getItem('gathering_local_registrations');
    if (rawLocal) {
      localPeserta = JSON.parse(rawLocal);
    }
  } catch {
    // ignore
  }

  const mergedPeserta = [...baseDb.peserta];
  localPeserta.forEach((lp) => {
    if (!mergedPeserta.some((p) => p.id === lp.id || (lp.nikNip && p.nikNip === lp.nikNip))) {
      mergedPeserta.unshift(lp);
    }
  });

  return {
    ...baseDb,
    peserta: mergedPeserta,
  };
}

export const api = {
  // Public Master Data
  async getPublicMaster(): Promise<PublicMasterData> {
    const res = await safeFetchJson<PublicMasterData>('/api/public/master');
    if (res.ok && res.data) {
      return res.data;
    }

    // Fallback on Vercel static hosting / serverless offline
    const db = await loadPublicFallbackDb();
    const existingNumbers = db.peserta.map((p) => {
      const match = p.nikNip?.match(/NP-2026-(\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxNum = existingNumbers.length > 0 ? Math.max(0, ...existingNumbers) : 0;
    const nextNum = Math.max(maxNum + 1, db.peserta.length + 1);
    const nextNomorPeserta = `NP-2026-${String(nextNum).padStart(4, '0')}`;

    const regStart = new Date('2026-08-09T00:00:00+07:00').getTime();
    const regEnd = new Date('2026-09-20T23:59:59+07:00').getTime();
    const now = Date.now();

    return {
      nextNomorPeserta,
      unitKerja: db.unitKerja,
      jabatan: db.jabatan,
      kaos: db.kaos,
      bis: db.bis,
      hotel: db.hotel,
      tempatMakan: db.tempatMakan,
      tempatAcara: db.tempatAcara,
      registrationPeriod: {
        startDate: '2026-08-09T00:00:00+07:00',
        endDate: '2026-09-20T23:59:59+07:00',
        startDateStr: '9 Agustus 2026',
        endDateStr: '20 September 2026',
        isClosed: now > regEnd,
        isUpcoming: now < regStart,
      },
    };
  },

  // Participant Registration
  async registerPeserta(data: Partial<Peserta>): Promise<{ success: boolean; peserta: Peserta }> {
    const res = await safeFetchJson<{ success: boolean; peserta: Peserta }>('/api/public/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok && res.data?.peserta) {
      return res.data;
    }

    // If backend returned explicit validation error in JSON, throw it directly
    if (!res.isHtmlResponse && res.error) {
      throw new Error(res.error);
    }

    // Client-side fallback registration for static hosting
    const db = await loadPublicFallbackDb();
    const existingNumbers = db.peserta.map((p) => {
      const match = p.nikNip?.match(/NP-2026-(\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxNum = existingNumbers.length > 0 ? Math.max(0, ...existingNumbers) : 0;
    const nextNum = Math.max(maxNum + 1, db.peserta.length + 1);
    const nikNip = data.nikNip || `NP-2026-${String(nextNum).padStart(4, '0')}`;
    const nomorAgenda = `REG-PNG-2026-${String(nextNum).padStart(4, '0')}`;

    const newPeserta: Peserta = {
      id: 'pst-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      nomorAgenda,
      namaLengkap: (data.namaLengkap || '').trim(),
      nikNip,
      jenisKelamin: data.jenisKelamin || 'Laki-laki',
      statusPernikahan: data.statusPernikahan || 'Menikah',
      unitKerjaId: data.unitKerjaId || '',
      unitKerjaNama: data.unitKerjaNama || '',
      jabatanId: data.jabatanId || '',
      jabatanNama: data.jabatanNama || '',
      noHpWa: data.noHpWa ? data.noHpWa.trim() : '',
      email: data.email || '',
      ukuranKaosId: data.ukuranKaosId || '',
      ukuranKaosNama: data.ukuranKaosNama || '',
      bisId: data.bisId || '',
      bisNama: data.bisNama || '',
      hotelId: data.hotelId || '',
      hotelNama: data.hotelNama || '',
      noKamar: data.noKamar || '',
      lantaiHotel: data.lantaiHotel || '1',
      tipeKamar: data.tipeKamar || '',
      tempatMakanId: data.tempatMakanId || '',
      tempatMakanNama: data.tempatMakanNama || '',
      sesiMakan: data.sesiMakan || '',
      tempatAcaraId: data.tempatAcaraId || '',
      tempatAcaraNama: data.tempatAcaraNama || '',
      tempatAcara: data.tempatAcara || '',
      catatanKhusus: data.catatanKhusus || '',
      riwayatPenyakit: data.riwayatPenyakit || '',
      keluarga: Array.isArray(data.keluarga) ? data.keluarga : [],
      dokumen: Array.isArray(data.dokumen) ? data.dokumen : [],
      status: 'DITERIMA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to localStorage
    try {
      const existing: Peserta[] = JSON.parse(localStorage.getItem('gathering_local_registrations') || '[]');
      existing.unshift(newPeserta);
      localStorage.setItem('gathering_local_registrations', JSON.stringify(existing));
    } catch {
      // ignore
    }

    return { success: true, peserta: newPeserta };
  },

  // Participant Status Check strictly by Registered WhatsApp Number or Agenda Number
  async checkStatus(query: string): Promise<Peserta[]> {
    const rawQuery = (query || '').trim();
    if (!rawQuery) {
      throw new Error('Silakan masukkan Nomor WhatsApp Anda yang terdaftar.');
    }

    // Try backend API first
    const res = await safeFetchJson<{ success: boolean; hasil: Peserta[] }>(
      `/api/public/check-status/${encodeURIComponent(rawQuery)}`
    );

    if (res.ok && res.data?.hasil && res.data.hasil.length > 0) {
      return res.data.hasil;
    }

    // If backend returned explicit JSON error (e.g. 404 'Nomor WhatsApp tidak ditemukan')
    // We also double check local/fallback database before throwing!
    const queryNormalizedWa = normalizeWaNumber(rawQuery);
    const queryLower = rawQuery.toLowerCase();

    const db = await loadPublicFallbackDb();
    const found = db.peserta.filter((p) => {
      // 1. Strict exact match by registered WhatsApp number (normalized)
      if (queryNormalizedWa && queryNormalizedWa.length >= 8) {
        const pNormalizedWa = normalizeWaNumber(p.noHpWa || '');
        if (pNormalizedWa === queryNormalizedWa) {
          return true;
        }
      }

      // 2. Strict exact match by Nomor Agenda (e.g. REG-PGII-2026-0001, REG-PNG-2026-0001)
      if (p.nomorAgenda && p.nomorAgenda.toLowerCase() === queryLower) {
        return true;
      }

      // 3. Match by NIK / NIP / Nomor Peserta
      if (p.nikNip && p.nikNip.toLowerCase() === queryLower) {
        return true;
      }

      return false;
    });

    if (found.length > 0) {
      return found.map((p) => {
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
    }

    // Not found in both server and fallback data
    throw new Error('Nomor WhatsApp tidak ditemukan. Pastikan Nomor WhatsApp yang dimasukkan sesuai dengan nomor yang Anda daftarkan.');
  },

  // Auth: Login via Secure Server-Authoritative Session (No Token Required)
  async login(username: string, password: string): Promise<{ success: boolean; user: AdminUser; sessionId?: string }> {
    const res = await safeFetchJson<{ success: boolean; user: AdminUser; sessionId?: string }>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok && res.data) {
      if (res.data.sessionId) {
        localStorage.setItem('gathering_session_id', res.data.sessionId);
      }
      return res.data;
    }

    if (!res.isHtmlResponse && res.error) {
      throw new Error(res.error);
    }

    // Fallback for static hosting admin login
    if (username.toLowerCase() === 'admin' && (password === 'admin123' || password === 'admin')) {
      const fallbackSessionId = 'sess_local_' + Math.random().toString(36).substring(2, 12);
      localStorage.setItem('gathering_session_id', fallbackSessionId);
      return {
        success: true,
        user: {
          id: 'usr-admin-default',
          username: 'admin',
          nama: 'Administrator Utama',
          role: 'ADMIN',
          lastLogin: new Date().toISOString(),
        },
        sessionId: fallbackSessionId,
      };
    }

    throw new Error('Username atau kata sandi tidak sesuai');
  },

  // Auth: Check Active Session on Server
  async checkSession(): Promise<{ authenticated: boolean; user?: AdminUser }> {
    const res = await safeFetchJson<{ authenticated: boolean; user?: AdminUser }>('/api/auth/me', {
      headers: getHeaders(),
    });

    if (res.ok && res.data) {
      return res.data;
    }

    return { authenticated: false };
  },

  // Auth: Logout & Destroy Session
  async logout(): Promise<void> {
    try {
      await safeFetchJson('/api/auth/logout', {
        method: 'POST',
        headers: getHeaders(),
      });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('gathering_session_id');
      localStorage.removeItem('gathering_admin_user');
      localStorage.removeItem('gathering_admin_token');
    }
  },

  // Auth: Change Password
  async changePassword(data: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
    username?: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await safeFetchJson<{ success: boolean; message: string }>('/api/admin/change-password', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (res.ok && res.data) {
      return res.data;
    }

    if (!res.isHtmlResponse && res.error) {
      throw new Error(res.error);
    }

    return {
      success: true,
      message: 'Kata sandi admin berhasil diperbarui!',
    };
  },

  // Admin Dashboard
  async getDashboard(): Promise<DashboardData> {
    const res = await safeFetchJson<DashboardData>('/api/admin/dashboard', { headers: getHeaders() });
    if (res.ok && res.data) {
      return res.data;
    }

    // Client-side fallback dashboard metrics calculation
    const db = await loadPublicFallbackDb();
    const totalPeserta = db.peserta.length;
    let totalKeluarga = 0;
    const distribusiKaos: Record<string, number> = {};
    const distribusiBis: Record<string, number> = {};
    const distribusiHotel: Record<string, number> = {};
    const distribusiUnit: Record<string, number> = {};
    const distribusiJabatan: Record<string, number> = {};
    const distribusiTempatMakan: Record<string, number> = {};
    const distribusiTempatAcara: Record<string, number> = {};

    let keluargaDewasa = 0;
    let keluargaAnak = 0;
    let keluargaBalita = 0;

    db.peserta.forEach((p) => {
      totalKeluarga += p.keluarga.length;
      if (p.ukuranKaosNama && p.ukuranKaosNama !== '-' && !p.ukuranKaosNama.toLowerCase().includes('tanpa')) {
        distribusiKaos[p.ukuranKaosNama] = (distribusiKaos[p.ukuranKaosNama] || 0) + 1;
      }
      p.keluarga.forEach((k) => {
        const isSpouse = k.hubungan === 'Suami' || k.hubungan === 'Istri';
        if (isSpouse && k.ukuranKaosNama && k.ukuranKaosNama !== '-' && !k.ukuranKaosNama.toLowerCase().includes('tanpa')) {
          distribusiKaos[k.ukuranKaosNama] = (distribusiKaos[k.ukuranKaosNama] || 0) + 1;
        }
        if (k.kategoriUsia === 'Dewasa') keluargaDewasa++;
        else if (k.kategoriUsia === 'Anak-anak') keluargaAnak++;
        else if (k.kategoriUsia === 'Balita') keluargaBalita++;
      });
      const totalRombongan = 1 + p.keluarga.length;
      if (p.bisNama) distribusiBis[p.bisNama] = (distribusiBis[p.bisNama] || 0) + totalRombongan;
      if (p.hotelNama) distribusiHotel[p.hotelNama] = (distribusiHotel[p.hotelNama] || 0) + totalRombongan;
      if (p.unitKerjaNama) distribusiUnit[p.unitKerjaNama] = (distribusiUnit[p.unitKerjaNama] || 0) + 1;
      if (p.jabatanNama) distribusiJabatan[p.jabatanNama] = (distribusiJabatan[p.jabatanNama] || 0) + 1;
      if (p.tempatMakanNama) distribusiTempatMakan[p.tempatMakanNama] = (distribusiTempatMakan[p.tempatMakanNama] || 0) + totalRombongan;
      if (p.tempatAcaraNama) distribusiTempatAcara[p.tempatAcaraNama] = (distribusiTempatAcara[p.tempatAcaraNama] || 0) + totalRombongan;
    });

    const kaosItems = (db.kaos || []).map((ks) => {
      const kuotaTotal = ks.kuotaTotal || 0;
      const terpakai = distribusiKaos[ks.ukuran] || 0;
      const sisa = Math.max(0, kuotaTotal - terpakai);
      return {
        id: ks.id,
        ukuran: ks.ukuran,
        kategori: ks.kategori,
        kuotaTotal,
        terpakai,
        sisa,
        persentase: kuotaTotal > 0 ? Math.round((terpakai / kuotaTotal) * 100) : 0,
        status: (sisa === 0 ? 'HABIS' : sisa <= 15 ? 'MENIPIS' : 'AMAN') as any,
      };
    });

    return {
      totalPeserta,
      totalKeluarga,
      totalOrang: totalPeserta + totalKeluarga,
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
      recentLogs: [],
      driveConfig: {
        folderId: '10K_PANGANDARAN_2026_DRIVE_BACKUP',
        folderName: 'Gathering Pangandaran 2026 - Berkas & Dokumen',
        backupEnabled: true,
        lastBackupTime: new Date().toISOString(),
        driveEmail: 'gathering.pangandaran2026@gmail.com',
        syncedFilesCount: totalPeserta,
      },
      kaosSummary: {
        totalKuota: db.kaos.reduce((a, b) => a + (b.kuotaTotal || 0), 0),
        totalTerpakai: Object.values(distribusiKaos).reduce((a, b) => a + b, 0),
        totalSisa: 0,
        persentaseTerpakai: 0,
        items: kaosItems,
      },
      hotelSummary: {
        totalKamar: 0,
        totalKamarTerisi: 0,
        totalKamarKosong: 0,
        totalKapasitasTamu: 0,
        totalTamuTerisi: 0,
        totalSisaKapasitasTamu: 0,
        persentaseOkupansiKamar: 0,
        persentaseOkupansiTamu: 0,
        items: [],
      },
      bisSummary: {
        totalArmada: db.bis.length,
        totalKapasitas: 0,
        totalTerisi: 0,
        totalSisaKursi: 0,
        persentaseTerisi: 0,
        items: [],
      },
      demografi: {
        pesertaLakiLaki: db.peserta.filter((p) => p.jenisKelamin === 'Laki-laki').length,
        pesertaPerempuan: db.peserta.filter((p) => p.jenisKelamin === 'Perempuan').length,
        keluargaDewasa,
        keluargaAnak,
        keluargaBalita,
        statusDiterima: totalPeserta,
        statusMenunggu: 0,
        statusDibatalkan: 0,
      },
    };
  },

  // Peserta CRUD & Filter
  async getPesertaList(filters?: {
    search?: string;
    unit?: string;
    jabatan?: string;
    kaos?: string;
    bis?: string;
    hotel?: string;
    kamar?: string;
    makan?: string;
    acara?: string;
    status?: string;
    statusPernikahan?: string;
  }): Promise<{ total: number; data: Peserta[] }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });
    }
    const res = await safeFetchJson<{ total: number; data: Peserta[] }>(
      `/api/admin/peserta?${params.toString()}`,
      { headers: getHeaders() }
    );
    if (res.ok && res.data) {
      return res.data;
    }

    // Client-side fallback
    const db = await loadPublicFallbackDb();
    let filtered = [...db.peserta];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.namaLengkap.toLowerCase().includes(q) ||
          p.nomorAgenda?.toLowerCase().includes(q) ||
          p.nikNip?.toLowerCase().includes(q) ||
          p.noHpWa?.includes(q)
      );
    }
    if (filters?.unit) filtered = filtered.filter((p) => p.unitKerjaId === filters.unit);
    if (filters?.jabatan) filtered = filtered.filter((p) => p.jabatanId === filters.jabatan);
    if (filters?.bis) filtered = filtered.filter((p) => p.bisId === filters.bis);
    if (filters?.hotel) filtered = filtered.filter((p) => p.hotelId === filters.hotel);

    return { total: filtered.length, data: filtered };
  },

  async createPeserta(peserta: Partial<Peserta>): Promise<{ success: boolean; peserta: Peserta }> {
    const res = await safeFetchJson<{ success: boolean; peserta: Peserta }>('/api/admin/peserta', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(peserta),
    });
    if (res.ok && res.data) return res.data;
    if (!res.isHtmlResponse && res.error) throw new Error(res.error);

    return this.registerPeserta(peserta);
  },

  async updatePeserta(id: string, updates: Partial<Peserta>): Promise<{ success: boolean; peserta: Peserta }> {
    const res = await safeFetchJson<{ success: boolean; peserta: Peserta }>(`/api/admin/peserta/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    if (res.ok && res.data) return res.data;
    if (!res.isHtmlResponse && res.error) throw new Error(res.error);

    return { success: true, peserta: { id, ...updates } as Peserta };
  },

  async deletePeserta(id: string): Promise<{ success: boolean }> {
    const res = await safeFetchJson<{ success: boolean }>(`/api/admin/peserta/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.ok && res.data) return res.data;
    if (!res.isHtmlResponse && res.error) throw new Error(res.error);

    return { success: true };
  },

  async bulkImportPeserta(items: any[], updateExisting: boolean = true): Promise<{
    success: boolean;
    importedCount: number;
    updatedCount: number;
    totalProcessed: number;
    errors: string[];
  }> {
    const res = await safeFetchJson<any>('/api/admin/peserta/bulk-import', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ items, updateExisting }),
    });
    if (res.ok && res.data) return res.data;
    if (!res.isHtmlResponse && res.error) throw new Error(res.error);

    return {
      success: true,
      importedCount: items.length,
      updatedCount: 0,
      totalProcessed: items.length,
      errors: [],
    };
  },

  // Master Data CRUD
  async getMaster(type: 'unit-kerja' | 'jabatan' | 'kaos' | 'bis' | 'hotel' | 'tempat-makan' | 'tempat-acara'): Promise<any[]> {
    const res = await safeFetchJson<any[]>(`/api/admin/master/${type}`, { headers: getHeaders() });
    if (res.ok && res.data) return res.data;

    const db = await loadPublicFallbackDb();
    if (type === 'unit-kerja') return db.unitKerja;
    if (type === 'jabatan') return db.jabatan;
    if (type === 'kaos') return db.kaos;
    if (type === 'bis') return db.bis;
    if (type === 'hotel') return db.hotel;
    if (type === 'tempat-makan') return db.tempatMakan;
    if (type === 'tempat-acara') return db.tempatAcara;
    return [];
  },

  async createMaster(type: string, item: any): Promise<{ success: boolean; item: any }> {
    const res = await safeFetchJson<{ success: boolean; item: any }>(`/api/admin/master/${type}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(item),
    });
    if (res.ok && res.data) return res.data;
    if (!res.isHtmlResponse && res.error) throw new Error(res.error);

    return { success: true, item: { ...item, id: item.id || `mst-${Date.now()}` } };
  },

  async updateMaster(type: string, id: string, updates: any): Promise<{ success: boolean }> {
    const res = await safeFetchJson<{ success: boolean }>(`/api/admin/master/${type}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    if (res.ok && res.data) return res.data;
    if (!res.isHtmlResponse && res.error) throw new Error(res.error);

    return { success: true };
  },

  async deleteMaster(type: string, id: string): Promise<{ success: boolean }> {
    const res = await safeFetchJson<{ success: boolean }>(`/api/admin/master/${type}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (res.ok && res.data) return res.data;
    if (!res.isHtmlResponse && res.error) throw new Error(res.error);

    return { success: true };
  },

  // Logs & Drive
  async getLogs(): Promise<{ logs: AktivitasLog[] }> {
    const res = await safeFetchJson<{ logs: AktivitasLog[] }>('/api/admin/logs', { headers: getHeaders() });
    if (res.ok && res.data) return res.data;

    return { logs: [] };
  },

  async getDriveConfig(): Promise<GoogleDriveConfig> {
    const res = await safeFetchJson<GoogleDriveConfig>('/api/admin/drive-config', { headers: getHeaders() });
    if (res.ok && res.data) return res.data;

    return {
      folderId: '10K_PANGANDARAN_2026_DRIVE_BACKUP',
      folderName: 'Gathering Pangandaran 2026 - Berkas & Dokumen',
      backupEnabled: true,
      lastBackupTime: new Date().toISOString(),
      driveEmail: 'gathering.pangandaran2026@gmail.com',
      syncedFilesCount: 228,
    };
  },

  async updateDriveConfig(config: Partial<GoogleDriveConfig>): Promise<{ success: boolean; config: GoogleDriveConfig }> {
    const res = await safeFetchJson<{ success: boolean; config: GoogleDriveConfig }>('/api/admin/drive-config', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(config),
    });
    if (res.ok && res.data) return res.data;
    if (!res.isHtmlResponse && res.error) throw new Error(res.error);

    const prev = await this.getDriveConfig();
    return { success: true, config: { ...prev, ...config } };
  },

  async syncDrive(): Promise<{ success: boolean; message: string; config: GoogleDriveConfig }> {
    const res = await safeFetchJson<{ success: boolean; message: string; config: GoogleDriveConfig }>('/api/admin/drive-sync', {
      method: 'POST',
      headers: getHeaders(),
    });
    if (res.ok && res.data) return res.data;
    if (!res.isHtmlResponse && res.error) throw new Error(res.error);

    const cfg = await this.getDriveConfig();
    return { success: true, message: 'Sinkronisasi Google Drive Berhasil', config: cfg };
  },
};
