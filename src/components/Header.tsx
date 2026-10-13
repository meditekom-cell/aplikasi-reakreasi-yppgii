import React from 'react';
import { Menu, Shield, Cloud, Lock, Sparkles, CheckCircle2, Compass, LayoutDashboard } from 'lucide-react';
import { AdminUser } from '../types';
import { NavTab } from './Sidebar';

interface HeaderProps {
  currentTab?: NavTab;
  activeTab?: NavTab;
  onOpenMobileMenu?: () => void;
  onToggleMobileSidebar?: () => void;
  adminUser: AdminUser | null;
  onOpenLogin: () => void;
  onLogout?: () => void;
  onNavigate: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  activeTab,
  onOpenMobileMenu,
  onToggleMobileSidebar,
  adminUser,
  onOpenLogin,
  onLogout,
  onNavigate,
}) => {
  const selectedTab = activeTab || currentTab || 'cek-status';
  const handleOpenMobile = onOpenMobileMenu || onToggleMobileSidebar || (() => {});

  const getTabInfo = () => {
    switch (selectedTab) {
      case 'pendaftaran':
        return { title: 'Formulir Pendaftaran Gathering', sub: 'Registrasi Resmi Peserta & Keluarga - Pangandaran 2026' };
      case 'cek-status':
        return { title: 'Cek Status & Kartu Peserta', sub: 'Pencarian Data, Unduh & Cetak Kartu Registrasi Gathering' };
      case 'dashboard':
        return { title: 'Dashboard Administrasi', sub: 'Ringkasan Statistik, Distribusi Rombongan & Log Aktivitas' };
      case 'peserta':
        return { title: 'Kelola Data Peserta', sub: 'Manajemen Data Lengkap, Multi-Filter, Bis, Hotel & Ekspor' };
      case 'keluarga':
        return { title: 'Daftar Anggota Keluarga', sub: 'Rincian Pendamping, Kategori Usia & Alokasi Kaos' };
      case 'master-data':
        return { title: 'Master Data & Konfigurasi', sub: 'Unit Kerja, Jabatan, Kaos, Armada Bis, Hotel, Tempat Makan' };
      case 'google-drive':
        return { title: 'Penyimpanan Google Drive', sub: 'Manajemen Berkas Lampiran & Backup Otomatis Dokumen' };
      case 'log-aktivitas':
        return { title: 'Log Aktivitas & Audit Trail', sub: 'Rekaman Jejak Sistem & Keamanan Data (Anti-Collision Lock)' };
      default:
        return { title: 'Gathering Rekreasi Pangandaran 2026', sub: 'Sistem Informasi & Manajemen Kegiatan' };
    }
  };

  const info = getTabInfo();

  return (
    <header className="sticky top-0 z-30 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {selectedTab === 'cek-status' ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 shrink-0">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight font-['Outfit',sans-serif] flex items-center gap-1.5">
                PANGANDARAN <span className="text-cyan-400">2026</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Cek Status & Kartu Peserta
              </p>
            </div>
          </div>
        ) : (
          <>
            <button
              id="btn-mobile-menu"
              onClick={handleOpenMobile}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight font-['Outfit',sans-serif] flex items-center gap-2">
                {info.title}
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">
                {info.sub}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sleek System Badges */}
        <div className="hidden xl:flex items-center gap-2 text-[11px] bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60 text-slate-300">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <Lock className="w-3.5 h-3.5" /> LockService Aktif
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-cyan-400 font-medium">
            <Cloud className="w-3.5 h-3.5" /> G-Drive Ready
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-indigo-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> NoSQL Safe
          </span>
        </div>

        {/* Public vs Admin Fast Action */}
        {selectedTab === 'pendaftaran' ? (
          <button
            onClick={() => onNavigate('cek-status')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cek Status</span>
          </button>
        ) : selectedTab === 'cek-status' ? null : (
          <button
            onClick={() => onNavigate('cek-status')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cek Status & Kartu</span>
          </button>
        )}

        {/* Admin Shortcut when logged in on cek-status */}
        {adminUser && selectedTab === 'cek-status' && (
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-semibold border border-indigo-500/40 transition-colors cursor-pointer"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard Admin</span>
          </button>
        )}

        {/* Admin Login Button if not logged in */}
        {!adminUser && (
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-semibold border border-indigo-500/40 transition-colors cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Login Admin</span>
          </button>
        )}
      </div>
    </header>
  );
};
