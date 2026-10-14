import React, { useState, useEffect } from 'react';
import { UserCheck, Search, Filter, Shirt, Users, User, Trash2, Edit2, X, Plus, MessageCircle, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
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

  // Add Family Member Modal (Create)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addParentId, setAddParentId] = useState('');
  const [addNama, setAddNama] = useState('');
  const [addHubungan, setAddHubungan] = useState<any>('Istri');
  const [addKategori, setAddKategori] = useState<any>('Dewasa');
  const [addUsia, setAddUsia] = useState('');
  const [addKaosId, setAddKaosId] = useState('');

  // Delete Target & Toast State
  const [deleteTarget, setDeleteTarget] = useState<{ parent: Peserta; famId: string; famNama: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, mRes] = await Promise.all([
        api.getPesertaList(),
        api.getPublicMaster(),
      ]);
      setPesertaList(pRes.data);
      setMasterData(mRes);
    } catch (err: any) {
      console.error(err);
      showToast('Gagal memuat data: ' + err.message, 'error');
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

      showToast(`Data anggota keluarga "${editNama}" berhasil diperbarui.`);
      setEditingFam(null);
      await loadData();
    } catch (err: any) {
      showToast('Gagal memperbarui: ' + err.message, 'error');
    }
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addParentId || !addNama.trim()) {
      showToast('Pilih peserta utama dan isi nama anggota keluarga.', 'error');
      return;
    }
    const parent = pesertaList.find(p => p.id === addParentId);
    if (!parent) return;

    try {
      const isSpouse = addHubungan === 'Suami' || addHubungan === 'Istri';
      const selectedKaos = isSpouse ? masterData?.kaos.find(k => k.id === addKaosId) : null;
      const newMember: AnggotaKeluarga = {
        id: 'fam-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        nama: addNama.trim(),
        hubungan: addHubungan,
        kategoriUsia: addKategori,
        usia: addUsia ? parseInt(addUsia, 10) : undefined,
        ukuranKaosId: isSpouse ? (selectedKaos?.id || addKaosId || '') : '',
        ukuranKaosNama: isSpouse ? (selectedKaos?.ukuran?.replace(/\s*Dewasa/gi, '').trim() || 'M') : 'Tanpa Kaos',
      };

      const updatedKeluargaList = [...parent.keluarga, newMember];
      await api.updatePeserta(parent.id, {
        keluarga: updatedKeluargaList,
      });

      showToast(`Anggota keluarga "${addNama}" berhasil ditambahkan ke ${parent.namaLengkap}.`);
      setIsAddModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast('Gagal menambahkan: ' + err.message, 'error');
    }
  };

  const confirmDeleteFam = (parent: Peserta, famId: string, famNama: string) => {
    setDeleteTarget({ parent, famId, famNama });
  };

  const executeDeleteFam = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const updatedKeluargaList = deleteTarget.parent.keluarga.filter(k => k.id !== deleteTarget.famId);
      await api.updatePeserta(deleteTarget.parent.id, {
        keluarga: updatedKeluargaList,
      });
      showToast(`Anggota keluarga "${deleteTarget.famNama}" berhasil dihapus.`);
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      showToast('Gagal menghapus: ' + err.message, 'error');
    } finally {
      setIsDeleting(false);
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

        <button
          onClick={() => {
            setIsAddModalOpen(true);
            setAddParentId(pesertaList[0]?.id || '');
            setAddNama('');
            setAddHubungan('Istri');
            setAddKategori('Dewasa');
            setAddUsia('');
            setAddKaosId(masterData?.kaos[0]?.id || '');
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Anggota Keluarga</span>
        </button>
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
                          onClick={() => confirmDeleteFam(parent, item.id, item.nama)}
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

      {/* Add Family Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                Tambah Anggota Keluarga
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Peserta Utama (Pegawai Penanggung Jawab):</label>
                <select
                  value={addParentId}
                  onChange={(e) => setAddParentId(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Pilih Peserta Utama --</option>
                  {pesertaList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.namaLengkap} ({p.nomorAgenda}) - {p.unitKerjaNama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nama Lengkap Anggota Keluarga:</label>
                <input
                  type="text"
                  required
                  value={addNama}
                  onChange={(e) => setAddNama(e.target.value)}
                  placeholder="Contoh: Ny. Siti Rahma"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Hubungan</label>
                  <select
                    value={addHubungan}
                    onChange={(e: any) => {
                      const val = e.target.value;
                      setAddHubungan(val);
                      if (val === 'Suami' || val === 'Istri') {
                        setAddKategori('Dewasa');
                      }
                    }}
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
                    value={addKategori}
                    onChange={(e: any) => setAddKategori(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Dewasa">Dewasa (&gt; 12 th)</option>
                    <option value="Anak-anak">Anak-anak (4 - 12 th)</option>
                    <option value="Balita">Balita (&lt; 4 th)</option>
                  </select>
                </div>
              </div>

              {(addHubungan.startsWith('Anak') || addKategori === 'Anak-anak' || addKategori === 'Balita') && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Usia Anak (Tahun):</label>
                  <input
                    type="number"
                    min="0"
                    max="18"
                    value={addUsia}
                    onChange={(e) => setAddUsia(e.target.value)}
                    placeholder="Contoh: 7"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              {(addHubungan === 'Suami' || addHubungan === 'Istri') ? (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Ukuran Kaos Pasangan:</label>
                  <select
                    value={addKaosId}
                    onChange={(e) => setAddKaosId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {masterData?.kaos.map(k => (
                      <option key={k.id} value={k.id}>{k.ukuran}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-400 text-[11px]">
                  Informasi: Berdasarkan regulasi kepanitiaan, kaos seragam hanya dialokasikan untuk Pegawai & Pasangan (Suami/Istri). Anak & pendamping lainnya tidak mendapatkan seragam kaos (Tanpa Kaos).
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold"
                >
                  Simpan Anggota Keluarga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Hapus Anggota Keluarga?</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong className="text-white">{deleteTarget.famNama}</strong> dari rombongan <span className="text-cyan-400 font-semibold">{deleteTarget.parent.namaLengkap}</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeDeleteFam}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-subtle">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold backdrop-blur-md border ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-950/90 border-rose-500/30 text-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
