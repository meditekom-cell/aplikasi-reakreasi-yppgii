import React from 'react';
import { 
  Users, 
  UserCheck, 
  Building2, 
  Briefcase, 
  Shirt, 
  Bus, 
  Hotel, 
  Utensils, 
  Layers, 
  History, 
  HardDrive, 
  LayoutDashboard, 
  UserPlus, 
  Search, 
  LogOut, 
  ShieldCheck,
  Compass,
  X
} from 'lucide-react';
import { AdminUser } from '../types';

export type NavTab = 
  | 'pendaftaran'
  | 'cek-status'
  | 'dashboard'
  | 'peserta'
  | 'keluarga'
  | 'master-data'
  | 'google-drive'
  | 'log-aktivitas';

interface SidebarProps {
  currentTab?: NavTab;
  activeTab?: NavTab;
  setCurrentTab?: (tab: NavTab) => void;
  onTabSelect?: (tab: NavTab) => void;
  adminUser: AdminUser | null;
  onLogout: () => void;
  onOpenLogin: () => void;
  isOpenMobile?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  setIsMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  activeTab,
  setCurrentTab,
  onTabSelect,
  adminUser,
  onLogout,
  onOpenLogin,
  isOpenMobile,
  isMobileOpen,
  onCloseMobile,
  setIsMobileOpen,
}) => {
  const selectedTab = activeTab || currentTab || 'cek-status';
  const handleSelect = onTabSelect || setCurrentTab || (() => {});
  const isMobile = isMobileOpen ?? isOpenMobile ?? false;
  const handleCloseMobile = onCloseMobile || (() => setIsMobileOpen?.(false));
  const publicNavItems = [
    { id: 'pendaftaran' as NavTab, label: 'Formulir Pendaftaran', icon: UserPlus, desc: 'Pendaftaran Peserta & Keluarga' },
  ];

  const adminNavItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard Admin', icon: LayoutDashboard, desc: 'Statistik & Ringkasan Data' },
    { id: 'peserta' as NavTab, label: 'Data Peserta (CRUD)', icon: Users, desc: 'Kelola Peserta, Filter & Ekspor' },
    { id: 'keluarga' as NavTab, label: 'Anggota Keluarga', icon: UserCheck, desc: 'Daftar Pendamping & Kaos' },
    { id: 'master-data' as NavTab, label: 'Master Data & Alokasi', icon: Layers, desc: 'Unit, Jabatan, Bis, Hotel, Makan' },
    { id: 'google-drive' as NavTab, label: 'Google Drive & Dokumen', icon: HardDrive, desc: 'Backup & Berkas Terunggah' },
    { id: 'log-aktivitas' as NavTab, label: 'Log Aktivitas & Audit', icon: History, desc: 'Jejak Perubahan Sistem' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={handleCloseMobile}
        />
      )}

      {/* Sidebar Navigation Panel with Dark Slate Theme (#0F172A) */}
      <aside 
        id="app-sidebar"
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-72 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobile ? 'translate-x-0' : '-translate-x-full'
        } bg-[#0F172A] border-r border-slate-800 text-slate-200 shadow-2xl overflow-y-auto`}
      >
        {/* Header Branding */}
        <div>
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5 font-['Outfit',sans-serif]">
                  PANGANDARAN <span className="text-cyan-400">2026</span>
                </h1>
                <p className="text-xs text-slate-400 font-medium tracking-wide">
                  Gathering & Rekreasi Akbar
                </p>
              </div>
            </div>
            <button
              onClick={handleCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Public / Peserta Section */}
          <div className="px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              Layanan Peserta
            </div>
            <nav className="space-y-1">
              {publicNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = selectedTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    onClick={() => {
                      handleSelect(item.id);
                      handleCloseMobile();
                    }}
                    className={`w-full flex items-start gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium leading-snug">{item.label}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Admin Management Section */}
          <div className="px-4 py-2 border-t border-slate-800/80">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                Panel Administrasi
              </div>
              {adminUser ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md font-mono font-bold">
                  {adminUser.role}
                </span>
              ) : (
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md">
                  Terkunci
                </span>
              )}
            </div>

            <nav className="space-y-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = selectedTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    onClick={() => {
                      if (!adminUser) {
                        onOpenLogin();
                      } else {
                        handleSelect(item.id);
                        handleCloseMobile();
                      }
                    }}
                    className={`w-full flex items-start gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium leading-snug flex items-center justify-between">
                        <span>{item.label}</span>
                        {!adminUser && <span className="text-[10px] text-slate-400">🔒</span>}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Account / Footer Status */}
        <div className="p-4 border-t border-slate-800/90 bg-slate-950/40">
          {adminUser ? (
            <div className="flex items-center justify-between gap-3 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{adminUser.nama}</p>
                  <p className="text-[10px] text-slate-400 truncate">@{adminUser.username} • {adminUser.role}</p>
                </div>
              </div>
              <button
                id="btn-logout"
                onClick={onLogout}
                title="Keluar Admin"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="btn-sidebar-login"
              onClick={onOpenLogin}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition-all shadow-xs"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Login Administrator</span>
            </button>
          )}

          <div className="mt-3 text-center">
            <p className="text-[10px] text-slate-400">
              Rekreasi Pangandaran © 2026
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
