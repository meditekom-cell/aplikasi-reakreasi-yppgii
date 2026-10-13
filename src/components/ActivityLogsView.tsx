import React, { useState, useEffect } from 'react';
import { History, Search, Filter, ShieldCheck, Download, Clock, User, CheckCircle2, Lock } from 'lucide-react';
import { api } from '../services/api';
import { AktivitasLog } from '../types';

export const ActivityLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AktivitasLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getLogs();
      setLogs(res.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => {
    const matchSearch =
      l.rincian.toLowerCase().includes(search.toLowerCase()) ||
      l.adminUser.toLowerCase().includes(search.toLowerCase()) ||
      (l.nomorAgendaTerkait && l.nomorAgendaTerkait.toLowerCase().includes(search.toLowerCase()));
    const matchKategori = filterKategori ? l.kategori === filterKategori : true;
    return matchSearch && matchKategori;
  });

  const exportLogs = () => {
    if (logs.length === 0) return;
    const content = JSON.stringify(logs, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_logs_pangandaran_2026_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white font-['Outfit',sans-serif] flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            Log Aktivitas & Audit Trail Keamanan
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Rekaman jejak sistem pendaftaran, LockService atomicity, perubahan data, dan autentikasi admin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportLogs}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Ekspor Log Audit</span>
          </button>
        </div>
      </div>

      {/* Security Engine Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-white">LockService Mutex Protection</p>
            <p className="text-slate-400">Mencegah benturan/collision nomor peserta secara mutlak saat peserta mendaftar serentak.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 shrink-0">
          <CheckCircle2 className="w-4 h-4" />
          <span>Zero-Collision Guarantee</span>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari aktivitas, admin, atau nomor peserta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">Semua Kategori Aksi</option>
            <option value="PESERTA">PESERTA</option>
            <option value="MASTER_DATA">MASTER_DATA</option>
            <option value="AUTH">AUTH / LOGIN</option>
            <option value="DOKUMEN">DOKUMEN & DRIVE</option>
            <option value="SISTEM">SISTEM</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase tracking-wider text-[11px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-bold">Waktu</th>
                <th className="py-3 px-4 font-bold">Kategori</th>
                <th className="py-3 px-4 font-bold">Aksi</th>
                <th className="py-3 px-4 font-bold">Pelaksana (User / IP)</th>
                <th className="py-3 px-4 font-bold">Rincian Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Memuat log aktivitas...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Tidak ada aktivitas yang sesuai kriteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                        log.kategori === 'PESERTA' ? 'bg-cyan-500/20 text-cyan-300' :
                        log.kategori === 'AUTH' ? 'bg-amber-500/20 text-amber-300' :
                        log.kategori === 'DOKUMEN' ? 'bg-emerald-500/20 text-emerald-300' :
                        'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        {log.kategori}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-white whitespace-nowrap">
                      {log.aksi}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-200">{log.adminUser}</span>
                      {log.ipAddress && (
                        <span className="text-slate-500 font-mono text-[10px] ml-1.5">({log.ipAddress})</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {log.rincian}
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
