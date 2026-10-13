import React, { useState, useEffect } from 'react';
import { Smartphone, Download, CheckCircle2, X, Share2, PlusSquare, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const AutoInstallModal: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [isOpen, setIsOpen] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Check if opened via barcode scan parameter (e.g. ?install=pwa) or from mobile browser
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isFromScan = urlParams.has('install');
      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      const isDismissed = sessionStorage.getItem('pwa_install_modal_dismissed') === '1';

      if ((isFromScan || isMobile) && !isInstalled && !isDismissed) {
        // Auto open install sheet after a brief delay so page renders nicely
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [isInstalled]);

  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem('pwa_install_modal_dismissed', '1');
    } catch {
      // ignore
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
        }, 3000);
      }
    }
  };

  if (!isOpen || isInstalled) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-cyan-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/30">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Scan Barcode Berhasil
              </span>
            </div>
            <h3 className="text-lg font-bold text-white font-['Outfit',sans-serif]">
              Pasang Aplikasi Gathering 2026
            </h3>
          </div>
        </div>

        {installSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-3 text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white mb-1">Aplikasi Berhasil Dipasang!</h4>
            <p className="text-xs text-slate-300">
              Ikon Gathering Rekreasi Pangandaran 2026 kini tersedia di layar utama smartphone Anda.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed">
              Anda membuka link melalui barcode. Pasang aplikasi ini ke layar utama HP Anda agar lebih cepat diakses tanpa repot membuka browser!
            </p>

            {isIOS ? (
              /* Petunjuk Khusus iOS (Safari) */
              <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 mb-5 text-xs text-slate-200 space-y-3">
                <p className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Cara Pasang di iPhone / iPad (Safari):
                </p>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">1</span>
                  <span>Ketuk tombol <strong>Bagikan (Share)</strong> <Share2 className="w-3.5 h-3.5 inline mx-1 text-cyan-400" /> di bar bawah Safari.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">2</span>
                  <span>Gulir ke bawah dan pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-cyan-400" />.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">3</span>
                  <span>Ketuk <strong>Tambah (Add)</strong> di kanan atas. Selesai!</span>
                </div>
              </div>
            ) : (
              /* Tombol 1-klik Install untuk Android / Chrome */
              <div className="space-y-3 mb-5">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-cyan-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-98"
                >
                  <Download className="w-5 h-5 text-slate-950" />
                  <span>PASANG APLIKASI SEKARANG</span>
                </button>
                <p className="text-[11px] text-center text-slate-400">
                  {isAndroid ? 'Otomatis menambahkan ke menu aplikasi HP Android Anda' : 'Jika browser belum mendukung prompt otomatis, gunakan menu Titik Tiga (⋮) > Install Aplikasi'}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-400 text-[11px]">Tidak memerlukan Google Play Store</span>
              <button
                type="button"
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-200 text-xs underline cursor-pointer"
              >
                Nanti saja
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
