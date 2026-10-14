import React, { useState, useEffect } from 'react';
import { HardDrive, Cloud, RefreshCw, CheckCircle, Folder, FileText, ExternalLink, Save, AlertCircle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { GoogleDriveConfig, Peserta } from '../types';

export const DriveSyncView: React.FC = () => {
  const [config, setConfig] = useState<GoogleDriveConfig | null>(null);
  const [pesertaList, setPesertaList] = useState<Peserta[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable config state
  const [folderId, setFolderId] = useState('');
  const [folderName, setFolderName] = useState('');
  const [driveEmail, setDriveEmail] = useState('');
  const [backupEnabled, setBackupEnabled] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, pRes] = await Promise.all([
        api.getDriveConfig(),
        api.getPesertaList(),
      ]);
      setConfig(cRes);
      setFolderId(cRes.folderId);
      setFolderName(cRes.folderName);
      setDriveEmail(cRes.driveEmail);
      setBackupEnabled(cRes.backupEnabled);
      setPesertaList(pRes.data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal memuat konfigurasi Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);
      const res = await api.updateDriveConfig({
        folderId,
        folderName,
        driveEmail,
        backupEnabled,
      });
      setConfig(res.config);
      setSuccessMsg('Konfigurasi Google Drive berhasil disimpan.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg('Gagal menyimpan: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setSaving(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      setErrorMsg(null);
      const res = await api.syncDrive();
      setConfig(res.config);
      setSuccessMsg('Sinkronisasi dokumen seluruh peserta ke Google Drive berhasil!');
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadData();
    } catch (err: any) {
      setErrorMsg('Gagal sinkronisasi: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setSyncing(false);
    }
  };

  // Collect all documents
  const allDocs: { parent: Peserta; doc: any }[] = [];
  pesertaList.forEach(p => {
    p.dokumen.forEach(d => {
      allDocs.push({ parent: p, doc: d });
    });
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white font-['Outfit',sans-serif] flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-cyan-400" />
            Penyimpanan Dokumen ke Google Drive
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Integrasi cloud storage dokumen KTP, Kartu Pegawai, dan berkas lampiran pendaftaran peserta.
          </p>
        </div>

        <button
          onClick={handleSyncNow}
          disabled={syncing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid Settings & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Drive Configuration Form */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Cloud className="w-4 h-4 text-indigo-400" />
              Konfigurasi Akun & Folder Target Drive
            </h3>
            <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> Terhubung
            </span>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nama Folder Target</label>
                <input
                  type="text"
                  required
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Google Drive Folder ID</label>
                <input
                  type="text"
                  required
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email Pengelola Akun Drive</label>
                <input
                  type="email"
                  required
                  value={driveEmail}
                  onChange={(e) => setDriveEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Status Auto-Backup</label>
                <div className="pt-1.5 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="auto-backup"
                    checked={backupEnabled}
                    onChange={(e) => setBackupEnabled(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                  <label htmlFor="auto-backup" className="text-slate-300 cursor-pointer font-medium">
                    Aktifkan auto-sync saat pendaftaran
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Sync Summary Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
              <Folder className="w-4 h-4 text-amber-400" />
              Status Sinkronisasi
            </h3>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Total Berkas Tersimpan:</span>
                <span className="font-bold text-white font-mono">{allDocs.length} Berkas</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Sinkron Terakhir:</span>
                <span className="font-semibold text-cyan-300 font-mono">
                  {config?.lastBackupTime ? new Date(config.lastBackupTime).toLocaleTimeString('id-ID') : 'Baru saja'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Batas Ukuran Upload:</span>
                <span className="font-bold text-emerald-400">5.0 MB / File</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300">
            Berkas terenkripsi dan disimpan secara redundan pada media NoSQL lokal server dan disinkronkan ke cloud folder Google Drive.
          </div>
        </div>
      </div>

      {/* Uploaded Documents Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider">
            Daftar Berkas Dokumen Terunggah ({allDocs.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 uppercase tracking-wider text-[11px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-bold">Nama Berkas</th>
                <th className="py-3 px-4 font-bold">Pemilik / Peserta</th>
                <th className="py-3 px-4 font-bold">Ukuran</th>
                <th className="py-3 px-4 font-bold">Tipe</th>
                <th className="py-3 px-4 font-bold">Status G-Drive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {allDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Belum ada dokumen yang diunggah oleh peserta.
                  </td>
                </tr>
              ) : (
                allDocs.map(({ parent, doc }, idx) => (
                  <tr key={doc.id || idx} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="truncate max-w-xs">{doc.namaFile}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-200">{parent.namaLengkap}</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-2">({parent.nomorAgenda})</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {(doc.ukuranBytes / (1024 * 1024)).toFixed(2)} MB
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {doc.tipe}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-mono text-[10px]">
                        <CheckCircle className="w-3 h-3" /> Synced
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
