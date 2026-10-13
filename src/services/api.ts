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
  const user = localStorage.getItem('gathering_admin_user');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (user) {
    try {
      const parsed = JSON.parse(user);
      headers['x-admin-user'] = parsed.username || 'ADMIN';
    } catch {
      // ignore
    }
  }
  return headers;
};

export const api = {
  // Public
  async getPublicMaster(): Promise<PublicMasterData> {
    const res = await fetch('/api/public/master');
    if (!res.ok) throw new Error('Gagal memuat data referensi');
    return res.json();
  },

  async registerPeserta(data: Partial<Peserta>): Promise<{ success: boolean; peserta: Peserta }> {
    const res = await fetch('/api/public/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Gagal mendaftar');
    return result;
  },

  async checkStatus(query: string): Promise<Peserta[]> {
    const res = await fetch(`/api/public/check-status/${encodeURIComponent(query)}`);
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Data tidak ditemukan');
    return result.hasil;
  },

  // Auth
  async login(username: string, password: string): Promise<{ success: boolean; user: AdminUser; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Login gagal');
    return result;
  },

  async changePassword(data: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
    username?: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Gagal mengubah kata sandi');
    return result;
  },

  // Admin Dashboard
  async getDashboard(): Promise<DashboardData> {
    const res = await fetch('/api/admin/dashboard', { headers: getHeaders() });
    if (!res.ok) throw new Error('Gagal memuat dashboard');
    return res.json();
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
    const res = await fetch(`/api/admin/peserta?${params.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Gagal memuat daftar peserta');
    return res.json();
  },

  async createPeserta(peserta: Partial<Peserta>): Promise<{ success: boolean; peserta: Peserta }> {
    const res = await fetch('/api/admin/peserta', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(peserta),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Gagal menambahkan peserta');
    return result;
  },

  async updatePeserta(id: string, updates: Partial<Peserta>): Promise<{ success: boolean; peserta: Peserta }> {
    const res = await fetch(`/api/admin/peserta/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Gagal memperbarui peserta');
    return result;
  },

  async deletePeserta(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/admin/peserta/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Gagal menghapus peserta');
    return result;
  },

  async bulkImportPeserta(items: any[], updateExisting: boolean = true): Promise<{
    success: boolean;
    importedCount: number;
    updatedCount: number;
    totalProcessed: number;
    errors: string[];
  }> {
    const res = await fetch('/api/admin/peserta/bulk-import', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ items, updateExisting }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Gagal mengimpor data peserta');
    return result;
  },

  // Master Data CRUD
  async getMaster(type: 'unit-kerja' | 'jabatan' | 'kaos' | 'bis' | 'hotel' | 'tempat-makan' | 'tempat-acara'): Promise<any[]> {
    const res = await fetch(`/api/admin/master/${type}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Gagal memuat master ${type}`);
    return res.json();
  },

  async createMaster(type: string, item: any): Promise<{ success: boolean; item: any }> {
    const res = await fetch(`/api/admin/master/${type}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(item),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Gagal menambahkan master data');
    return result;
  },

  async updateMaster(type: string, id: string, updates: any): Promise<{ success: boolean }> {
    const res = await fetch(`/api/admin/master/${type}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Gagal memperbarui master data');
    return result;
  },

  async deleteMaster(type: string, id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/admin/master/${type}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Gagal menghapus master data');
    return result;
  },

  // Logs & Drive
  async getLogs(): Promise<{ logs: AktivitasLog[] }> {
    const res = await fetch('/api/admin/logs', { headers: getHeaders() });
    if (!res.ok) throw new Error('Gagal memuat log aktivitas');
    return res.json();
  },

  async getDriveConfig(): Promise<GoogleDriveConfig> {
    const res = await fetch('/api/admin/drive-config', { headers: getHeaders() });
    if (!res.ok) throw new Error('Gagal memuat konfigurasi Google Drive');
    return res.json();
  },

  async updateDriveConfig(config: Partial<GoogleDriveConfig>): Promise<{ success: boolean; config: GoogleDriveConfig }> {
    const res = await fetch('/api/admin/drive-config', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(config),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Gagal memperbarui Google Drive');
    return result;
  },

  async syncDrive(): Promise<{ success: boolean; message: string; config: GoogleDriveConfig }> {
    const res = await fetch('/api/admin/drive-sync', {
      method: 'POST',
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Sinkronisasi gagal');
    return result;
  },
};
