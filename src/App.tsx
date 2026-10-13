import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { RegistrationForm } from './components/RegistrationForm';
import { CheckStatusView } from './components/CheckStatusView';
import { AdminDashboard } from './components/AdminDashboard';
import { PesertaManagement } from './components/PesertaManagement';
import { FamilyManagement } from './components/FamilyManagement';
import { MasterDataManagement } from './components/MasterDataManagement';
import { DriveSyncView } from './components/DriveSyncView';
import { ActivityLogsView } from './components/ActivityLogsView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ParticipantCardModal } from './components/ParticipantCardModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AutoInstallModal } from './components/AutoInstallModal';
import { AdminUser, Peserta } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('cek-status');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [targetTabAfterLogin, setTargetTabAfterLogin] = useState<NavTab | null>(null);
  const [registeredCard, setRegisteredCard] = useState<Peserta | null>(null);

  // Check existing session
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('gathering_admin_user');
      const savedToken = localStorage.getItem('gathering_admin_token');
      if (savedUser && savedToken) {
        setAdminUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleTabSelect = (tab: NavTab) => {
    const adminOnlyTabs: NavTab[] = ['dashboard', 'peserta', 'keluarga', 'master-data', 'google-drive', 'log-aktivitas'];
    
    if (adminOnlyTabs.includes(tab) && !adminUser) {
      setTargetTabAfterLogin(tab);
      setIsLoginModalOpen(true);
      return;
    }

    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
    if (targetTabAfterLogin) {
      setActiveTab(targetTabAfterLogin);
      setTargetTabAfterLogin(null);
    } else if (activeTab === 'pendaftaran' || activeTab === 'cek-status') {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gathering_admin_user');
    localStorage.removeItem('gathering_admin_token');
    setAdminUser(null);
    if (['dashboard', 'peserta', 'keluarga', 'master-data', 'google-drive', 'log-aktivitas'].includes(activeTab)) {
      setActiveTab('cek-status');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-cyan-500 selection:text-slate-950">
      
      {/* App Body with Sidebar & Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Navigation Sidebar (Hidden on Cek Status & Kartu Peserta page) */}
        {activeTab !== 'cek-status' && (
          <Sidebar
            activeTab={activeTab}
            onTabSelect={handleTabSelect}
            adminUser={adminUser}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onLogout={handleLogout}
            isMobileOpen={isMobileSidebarOpen}
            setIsMobileOpen={setIsMobileSidebarOpen}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-950">
          
          {/* Header Bar */}
          <Header
            activeTab={activeTab}
            adminUser={adminUser}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onLogout={handleLogout}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
            onNavigate={handleTabSelect}
          />

          {/* View Container */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
            {activeTab === 'pendaftaran' && (
              <RegistrationForm
                onRegistrationSuccess={(peserta) => {
                  setRegisteredCard(peserta);
                }}
                onNavigate={handleTabSelect}
              />
            )}

            {activeTab === 'cek-status' && (
              <CheckStatusView onNavigate={handleTabSelect} />
            )}

            {activeTab === 'dashboard' && (
              <AdminDashboard 
                onNavigate={handleTabSelect} 
                onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
              />
            )}

            {activeTab === 'peserta' && (
              <PesertaManagement />
            )}

            {activeTab === 'keluarga' && (
              <FamilyManagement />
            )}

            {activeTab === 'master-data' && (
              <MasterDataManagement />
            )}

            {activeTab === 'google-drive' && (
              <DriveSyncView />
            )}

            {activeTab === 'log-aktivitas' && (
              <ActivityLogsView />
            )}
          </main>
        </div>
      </div>

      {/* Global Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          setTargetTabAfterLogin(null);
        }}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Admin Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        adminUser={adminUser}
      />

      {/* Immediate Registration Success Card Modal */}
      {registeredCard && (
        <ParticipantCardModal
          peserta={registeredCard}
          onClose={() => setRegisteredCard(null)}
        />
      )}

      {/* PWA Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* PWA Auto Install Prompt from Barcode Scan */}
      <AutoInstallModal />
    </div>
  );
}
