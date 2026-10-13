import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Download, 
  Eye, 
  Printer, 
  FileText, 
  Bus, 
  Hotel, 
  Shirt, 
  X, 
  Save, 
  CheckCircle, 
  AlertCircle,
  AlertTriangle,
  Loader2,
  Phone,
  Layers,
  ChevronDown,
  Upload,
  FileSpreadsheet,
  FileUp,
  FileDown,
  CheckCircle2,
  HelpCircle,
  ArrowDownToLine,
  RefreshCw,
  MessageCircle,
  UserCheck,
  Utensils,
  MapPin,
  Calendar
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api, PublicMasterData } from '../services/api';
import { Peserta, AnggotaKeluarga, DokumenLampiran } from '../types';
import { ParticipantCardModal } from './ParticipantCardModal';
import { getWhatsAppUrl } from '../lib/whatsapp';

export const PesertaManagement: React.FC = () => {
  const [pesertaList, setPesertaList] = useState<Peserta[]>([]);
  const [masterData, setMasterData] = useState<PublicMasterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Multi-Filters
  const [filterUnit, setFilterUnit] = useState('');
  const [filterJabatan, setFilterJabatan] = useState('');
  const [filterStatusPernikahan, setFilterStatusPernikahan] = useState('');
  const [filterKaos, setFilterKaos] = useState('');
  const [filterBis, setFilterBis] = useState('');
  const [filterHotel, setFilterHotel] = useState('');
  const [filterKamar, setFilterKamar] = useState('');
  const [filterMakan, setFilterMakan] = useState('');
  const [filterAcara, setFilterAcara] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modals & Selected items
  const [cardModalPeserta, setCardModalPeserta] = useState<Peserta | null>(null);
  const [editModalPeserta, setEditModalPeserta] = useState<Peserta | null>(null);
  const [isNewModal, setIsNewModal] = useState(false);
  const [viewDocModal, setViewDocModal] = useState<DokumenLampiran | null>(null);

  // Excel Upload & Import Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [parsedTotalCount, setParsedTotalCount] = useState(0);
  const [updateExistingOnImport, setUpdateExistingOnImport] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    updatedCount: number;
    totalProcessed: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State for Create/Edit
  const [formNama, setFormNama] = useState('');
  const [formNik, setFormNik] = useState('');
  const [formJk, setFormJk] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [formStatusPernikahan, setFormStatusPernikahan] = useState<'Menikah' | 'Belum Menikah' | 'Cerai Hidup' | 'Cerai Mati'>('Menikah');
  const [formUnitId, setFormUnitId] = useState('');
  const [formJabatanId, setFormJabatanId] = useState('');
  const [formHp, setFormHp] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formKaosId, setFormKaosId] = useState('');
  const [formBisId, setFormBisId] = useState('');
  const [formNamaSupir, setFormNamaSupir] = useState('');
  const [formNoHpSopir, setFormNoHpSopir] = useState('');
  const [formTourLeader, setFormTourLeader] = useState('');
  const [formNoHpTourLeader, setFormNoHpTourLeader] = useState('');
  const [formKursi1, setFormKursi1] = useState('');
  const [formKursi2, setFormKursi2] = useState('');
  const [formKursi3, setFormKursi3] = useState('');
  const [formKursi4, setFormKursi4] = useState('');
  const [formKursi5, setFormKursi5] = useState('');
  const [formKursi6, setFormKursi6] = useState('');
  const [formKursi7, setFormKursi7] = useState('');
  const [formHotelId, setFormHotelId] = useState('');
  const [formNoKamar, setFormNoKamar] = useState('');
  const [formLantaiHotel, setFormLantaiHotel] = useState('');
  const [formMakanId, setFormMakanId] = useState('');
  const [formAcaraId, setFormAcaraId] = useState('');
  const [formCatatan, setFormCatatan] = useState('');
  const [formPenyakit, setFormPenyakit] = useState('');
  const [formStatus, setFormStatus] = useState<'DITERIMA' | 'MENUNGGU_VERIFIKASI' | 'DIBATALKAN'>('DITERIMA');
  const [formKeluarga, setFormKeluarga] = useState<AnggotaKeluarga[]>([]);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nama: string; noAgenda: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    loadData();
  }, [filterUnit, filterJabatan, filterStatusPernikahan, filterKaos, filterBis, filterHotel, filterKamar, filterMakan, filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, mRes] = await Promise.all([
        api.getPesertaList({
          search,
          unit: filterUnit,
          jabatan: filterJabatan,
          statusPernikahan: filterStatusPernikahan,
          kaos: filterKaos,
          bis: filterBis,
          hotel: filterHotel,
          kamar: filterKamar,
          makan: filterMakan,
          acara: filterAcara,
          status: filterStatus,
        }),
        api.getPublicMaster(),
      ]);
      setPesertaList(pRes.data);
      setMasterData(mRes);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleResetFilter = () => {
    setSearch('');
    setFilterUnit('');
    setFilterJabatan('');
    setFilterStatusPernikahan('');
    setFilterKaos('');
    setFilterBis('');
    setFilterHotel('');
    setFilterKamar('');
    setFilterMakan('');
    setFilterAcara('');
    setFilterStatus('');
  };

  const openCreateModal = () => {
    setIsNewModal(true);
    setEditModalPeserta(null);
    setFormNama('');
    // Auto-generate Nomor Peserta for new modal
    const existingNumbers = pesertaList.map(p => {
      const match = p.nikNip?.match(/NP-2026-(\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxNum = existingNumbers.length > 0 ? Math.max(0, ...existingNumbers) : 0;
    const nextNum = Math.max(maxNum + 1, pesertaList.length + 1);
    setFormNik(`NP-2026-${String(nextNum).padStart(4, '0')}`);
    setFormJk('Laki-laki');
    setFormStatusPernikahan('Menikah');
    setFormUnitId(masterData?.unitKerja[0]?.id || '');
    setFormJabatanId(masterData?.jabatan[0]?.id || '');
    setFormHp('');
    setFormEmail('');
    setFormKaosId(masterData?.kaos[0]?.id || '');
    const firstBis = masterData?.bis[0];
    setFormBisId(firstBis?.id || '');
    setFormNamaSupir(firstBis?.namaSupir || '');
    setFormNoHpSopir(firstBis?.noHpSopir || '');
    setFormTourLeader(firstBis?.namaKoordinator || '');
    setFormNoHpTourLeader(firstBis?.kontakKoordinator || '');
    setFormKursi1('');
    setFormKursi2('');
    setFormKursi3('');
    setFormKursi4('');
    setFormKursi5('');
    setFormKursi6('');
    setFormKursi7('');
    setFormHotelId(masterData?.hotel[0]?.id || '');
    setFormNoKamar(masterData?.hotel[0]?.daftarKamar[0]?.noKamar || '101');
    setFormLantaiHotel(masterData?.hotel[0]?.daftarKamar[0]?.lantai || '1');
    setFormMakanId(masterData?.tempatMakan[0]?.id || '');
    setFormAcaraId(masterData?.tempatAcara?.[0]?.id || '');
    setFormCatatan('');
    setFormPenyakit('');
    setFormStatus('DITERIMA');
    setFormKeluarga([]);
    setModalError(null);
  };

  const openEditModal = (p: Peserta) => {
    setIsNewModal(false);
    setEditModalPeserta(p);
    setFormNama(p.namaLengkap);
    setFormNik(p.nikNip);
    setFormJk(p.jenisKelamin);
    setFormStatusPernikahan((p.statusPernikahan as any) || 'Menikah');
    setFormUnitId(p.unitKerjaId);
    setFormJabatanId(p.jabatanId);
    setFormHp(p.noHpWa);
    setFormEmail(p.email || '');
    setFormKaosId(p.ukuranKaosId);
    setFormBisId(p.bisId);
    const busObj = masterData?.bis.find(b => b.id === p.bisId || b.namaBis === p.bisNama);
    setFormNamaSupir(p.namaSupir || busObj?.namaSupir || '');
    setFormNoHpSopir(p.noHpSopir || busObj?.noHpSopir || '');
    setFormTourLeader(p.tourLeader || busObj?.namaKoordinator || '');
    setFormNoHpTourLeader(p.noHpTourLeader || busObj?.kontakKoordinator || '');
    setFormKursi1(p.kursi1 || p.nomorKursi || '');
    setFormKursi2(p.kursi2 || '');
    setFormKursi3(p.kursi3 || '');
    setFormKursi4(p.kursi4 || '');
    setFormKursi5(p.kursi5 || '');
    setFormKursi6(p.kursi6 || '');
    setFormKursi7(p.kursi7 || '');
    setFormHotelId(p.hotelId);
    setFormNoKamar(p.noKamar || '101');
    const hotelObj = masterData?.hotel.find(h => h.id === p.hotelId);
    const roomObj = hotelObj?.daftarKamar.find(k => k.noKamar === p.noKamar);
    setFormLantaiHotel(p.lantaiHotel || roomObj?.lantai || (p.noKamar && p.noKamar.length >= 3 ? p.noKamar.charAt(0) : '1'));
    setFormMakanId(p.tempatMakanId);
    const defaultAcaraId = p.tempatAcaraId || masterData?.tempatAcara?.find(a => a.namaTempat === p.tempatAcara || a.namaTempat === p.tempatAcaraNama)?.id || masterData?.tempatAcara?.[0]?.id || '';
    setFormAcaraId(defaultAcaraId);
    setFormCatatan(p.catatanKhusus || '');
    setFormPenyakit(p.riwayatPenyakit || '');
    setFormStatus(p.status);
    setFormKeluarga([...p.keluarga]);
    setModalError(null);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim() || !formHp.trim()) {
      setModalError('Nama Lengkap dan No. WhatsApp wajib diisi.');
      return;
    }

    try {
      setSaving(true);
      setModalError(null);

      const unit = masterData?.unitKerja.find(u => u.id === formUnitId);
      const cleanUnitNama = unit ? unit.nama.replace(/\s*\([^)]*\)/g, '').trim() : '';
      const jabatan = masterData?.jabatan.find(j => j.id === formJabatanId);
      const cleanJabatanNama = jabatan ? jabatan.nama.replace(/\s*\([^)]*\)/g, '').trim() : '';
      const kaos = masterData?.kaos.find(k => k.id === formKaosId);
      const bis = masterData?.bis.find(b => b.id === formBisId);
      const hotel = masterData?.hotel.find(h => h.id === formHotelId);
      const roomObj = hotel?.daftarKamar.find(k => k.noKamar === formNoKamar);
      const finalFloor = formLantaiHotel.trim() || roomObj?.lantai || (formNoKamar.length >= 3 ? formNoKamar.charAt(0) : '1');
      const makan = masterData?.tempatMakan.find(m => m.id === formMakanId);
      const acara = masterData?.tempatAcara?.find(a => a.id === formAcaraId);

      const payload: Partial<Peserta> = {
        namaLengkap: formNama,
        nikNip: formNik,
        jenisKelamin: formJk,
        statusPernikahan: formStatusPernikahan,
        unitKerjaId: formUnitId,
        unitKerjaNama: cleanUnitNama,
        jabatanId: formJabatanId,
        jabatanNama: cleanJabatanNama,
        noHpWa: formHp,
        email: formEmail,
        ukuranKaosId: formKaosId,
        ukuranKaosNama: kaos?.ukuran || '',
        bisId: formBisId,
        bisNama: bis?.namaBis || '',
        nomorKursi: formKursi1,
        namaSupir: formNamaSupir,
        noHpSopir: formNoHpSopir,
        tourLeader: formTourLeader,
        noHpTourLeader: formNoHpTourLeader,
        kursi1: formKursi1,
        kursi2: formKursi2,
        kursi3: formKursi3,
        kursi4: formKursi4,
        kursi5: formKursi5,
        kursi6: formKursi6,
        kursi7: formKursi7,
        hotelId: formHotelId,
        hotelNama: hotel?.namaHotel || '',
        noKamar: formNoKamar,
        lantaiHotel: finalFloor,
        tipeKamar: roomObj?.tipe || 'Standard',
        tempatMakanId: formMakanId,
        tempatMakanNama: makan?.namaTempat || '',
        tempatAcaraId: formAcaraId,
        tempatAcaraNama: acara?.namaTempat || '',
        tempatAcara: acara?.namaTempat || '',
        catatanKhusus: formCatatan,
        riwayatPenyakit: formPenyakit,
        status: formStatus,
        keluarga: formKeluarga,
      };

      if (isNewModal) {
        await api.createPeserta(payload);
        showToast(`Peserta "${formNama}" berhasil ditambahkan secara manual.`);
      } else if (editModalPeserta) {
        await api.updatePeserta(editModalPeserta.id, payload);
        showToast(`Data peserta "${formNama}" berhasil diperbarui.`);
      }

      setEditModalPeserta(null);
      setIsNewModal(false);
      await loadData();
    } catch (err: any) {
      setModalError(err.message || 'Gagal menyimpan data peserta');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (peserta: Peserta) => {
    setDeleteTarget({
      id: peserta.id,
      nama: peserta.namaLengkap,
      noAgenda: peserta.nomorAgenda,
    });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await api.deletePeserta(deleteTarget.id);
      showToast(`Peserta "${deleteTarget.nama}" (${deleteTarget.noAgenda}) berhasil dihapus.`);
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      showToast('Gagal menghapus: ' + (err.message || 'Terjadi kesalahan sistem'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const exportExcel = () => {
    if (pesertaList.length === 0) {
      showToast('Tidak ada data peserta untuk diekspor.', 'error');
      return;
    }

    const dataRows = pesertaList.map((p, idx) => {
      // Ekstrak pasangan (Suami/Istri)
      const spouse = p.keluarga.find(k => k.hubungan === 'Suami' || k.hubungan === 'Istri');
      
      // Ekstrak anak-anak berurutan (Anak 1 s/d 5)
      const anakList = p.keluarga.filter(k => 
        k.hubungan.toLowerCase().includes('anak') || 
        ['anak 1', 'anak 2', 'anak 3', 'anak 4', 'anak 5'].includes(k.hubungan.toLowerCase())
      );
      
      // Helper untuk mendapatkan usia atau kategori usia anak
      const getUsiaDisplay = (anak?: typeof p.keluarga[0]) => {
        if (!anak) return '-';
        if (anak.usia !== undefined && anak.usia !== null && anak.usia !== '') return String(anak.usia);
        return anak.kategoriUsia || '-';
      };

      const anak1 = anakList[0];
      const anak2 = anakList[1];
      const anak3 = anakList[2];
      const anak4 = anakList[3];
      const anak5 = anakList[4];
      const matchedBis = masterData?.bis.find(b => b.id === p.bisId || b.namaBis === p.bisNama || `${b.nomorBis} - ${b.namaBis}` === p.bisNama);

      return {
        'No': idx + 1,
        'No Peserta': p.nomorAgenda,
        'Status': p.status,
        'Nama Lengkap': p.namaLengkap,
        'Jenis Kelamin': p.jenisKelamin,
        'Status Perkawinan': p.statusPernikahan || 'Menikah',
        'Unit Kerja': (p.unitKerjaNama || '').replace(/\s*\([^)]*\)/g, '').trim(),
        'Jabatan': p.jabatanNama,
        'No HP / WA': p.noHpWa,
        'Ukuran Kaos_Pes': p.ukuranKaosNama,
        'Nama Istri / Suami': spouse ? spouse.nama : '-',
        'Ukuran Kaos_IS': spouse ? (spouse.ukuranKaosNama || '-') : '-',
        'Nama Anak1': anak1 ? anak1.nama : '-',
        'Usia Anak1': getUsiaDisplay(anak1),
        'Nama Anak2': anak2 ? anak2.nama : '-',
        'Usia Anak2': getUsiaDisplay(anak2),
        'Nama Anak3': anak3 ? anak3.nama : '-',
        'Usia Anak3': getUsiaDisplay(anak3),
        'Nama Anak4': anak4 ? anak4.nama : '-',
        'Usia Anak 4': getUsiaDisplay(anak4),
        'Nama Anak5': anak5 ? anak5.nama : '-',
        'Usia Anak5': getUsiaDisplay(anak5),
        'Jml_Ang_kel': p.keluarga.length,
        'Total_Romb': 1 + p.keluarga.length,
        'Armada Bis': p.bisNama || (matchedBis ? `${matchedBis.nomorBis} - ${matchedBis.namaBis}` : '-'),
        'Nama Supir': p.namaSupir || matchedBis?.namaSupir || '-',
        'No HP Sopir': p.noHpSopir || matchedBis?.noHpSopir || '-',
        'Tour Leader': p.tourLeader || matchedBis?.namaKoordinator || '-',
        'No HP TL': p.noHpTourLeader || matchedBis?.kontakKoordinator || '-',
        'Kursi1': p.kursi1 || p.nomorKursi || '-',
        'Kursi2': p.kursi2 || '-',
        'Kursi3': p.kursi3 || '-',
        'Kursi4': p.kursi4 || '-',
        'Kursi5': p.kursi5 || '-',
        'Kursi6': p.kursi6 || '-',
        'Kursi7': p.kursi7 || '-',
        'Hotel': p.hotelNama || '-',
        'No Kamar': p.noKamar || '-',
        'Lantai': p.lantaiHotel || (p.noKamar && p.noKamar.length >= 3 ? p.noKamar.charAt(0) : '1'),
        'Tempat Makan': p.tempatMakanNama || '-',
        'Tempat Acara': p.tempatAcaraNama || p.tempatAcara || '-',
        'Rincian Rombongan': `1 Pegawai ${p.keluarga.length > 0 ? `+ ${p.keluarga.length} Keluarga` : '(Sendiri)'}`,
        'Rincian Keluarga': p.keluarga.map(k => `${k.nama} (${k.hubungan}, Kaos: ${(k.hubungan === 'Suami' || k.hubungan === 'Istri') ? (k.ukuranKaosNama || '-') : 'Tanpa Kaos'})`).join('; ') || '-',
        'Riwayat Penyakit': p.riwayatPenyakit || '-',
        'Catatan Khusus': p.catatanKhusus || '-',
        'Waktu Registrasi': p.createdAt ? new Date(p.createdAt).toLocaleString('id-ID') : '-',
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataRows);

    // Set column widths
    ws['!cols'] = [
      { wch: 6 },  // No
      { wch: 14 }, // No Peserta
      { wch: 15 }, // Status
      { wch: 28 }, // Nama Lengkap
      { wch: 15 }, // Jenis Kelamin
      { wch: 18 }, // Status Perkawinan
      { wch: 25 }, // Unit Kerja
      { wch: 22 }, // Jabatan
      { wch: 18 }, // No HP/WA
      { wch: 16 }, // Ukuran Kaos_Pes
      { wch: 24 }, // Nama Istri / Suami
      { wch: 16 }, // Ukuran Kaos_IS
      { wch: 20 }, // Nama Anak1
      { wch: 14 }, // Usia Anak1
      { wch: 20 }, // Nama Anak2
      { wch: 14 }, // Usia Anak2
      { wch: 20 }, // Nama Anak3
      { wch: 14 }, // Usia Anak3
      { wch: 20 }, // Nama Anak4
      { wch: 14 }, // Usia Anak 4
      { wch: 20 }, // Nama Anak5
      { wch: 14 }, // Usia Anak5
      { wch: 14 }, // Jml_Ang_kel
      { wch: 14 }, // Total_Romb
      { wch: 25 }, // Armada Bis
      { wch: 20 }, // Nama Supir
      { wch: 16 }, // No HP Sopir
      { wch: 20 }, // Tour Leader
      { wch: 16 }, // No HP TL
      { wch: 10 }, // Kursi1
      { wch: 10 }, // Kursi2
      { wch: 10 }, // Kursi3
      { wch: 10 }, // Kursi4
      { wch: 10 }, // Kursi5
      { wch: 10 }, // Kursi6
      { wch: 10 }, // Kursi7
      { wch: 24 }, // Hotel
      { wch: 12 }, // No Kamar
      { wch: 10 }, // Lantai
      { wch: 24 }, // Tempat Makan
      { wch: 24 }, // Tempat Acara
      { wch: 26 }, // Rincian Rombongan
      { wch: 45 }, // Rincian Keluarga
      { wch: 24 }, // Riwayat Penyakit
      { wch: 24 }, // Catatan Khusus
      { wch: 20 }, // Waktu Registrasi
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Peserta Gathering');

    // Summary Sheet
    const totalKeluargaAll = pesertaList.reduce((acc, curr) => acc + curr.keluarga.length, 0);
    const summaryRows = [
      { 'Kategori / Parameter': 'Total Pegawai (Peserta Utama)', 'Nilai': pesertaList.length },
      { 'Kategori / Parameter': 'Total Anggota Keluarga', 'Nilai': totalKeluargaAll },
      { 'Kategori / Parameter': 'Total Seluruh Rombongan (Pegawai + Keluarga)', 'Nilai': totalOrangFiltered },
      { 'Kategori / Parameter': 'Status DITERIMA (Terverifikasi)', 'Nilai': pesertaList.filter(p => p.status === 'DITERIMA').length },
      { 'Kategori / Parameter': 'Status MENUNGGU VERIFIKASI', 'Nilai': pesertaList.filter(p => p.status === 'MENUNGGU_VERIFIKASI').length },
      { 'Kategori / Parameter': 'Waktu Ekspor', 'Nilai': new Date().toLocaleString('id-ID') },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 35 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

    const fileName = `Data_Peserta_Gathering_Pangandaran_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast(`File Excel "${fileName}" berhasil diunduh!`);
  };

  const downloadTemplateExcel = () => {
    const templateData = [
      {
        'No Peserta': 'PG26-0001',
        'Nama Lengkap': 'Ahmad Fauzi, S.Kep',
        'Jenis Kelamin': 'Laki-laki',
        'Status Perkawinan': 'Menikah',
        'Unit Kerja': 'MEDIKA',
        'Jabatan': 'Perawat Ahli',
        'No HP / WA': '081234567890',
        'Email': 'ahmad.fauzi@example.com',
        'Ukuran Kaos_Pes': 'L',
        'Nama Istri / Suami': 'Dewi Lestari',
        'Ukuran Kaos_IS': 'M',
        'Armada Bis': 'Bis 01',
        'Nama Supir': 'Pak Asep',
        'No HP Sopir': '081311223344',
        'Tour Leader': 'Budi Santoso',
        'No HP TL': '081234567890',
        'Kursi1': '1A',
        'Kursi2': '1B',
        'Kursi3': '',
        'Kursi4': '',
        'Kursi5': '',
        'Kursi6': '',
        'Kursi7': '',
        'Hotel': 'Hotel Horison Palma Pangandaran',
        'No Kamar': '101',
        'Lantai': '1',
        'Tempat Makan': 'RM Karya Bahari Pangandaran',
        'Tempat Acara': 'Pantai Barat Pangandaran',
        'Status': 'DITERIMA',
        'Riwayat Penyakit': 'Tidak ada',
        'Catatan Khusus': 'Alergi seafood udang',
      },
      {
        'No Peserta': '',
        'Nama Lengkap': 'dr. Siti Rahmayanti, Sp.A',
        'Jenis Kelamin': 'Perempuan',
        'Status Perkawinan': 'Menikah',
        'Unit Kerja': 'MEDIKA',
        'Jabatan': 'Dokter Spesialis',
        'No HP / WA': '081987654321',
        'Email': 'siti.rahmayanti@example.com',
        'Ukuran Kaos_Pes': 'M',
        'Nama Istri / Suami': 'dr. Hendra Kusuma',
        'Ukuran Kaos_IS': 'XL',
        'Armada Bis': 'Bis 02',
        'Nama Supir': 'Pak Dadang',
        'No HP Sopir': '081322334455',
        'Tour Leader': 'Hendri Pratama',
        'No HP TL': '081298765432',
        'Kursi1': '2A',
        'Kursi2': '2B',
        'Kursi3': '',
        'Kursi4': '',
        'Kursi5': '',
        'Kursi6': '',
        'Kursi7': '',
        'Hotel': 'Hotel Horison Palma Pangandaran',
        'No Kamar': '102',
        'Lantai': '1',
        'Tempat Makan': 'RM Karya Bahari Pangandaran',
        'Tempat Acara': 'Pantai Barat Pangandaran',
        'Status': 'DITERIMA',
        'Riwayat Penyakit': 'Asma ringan',
        'Catatan Khusus': 'Duduk di baris depan bis',
      },
      {
        'No Peserta': '',
        'Nama Lengkap': 'Budi Santoso, S.Kom',
        'Jenis Kelamin': 'Laki-laki',
        'Status Perkawinan': 'Belum Menikah',
        'Unit Kerja': 'IT & SISTEM INFORMASI',
        'Jabatan': 'Staff TI',
        'No HP / WA': '085712349988',
        'Email': 'budi.santoso@example.com',
        'Ukuran Kaos_Pes': 'XL',
        'Nama Istri / Suami': '',
        'Ukuran Kaos_IS': '',
        'Armada Bis': 'Bis 01',
        'Nama Supir': 'Pak Asep',
        'No HP Sopir': '081311223344',
        'Tour Leader': 'Budi Santoso',
        'No HP TL': '081234567890',
        'Kursi1': '3A',
        'Kursi2': '',
        'Kursi3': '',
        'Kursi4': '',
        'Kursi5': '',
        'Kursi6': '',
        'Kursi7': '',
        'Hotel': 'The Allure Villas Managed by Sahid',
        'No Kamar': '205',
        'Lantai': '2',
        'Tempat Makan': 'Pangandaran Seafood Plaza',
        'Tempat Acara': 'Pantai Barat Pangandaran',
        'Status': 'DITERIMA',
        'Riwayat Penyakit': '',
        'Catatan Khusus': 'Membawa perlengkapan dokumentasi',
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 14 }, // No Peserta
      { wch: 28 }, // Nama Lengkap
      { wch: 15 }, // Jenis Kelamin
      { wch: 18 }, // Status Perkawinan
      { wch: 22 }, // Unit Kerja
      { wch: 20 }, // Jabatan
      { wch: 16 }, // No HP / WA
      { wch: 26 }, // Email
      { wch: 16 }, // Ukuran Kaos_Pes
      { wch: 22 }, // Nama Istri / Suami
      { wch: 16 }, // Ukuran Kaos_IS
      { wch: 16 }, // Armada Bis
      { wch: 18 }, // Nama Supir
      { wch: 16 }, // No HP Sopir
      { wch: 18 }, // Tour Leader
      { wch: 16 }, // No HP TL
      { wch: 10 }, // Kursi1
      { wch: 10 }, // Kursi2
      { wch: 10 }, // Kursi3
      { wch: 10 }, // Kursi4
      { wch: 10 }, // Kursi5
      { wch: 10 }, // Kursi6
      { wch: 10 }, // Kursi7
      { wch: 32 }, // Hotel
      { wch: 12 }, // No Kamar
      { wch: 10 }, // Lantai
      { wch: 28 }, // Tempat Makan
      { wch: 28 }, // Tempat Acara
      { wch: 14 }, // Status
      { wch: 20 }, // Riwayat Penyakit
      { wch: 30 }, // Catatan Khusus
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Peserta');

    const panduanData = [
      { 'Kolom': 'No Peserta', 'Keterangan': 'Boleh dikosongkan (sistem otomatis membuat nomor seperti PG26-XXXX)' },
      { 'Kolom': 'Nama Lengkap', 'Keterangan': 'Wajib diisi (Nama lengkap peserta utama)' },
      { 'Kolom': 'Jenis Kelamin', 'Keterangan': 'Laki-laki atau Perempuan' },
      { 'Kolom': 'Status Perkawinan', 'Keterangan': 'Menikah, Belum Menikah, Cerai Hidup, atau Cerai Mati' },
      { 'Kolom': 'Unit Kerja', 'Keterangan': 'Nama Unit atau Kode Unit (contoh: MEDIKA, OPERASIONAL, IT, dll)' },
      { 'Kolom': 'Jabatan', 'Keterangan': 'Nama Jabatan atau level posisi' },
      { 'Kolom': 'Ukuran Kaos_Pes', 'Keterangan': 'Ukuran kaos pegawai/peserta (contoh: S, M, L, XL, XXL, 3XL)' },
      { 'Kolom': 'Nama Istri / Suami', 'Keterangan': 'Nama pasangan sah (jika ikut gathering)' },
      { 'Kolom': 'Ukuran Kaos_IS', 'Keterangan': 'Ukuran kaos pasangan Suami/Istri (contoh: S, M, L, XL, XXL)' },
      { 'Kolom': 'Armada Bis', 'Keterangan': 'Nomor atau Nama Bis (contoh: Bis 01, Bis 02, Bis 03)' },
      { 'Kolom': 'Nama Supir', 'Keterangan': 'Nama supir armada bis' },
      { 'Kolom': 'No HP Sopir', 'Keterangan': 'Nomor HP/WA supir bis' },
      { 'Kolom': 'Tour Leader', 'Keterangan': 'Nama Tour Leader / Koordinator bis' },
      { 'Kolom': 'No HP TL', 'Keterangan': 'Nomor kontak WhatsApp Tour Leader' },
      { 'Kolom': 'Kursi1 - Kursi7', 'Keterangan': 'Nomor alokasi kursi peserta & keluarga (contoh: 1A, 1B, 2A, dll)' },
      { 'Kolom': 'Hotel', 'Keterangan': 'Nama hotel penginapan yang dialokasikan' },
      { 'Kolom': 'No Kamar & Lantai', 'Keterangan': 'Nomor kamar dan lantai penginapan' },
      { 'Kolom': 'Tempat Makan', 'Keterangan': 'Nama restoran / tempat makan bersama' },
      { 'Kolom': 'Tempat Acara', 'Keterangan': 'Lokasi kegiatan gathering / acara utama' },
      { 'Kolom': 'Status', 'Keterangan': 'DITERIMA atau MENUNGGU_VERIFIKASI' },
    ];
    const wsPanduan = XLSX.utils.json_to_sheet(panduanData);
    wsPanduan['!cols'] = [{ wch: 20 }, { wch: 65 }];
    XLSX.utils.book_append_sheet(wb, wsPanduan, 'Petunjuk Pengisian');

    XLSX.writeFile(wb, 'Template_Import_Peserta_Gathering_2026.xlsx');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    processSelectedFile(file);
  };

  const processSelectedFile = (file: File) => {
    setImportFile(file);
    setImportError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonRows || jsonRows.length === 0) {
          setImportError('File Excel tidak memiliki baris data atau kosong.');
          setPreviewRows([]);
          setParsedTotalCount(0);
          return;
        }

        const mapped = jsonRows.map((r) => {
          const keys = Object.keys(r);
          const findVal = (...aliases: string[]) => {
            for (const alias of aliases) {
              const match = keys.find((k) => k.trim().toLowerCase() === alias.toLowerCase());
              if (match && r[match] !== undefined && r[match] !== null) {
                return String(r[match]).trim();
              }
            }
            return '';
          };

          return {
            nomorAgenda: findVal('no agenda', 'nomor agenda', 'no_agenda', 'agenda', 'id agenda'),
            namaLengkap: findVal('nama lengkap', 'nama', 'nama_lengkap', 'fullname', 'nama peserta'),
            nikNip: findVal('nomor peserta', 'no peserta', 'no. peserta', 'nomor_peserta', 'nik/nip', 'nik / nip', 'nik', 'nip', 'nik_nip', 'no_induk', 'nomor induk', 'no identitas'),
            jenisKelamin: findVal('jenis kelamin', 'jk', 'gender', 'jenis_kelamin').toLowerCase().startsWith('p') ? 'Perempuan' : 'Laki-laki',
            unitKerjaNama: findVal('unit kerja', 'unit_kerja', 'unit', 'divisi', 'departemen', 'bagian'),
            jabatanNama: findVal('jabatan', 'posisi', 'level'),
            noHpWa: findVal('no hp/wa', 'no hp / wa', 'no hp', 'no wa', 'nohp', 'no_hp', 'telepon', 'whatsapp', 'phone'),
            email: findVal('email', 'surel', 'e-mail'),
            ukuranKaosNama: findVal('ukuran kaos_pes', 'ukuran kaos pes', 'ukuran kaos', 'ukuran_kaos', 'kaos', 'size kaos', 'size baju', 'ukuran'),
            bisNama: findVal('armada bis', 'nomor bis', 'bus', 'bis', 'bis_nama', 'armada'),
            namaSupir: findVal('nama supir', 'nama driver', 'supir', 'driver'),
            noHpSopir: findVal('no hp sopir', 'no hp supir', 'hp sopir', 'hp supir', 'kontak sopir', 'kontak supir'),
            tourLeader: findVal('tour leader', 'tl', 'nama tour leader', 'nama tl', 'koordinator bis', 'nama koordinator'),
            noHpTourLeader: findVal('no hp tl', 'no hp tour leader', 'hp tl', 'hp tour leader', 'kontak tl', 'kontak tour leader'),
            nomorKursi: findVal('kursi1', 'kursi 1', 'no kursi', 'nomor kursi', 'kursi'),
            kursi1: findVal('kursi1', 'kursi 1', 'no kursi', 'nomor kursi', 'kursi'),
            kursi2: findVal('kursi2', 'kursi 2'),
            kursi3: findVal('kursi3', 'kursi 3'),
            kursi4: findVal('kursi4', 'kursi 4'),
            kursi5: findVal('kursi5', 'kursi 5'),
            kursi6: findVal('kursi6', 'kursi 6'),
            kursi7: findVal('kursi7', 'kursi 7'),
            hotelNama: findVal('hotel', 'nama hotel', 'penginapan'),
            noKamar: findVal('no kamar', 'nomor kamar', 'kamar', 'room'),
            lantaiHotel: findVal('lantai', 'lantai hotel', 'floor', 'lantai_hotel', 'no lantai'),
            tipeKamar: findVal('tipe kamar', 'tipe'),
            tempatMakanNama: findVal('tempat makan', 'resto', 'rumah makan', 'lokasi makan'),
            tempatAcaraNama: findVal('tempat acara', 'tempat_acara', 'lokasi acara', 'acara', 'venue', 'venue acara'),
            status: findVal('status', 'status pendaftaran').toUpperCase().includes('VERIFIKASI') ? 'MENUNGGU_VERIFIKASI' : findVal('status', 'status pendaftaran').toUpperCase().includes('BATAL') ? 'DIBATALKAN' : 'DITERIMA',
            catatanKhusus: findVal('catatan khusus', 'catatan', 'keterangan'),
            riwayatPenyakit: findVal('riwayat penyakit', 'penyakit', 'kondisi medis'),
          };
        }).filter(r => r.namaLengkap || r.nikNip);

        if (mapped.length === 0) {
          setImportError('Tidak ditemukan kolom "Nama Lengkap" atau "Nomor Peserta" yang valid pada sheet Excel.');
          setPreviewRows([]);
          setParsedTotalCount(0);
          return;
        }

        setPreviewRows(mapped.slice(0, 5));
        setParsedTotalCount(mapped.length);
      } catch (err: any) {
        setImportError('Gagal membaca format file Excel: ' + (err.message || 'File rusak atau tidak kompatibel'));
      }
    };
    reader.readAsBinaryString(file);
  };

  const executeBulkImport = async () => {
    if (!importFile) return;
    try {
      setIsImporting(true);
      setImportError(null);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          const mapped = jsonRows.map((r) => {
            const keys = Object.keys(r);
            const findVal = (...aliases: string[]) => {
              for (const alias of aliases) {
                const match = keys.find((k) => k.trim().toLowerCase() === alias.toLowerCase());
                if (match && r[match] !== undefined && r[match] !== null) {
                  return String(r[match]).trim();
                }
              }
              return '';
            };

            return {
              nomorAgenda: findVal('no agenda', 'nomor agenda', 'no_agenda', 'agenda', 'id agenda'),
              namaLengkap: findVal('nama lengkap', 'nama', 'nama_lengkap', 'fullname', 'nama peserta'),
              nikNip: findVal('nomor peserta', 'no peserta', 'no. peserta', 'nomor_peserta', 'nik/nip', 'nik / nip', 'nik', 'nip', 'nik_nip', 'no_induk', 'nomor induk', 'no identitas'),
              jenisKelamin: findVal('jenis kelamin', 'jk', 'gender', 'jenis_kelamin').toLowerCase().startsWith('p') ? 'Perempuan' : 'Laki-laki',
              unitKerjaNama: findVal('unit kerja', 'unit_kerja', 'unit', 'divisi', 'departemen', 'bagian'),
              jabatanNama: findVal('jabatan', 'posisi', 'level'),
              noHpWa: findVal('no hp/wa', 'no hp / wa', 'no hp', 'no wa', 'nohp', 'no_hp', 'telepon', 'whatsapp', 'phone'),
              email: findVal('email', 'surel', 'e-mail'),
              ukuranKaosNama: findVal('ukuran kaos_pes', 'ukuran kaos pes', 'ukuran kaos', 'ukuran_kaos', 'kaos', 'size kaos', 'size baju', 'ukuran'),
              bisNama: findVal('armada bis', 'nomor bis', 'bus', 'bis', 'bis_nama', 'armada'),
              namaSupir: findVal('nama supir', 'nama driver', 'supir', 'driver'),
              noHpSopir: findVal('no hp sopir', 'no hp supir', 'hp sopir', 'hp supir', 'kontak sopir', 'kontak supir'),
              tourLeader: findVal('tour leader', 'tl', 'nama tour leader', 'nama tl', 'koordinator bis', 'nama koordinator'),
              noHpTourLeader: findVal('no hp tl', 'no hp tour leader', 'hp tl', 'hp tour leader', 'kontak tl', 'kontak tour leader'),
              nomorKursi: findVal('kursi1', 'kursi 1', 'no kursi', 'nomor kursi', 'kursi'),
              kursi1: findVal('kursi1', 'kursi 1', 'no kursi', 'nomor kursi', 'kursi'),
              kursi2: findVal('kursi2', 'kursi 2'),
              kursi3: findVal('kursi3', 'kursi 3'),
              kursi4: findVal('kursi4', 'kursi 4'),
              kursi5: findVal('kursi5', 'kursi 5'),
              kursi6: findVal('kursi6', 'kursi 6'),
              kursi7: findVal('kursi7', 'kursi 7'),
              hotelNama: findVal('hotel', 'nama hotel', 'penginapan'),
              noKamar: findVal('no kamar', 'nomor kamar', 'kamar', 'room'),
              lantaiHotel: findVal('lantai', 'lantai hotel', 'floor', 'lantai_hotel', 'no lantai'),
              tipeKamar: findVal('tipe kamar', 'tipe'),
              tempatMakanNama: findVal('tempat makan', 'resto', 'rumah makan', 'lokasi makan'),
              status: findVal('status', 'status pendaftaran').toUpperCase().includes('VERIFIKASI') ? 'MENUNGGU_VERIFIKASI' : findVal('status', 'status pendaftaran').toUpperCase().includes('BATAL') ? 'DIBATALKAN' : 'DITERIMA',
              catatanKhusus: findVal('catatan khusus', 'catatan', 'keterangan'),
              riwayatPenyakit: findVal('riwayat penyakit', 'penyakit', 'kondisi medis'),
            };
          }).filter(r => r.namaLengkap && r.nikNip);

          if (mapped.length === 0) {
            setImportError('Tidak ada baris data valid untuk diimpor (wajib ada Nama Lengkap & Nomor Peserta).');
            setIsImporting(false);
            return;
          }

          const res = await api.bulkImportPeserta(mapped, updateExistingOnImport);
          setImportResult(res);
          showToast(`Import Excel Sukses! +${res.importedCount} peserta baru, ${res.updatedCount} diperbarui.`);
          await loadData();
        } catch (err: any) {
          setImportError('Gagal memproses import data: ' + (err.message || 'Terjadi kesalahan sistem'));
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsBinaryString(importFile);
    } catch (err: any) {
      setImportError(err.message);
      setIsImporting(false);
    }
  };

  const openUploadModal = () => {
    setImportFile(null);
    setPreviewRows([]);
    setParsedTotalCount(0);
    setImportError(null);
    setImportResult(null);
    setIsUploadModalOpen(true);
  };

  const totalOrangFiltered = pesertaList.reduce((acc, curr) => acc + 1 + curr.keluarga.length, 0);

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

      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white font-['Outfit',sans-serif] flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Manajemen Data Peserta Gathering
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Total Rombongan: <strong className="text-cyan-300 font-semibold">{totalOrangFiltered} Jiwa</strong> ({pesertaList.length} Pegawai + {pesertaList.reduce((acc, curr) => acc + curr.keluarga.length, 0)} Anggota Keluarga)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              showFilters || filterUnit || filterJabatan || filterKaos || filterBis || filterHotel || filterKamar || filterMakan || filterStatus
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Multi-Filter</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Upload Excel Button */}
          <button
            id="btn-upload-excel"
            onClick={openUploadModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition-all hover:border-emerald-400 shadow-sm"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Upload (Excel)</span>
          </button>

          {/* Ekspor ke Excel Button */}
          <button
            id="btn-export-excel"
            onClick={exportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold border border-slate-700 hover:border-emerald-500/30 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Ekspor ke Excel</span>
          </button>

          {/* Tambah Peserta Button */}
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Peserta</span>
          </button>
        </div>
      </div>

      {/* Multi-Filter Panel */}
      {showFilters && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Filter Khusus Alokasi & Kategori
            </span>
            <button
              onClick={handleResetFilter}
              className="text-xs text-rose-400 hover:underline font-semibold"
            >
              Reset Semua Filter
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Filter Unit */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Unit Kerja:</label>
              <select
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Semua Unit Kerja</option>
                {masterData?.unitKerja.map(u => {
                  const cleanName = u.nama.replace(/\s*\([^)]*\)/g, '').trim();
                  return (
                    <option key={u.id} value={u.id}>{cleanName}</option>
                  );
                })}
              </select>
            </div>

            {/* Filter Jabatan */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Jabatan:</label>
              <select
                value={filterJabatan}
                onChange={(e) => setFilterJabatan(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Semua Jabatan</option>
                {masterData?.jabatan.map(j => {
                  const cleanNama = j.nama.replace(/\s*\([^)]*\)/g, '').trim();
                  return (
                    <option key={j.id} value={j.id}>{cleanNama}</option>
                  );
                })}
              </select>
            </div>

            {/* Filter Kaos */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Ukuran Kaos:</label>
              <select
                value={filterKaos}
                onChange={(e) => setFilterKaos(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Semua Ukuran Kaos</option>
                {masterData?.kaos.map(k => (
                  <option key={k.id} value={k.id}>{k.ukuran}</option>
                ))}
              </select>
            </div>

            {/* Filter Bis */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Armada Bis:</label>
              <select
                value={filterBis}
                onChange={(e) => setFilterBis(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Semua Armada Bis</option>
                {masterData?.bis.map(b => (
                  <option key={b.id} value={b.id}>{b.nomorBis} - {b.namaBis}</option>
                ))}
              </select>
            </div>

            {/* Filter Hotel */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Hotel / Penginapan:</label>
              <select
                value={filterHotel}
                onChange={(e) => setFilterHotel(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Semua Hotel</option>
                {masterData?.hotel.map(h => (
                  <option key={h.id} value={h.id}>{h.namaHotel}</option>
                ))}
              </select>
            </div>

            {/* Filter Kamar */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Cari No Kamar:</label>
              <input
                type="text"
                placeholder="Contoh: 101, 205..."
                value={filterKamar}
                onChange={(e) => setFilterKamar(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Filter Makan */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tempat Makan:</label>
              <select
                value={filterMakan}
                onChange={(e) => setFilterMakan(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Semua Tempat Makan</option>
                {masterData?.tempatMakan.map(m => (
                  <option key={m.id} value={m.id}>{m.namaTempat}</option>
                ))}
              </select>
            </div>

            {/* Filter Tempat Acara (setelah Tempat Makan) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tempat Acara:</label>
              <select
                value={filterAcara}
                onChange={(e) => setFilterAcara(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Semua Tempat Acara</option>
                {masterData?.tempatAcara?.map(a => (
                  <option key={a.id} value={a.id}>{a.namaTempat}</option>
                ))}
              </select>
            </div>

            {/* Filter Status Perkawinan */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Status Perkawinan:</label>
              <select
                value={filterStatusPernikahan}
                onChange={(e) => setFilterStatusPernikahan(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Semua Status Perkawinan</option>
                <option value="Menikah">Menikah</option>
                <option value="Belum Menikah">Belum Menikah</option>
                <option value="Cerai Hidup">Cerai Hidup</option>
                <option value="Cerai Mati">Cerai Mati</option>
              </select>
            </div>

            {/* Filter Status */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Status Verifikasi:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Semua Status</option>
                <option value="DITERIMA">DITERIMA</option>
                <option value="MENUNGGU_VERIFIKASI">MENUNGGU_VERIFIKASI</option>
                <option value="DIBATALKAN">DIBATALKAN</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari berdasarkan Nama, Nomor Peserta, atau No HP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
        >
          Cari
        </button>
      </form>

      {/* Peserta Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase tracking-wider text-[11px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Nomor Peserta</th>
                <th className="py-3.5 px-4 font-bold">Nama Peserta & Kontak</th>
                <th className="py-3.5 px-4 font-bold">Status Perkawinan</th>
                <th className="py-3.5 px-4 font-bold">Unit / Jabatan</th>
                <th className="py-3.5 px-4 font-bold">Total Rombongan</th>
                <th className="py-3.5 px-4 font-bold whitespace-nowrap">Ukuran Kaos_Pes</th>
                <th className="py-3.5 px-4 font-bold whitespace-nowrap">Armada Bis</th>
                <th className="py-3.5 px-4 font-bold whitespace-nowrap">Nama Supir</th>
                <th className="py-3.5 px-4 font-bold whitespace-nowrap">No HP Sopir</th>
                <th className="py-3.5 px-4 font-bold whitespace-nowrap">Tour Leader</th>
                <th className="py-3.5 px-4 font-bold whitespace-nowrap">No HP TL</th>
                <th className="py-3.5 px-2.5 font-bold whitespace-nowrap text-center">Kursi1</th>
                <th className="py-3.5 px-2.5 font-bold whitespace-nowrap text-center">Kursi2</th>
                <th className="py-3.5 px-2.5 font-bold whitespace-nowrap text-center">Kursi3</th>
                <th className="py-3.5 px-2.5 font-bold whitespace-nowrap text-center">Kursi4</th>
                <th className="py-3.5 px-2.5 font-bold whitespace-nowrap text-center">Kursi5</th>
                <th className="py-3.5 px-2.5 font-bold whitespace-nowrap text-center">Kursi6</th>
                <th className="py-3.5 px-2.5 font-bold whitespace-nowrap text-center">Kursi7</th>
                <th className="py-3.5 px-4 font-bold whitespace-nowrap">Hotel & Kamar</th>
                <th className="py-3.5 px-4 font-bold">Tempat Makan</th>
                <th className="py-3.5 px-4 font-bold">Tempat Acara</th>
                <th className="py-3.5 px-4 font-bold">Dokumen</th>
                <th className="py-3.5 px-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y border-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={23} className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Memuat data peserta...
                  </td>
                </tr>
              ) : pesertaList.length === 0 ? (
                <tr>
                  <td colSpan={23} className="py-12 text-center text-slate-400">
                    Tidak ada data peserta ditemukan.
                  </td>
                </tr>
              ) : (
                pesertaList.map((p) => {
                  const busInfo = masterData?.bis.find(b => b.id === p.bisId || b.namaBis === p.bisNama || `${b.nomorBis} - ${b.namaBis}` === p.bisNama);
                  const namaSupirVal = p.namaSupir || busInfo?.namaSupir || '';
                  const noHpSopirVal = p.noHpSopir || busInfo?.noHpSopir || '';
                  const tourLeaderVal = p.tourLeader || busInfo?.namaKoordinator || '';
                  const noHpTLVal = p.noHpTourLeader || busInfo?.kontakKoordinator || '';
                  const k1 = p.kursi1 || p.nomorKursi || '';
                  const k2 = p.kursi2 || '';
                  const k3 = p.kursi3 || '';
                  const k4 = p.kursi4 || '';
                  const k5 = p.kursi5 || '';
                  const k6 = p.kursi6 || '';
                  const k7 = p.kursi7 || '';

                  return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Nomor Peserta Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-900/80 border border-cyan-500/30 text-cyan-300 font-mono text-xs sm:text-sm font-bold shadow-sm tracking-wide">
                        {p.nomorAgenda}
                      </span>
                    </td>

                    {/* Peserta & Kontak */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{p.namaLengkap}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                        <a
                          href={getWhatsAppUrl(p.noHpWa, `Halo Bapak/Ibu ${p.namaLengkap}, terkait informasi kegiatan Family Gathering Pangandaran 2026 (No. Peserta: ${p.nomorAgenda})...`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-mono bg-emerald-500/10 hover:bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30 transition-all group"
                          title={`Chat WhatsApp ke ${p.namaLengkap} (${p.noHpWa})`}
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform" />
                          <span>{p.noHpWa}</span>
                        </a>
                        <span>•</span>
                        <span>{p.jenisKelamin}</span>
                      </div>
                    </td>

                    {/* Status Perkawinan */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                          p.statusPernikahan === 'Menikah'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : p.statusPernikahan === 'Belum Menikah'
                            ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {p.statusPernikahan || 'Menikah'}
                      </span>
                    </td>

                    {/* Unit / Jabatan */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{p.unitKerjaNama}</div>
                      <div className="text-[11px] text-slate-400">{p.jabatanNama}</div>
                    </td>

                    {/* Total Rombongan (Pegawai + Anggota Keluarga) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="inline-flex items-center gap-1 bg-cyan-500/15 text-cyan-300 px-2 py-0.5 rounded-md text-[11px] font-bold border border-cyan-500/30 w-fit">
                          <Users className="w-3 h-3 text-cyan-400" />
                          {1 + p.keluarga.length} Jiwa
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          1 Pegawai {p.keluarga.length > 0 ? `+ ${p.keluarga.length} Keluarga` : '(Sendiri)'}
                        </span>
                      </div>
                    </td>

                    {/* Kaos Peserta & Pasangan */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border border-emerald-500/20">
                            {p.ukuranKaosNama}
                          </span>
                          <span className="text-[10px] text-slate-400">(Peserta)</span>
                        </div>
                        {(() => {
                          const spouse = p.keluarga?.find(k => k.hubungan === 'Suami' || k.hubungan === 'Istri');
                          if (spouse && spouse.ukuranKaosNama && spouse.ukuranKaosNama !== 'Tanpa Kaos') {
                            return (
                              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <span>IS:</span>
                                <span className="text-emerald-300 font-mono font-semibold">{spouse.ukuranKaosNama}</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </td>

                    {/* Armada Bis */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                        <Bus className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate max-w-[160px]">{p.bisNama || (busInfo ? `${busInfo.nomorBis} - ${busInfo.namaBis}` : '-')}</span>
                      </div>
                    </td>

                    {/* Nama Supir */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-200">
                        {namaSupirVal || <span className="text-slate-500">-</span>}
                      </div>
                    </td>

                    {/* No HP Sopir */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {noHpSopirVal ? (
                        <a
                          href={getWhatsAppUrl(noHpSopirVal, `Halo Pak ${namaSupirVal || 'Supir'}, terkait kegiatan Family Gathering...`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-mono text-[11px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30"
                          title="Chat WhatsApp Supir"
                        >
                          <Phone className="w-2.5 h-2.5 text-emerald-400" />
                          <span>{noHpSopirVal}</span>
                        </a>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    {/* Tour Leader */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-amber-300">
                        {tourLeaderVal || <span className="text-slate-500">-</span>}
                      </div>
                    </td>

                    {/* No HP TL */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {noHpTLVal ? (
                        <a
                          href={getWhatsAppUrl(noHpTLVal, `Halo Kak ${tourLeaderVal || 'Tour Leader'}, terkait kegiatan Family Gathering...`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-mono text-[11px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30"
                          title="Chat WhatsApp Tour Leader"
                        >
                          <Phone className="w-2.5 h-2.5 text-emerald-400" />
                          <span>{noHpTLVal}</span>
                        </a>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    {/* Kursi 1 */}
                    <td className="py-3.5 px-2.5 text-center whitespace-nowrap">
                      {k1 ? (
                        <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold font-mono text-xs shadow-sm">
                          {k1}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Kursi 2 */}
                    <td className="py-3.5 px-2.5 text-center whitespace-nowrap">
                      {k2 ? (
                        <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/40 text-blue-300 font-bold font-mono text-xs shadow-sm">
                          {k2}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Kursi 3 */}
                    <td className="py-3.5 px-2.5 text-center whitespace-nowrap">
                      {k3 ? (
                        <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/40 text-blue-300 font-bold font-mono text-xs shadow-sm">
                          {k3}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Kursi 4 */}
                    <td className="py-3.5 px-2.5 text-center whitespace-nowrap">
                      {k4 ? (
                        <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/40 text-blue-300 font-bold font-mono text-xs shadow-sm">
                          {k4}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Kursi 5 */}
                    <td className="py-3.5 px-2.5 text-center whitespace-nowrap">
                      {k5 ? (
                        <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/40 text-blue-300 font-bold font-mono text-xs shadow-sm">
                          {k5}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Kursi 6 */}
                    <td className="py-3.5 px-2.5 text-center whitespace-nowrap">
                      {k6 ? (
                        <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/40 text-blue-300 font-bold font-mono text-xs shadow-sm">
                          {k6}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Kursi 7 */}
                    <td className="py-3.5 px-2.5 text-center whitespace-nowrap">
                      {k7 ? (
                        <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/40 text-blue-300 font-bold font-mono text-xs shadow-sm">
                          {k7}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Hotel & Kamar */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-medium truncate max-w-[170px] flex items-center gap-1.5">
                        <Hotel className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{p.hotelNama || '-'}</span>
                      </div>
                      <div className="text-[11px] text-amber-300 font-mono flex items-center gap-1.5 mt-0.5">
                        <span>Kamar: {p.noKamar || '-'}</span>
                        {(p.lantaiHotel || (p.noKamar && p.noKamar.length >= 3)) && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-500/30 text-amber-300 font-bold font-mono">
                            Lt. {p.lantaiHotel || (p.noKamar && p.noKamar.length >= 3 ? p.noKamar.charAt(0) : '1')}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Tempat Makan */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-rose-300 font-medium">
                        <Utensils className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="truncate max-w-[140px]">{p.tempatMakanNama || '-'}</span>
                      </div>
                    </td>

                    {/* Tempat Acara (setelah Tempat Makan) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-violet-300 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                        <span className="truncate max-w-[150px]">{p.tempatAcaraNama || p.tempatAcara || '-'}</span>
                      </div>
                    </td>

                    {/* Dokumen */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {p.dokumen && p.dokumen.length > 0 ? (
                        <button
                          onClick={() => setViewDocModal(p.dokumen[0])}
                          className="flex items-center gap-1 text-cyan-400 hover:underline text-[11px]"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{p.dokumen.length} Berkas</span>
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setCardModalPeserta(p)}
                          title="Cetak / Lihat Kartu Peserta"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-cyan-400 transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          title="Edit Peserta"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-500/20 text-indigo-400 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(p)}
                          title="Hapus Peserta"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Participant Card Modal */}
      {cardModalPeserta && (
        <ParticipantCardModal
          peserta={cardModalPeserta}
          onClose={() => setCardModalPeserta(null)}
        />
      )}

      {/* Document Previewer Modal */}
      {viewDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                {viewDocModal.namaFile}
              </h3>
              <button onClick={() => setViewDocModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-300">
                Ukuran: {(viewDocModal.ukuranBytes / (1024 * 1024)).toFixed(2)} MB • Tipe: {viewDocModal.tipe}
              </p>
              {viewDocModal.base64Data && viewDocModal.tipe.startsWith('image') ? (
                <img
                  src={viewDocModal.base64Data}
                  alt={viewDocModal.namaFile}
                  className="rounded-xl max-h-72 w-full object-contain bg-slate-950 border border-slate-800"
                />
              ) : (
                <div className="p-8 rounded-xl bg-slate-950 text-center border border-slate-800">
                  <FileText className="w-12 h-12 text-cyan-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-300 font-semibold">Dokumen PDF Terunggah Aman</p>
                  <p className="text-[10px] text-slate-500 mt-1">Disinkronkan ke Folder Google Drive Gathering 2026</p>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setViewDocModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Peserta Modal */}
      {(editModalPeserta || isNewModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl max-w-3xl lg:max-w-4xl w-full shadow-2xl flex flex-col max-h-[94vh] sm:max-h-[90vh] overflow-hidden">
            {/* Modal Sticky Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 shrink-0 bg-slate-900 z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit',sans-serif] truncate">
                    {isNewModal ? 'Tambah Peserta Baru (Admin)' : `Edit Peserta: ${formNama || editModalPeserta?.namaLengkap}`}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {editModalPeserta ? (
                      <>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-900 border border-cyan-500/50 text-cyan-300 font-mono text-xs sm:text-sm font-extrabold tracking-wide">
                          {editModalPeserta.nomorAgenda}
                        </span>
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                          <span>•</span>
                          <span>{editModalPeserta.nikNip || 'Tanpa NIP'}</span>
                          <span>•</span>
                          <span className="text-amber-300">{editModalPeserta.unitKerjaNama || '-'}</span>
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">Entri data peserta gathering oleh Panitia</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditModalPeserta(null);
                  setIsNewModal(false);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form with Scrollable Body */}
            <form onSubmit={handleSaveModal} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto px-5 sm:px-6 py-5 space-y-5 flex-1 min-h-0 text-xs custom-scrollbar">
                {modalError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                {/* Section 1: Identitas Pegawai / Peserta */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-800 text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
                    <Users className="w-3.5 h-3.5" />
                    <span>1. Data Pribadi & Kontak Peserta</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Nama Lengkap <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formNama}
                        onChange={(e) => setFormNama(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                        placeholder="Nama lengkap beserta gelar..."
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Nomor Peserta / NIP / NIK
                      </label>
                      <input
                        type="text"
                        value={formNik}
                        onChange={(e) => setFormNik(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                        placeholder="NIP / No. Identitas..."
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        No. WhatsApp / HP <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={formHp}
                          onChange={(e) => setFormHp(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                          placeholder="0812xxxxxxx"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Email Peserta (Opsional)
                      </label>
                      <input
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                        placeholder="nama@email.com"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Jenis Kelamin</label>
                      <select
                        value={formJk}
                        onChange={(e: any) => setFormJk(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Status Perkawinan</label>
                      <select
                        value={formStatusPernikahan}
                        onChange={(e: any) => setFormStatusPernikahan(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Menikah">Menikah</option>
                        <option value="Belum Menikah">Belum Menikah</option>
                        <option value="Cerai Hidup">Cerai Hidup</option>
                        <option value="Cerai Mati">Cerai Mati</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Penugasan & Ukuran Kaos */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-800 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                    <Shirt className="w-3.5 h-3.5" />
                    <span>2. Unit Kerja, Jabatan & Ukuran Kaos</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Unit Kerja</label>
                      <select
                        value={formUnitId}
                        onChange={(e) => setFormUnitId(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      >
                        {masterData?.unitKerja.map(u => {
                          const cleanName = u.nama.replace(/\s*\([^)]*\)/g, '').trim();
                          return (
                            <option key={u.id} value={u.id}>{cleanName}</option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Jabatan</label>
                      <select
                        value={formJabatanId}
                        onChange={(e) => setFormJabatanId(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      >
                        {masterData?.jabatan.map(j => {
                          const cleanNama = j.nama.replace(/\s*\([^)]*\)/g, '').trim();
                          return (
                            <option key={j.id} value={j.id}>{cleanNama}</option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Ukuran Kaos_Pes
                      </label>
                      <select
                        value={formKaosId}
                        onChange={(e) => setFormKaosId(e.target.value)}
                        className="w-full bg-slate-800 border border-emerald-500/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400 font-semibold"
                      >
                        {masterData?.kaos.map(k => (
                          <option key={k.id} value={k.id}>{k.ukuran}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Logistik & Akomodasi */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-800 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                    <Bus className="w-3.5 h-3.5" />
                    <span>3. Logistik Armada Bis & Akomodasi Hotel</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Armada Bis</label>
                      <select
                        value={formBisId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormBisId(val);
                          const b = masterData?.bis.find(item => item.id === val);
                          if (b) {
                            if (!formNamaSupir) setFormNamaSupir(b.namaSupir || '');
                            if (!formNoHpSopir) setFormNoHpSopir(b.noHpSopir || '');
                            if (!formTourLeader) setFormTourLeader(b.namaKoordinator || '');
                            if (!formNoHpTourLeader) setFormNoHpTourLeader(b.kontakKoordinator || '');
                          }
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      >
                        {masterData?.bis.map(b => (
                          <option key={b.id} value={b.id}>{b.nomorBis} - {b.namaBis}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Tempat Makan</label>
                      <select
                        value={formMakanId}
                        onChange={(e) => setFormMakanId(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      >
                        {masterData?.tempatMakan.map(m => (
                          <option key={m.id} value={m.id}>{m.namaTempat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Tempat Acara</label>
                      <select
                        value={formAcaraId}
                        onChange={(e) => setFormAcaraId(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      >
                        {masterData?.tempatAcara?.map(a => (
                          <option key={a.id} value={a.id}>{a.namaTempat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sub-Section Driver & Kursi */}
                    <div className="sm:col-span-3 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-blue-400 text-xs flex items-center gap-1.5">
                          <Bus className="w-4 h-4" />
                          Detail Supir, Tour Leader & Alokasi Kursi (Kursi 1 s/d 7)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Nama Supir:</label>
                          <input
                            type="text"
                            placeholder="Nama Supir"
                            value={formNamaSupir}
                            onChange={(e) => setFormNamaSupir(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">No HP Sopir:</label>
                          <input
                            type="text"
                            placeholder="0813xxxxxxx"
                            value={formNoHpSopir}
                            onChange={(e) => setFormNoHpSopir(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Tour Leader (TL):</label>
                          <input
                            type="text"
                            placeholder="Nama Tour Leader"
                            value={formTourLeader}
                            onChange={(e) => setFormTourLeader(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">No HP TL:</label>
                          <input
                            type="text"
                            placeholder="0812xxxxxxx"
                            value={formNoHpTourLeader}
                            onChange={(e) => setFormNoHpTourLeader(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                          />
                        </div>
                      </div>

                      {/* Kursi 1 s/d Kursi 7 */}
                      <div className="pt-1 border-t border-slate-800/80">
                        <label className="block text-[11px] text-cyan-400 mb-1.5 font-semibold">
                          Alokasi Nomor Kursi Bis (Kursi 1 s/d Kursi 7):
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 text-xs">
                          <div>
                            <span className="block text-[10px] text-cyan-300 font-bold mb-0.5">Kursi 1 (Peserta)</span>
                            <input
                              type="text"
                              placeholder="1A"
                              value={formKursi1}
                              onChange={(e) => setFormKursi1(e.target.value)}
                              className="w-full bg-slate-900 border border-cyan-500/40 rounded-lg px-2 py-1.5 text-cyan-300 font-bold font-mono text-center focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400 mb-0.5">Kursi 2</span>
                            <input
                              type="text"
                              placeholder="1B"
                              value={formKursi2}
                              onChange={(e) => setFormKursi2(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono text-center focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400 mb-0.5">Kursi 3</span>
                            <input
                              type="text"
                              placeholder="2A"
                              value={formKursi3}
                              onChange={(e) => setFormKursi3(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono text-center focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400 mb-0.5">Kursi 4</span>
                            <input
                              type="text"
                              placeholder="2B"
                              value={formKursi4}
                              onChange={(e) => setFormKursi4(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono text-center focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400 mb-0.5">Kursi 5</span>
                            <input
                              type="text"
                              placeholder="3A"
                              value={formKursi5}
                              onChange={(e) => setFormKursi5(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono text-center focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400 mb-0.5">Kursi 6</span>
                            <input
                              type="text"
                              placeholder="3B"
                              value={formKursi6}
                              onChange={(e) => setFormKursi6(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono text-center focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400 mb-0.5">Kursi 7</span>
                            <input
                              type="text"
                              placeholder="4A"
                              value={formKursi7}
                              onChange={(e) => setFormKursi7(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono text-center focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hotel Card Sub-Section */}
                    <div className="sm:col-span-3 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-400 text-xs flex items-center gap-1.5">
                          <Hotel className="w-4 h-4" />
                          Alokasi Hotel, Nomor Kamar & Lantai
                        </span>
                        {formNoKamar && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
                            Kamar {formNoKamar} (Lt. {formLantaiHotel || '1'})
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        <div>
                          <span className="block text-[11px] text-slate-400 mb-1">Pilihan Hotel:</span>
                          <select
                            value={formHotelId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormHotelId(val);
                              const h = masterData?.hotel.find(item => item.id === val);
                              if (h && h.daftarKamar.length > 0) {
                                setFormNoKamar(h.daftarKamar[0].noKamar);
                                setFormLantaiHotel(h.daftarKamar[0].lantai || '1');
                              }
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                          >
                            {masterData?.hotel.map(h => (
                              <option key={h.id} value={h.id}>{h.namaHotel}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <span className="block text-[11px] text-slate-400 mb-1">Nomor Kamar:</span>
                          <input
                            type="text"
                            placeholder="Misal: 101, 204"
                            value={formNoKamar}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormNoKamar(val);
                              const h = masterData?.hotel.find(item => item.id === formHotelId);
                              const matchedRoom = h?.daftarKamar.find(k => k.noKamar === val);
                              if (matchedRoom?.lantai) {
                                setFormLantaiHotel(matchedRoom.lantai);
                              } else if (val.length >= 3 && !isNaN(Number(val.charAt(0)))) {
                                setFormLantaiHotel(val.charAt(0));
                              }
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                          />
                        </div>

                        <div>
                          <span className="block text-[11px] text-slate-400 mb-1">Lantai:</span>
                          <input
                            type="text"
                            placeholder="Misal: 1, 2, 3"
                            value={formLantaiHotel}
                            onChange={(e) => setFormLantaiHotel(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                          />
                        </div>
                      </div>

                      {/* Quick room selection chips */}
                      {(() => {
                        const currentHotel = masterData?.hotel.find(h => h.id === formHotelId);
                        if (!currentHotel || !currentHotel.daftarKamar?.length) return null;
                        return (
                          <div className="pt-1">
                            <span className="text-slate-400 text-[10px] block mb-1.5">
                              Pilih Cepat Kamar Tersedia ({currentHotel.namaHotel}):
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto pr-1">
                              {currentHotel.daftarKamar.map((km, idx) => {
                                const floor = km.lantai || (km.noKamar.length >= 3 ? km.noKamar.charAt(0) : '1');
                                const isSelected = formNoKamar === km.noKamar;
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setFormNoKamar(km.noKamar);
                                      setFormLantaiHotel(floor);
                                    }}
                                    className={`px-2 py-0.5 rounded-lg border font-mono transition-colors flex items-center gap-1 text-[11px] ${
                                      isSelected
                                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                                        : 'bg-slate-800 text-amber-200 border-slate-700 hover:border-amber-500/40'
                                    }`}
                                  >
                                    <span>No. {km.noKamar}</span>
                                    <span className={`text-[10px] px-1 py-0.2 rounded font-semibold ${isSelected ? 'bg-amber-700/50 text-white' : 'bg-slate-900 text-amber-300'}`}>
                                      Lt. {floor}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Section 4: Status Pendaftaran & Catatan */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-800 text-indigo-400 font-bold uppercase tracking-wider text-[11px]">
                    <Layers className="w-3.5 h-3.5" />
                    <span>4. Status Verifikasi & Catatan Khusus</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Status Pendaftaran</label>
                      <select
                        value={formStatus}
                        onChange={(e: any) => setFormStatus(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-semibold"
                      >
                        <option value="DITERIMA">DITERIMA (Terverifikasi)</option>
                        <option value="MENUNGGU_VERIFIKASI">MENUNGGU VERIFIKASI</option>
                        <option value="DIBATALKAN">DIBATALKAN</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Riwayat Penyakit (Opsional)</label>
                      <input
                        type="text"
                        placeholder="Misal: Asma, Hipertensi, Alergi..."
                        value={formPenyakit}
                        onChange={(e) => setFormPenyakit(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-300 mb-1">Catatan Khusus / Keterangan (Opsional)</label>
                      <input
                        type="text"
                        placeholder="Catatan tambahan untuk panitia..."
                        value={formCatatan}
                        onChange={(e) => setFormCatatan(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 5: Anggota Keluarga & Total Rombongan */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
                      <Users className="w-3.5 h-3.5" />
                      <span>5. Data Anggota Keluarga & Total Rombongan ({1 + formKeluarga.length} Jiwa)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const isFirst = formKeluarga.length === 0;
                        const defHub: string = isFirst ? 'Istri' : 'Anak 1';
                        const isSpouse = defHub === 'Istri' || defHub === 'Suami';
                        setFormKeluarga([
                          ...formKeluarga,
                          {
                            id: 'fam-' + Date.now(),
                            nama: '',
                            hubungan: defHub,
                            kategoriUsia: isSpouse ? 'Dewasa' : 'Anak-anak',
                            ukuranKaosId: isSpouse ? (masterData?.kaos[0]?.id || '') : '',
                            ukuranKaosNama: isSpouse ? (masterData?.kaos[0]?.ukuran?.replace(/\s*Dewasa/gi, '').trim() || 'M') : 'Tanpa Kaos',
                          },
                        ]);
                      }}
                      className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-3 py-1 rounded-lg font-semibold transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Anggota</span>
                    </button>
                  </div>

                  {/* Kalkulasi Rombongan Box */}
                  <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-indigo-300 block">Total Rombongan: {1 + formKeluarga.length} Jiwa</span>
                      <span className="text-[11px] text-slate-400">
                        Kalkulasi resmi: <strong>1 Pegawai</strong> {formNama ? `(${formNama})` : ''} + <strong>{formKeluarga.length} Anggota Keluarga</strong>
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono font-bold text-xs w-fit">
                      {1 + formKeluarga.length} Orang
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                    💡 <span className="font-semibold text-slate-300">Ketentuan Kaos:</span> Sesuai kebijakan gathering, hanya <span className="text-emerald-300 font-medium">Suami/Istri</span> yang berhak mendapatkan jatah kaos seragam. Anggota keluarga lainnya tidak mendapatkan kaos.
                  </p>

                  {formKeluarga.length === 0 ? (
                    <div className="text-center py-4 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
                      Belum ada anggota keluarga yang didaftarkan.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {formKeluarga.map((fam, idx) => {
                        const isSpouse = fam.hubungan === 'Suami' || fam.hubungan === 'Istri';
                        return (
                          <div
                            key={fam.id || idx}
                            className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs flex flex-col sm:flex-row sm:items-center gap-2.5"
                          >
                            <div className="flex-1 min-w-0">
                              <label className="block text-[10px] text-slate-400 mb-0.5 sm:hidden font-semibold">Nama Anggota:</label>
                              <input
                                type="text"
                                placeholder="Nama lengkap anggota keluarga"
                                value={fam.nama}
                                onChange={(e) => {
                                  const updated = [...formKeluarga];
                                  updated[idx].nama = e.target.value;
                                  setFormKeluarga(updated);
                                }}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                              />
                            </div>

                            <div className="w-full sm:w-36 shrink-0">
                              <label className="block text-[10px] text-slate-400 mb-0.5 sm:hidden font-semibold">Hubungan:</label>
                              <select
                                value={fam.hubungan}
                                onChange={(e: any) => {
                                  const updated = [...formKeluarga];
                                  const val = e.target.value;
                                  const willBeSpouse = val === 'Suami' || val === 'Istri';
                                  updated[idx].hubungan = val;
                                  if (willBeSpouse) {
                                    if (!updated[idx].ukuranKaosId && masterData?.kaos[0]) {
                                      updated[idx].ukuranKaosId = masterData.kaos[0].id;
                                      updated[idx].ukuranKaosNama = masterData.kaos[0].ukuran;
                                    }
                                    updated[idx].kategoriUsia = 'Dewasa';
                                  } else {
                                    updated[idx].ukuranKaosId = '';
                                    updated[idx].ukuranKaosNama = 'Tanpa Kaos';
                                  }
                                  setFormKeluarga(updated);
                                }}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-cyan-500"
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

                            <div className="w-full sm:w-36 shrink-0">
                              <label className="block text-[10px] text-slate-400 mb-0.5 sm:hidden font-semibold">Alokasi Kaos:</label>
                              {isSpouse ? (
                                <select
                                  value={fam.ukuranKaosId}
                                  onChange={(e) => {
                                    const updated = [...formKeluarga];
                                    updated[idx].ukuranKaosId = e.target.value;
                                    const ks = masterData?.kaos.find(k => k.id === e.target.value);
                                    if (ks) updated[idx].ukuranKaosNama = ks.ukuran;
                                    setFormKeluarga(updated);
                                  }}
                                  className="w-full bg-slate-800 border border-emerald-500/60 rounded-lg px-2 py-1.5 text-emerald-300 font-semibold focus:outline-none focus:border-emerald-400"
                                >
                                  {masterData?.kaos.map(k => (
                                    <option key={k.id} value={k.id}>{k.ukuran}</option>
                                  ))}
                                </select>
                              ) : (
                                <div className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-500 italic text-[11px] text-center select-none">
                                  Tanpa Kaos
                                </div>
                              )}
                            </div>

                            <div className="shrink-0 flex justify-end sm:justify-center pt-1 sm:pt-0">
                              <button
                                type="button"
                                onClick={() => setFormKeluarga(formKeluarga.filter((_, i) => i !== idx))}
                                className="flex items-center gap-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                                title="Hapus Anggota Keluarga"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="sm:hidden">Hapus</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="flex items-center justify-between sm:justify-end gap-3 px-5 sm:px-6 py-3.5 border-t border-slate-800 shrink-0 bg-slate-900/95 backdrop-blur-sm z-10">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalPeserta(null);
                    setIsNewModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Data Peserta</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* In-App Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base font-['Outfit',sans-serif]">
                  Hapus Data Peserta?
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Apakah Anda yakin ingin menghapus data peserta berikut dari database gathering?
                </p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Nomor Peserta:</span>
                <span className="font-mono text-sm sm:text-base font-black text-cyan-300 px-2.5 py-0.5 rounded-lg bg-slate-900 border border-cyan-500/40">{deleteTarget.noAgenda}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Peserta:</span>
                <span className="font-bold text-white">{deleteTarget.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ID Sistem:</span>
                <span className="font-mono text-slate-400">{deleteTarget.id}</span>
              </div>
            </div>

            <p className="text-[11px] text-rose-300/80 bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5">
              Peringatan: Seluruh data anggota keluarga dan alokasi bus/kamar peserta ini akan turut dihapus.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                id="btn-cancel-delete-peserta"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                Batalkan
              </button>
              <button
                type="button"
                id="btn-confirm-delete-peserta"
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
                    <span>Ya, Hapus Peserta</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Upload & Bulk Import Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg font-['Outfit',sans-serif] flex items-center gap-2">
                    Upload & Import Data Peserta Excel
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Unggah file spreadsheet (.xlsx / .xls / .csv) untuk impor data peserta secara massal
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Template Download Banner */}
              <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Gunakan Format Standar
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Unduh format template Excel resmi dengan kolom lengkap & contoh isian data.
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-download-template-excel"
                  onClick={downloadTemplateExcel}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition-all hover:border-cyan-500/30 shrink-0"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Download Template</span>
                </button>
              </div>

              {/* Upload Drop Area */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />

              {!importFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      processSelectedFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/60 hover:bg-slate-950 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <div className="p-4 bg-slate-800 group-hover:bg-emerald-500/15 text-slate-400 group-hover:text-emerald-400 rounded-2xl transition-colors">
                    <FileUp className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Klik untuk memilih file Excel atau seret file ke sini
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Mendukung format Microsoft Excel (.xlsx, .xls) atau Comma Separated (.csv)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white">{importFile.name}</span>
                        <p className="text-[11px] text-slate-400">
                          {(importFile.size / 1024).toFixed(1)} KB •{' '}
                          <strong className="text-emerald-400">{parsedTotalCount} baris terdeteksi</strong>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-cyan-400 hover:underline px-2.5 py-1"
                    >
                      Ganti File
                    </button>
                  </div>

                  {/* Preview Table */}
                  {previewRows.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">Preview Data (Menampilkan {previewRows.length} dari {parsedTotalCount}):</span>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-slate-800">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-slate-900 text-slate-400 font-semibold">
                            <tr>
                              <th className="py-2 px-3">Nama</th>
                              <th className="py-2 px-3">No. Peserta</th>
                              <th className="py-2 px-3">JK</th>
                              <th className="py-2 px-3">Unit</th>
                              <th className="py-2 px-3">Kaos</th>
                              <th className="py-2 px-3">Bis</th>
                              <th className="py-2 px-3">Supir</th>
                              <th className="py-2 px-3">Tour Leader</th>
                              <th className="py-2 px-3">Kursi</th>
                              <th className="py-2 px-3">Hotel</th>
                              <th className="py-2 px-3">Makan</th>
                              <th className="py-2 px-3">Acara</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 bg-slate-950/60">
                            {previewRows.map((row, i) => (
                              <tr key={i} className="hover:bg-slate-900/40">
                                <td className="py-2 px-3 font-semibold text-white whitespace-nowrap">{row.namaLengkap || '-'}</td>
                                <td className="py-2 px-3 font-mono text-cyan-300 whitespace-nowrap">{row.nikNip || '-'}</td>
                                <td className="py-2 px-3 text-slate-300 whitespace-nowrap">{row.jenisKelamin || '-'}</td>
                                <td className="py-2 px-3 text-slate-300 whitespace-nowrap">{row.unitKerjaNama || '-'}</td>
                                <td className="py-2 px-3 text-amber-300 font-mono whitespace-nowrap">{row.ukuranKaosNama || '-'}</td>
                                <td className="py-2 px-3 text-indigo-300 whitespace-nowrap">{row.bisNama || '-'}</td>
                                <td className="py-2 px-3 text-slate-300 whitespace-nowrap">{row.namaSupir || '-'}</td>
                                <td className="py-2 px-3 text-amber-300 whitespace-nowrap">{row.tourLeader || '-'}</td>
                                <td className="py-2 px-3 text-cyan-300 font-mono whitespace-nowrap">{row.kursi1 || row.nomorKursi || '-'}</td>
                                <td className="py-2 px-3 text-emerald-300 whitespace-nowrap">{row.hotelNama || '-'}</td>
                                <td className="py-2 px-3 text-rose-300 whitespace-nowrap">{row.tempatMakanNama || '-'}</td>
                                <td className="py-2 px-3 text-purple-300 whitespace-nowrap">{row.tempatAcaraNama || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Duplicate Handling Option */}
                  <label className="flex items-center gap-2.5 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateExistingOnImport}
                      onChange={(e) => setUpdateExistingOnImport(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-800 border-slate-700"
                    />
                    <span className="text-xs text-slate-300">
                      Perbarui (update) data peserta jika Nomor Peserta sudah terdaftar
                    </span>
                  </label>
                </div>
              )}

              {/* Error Box */}
              {importError && (
                <div className="bg-rose-950/80 border border-rose-500/40 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Success Result Summary */}
              {importResult && (
                <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Import Excel Berhasil Diproses!</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2">
                      <span className="block text-[10px] text-slate-400">Total Diproses</span>
                      <strong className="text-sm text-white font-mono">{importResult.totalProcessed}</strong>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2">
                      <span className="block text-[10px] text-slate-400">Peserta Baru</span>
                      <strong className="text-sm text-emerald-400 font-mono">+{importResult.importedCount}</strong>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2">
                      <span className="block text-[10px] text-slate-400">Data Diupdate</span>
                      <strong className="text-sm text-cyan-400 font-mono">{importResult.updatedCount}</strong>
                    </div>
                  </div>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-2 text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded-xl">
                      <strong>Catatan Baris Dilewati:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {importResult.errors.slice(0, 3).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 shrink-0">
              <button
                type="button"
                id="btn-close-upload-modal"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                {importResult ? 'Selesai' : 'Batal'}
              </button>

              {!importResult && (
                <button
                  type="button"
                  id="btn-start-bulk-import"
                  onClick={executeBulkImport}
                  disabled={!importFile || parsedTotalCount === 0 || isImporting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 disabled:shadow-none"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengimpor {parsedTotalCount} Data...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Mulai Import ({parsedTotalCount} Peserta)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
