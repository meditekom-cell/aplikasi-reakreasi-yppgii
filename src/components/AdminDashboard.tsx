import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Shirt, 
  Bus, 
  Hotel, 
  Utensils, 
  HardDrive, 
  Layers, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Activity,
  AlertTriangle,
  ArrowRight,
  BedDouble,
  SlidersHorizontal,
  ChevronRight,
  KeyRound,
  Shield,
  Lock
} from 'lucide-react';
import { api, DashboardData } from '../services/api';
import { NavTab } from './Sidebar';

interface AdminDashboardProps {
  onNavigate: (tab: NavTab) => void;
  onOpenChangePassword?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, onOpenChangePassword }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [kaosFilter, setKaosFilter] = useState<'ALL' | 'TERSEDIA' | 'MENIPIS'>('ALL');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setData(res);
      setLastUpdated(new Date().toLocaleTimeString('id-ID'));
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSync = async () => {
    try {
      setSyncing(true);
      await api.syncDrive();
      await loadDashboard();
    } catch (err: any) {
      alert('Sync gagal: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold text-slate-200">Memuat Statistik Real-Time Gathering Pangandaran 2026...</p>
        <p className="text-xs text-slate-500 mt-1">Menghitung kuota kaos, alokasi hotel, dan kapasitas bus</p>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <p className="text-sm font-semibold text-rose-300">{errorMsg || 'Data dashboard tidak tersedia'}</p>
        <button
          onClick={loadDashboard}
          className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
        >
          Coba Muat Ulang
        </button>
      </div>
    );
  }

  // Filtered kaos items
  const filteredKaos = data.kaosSummary?.items?.filter((item) => {
    if (kaosFilter === 'TERSEDIA') return item.sisa > 0 && item.status !== 'MENIPIS';
    if (kaosFilter === 'MENIPIS') return item.status === 'MENIPIS' || item.sisa === 0;
    return true;
  }) || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800/80 p-5 sm:p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
              Live Monitoring Dashboard
            </span>
            {lastUpdated && (
              <span className="text-[11px] text-slate-500 font-mono">
                • Update: {lastUpdated}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit',sans-serif] flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-cyan-400" />
            Executive Dashboard Gathering 2026
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Ringkasan terpadu kuota kaos, ketersediaan kamar hotel, alokasi bus, dan data demografi seluruh rombongan secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {onOpenChangePassword && (
            <button
              onClick={onOpenChangePassword}
              title="Ubah Kata Sandi Akun Administrator"
              id="btn-dashboard-change-password"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Ganti Password</span>
            </button>
          )}
          <button
            onClick={loadDashboard}
            title="Muat Ulang Data Real-Time"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 text-xs font-semibold"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleQuickSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all disabled:opacity-50"
          >
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span>{syncing ? 'Menyinkronkan...' : 'Sync G-Drive'}</span>
          </button>
        </div>
      </div>

      {/* Top 5 Primary Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Pegawai (Peserta Utama) */}
        <div 
          onClick={() => onNavigate('peserta')}
          className="cursor-pointer group bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 p-5 rounded-3xl shadow-lg transition-all hover:translate-y-[-2px]"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Pegawai (Peserta)</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-['Outfit',sans-serif] tracking-tight">
            {data.totalPeserta} <span className="text-xs font-normal text-slate-400">Orang</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-emerald-400 font-medium">Diterima: {data.demografi?.statusDiterima ?? data.totalPeserta}</span>
            {data.demografi?.statusMenunggu > 0 && (
              <span className="text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded">
                +{data.demografi.statusMenunggu} Baru
              </span>
            )}
          </div>
        </div>

        {/* 2. Total Anggota Keluarga */}
        <div 
          onClick={() => onNavigate('keluarga')}
          className="cursor-pointer group bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 p-5 rounded-3xl shadow-lg transition-all hover:translate-y-[-2px]"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Anggota Keluarga</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-['Outfit',sans-serif] tracking-tight">
            {data.totalKeluarga} <span className="text-xs font-normal text-slate-400">Orang</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Dewasa: <strong className="text-indigo-300 font-mono">{data.demografi?.keluargaDewasa ?? 0}</strong></span>
            <span>•</span>
            <span>Anak: <strong className="text-indigo-300 font-mono">{data.demografi?.keluargaAnak ?? 0}</strong></span>
          </div>
        </div>

        {/* 3. Total Keseluruhan Rombongan = Pegawai + Anggota Keluarga */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/40 p-5 rounded-3xl shadow-lg">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">Total Rombongan</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-cyan-300 font-['Outfit',sans-serif] tracking-tight">
            {data.totalOrang} <span className="text-sm font-medium text-slate-400">Jiwa</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-indigo-900/50 text-[11px] text-indigo-200/90 font-medium">
            Pegawai ({data.totalPeserta}) + Keluarga ({data.totalKeluarga})
          </div>
        </div>

        {/* 4. Sisa Kuota Kaos */}
        <div 
          onClick={() => onNavigate('master-data')}
          className="cursor-pointer group bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-3xl shadow-lg transition-all hover:translate-y-[-2px]"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sisa Kuota Kaos</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400 font-['Outfit',sans-serif] tracking-tight">
            {data.kaosSummary?.totalSisa ?? 0} <span className="text-xs font-normal text-slate-400">/ {data.kaosSummary?.totalKuota ?? 0}</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Terpakai: <strong className="text-slate-200">{data.kaosSummary?.totalTerpakai ?? data.totalOrang} pcs</strong></span>
            <span className="font-mono text-emerald-400 font-bold">{data.kaosSummary?.persentaseTerpakai ?? 0}%</span>
          </div>
        </div>

        {/* 5. Okupansi Kamar Hotel */}
        <div 
          onClick={() => onNavigate('master-data')}
          className="cursor-pointer group bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 p-5 rounded-3xl shadow-lg transition-all hover:translate-y-[-2px]"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Okupansi Kamar</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Hotel className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-300 font-['Outfit',sans-serif] tracking-tight">
            {data.hotelSummary?.totalKamarTerisi ?? 0} <span className="text-xs font-normal text-slate-400">/ {data.hotelSummary?.totalKamar ?? 0} Kamar</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Sisa Kamar: <strong className="text-emerald-400">{data.hotelSummary?.totalKamarKosong ?? 0}</strong></span>
            <span className="font-mono text-amber-400 font-bold">{data.hotelSummary?.persentaseOkupansiKamar ?? 0}%</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION: REAL-TIME QUOTA & ALLOCATION SUMMARY CARDS     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* CARD 1: Sisa Kuota Kaos Gathering (Visual Progress Breakdown) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 font-['Outfit',sans-serif]">
                  <Shirt className="w-5 h-5 text-emerald-400" />
                  Sisa Kuota Kaos Gathering
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Statistik ketersediaan ukuran kaos berdasarkan total pengadaan panitia.
                </p>
              </div>

              {/* Filter Kuota Kaos */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs self-start sm:self-auto">
                <button
                  onClick={() => setKaosFilter('ALL')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    kaosFilter === 'ALL'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setKaosFilter('TERSEDIA')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    kaosFilter === 'TERSEDIA'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tersedia
                </button>
                <button
                  onClick={() => setKaosFilter('MENIPIS')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    kaosFilter === 'MENIPIS'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Menipis / Habis
                </button>
              </div>
            </div>

            {/* Overall Kaos Meter Banner */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 mb-5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-300 font-semibold">Total Pengadaan Kaos Rombongan</span>
                <span className="font-mono font-bold text-white">
                  {data.kaosSummary?.totalTerpakai ?? 0} / {data.kaosSummary?.totalKuota ?? 0} pcs ({data.kaosSummary?.persentaseTerpakai ?? 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${Math.max(data.kaosSummary?.persentaseTerpakai ?? 0, 4)}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Kuota</div>
                  <div className="text-base font-bold text-white font-mono">{data.kaosSummary?.totalKuota ?? 0} pcs</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Terpakai</div>
                  <div className="text-base font-bold text-cyan-400 font-mono">{data.kaosSummary?.totalTerpakai ?? 0} pcs</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Sisa Tersedia</div>
                  <div className="text-base font-bold text-emerald-400 font-mono">{data.kaosSummary?.totalSisa ?? 0} pcs</div>
                </div>
              </div>
            </div>

            {/* Size Breakdown List */}
            <div className="space-y-3">
              {filteredKaos.map((ks) => {
                const isHabis = ks.sisa === 0;
                const isMenipis = ks.status === 'MENIPIS';

                return (
                  <div 
                    key={ks.id}
                    className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-2xl hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{ks.ukuran.replace(/\s*Dewasa/gi, '').trim()}</span>
                        {ks.kategori && ks.kategori.toLowerCase() !== 'dewasa' && ks.kategori.toLowerCase() !== 'standar' && (
                          <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded font-medium">
                            {ks.kategori}
                          </span>
                        )}
                        {isHabis ? (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded">
                            KUOTA HABIS
                          </span>
                        ) : isMenipis ? (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
                            SISA SEDIKIT
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            AMAN
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {ks.terpakai} / {ks.kuotaTotal} pcs
                        </span>
                        <span className="text-slate-400 text-[11px] ml-1.5">
                          (Sisa: <strong className={isHabis ? 'text-rose-400' : isMenipis ? 'text-amber-400' : 'text-emerald-400'}>{ks.sisa}</strong>)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isHabis 
                            ? 'bg-rose-500' 
                            : isMenipis 
                            ? 'bg-gradient-to-r from-amber-500 to-orange-400' 
                            : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        }`}
                        style={{ width: `${Math.max(ks.persentase, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Varian: {filteredKaos.length} Ukuran</span>
            <button
              onClick={() => onNavigate('master-data')}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              Kelola Kuota Kaos <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 2: Alokasi & Okupansi Kamar Hotel (Visual Room & Bed Breakdown) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 font-['Outfit',sans-serif]">
                  <Hotel className="w-5 h-5 text-amber-400" />
                  Alokasi & Okupansi Kamar Hotel
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Distribusi kamar dan keterisian ranjang peserta & keluarga per hotel.
                </p>
              </div>
              <button
                onClick={() => onNavigate('master-data')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 shrink-0"
              >
                Data Hotel <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Overall Hotel Summary Box */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 mb-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/60">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Kamar</div>
                  <div className="text-lg font-black text-white font-mono mt-0.5">{data.hotelSummary?.totalKamar ?? 0}</div>
                  <div className="text-[10px] text-slate-500">Unit Tersedia</div>
                </div>
                <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/60">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Kamar Terisi</div>
                  <div className="text-lg font-black text-amber-400 font-mono mt-0.5">{data.hotelSummary?.totalKamarTerisi ?? 0}</div>
                  <div className="text-[10px] text-amber-400/80 font-mono font-semibold">{data.hotelSummary?.persentaseOkupansiKamar ?? 0}% Terisi</div>
                </div>
                <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/60">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Sisa Kamar Kosong</div>
                  <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">{data.hotelSummary?.totalKamarKosong ?? 0}</div>
                  <div className="text-[10px] text-emerald-400/80">Siap Ditempati</div>
                </div>
                <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/60">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Tamu Terakomodasi</div>
                  <div className="text-lg font-black text-cyan-300 font-mono mt-0.5">{data.hotelSummary?.totalTamuTerisi ?? 0}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Kapasitas {data.hotelSummary?.totalKapasitasTamu ?? 0}</div>
                </div>
              </div>
            </div>

            {/* Individual Hotel Breakdown */}
            <div className="space-y-3.5">
              {data.hotelSummary?.items?.map((htl) => {
                return (
                  <div
                    key={htl.id}
                    className="p-4 bg-slate-950/40 border border-slate-800/70 rounded-2xl space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <BedDouble className="w-4 h-4 text-amber-400" />
                          {htl.namaHotel}
                        </h4>
                        <p className="text-[11px] text-slate-400">{htl.lokasi}</p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                          {htl.kamarTerisi} / {htl.totalKamar} Kamar ({htl.persentaseKamar}%)
                        </span>
                        <span className="text-[11px] font-mono text-slate-300 bg-slate-800 px-2 py-1 rounded-lg">
                          {htl.tamuTerisi} Tamu
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Kamar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Okupansi Kamar</span>
                        <span className="text-slate-300 font-medium">Sisa: <strong className="text-emerald-400">{htl.kamarKosong} kamar kosong</strong></span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-orange-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(htl.persentaseKamar, 4)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Properti: {data.hotelSummary?.items?.length || 0} Penginapan</span>
            <button
              onClick={() => onNavigate('peserta')}
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              Lihat Penempatan Kamar Peserta <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION: TRANSPORTATION (BUS) & CATERING SUMMARY        */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Distribusi Armada Bis */}
        <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-['Outfit',sans-serif]">
                <Bus className="w-5 h-5 text-blue-400" />
                Keterisian Armada Bis ({data.bisSummary?.totalArmada ?? data.totalBis} Armada)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Total Kursi: {data.bisSummary?.totalKapasitas ?? 0} • Terisi: {data.bisSummary?.totalTerisi ?? data.totalOrang} • Sisa Kursi: <strong className="text-emerald-400">{data.bisSummary?.totalSisaKursi ?? 0}</strong>
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 shrink-0">
              {data.bisSummary?.persentaseTerisi ?? 0}% Terisi
            </span>
          </div>

          <div className="space-y-3">
            {data.bisSummary?.items?.map((bis) => {
              const isPenuh = bis.sisa === 0;
              const isHampirPenuh = bis.status === 'HAMPIR_PENUH';

              return (
                <div key={bis.id} className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white text-sm mr-2">{bis.nomorBis}</span>
                      <span className="text-slate-400 text-xs truncate max-w-[200px] inline-block align-middle">{bis.namaBis}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-blue-400 font-bold">{bis.terisi} / {bis.kapasitas} Kursi</span>
                      <span className="text-slate-400 text-[11px] ml-1">
                        (Sisa: <strong className={isPenuh ? 'text-rose-400' : isHampirPenuh ? 'text-amber-400' : 'text-emerald-400'}>{bis.sisa}</strong>)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isPenuh 
                          ? 'bg-rose-500' 
                          : isHampirPenuh 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-400' 
                          : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                      }`}
                      style={{ width: `${Math.max(bis.persentase, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribusi Tempat Makan & Gala Dinner */}
        <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-['Outfit',sans-serif]">
                <Utensils className="w-5 h-5 text-rose-400" />
                Alokasi Restoran & Gala Dinner
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Kapasitas tempat makan seafood dan banquet pantai Pangandaran.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-medium">Total: {data.totalOrang} Pax</span>
          </div>

          <div className="space-y-3">
            {Object.entries(data.distribusiTempatMakan).map(([resto, count]) => (
              <div key={resto} className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60 flex items-center justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-white truncate">{resto}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Makan Bersama Rombongan</p>
                </div>
                <span className="font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg shrink-0">
                  {count} Pax
                </span>
              </div>
            ))}
          </div>

          {/* Unit Kerja Overview */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Sebaran Unit Kerja Terbanyak
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {Object.entries(data.distribusiUnit).map(([unit, count]) => (
                <div key={unit} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/50 last:border-0">
                  <span className="font-medium text-slate-300 truncate max-w-[240px]">{unit}</span>
                  <span className="font-bold text-indigo-300 font-mono bg-slate-800 px-2 py-0.5 rounded">
                    {count} Peserta
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Audit Logs Box */}
      <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-['Outfit',sans-serif]">
              <Clock className="w-5 h-5 text-cyan-400" />
              Jejak Aktivitas & Audit Sistem Real-Time
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Setiap aksi registrasi, mutasi kamar/bis, dan login admin tercatat secara immutable.
            </p>
          </div>
          <button
            onClick={() => onNavigate('log-aktivitas')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            Lihat Semua Log <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800 text-xs">
          {data.recentLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 px-2 py-0.5 rounded-md bg-slate-800 font-mono text-[10px] text-cyan-400 font-bold uppercase">
                  {log.kategori}
                </span>
                <div>
                  <p className="text-slate-200 font-medium">{log.rincian}</p>
                  <p className="text-[11px] text-slate-500">Oleh: {log.adminUser} {log.ipAddress ? `(${log.ipAddress})` : ''}</p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                {new Date(log.timestamp).toLocaleTimeString('id-ID')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Security & Account Management Banner inside Dashboard */}
      {onOpenChangePassword && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border border-amber-500/20 p-5 sm:p-6 rounded-3xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 font-['Outfit',sans-serif]">
                Keamanan & Kredensial Administrator
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-semibold">
                  PRIVAT
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Amankan akses sistem dengan memperbarui kata sandi admin secara berkala melalui protokol enkripsi SHA-256 + Unique Salt.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenChangePassword}
            id="btn-bottom-change-password"
            className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm shadow-amber-500/10"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Ubah Kata Sandi Admin</span>
          </button>
        </div>
      )}
    </div>
  );
};
