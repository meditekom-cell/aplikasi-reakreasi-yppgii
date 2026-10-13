import React, { useState, useEffect } from 'react';
import { UserCheck, Search, Filter, Shirt, Users, User, Trash2, Edit2, X, Plus, MessageCircle } from 'lucide-react';
import { api, PublicMasterData } from '../services/api';
import { Peserta, AnggotaKeluarga } from '../types';
import { getWhatsAppUrl } from '../lib/whatsapp';

export const FamilyManagement: React.FC = () => {
  const [pesertaList, setPesertaList] = useState<Peserta[]>([]);
  const [masterData, setMasterData] = useState<PublicMasterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterHubungan, setFilterHubungan] = useState('');
  const [filterKategori, setFilterKategori] = useState('');

  // Edit Family Member Modal
  const [editingFam, setEditingFam] = useState<{ parent: Peserta; item: AnggotaKeluarga } | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editHubungan, setEditHubungan] = useState<any>('Istri');
  const [editKategori, setEditKategori] = useState<any>('Dewasa');
  const [editKaosId, setEditKaosId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, mRes] = await Promise.all([
        api.getPesertaList(),
        api.getPublicMaster(),
      ]);
      setPesertaList(pRes.data);
      setMasterData(mRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Flatten all family members with parent participant info
  const allFamilies: { parent: Peserta; item: AnggotaKeluarga }[] = [];
  pesertaList.forEach(p => {
    p.keluarga.forEach(k => {
      allFamilies.push({ parent: p, item: k });
    });
  });

  const filteredFamilies = allFamilies.filter(f => {
    const matchSearch = 
      f.item.nama.toLowerCase().includes(search.toLowerCase()) ||
      f.parent.namaLengkap.toLowerCase().includes(search.toLowerCase()) ||
      f.parent.nomorAgenda.toLowerCase().includes(search.toLowerCase());
    const matchHubungan = filterHubungan ? f.item.hubungan === filterHubungan : true;
    const matchKategori = filterKategori ? f.item.kategoriUsia === filterKategori : true;
    return matchSearch && matchHubungan && matchKategori;
  });

  const openEditModal = (parent: Peserta, item: AnggotaKeluarga) => {
    setEditingFam({ parent, item });
    setEditNama(item.nama);
    setEditHubungan(item.hubungan);
    setEditKategori(item.kategoriUsia);
    setEditKaosId(item.ukuranKaosId);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFam) return;

    try {
      const isSpouse = editHubungan === 'Suami' || editHubungan === 'Istri';
      const selectedKaos = isSpouse ? masterData?.kaos.find(k => k.id === editKaosId) : null;
      const updatedKeluargaList = editingFam.parent.keluarga.map(k => {
        if (k.id === editingFam.item.id) {
          return {
            ...k,
            nama: editNama,
            hubungan: editHubungan,
            kategoriUsia: editKategori,
            ukuranKaosId: isSpouse ? (selectedKaos?.id || editKaosId || '') : '',
            ukuranKaosNama: isSpouse ? (selectedKaos?.ukuran?.replace(/\s*Dewasa/gi, '').trim() || 'M') : 'Tanpa Kaos',
          };
        }
        return k;
      });

      await api.updatePeserta(editingFam.parent.id, {
        keluarga: updatedKeluargaList,
      });

      setEditingFam(null);
      await loadData();
    } catch (err: any) {
      alert('Gagal memperbarui: ' + err.message);
    }
  };

  const handleDeleteFam = async (parent: Peserta, famId: string, famNama: string) => {
    if (!window.confirm(`Hapus anggota keluarga "${famNama}" dari ${parent.namaLengkap}?`)) return;

    try {
      const updatedKeluargaList = parent.keluarga.filter(k => k.id !== famId);
      await api.updatePeserta(parent.id, {
        keluarga: updatedKeluargaList,
      });
      await loadData();
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const countDewasa = allFamilies.filter(f => f.item.kategoriUsia === 'Dewasa').length;
  const countAnak = allFamilies.filter(f => f.item.kategoriUsia === 'Anak-anak').length;
  const countBalita = allFamilies.filter(f => f.item.kategoriUsia === 'Balita').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white font-['Outfit',sans-serif] flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            Manajemen Anggota Keluarga & Pendamping
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Total Rombongan: <strong className="text-cyan-300 font-semibold">{pesertaList.length + allFamilies.length} Jiwa</strong> ({pesertaList.length} Pegawai + {allFamilies.length} Anggota Keluarga)
          </p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari nama anggota / pegawai..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <select
            value={filterHubungan}
            onChange={(e) => setFilterHubungan(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">Semua Hubungan</option>
            <option value="Suami">Suami</option>
            <option value="Istri">Istri</option>
            <option value="Anak 1">Anak 1</option>
            <option value="Anak 2">Anak 2</option>
            <option value="Anak 3">Anak 3</option>
            <option value="Orang Tua">Orang Tua</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>

        <div>
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">Semua Kategori Usia</option>
            <option value="Dewasa">Dewasa (&gt; 12 th)</option>
            <option value="Anak-anak">Anak-anak (4 - 12 th)</option>
            <option value="Balita">Balita (&lt; 4 th)</option>
          </select>
        </div>
      </div>

      {/* Family Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase tracking-wider text-[11px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Nama Anggota</th>
                <th className="py-3.5 px-4 font-bold">Hubungan</th>
                <th className="py-3.5 px-4 font-bold">Kategori Usia</th>
                <th className="py-3.5 px-4 font-bold">Ukuran Kaos</th>
                <th className="py-3.5 px-4 font-bold">Peserta Utama (Penanggung Jawab)</th>
                <th className="py-3.5 px-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Memuat data keluarga...
                  </td>
                </tr>
              ) : filteredFamilies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada anggota keluarga yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredFamilies.map(({ parent, item }, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white text-sm">
                      {item.nama}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md font-semibold border border-indigo-500/30 text-[11px]">
                        {item.hubungan}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-300 font-medium">
                        {item.kategoriUsia}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold">
                        {item.ukuranKaosNama}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-cyan-300">{parent.namaLengkap}</div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <span>{parent.nomorAgenda} • {parent.unitKerjaNama}</span>
                        {parent.noHpWa && (
                          <a
                            href={getWhatsAppUrl(parent.noHpWa, `Halo ${parent.namaLengkap}, konfirmasi data keluarga (${item.nama} - ${item.hubungan}) untuk Gathering Pangandaran 2026`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-emerald-400 hover:text-emerald-300 hover:underline"
                            title={`Chat WhatsApp ke ${parent.namaLengkap} (${parent.noHpWa})`}
                          >
                            <MessageCircle className="w-2.5 h-2.5 text-emerald-400" />
                            <span>WA</span>
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(parent, item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-500/20 text-indigo-400"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFam(parent, item.id, item.nama)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingFam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-white text-base">Edit Anggota Keluarga</h3>
              <button onClick={() => setEditingFam(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nama Anggota</label>
                <input
                  type="text"
                  required
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Hubungan</label>
                <select
                  value={editHubungan}
                  onChange={(e: any) => setEditHubungan(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Suami">Suami</option>
                  <option value="Istri">Istri</option>
                  <option value="Anak 1">Anak 1</option>
                  <option value="Anak 2">Anak 2</option>
                  <option value="Anak 3">Anak 3</option>
                  <option value="Orang Tua">Orang Tua</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Kategori Usia</label>
                <select
                  value={editKategori}
                  onChange={(e: any) => setEditKategori(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Dewasa">Dewasa (&gt; 12 th)</option>
                  <option value="Anak-anak">Anak-anak (4 - 12 th)</option>
                  <option value="Balita">Balita (&lt; 4 th)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Ukuran Kaos</label>
                <select
                  value={editKaosId}
                  onChange={(e) => setEditKaosId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  {masterData?.kaos.map(k => (
                    <option key={k.id} value={k.id}>{k.ukuran}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingFam(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
