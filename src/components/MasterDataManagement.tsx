import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Building2, 
  Briefcase, 
  Shirt, 
  Bus, 
  Hotel, 
  Utensils, 
  Calendar,
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Save,
  CheckCircle,
  AlertTriangle,
  Info,
  Loader2,
  Phone,
  MapPin,
  MessageCircle
} from 'lucide-react';
import { api, PublicMasterData } from '../services/api';
import { MasterUnitKerja, MasterJabatan, MasterKaos, MasterBis, MasterHotel, MasterTempatMakan, MasterTempatAcara } from '../types';
import { getWhatsAppUrl } from '../lib/whatsapp';

type MasterTab = 'unit-kerja' | 'jabatan' | 'kaos' | 'bis' | 'hotel' | 'tempat-makan' | 'tempat-acara';

interface DeleteTarget {
  id: string;
  name: string;
  type: MasterTab;
  typeLabel: string;
}

export const MasterDataManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MasterTab>('unit-kerja');
  const [masterData, setMasterData] = useState<PublicMasterData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Dynamic Item Form States
  const [formField1, setFormField1] = useState('');
  const [formField2, setFormField2] = useState('');
  const [formField3, setFormField3] = useState('');
  const [formField4, setFormField4] = useState('');
  const [formField5, setFormField5] = useState('');

  // Hotel Room & Floor Management in Modal
  const [hotelRooms, setHotelRooms] = useState<Array<{ noKamar: string; lantai?: string; tipe: string; kapasitas: number; keterangan?: string }>>([]);
  const [newRoomNo, setNewRoomNo] = useState('');
  const [newRoomLantai, setNewRoomLantai] = useState('');
  const [newRoomTipe, setNewRoomTipe] = useState('Standard');
  const [newRoomKapasitas, setNewRoomKapasitas] = useState('2');

  useEffect(() => {
    loadMaster();
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

  const loadMaster = async () => {
    try {
      setLoading(true);
      const res = await api.getPublicMaster();
      setMasterData(res);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat master data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormField1('');
    setFormField2(activeTab === 'kaos' ? 'Standar' : '');
    setFormField3(activeTab === 'kaos' ? '0' : '');
    setFormField4('');
    setFormField5('');
    setHotelRooms([]);
    setNewRoomNo('');
    setNewRoomLantai('');
    setNewRoomTipe('Standard');
    setNewRoomKapasitas('2');
    setModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    if (activeTab === 'unit-kerja') {
      setFormField1(item.kode || '');
      setFormField2(item.nama || '');
      setFormField3(item.deskripsi || '');
    } else if (activeTab === 'jabatan') {
      setFormField1(item.nama || '');
      setFormField2(item.level || '');
    } else if (activeTab === 'kaos') {
      setFormField1(item.ukuran || '');
      setFormField2(item.kategori || 'Standar');
      setFormField3(item.kuotaTotal !== undefined && item.kuotaTotal !== null ? String(item.kuotaTotal) : '0');
    } else if (activeTab === 'bis') {
      setFormField1(item.nomorBis || '');
      setFormField2(item.namaBis || '');
      setFormField3(item.kapasitas !== undefined && item.kapasitas !== null ? String(item.kapasitas) : '48');
      setFormField4(item.nomorPolisi || '');
      setFormField5((item.namaKoordinator || '') + (item.kontakKoordinator ? ' - ' + item.kontakKoordinator : ''));
    } else if (activeTab === 'hotel') {
      setFormField1(item.namaHotel || '');
      setFormField2(item.lokasi || '');
      setFormField3(item.kontakHotel || '');
      setHotelRooms(item.daftarKamar ? JSON.parse(JSON.stringify(item.daftarKamar)) : []);
      setNewRoomNo('');
      setNewRoomLantai('');
      setNewRoomTipe('Standard');
      setNewRoomKapasitas('2');
    } else if (activeTab === 'tempat-makan') {
      setFormField1(item.namaTempat || '');
      setFormField2(item.lokasi || '');
      setFormField3(item.menuUtama || '');
      setFormField4(item.kapasitas !== undefined && item.kapasitas !== null ? String(item.kapasitas) : '350');
    } else if (activeTab === 'tempat-acara') {
      setFormField1(item.namaTempat || '');
      setFormField2(item.lokasi || '');
      setFormField3(item.kegiatan || '');
      setFormField4(item.kapasitas !== undefined && item.kapasitas !== null ? String(item.kapasitas) : '500');
      setFormField5(item.keterangan || '');
    }
    setModalOpen(true);
  };

  const handleAddRoomToHotel = () => {
    if (!newRoomNo.trim()) return;
    const exists = hotelRooms.some((r) => r.noKamar.trim().toLowerCase() === newRoomNo.trim().toLowerCase());
    if (exists) {
      showToast(`Nomor Kamar ${newRoomNo} sudah terdaftar di hotel ini.`, 'error');
      return;
    }
    const cap = parseInt(newRoomKapasitas, 10);
    const roomObj = {
      noKamar: newRoomNo.trim(),
      lantai: newRoomLantai.trim() || (newRoomNo.trim().length >= 3 ? newRoomNo.trim().charAt(0) : '1'),
      tipe: newRoomTipe || 'Standard',
      kapasitas: !isNaN(cap) && cap > 0 ? cap : 2,
    };
    setHotelRooms([...hotelRooms, roomObj]);
    setNewRoomNo('');
    setNewRoomLantai('');
  };

  const handleRemoveRoomFromHotel = (noKamar: string) => {
    setHotelRooms(hotelRooms.filter((r) => r.noKamar !== noKamar));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      let payload: any = {};
      if (activeTab === 'unit-kerja') {
        payload = { kode: formField1.trim(), nama: formField2.trim(), deskripsi: formField3.trim() };
      } else if (activeTab === 'jabatan') {
        payload = { nama: formField1.trim(), level: formField2.trim() };
      } else if (activeTab === 'kaos') {
        const rawQuota = formField3.trim();
        const parsedQuota = parseInt(rawQuota, 10);
        const kuotaTotal = !isNaN(parsedQuota) && parsedQuota >= 0 ? parsedQuota : 0;
        payload = { 
          ukuran: formField1.trim().replace(/\s*Dewasa/gi, '').trim(), 
          kategori: formField2.trim() || 'Standar', 
          kuotaTotal 
        };
      } else if (activeTab === 'bis') {
        const [koor, kontak] = formField5.split(' - ');
        const rawCap = parseInt(formField3.trim(), 10);
        payload = {
          nomorBis: formField1.trim(),
          namaBis: formField2.trim(),
          kapasitas: !isNaN(rawCap) && rawCap >= 0 ? rawCap : 48,
          nomorPolisi: formField4.trim(),
          namaKoordinator: koor?.trim() || 'Koordinator Bis',
          kontakKoordinator: kontak?.trim() || '-',
        };
      } else if (activeTab === 'hotel') {
        const uniqueTipes = Array.from(new Set(hotelRooms.map((r) => r.tipe).filter(Boolean)));
        payload = {
          namaHotel: formField1.trim(),
          lokasi: formField2.trim(),
          kontakHotel: formField3.trim(),
          tipeKamar: uniqueTipes.length > 0 ? uniqueTipes : (editingItem?.tipeKamar || ['Standard', 'Deluxe', 'Family Suite']),
          daftarKamar: hotelRooms,
        };
      } else if (activeTab === 'tempat-makan') {
        const rawCap = parseInt(formField4.trim(), 10);
        payload = {
          namaTempat: formField1.trim(),
          lokasi: formField2.trim(),
          menuUtama: formField3.trim(),
          kapasitas: !isNaN(rawCap) && rawCap >= 0 ? rawCap : 350,
          sesiMakan: editingItem ? editingItem.sesiMakan : ['Makan Siang Hari 1', 'Gala Dinner'],
        };
      } else if (activeTab === 'tempat-acara') {
        const rawCap = parseInt(formField4.trim(), 10);
        payload = {
          namaTempat: formField1.trim(),
          lokasi: formField2.trim(),
          kegiatan: formField3.trim(),
          kapasitas: !isNaN(rawCap) && rawCap >= 0 ? rawCap : 500,
          keterangan: formField5.trim(),
        };
      }

      if (editingItem) {
        await api.updateMaster(activeTab, editingItem.id, payload);
        showToast(`Master data "${formField1 || formField2}" berhasil diperbarui.`);
      } else {
        await api.createMaster(activeTab, payload);
        showToast(`Master data baru berhasil ditambahkan.`);
      }

      setModalOpen(false);
      await loadMaster();
    } catch (err: any) {
      showToast('Gagal menyimpan: ' + (err.message || 'Terjadi kesalahan sistem'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: string, name: string) => {
    const currentTabObj = tabs.find(t => t.id === activeTab);
    setDeleteTarget({
      id,
      name,
      type: activeTab,
      typeLabel: currentTabObj?.label || 'Master Data',
    });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await api.deleteMaster(deleteTarget.type, deleteTarget.id);
      showToast(`Master data "${deleteTarget.name}" berhasil dihapus.`);
      setDeleteTarget(null);
      await loadMaster();
    } catch (err: any) {
      showToast('Gagal menghapus: ' + (err.message || 'Terjadi kesalahan sistem'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const tabs = [
    { id: 'unit-kerja' as MasterTab, label: 'Unit Kerja', icon: Building2, count: masterData?.unitKerja.length },
    { id: 'jabatan' as MasterTab, label: 'Jabatan', icon: Briefcase, count: masterData?.jabatan.length },
    { id: 'kaos' as MasterTab, label: 'Ukuran Kaos', icon: Shirt, count: masterData?.kaos.length },
    { id: 'bis' as MasterTab, label: 'Armada Bis', icon: Bus, count: masterData?.bis.length },
    { id: 'hotel' as MasterTab, label: 'Akomodasi Hotel', icon: Hotel, count: masterData?.hotel.length },
    { id: 'tempat-makan' as MasterTab, label: 'Tempat Makan', icon: Utensils, count: masterData?.tempatMakan.length },
    { id: 'tempat-acara' as MasterTab, label: 'Tempat Acara', icon: Calendar, count: masterData?.tempatAcara?.length },
  ];

  return (
    <div className="space-y-6 pb-12 relative">
      {/* In-app Toast Banner */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border transition-all animate-in fade-in slide-in-from-top-4 ${
          toast.type === 'success' 
            ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200' 
            : 'bg-rose-950/95 border-rose-500/40 text-rose-200'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white ml-2 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white font-['Outfit',sans-serif] flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Master Data & Konfigurasi Alokasi
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Konfigurasi referensi unit kerja, jabatan, kaos, bus, hotel penginapan, dan tempat makan.
          </p>
        </div>

        <button
          id="btn-add-master-data"
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Master {tabs.find(t => t.id === activeTab)?.label}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-master-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Tables */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase tracking-wider text-[11px] text-slate-400 border-b border-slate-800">
              <tr>
                {activeTab === 'bis' ? (
                  <>
                    <th className="py-3.5 px-4 font-bold">Nomor Bis</th>
                    <th className="py-3.5 px-4 font-bold">Nama Armada Bis</th>
                    <th className="py-3.5 px-4 font-bold">Nomor Polisi</th>
                    <th className="py-3.5 px-4 font-bold">Kapasitas & Koordinator / TL</th>
                    <th className="py-3.5 px-4 font-bold text-center">Aksi</th>
                  </>
                ) : activeTab === 'hotel' ? (
                  <>
                    <th className="py-3.5 px-4 font-bold">Nama Hotel & Kontak</th>
                    <th className="py-3.5 px-4 font-bold">Lokasi Penginapan</th>
                    <th className="py-3.5 px-4 font-bold">Daftar Nomor Kamar & Lantai</th>
                    <th className="py-3.5 px-4 font-bold">Total Kuota / Tamu</th>
                    <th className="py-3.5 px-4 font-bold text-center">Aksi</th>
                  </>
                ) : (
                  <>
                    <th className="py-3.5 px-4 font-bold">Kode / Identitas</th>
                    <th className="py-3.5 px-4 font-bold">Nama / Keterangan</th>
                    <th className="py-3.5 px-4 font-bold">Detail Tambahan</th>
                    <th className="py-3.5 px-4 font-bold text-center">Aksi</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'bis' || activeTab === 'hotel' ? 5 : 4} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                      <span>Memuat data master...</span>
                    </div>
                  </td>
                </tr>
              ) : activeTab === 'unit-kerja' ? (
                masterData?.unitKerja.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">Belum ada master unit kerja.</td>
                  </tr>
                ) : (
                  masterData?.unitKerja.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">[{u.kode}]</td>
                      <td className="py-3.5 px-4 font-bold text-white text-sm">{u.nama}</td>
                      <td className="py-3.5 px-4 text-slate-400">{u.deskripsi}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            id={`btn-edit-uk-${u.id}`}
                            onClick={() => openEditModal(u)} 
                            className="p-2 text-indigo-400 hover:bg-slate-800 hover:text-indigo-300 rounded-xl transition-colors"
                            title="Edit Master"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            id={`btn-del-uk-${u.id}`}
                            onClick={() => confirmDelete(u.id, u.nama)} 
                            className="p-2 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl transition-colors"
                            title="Hapus Master"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : activeTab === 'jabatan' ? (
                masterData?.jabatan.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">Belum ada master jabatan.</td>
                  </tr>
                ) : (
                  masterData?.jabatan.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-cyan-300 font-bold">{j.id}</td>
                      <td className="py-3.5 px-4 font-bold text-white text-sm">{j.nama}</td>
                      <td className="py-3.5 px-4 text-indigo-300 font-semibold">{j.level}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            id={`btn-edit-jb-${j.id}`}
                            onClick={() => openEditModal(j)} 
                            className="p-2 text-indigo-400 hover:bg-slate-800 hover:text-indigo-300 rounded-xl transition-colors"
                            title="Edit Master"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            id={`btn-del-jb-${j.id}`}
                            onClick={() => confirmDelete(j.id, j.nama)} 
                            className="p-2 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl transition-colors"
                            title="Hapus Master"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : activeTab === 'kaos' ? (
                masterData?.kaos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">Belum ada master ukuran kaos.</td>
                  </tr>
                ) : (
                  masterData?.kaos.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold">{k.ukuran.replace(/\s*Dewasa/gi, '').trim()}</td>
                      <td className="py-3.5 px-4 font-bold text-white">{k.kategori === 'Dewasa' ? 'Standar' : k.kategori}</td>
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300">Kuota Produksi:</span>
                          {k.kuotaTotal === 0 ? (
                            <span className="px-2.5 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold">
                              0 pcs (Tidak Diproduksi / Habis)
                            </span>
                          ) : (
                            <span className="font-bold text-cyan-300">
                              {k.kuotaTotal} pcs
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            id={`btn-edit-ks-${k.id}`}
                            onClick={() => openEditModal(k)} 
                            className="p-2 text-indigo-400 hover:bg-slate-800 hover:text-indigo-300 rounded-xl transition-colors"
                            title="Edit Master"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            id={`btn-del-ks-${k.id}`}
                            onClick={() => confirmDelete(k.id, `${k.ukuran} (${k.kategori})`)} 
                            className="p-2 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl transition-colors"
                            title="Hapus Master"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : activeTab === 'bis' ? (
                masterData?.bis.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">Belum ada master armada bis.</td>
                  </tr>
                ) : (
                  masterData?.bis.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono font-bold text-xs">
                          {b.nomorBis}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white text-sm">{b.namaBis}</td>
                      <td className="py-3.5 px-4 font-mono text-cyan-300 font-semibold">{b.nomorPolisi || '-'}</td>
                      <td className="py-3.5 px-4 text-slate-300">
                        Kapasitas: <span className="font-bold text-cyan-300 font-mono">{b.kapasitas} Kursi</span> • Koor: {b.namaKoordinator}{' '}
                        {b.kontakKoordinator && b.kontakKoordinator !== '-' ? (
                          <a
                            href={getWhatsAppUrl(b.kontakKoordinator, `Halo Pak/Bu ${b.namaKoordinator} (Koordinator ${b.namaBis}), koordinasi Gathering Pangandaran 2026`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-emerald-400 hover:text-emerald-300 hover:underline font-mono text-xs"
                            title="Chat WhatsApp Koordinator"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-400 inline" />
                            <span>({b.kontakKoordinator})</span>
                          </a>
                        ) : (
                          <span className="text-slate-500 font-mono">({b.kontakKoordinator || '-'})</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            id={`btn-edit-bis-${b.id}`}
                            onClick={() => openEditModal(b)} 
                            className="p-2 text-indigo-400 hover:bg-slate-800 hover:text-indigo-300 rounded-xl transition-colors"
                            title="Edit Master"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            id={`btn-del-bis-${b.id}`}
                            onClick={() => confirmDelete(b.id, `${b.nomorBis} - ${b.namaBis}`)} 
                            className="p-2 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl transition-colors"
                            title="Hapus Master"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : activeTab === 'hotel' ? (
                masterData?.hotel.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">Belum ada master hotel.</td>
                  </tr>
                ) : (
                  masterData?.hotel.map((h) => {
                    const totalKamar = h.daftarKamar?.length || 0;
                    const totalKapasitas = (h.daftarKamar || []).reduce((sum, km) => sum + (km.kapasitas || 2), 0);
                    return (
                      <tr key={h.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* Nama Hotel & Kontak */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-bold text-amber-400 text-sm">{h.namaHotel}</div>
                          {h.kontakHotel && h.kontakHotel !== '-' ? (
                            <a
                              href={getWhatsAppUrl(h.kontakHotel, `Halo ${h.namaHotel}, koordinasi reservasi Family Gathering Pangandaran 2026`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 hover:underline font-mono text-xs mt-1"
                              title="Chat WhatsApp Hotel"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{h.kontakHotel}</span>
                            </a>
                          ) : (
                            <span className="text-slate-500 text-xs">-</span>
                          )}
                        </td>

                        {/* Lokasi */}
                        <td className="py-3.5 px-4 align-top text-slate-300 text-xs max-w-[180px]">
                          {h.lokasi}
                        </td>

                        {/* Daftar Nomor Kamar & Lantai */}
                        <td className="py-3.5 px-4 align-top">
                          {h.daftarKamar && h.daftarKamar.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 max-w-xl">
                              {h.daftarKamar.map((km, idx) => (
                                <div
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs shadow-xs"
                                >
                                  <span className="font-mono font-bold text-white">No. {km.noKamar}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/90 border border-amber-500/30 text-amber-300 font-bold font-mono">
                                    Lantai {km.lantai || (km.noKamar.length >= 3 ? km.noKamar.charAt(0) : '1')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-xs italic">Belum ada data kamar</span>
                          )}
                        </td>

                        {/* Total Kuota / Tamu */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap text-xs text-slate-300">
                          <div>
                            <span className="font-bold text-cyan-300 font-mono text-sm">{totalKamar}</span> Kamar
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Kapasitas: <span className="font-bold text-white font-mono">{totalKapasitas}</span> Tamu
                          </div>
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-center align-top">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              id={`btn-edit-htl-${h.id}`}
                              onClick={() => openEditModal(h)} 
                              className="p-2 text-indigo-400 hover:bg-slate-800 hover:text-indigo-300 rounded-xl transition-colors"
                              title="Edit Master"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              id={`btn-del-htl-${h.id}`}
                              onClick={() => confirmDelete(h.id, h.namaHotel)} 
                              className="p-2 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl transition-colors"
                              title="Hapus Master"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )
              ) : activeTab === 'tempat-makan' ? (
                masterData?.tempatMakan.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">Belum ada master tempat makan.</td>
                  </tr>
                ) : (
                  masterData?.tempatMakan.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-rose-400">{t.namaTempat}</td>
                      <td className="py-3.5 px-4 text-slate-300">{t.lokasi}</td>
                      <td className="py-3.5 px-4 text-slate-400">
                        Menu: {t.menuUtama} (Kapasitas {t.kapasitas} Org)
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            id={`btn-edit-tm-${t.id}`}
                            onClick={() => openEditModal(t)} 
                            className="p-2 text-indigo-400 hover:bg-slate-800 hover:text-indigo-300 rounded-xl transition-colors"
                            title="Edit Master"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            id={`btn-del-tm-${t.id}`}
                            onClick={() => confirmDelete(t.id, t.namaTempat)} 
                            className="p-2 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl transition-colors"
                            title="Hapus Master"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : activeTab === 'tempat-acara' ? (
                masterData?.tempatAcara?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">Belum ada master tempat acara.</td>
                  </tr>
                ) : (
                  masterData?.tempatAcara?.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-violet-400">{a.namaTempat}</td>
                      <td className="py-3.5 px-4 text-slate-300">{a.lokasi}</td>
                      <td className="py-3.5 px-4 text-slate-400">
                        <div><strong className="text-slate-300">Kegiatan:</strong> {a.kegiatan}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Kapasitas: {a.kapasitas} orang {a.keterangan ? `• ${a.keterangan}` : ''}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            id={`btn-edit-ta-${a.id}`}
                            onClick={() => openEditModal(a)} 
                            className="p-2 text-indigo-400 hover:bg-slate-800 hover:text-indigo-300 rounded-xl transition-colors"
                            title="Edit Master"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            id={`btn-del-ta-${a.id}`}
                            onClick={() => confirmDelete(a.id, a.namaTempat)} 
                            className="p-2 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl transition-colors"
                            title="Hapus Master"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Master */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-white text-base">
                {editingItem ? 'Edit Master Data' : 'Tambah Master Data'} ({tabs.find(t => t.id === activeTab)?.label})
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {activeTab === 'unit-kerja' ? 'Kode Unit' : activeTab === 'bis' ? 'Nomor Bis (e.g. Bis 01)' : activeTab === 'tempat-acara' ? 'Nama Tempat Acara' : 'Nama / Identitas'}
                </label>
                <input
                  type="text"
                  required
                  value={formField1}
                  onChange={(e) => setFormField1(e.target.value)}
                  placeholder={activeTab === 'kaos' ? 'Contoh: XXL, S Anak' : activeTab === 'tempat-acara' ? 'Contoh: Panggung Utama Pantai Timur' : 'Masukkan teks...'}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {activeTab === 'unit-kerja' ? 'Nama Divisi/Unit' : activeTab === 'jabatan' ? 'Level/Golongan' : activeTab === 'kaos' ? 'Kategori Kaos' : activeTab === 'tempat-acara' ? 'Lokasi Acara' : 'Nama Lengkap / Lokasi'}
                </label>
                <input
                  type="text"
                  required
                  value={formField2}
                  onChange={(e) => setFormField2(e.target.value)}
                  placeholder={activeTab === 'kaos' ? 'Standar / Khusus' : activeTab === 'tempat-acara' ? 'Contoh: Area Terbuka Pantai Timur Pangandaran' : 'Masukkan teks...'}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {(activeTab === 'unit-kerja' || activeTab === 'kaos' || activeTab === 'bis' || activeTab === 'hotel' || activeTab === 'tempat-makan' || activeTab === 'tempat-acara') && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    {activeTab === 'kaos' ? 'Kuota Produksi (Pcs - isi 0 jika tidak diproduksi)' : activeTab === 'bis' ? 'Kapasitas Kursi' : activeTab === 'hotel' ? 'No. Kontak Hotel' : activeTab === 'tempat-makan' ? 'Menu Utama' : activeTab === 'tempat-acara' ? 'Agenda / Rangkaian Kegiatan' : 'Deskripsi'}
                  </label>
                  <input
                    type={activeTab === 'kaos' || activeTab === 'bis' ? 'number' : 'text'}
                    min={activeTab === 'kaos' || activeTab === 'bis' ? '0' : undefined}
                    value={formField3}
                    onChange={(e) => setFormField3(e.target.value)}
                    placeholder={activeTab === 'kaos' ? '0' : activeTab === 'tempat-acara' ? 'Contoh: Gala Dinner, Pentas Seni & Doorprize' : ''}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                  {activeTab === 'kaos' && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Set ke <strong className="text-cyan-300 font-mono">0</strong> jika ukuran ini tidak diproduksi / kuota ditutup.
                    </p>
                  )}
                </div>
              )}

              {(activeTab === 'tempat-makan' || activeTab === 'tempat-acara') && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    {activeTab === 'tempat-makan' ? 'Kapasitas Tempat Makan (Orang)' : 'Kapasitas Tempat Acara (Orang)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formField4}
                    onChange={(e) => setFormField4(e.target.value)}
                    placeholder="Contoh: 500"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              {activeTab === 'tempat-acara' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Keterangan / Fasilitas Acara</label>
                  <input
                    type="text"
                    value={formField5}
                    onChange={(e) => setFormField5(e.target.value)}
                    placeholder="Contoh: Panggung rigging, sound system, area pantai terbuka"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              {activeTab === 'bis' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Nomor Polisi (Plat)</label>
                    <input
                      type="text"
                      value={formField4}
                      onChange={(e) => setFormField4(e.target.value)}
                      placeholder="D 7101 PGII"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Koordinator / Tour Leader & No. HP (Format: Nama - 0812...)</label>
                    <input
                      type="text"
                      value={formField5}
                      onChange={(e) => setFormField5(e.target.value)}
                      placeholder="Trio Harnoto - 081214278148"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </>
              )}

              {activeTab === 'hotel' && (
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Hotel className="w-4 h-4 text-amber-400" />
                      Daftar Nomor Kamar & Lantai ({hotelRooms.length} Kamar)
                    </label>
                  </div>

                  {/* List of current rooms */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 max-h-44 overflow-y-auto">
                    {hotelRooms.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-2 italic">
                        Belum ada kamar yang ditambahkan. Masukkan nomor kamar dan lantai di bawah.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {hotelRooms.map((room, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs"
                          >
                            <span className="font-mono font-bold text-white">No. {room.noKamar}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 border border-amber-500/30 text-amber-300 font-bold font-mono">
                              Lt. {room.lantai || '1'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveRoomFromHotel(room.noKamar)}
                              className="text-rose-400 hover:text-rose-300 p-0.5 rounded transition-colors ml-0.5"
                              title="Hapus Kamar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Room Inputs */}
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-200">Tambah Nomor Kamar & Lantai:</span>
                      <span className="text-[10px] text-slate-400">Tekan tombol + untuk memasukkan</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-medium text-slate-400 mb-1">Nomor Kamar</label>
                        <input
                          type="text"
                          placeholder="Misal: 101"
                          value={newRoomNo}
                          onChange={(e) => setNewRoomNo(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-400 mb-1">Lantai</label>
                        <input
                          type="text"
                          placeholder="Misal: 1"
                          value={newRoomLantai}
                          onChange={(e) => setNewRoomLantai(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-400 mb-1">Kapasitas</label>
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={newRoomKapasitas}
                            onChange={(e) => setNewRoomKapasitas(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleAddRoomToHotel}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shrink-0 transition-colors shadow-sm"
                            title="Tambahkan Kamar"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingItem ? 'Simpan Perubahan' : 'Tambah Master Data'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Custom Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base font-['Outfit',sans-serif]">
                  Hapus Master {deleteTarget.typeLabel}?
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Apakah Anda yakin ingin menghapus master data berikut dari sistem?
                </p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Kategori:</span>
                <span className="font-semibold text-slate-300">{deleteTarget.typeLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nama / Item:</span>
                <span className="font-bold text-white">{deleteTarget.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ID Referensi:</span>
                <span className="font-mono text-cyan-400">{deleteTarget.id}</span>
              </div>
            </div>

            <p className="text-[11px] text-amber-300/80 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5">
              Catatan: Pastikan peserta atau alokasi yang menggunakan data ini sudah disesuaikan jika diperlukan.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                id="btn-cancel-delete-master"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                Batalkan
              </button>
              <button
                type="button"
                id="btn-confirm-delete-master"
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Hapus Master Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
