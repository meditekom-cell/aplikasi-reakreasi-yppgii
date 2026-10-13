import React, { useState, useEffect } from 'react';
import { 
  User, 
  Users, 
  Bus, 
  Hotel, 
  Utensils, 
  Shirt, 
  Upload, 
  FileText, 
  Trash2, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  Info,
  Calendar,
  MapPin,
  Lock,
  Search,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api, PublicMasterData } from '../services/api';
import { Peserta, AnggotaKeluarga, DokumenLampiran } from '../types';
import { NavTab } from './Sidebar';

// Periode Pendaftaran: 9 Agustus 2026 s/d 20 September 2026 (WIB / UTC+7)
export const REGISTRATION_START_DATE = new Date('2026-08-09T00:00:00+07:00').getTime();
export const REGISTRATION_END_DATE = new Date('2026-09-20T23:59:59+07:00').getTime();

interface RegistrationFormProps {
  onSuccessRegistered?: (peserta: Peserta) => void;
  onRegistrationSuccess?: (peserta: Peserta) => void;
  onNavigate?: (tab: NavTab) => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ 
  onSuccessRegistered, 
  onRegistrationSuccess,
  onNavigate 
}) => {
  const [step, setStep] = useState<number>(1);
  const [masterData, setMasterData] = useState<PublicMasterData | null>(null);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [namaLengkap, setNamaLengkap] = useState('');
  const [nikNip, setNikNip] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [statusPernikahan, setStatusPernikahan] = useState<'Menikah' | 'Belum Menikah'>('Menikah');
  const [unitKerjaId, setUnitKerjaId] = useState('');
  const [jabatanId, setJabatanId] = useState('');
  const [noHpWa, setNoHpWa] = useState('');
  const [ukuranKaosId, setUkuranKaosId] = useState('');
  const [bisId, setBisId] = useState('');
  const [hotelId, setHotelId] = useState('');
  const [noKamar, setNoKamar] = useState('');
  const [tempatMakanId, setTempatMakanId] = useState('');
  const [tempatAcaraId, setTempatAcaraId] = useState('');
  const [catatanKhusus, setCatatanKhusus] = useState('');
  const [riwayatPenyakit, setRiwayatPenyakit] = useState('');

  // Family Members State
  const [keluargaList, setKeluargaList] = useState<AnggotaKeluarga[]>([]);

  // Document Uploads State
  const [dokumenList, setDokumenList] = useState<DokumenLampiran[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Periode Pendaftaran: 9 Agustus 2026 s/d 20 September 2026 23:59:59 WIB
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());
  const [simulateClosed, setSimulateClosed] = useState<boolean>(() => {
    return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('status') === 'closed';
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const isServerClosed = masterData?.registrationPeriod?.isClosed ?? (currentTime > REGISTRATION_END_DATE);
  const isRegistrationClosed = isServerClosed || simulateClosed;

  useEffect(() => {
    loadMaster();
  }, []);

  const loadMaster = async () => {
    try {
      setLoadingMaster(true);
      const data = await api.getPublicMaster();
      setMasterData(data);
      if (data.nextNomorPeserta) {
        setNikNip(data.nextNomorPeserta);
      } else {
        setNikNip('NP-2026-0001');
      }
      if (data.unitKerja.length > 0) setUnitKerjaId(data.unitKerja[0].id);
      if (data.jabatan.length > 0) setJabatanId(data.jabatan[0].id);
      if (data.kaos.length > 0) setUkuranKaosId(data.kaos[0].id);
      if (data.bis.length > 0) setBisId(data.bis[0].id);
      if (data.hotel.length > 0) {
        setHotelId(data.hotel[0].id);
        if (data.hotel[0].daftarKamar.length > 0) {
          setNoKamar(data.hotel[0].daftarKamar[0].noKamar);
        }
      }
      if (data.tempatMakan.length > 0) setTempatMakanId(data.tempatMakan[0].id);
      if (data.tempatAcara && data.tempatAcara.length > 0) setTempatAcaraId(data.tempatAcara[0].id);
    } catch (err: any) {
      setErrorMsg('Gagal memuat pilihan referensi: ' + err.message);
    } finally {
      setLoadingMaster(false);
    }
  };

  const handleAddKeluarga = () => {
    const defaultKaos = masterData?.kaos[0];
    const isFirstMember = keluargaList.length === 0;
    const defaultHub = isFirstMember
      ? (jenisKelamin === 'Laki-laki' ? 'Istri' : 'Suami')
      : (keluargaList.length === 1 ? 'Anak 1' : keluargaList.length === 2 ? 'Anak 2' : 'Anak 3');
    const isSpouse = defaultHub === 'Suami' || defaultHub === 'Istri';

    const newKeluarga: AnggotaKeluarga = {
      id: 'temp-' + Date.now(),
      nama: '',
      hubungan: defaultHub,
      kategoriUsia: isSpouse ? 'Dewasa' : 'Anak-anak',
      ukuranKaosId: isSpouse && defaultKaos ? defaultKaos.id : '',
      ukuranKaosNama: isSpouse && defaultKaos ? defaultKaos.ukuran : 'Tanpa Kaos',
      catatan: '',
    };
    setKeluargaList([...keluargaList, newKeluarga]);
  };

  const handleUpdateKeluarga = (index: number, field: keyof AnggotaKeluarga, value: any) => {
    const updated = [...keluargaList];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'hubungan') {
      const isSpouse = value === 'Suami' || value === 'Istri';
      if (isSpouse) {
        if (!updated[index].ukuranKaosId && masterData?.kaos[0]) {
          updated[index].ukuranKaosId = masterData.kaos[0].id;
          updated[index].ukuranKaosNama = masterData.kaos[0].ukuran;
        }
        updated[index].kategoriUsia = 'Dewasa';
      } else {
        updated[index].ukuranKaosId = '';
        updated[index].ukuranKaosNama = 'Tanpa Kaos';
      }
    }

    if (field === 'ukuranKaosId' && masterData) {
      const found = masterData.kaos.find(k => k.id === value);
      if (found) {
        updated[index].ukuranKaosNama = found.ukuran;
      }
    }
    setKeluargaList(updated);
  };

  const handleRemoveKeluarga = (index: number) => {
    setKeluargaList(keluargaList.filter((_, i) => i !== index));
  };

  // File Upload Handler with strict 5MB limit
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

    if (file.size > MAX_SIZE) {
      setUploadError(`Ukuran file "${file.name}" melebihi batas maksimal 5 MB (${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Tipe file tidak didukung. Harap unggah file PDF, JPG, atau PNG.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const newDoc: DokumenLampiran = {
        id: 'doc-' + Date.now(),
        namaFile: file.name,
        tipe: file.type,
        ukuranBytes: file.size,
        base64Data: base64,
        uploadedAt: new Date().toISOString(),
      };
      setDokumenList([...dokumenList, newDoc]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveDoc = (id: string) => {
    setDokumenList(dokumenList.filter(d => d.id !== id));
  };

  // Step Validations
  const validateStep1 = () => {
    if (!namaLengkap.trim() || namaLengkap.trim().length < 3) {
      setErrorMsg('Nama lengkap wajib diisi minimal 3 karakter');
      return false;
    }
    if (!noHpWa.trim() || noHpWa.trim().length < 9) {
      setErrorMsg('Nomor HP / WhatsApp wajib diisi (minimal 9 digit)');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const validateStep2 = () => {
    for (let i = 0; i < keluargaList.length; i++) {
      if (!keluargaList[i].nama.trim()) {
        setErrorMsg(`Nama anggota keluarga #${i + 1} belum diisi.`);
        return false;
      }
    }
    setErrorMsg(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistrationClosed) {
      setErrorMsg('Pendaftaran Sudah Ditutup. Batas waktu pendaftaran peserta baru (20 September 2026) telah berakhir.');
      return;
    }
    if (!validateStep1() || !validateStep2()) return;

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const selectedUnit = masterData?.unitKerja.find(u => u.id === unitKerjaId);
      const cleanUnitNama = selectedUnit ? selectedUnit.nama.replace(/\s*\([^)]*\)/g, '').trim() : '';
      const selectedJabatan = masterData?.jabatan.find(j => j.id === jabatanId);
      const cleanJabatanNama = selectedJabatan ? selectedJabatan.nama.replace(/\s*\([^)]*\)/g, '').trim() : '';
      const selectedKaos = masterData?.kaos.find(k => k.id === ukuranKaosId);
      const selectedBis = masterData?.bis.find(b => b.id === bisId);
      const selectedHotel = masterData?.hotel.find(h => h.id === hotelId);
      const selectedMakan = masterData?.tempatMakan.find(t => t.id === tempatMakanId);
      const selectedAcara = masterData?.tempatAcara?.find(a => a.id === tempatAcaraId);
      const selectedRoomObj = selectedHotel?.daftarKamar?.find(k => k.noKamar === noKamar);
      const calculatedFloor = selectedRoomObj?.lantai || (noKamar && noKamar.length >= 3 ? noKamar.charAt(0) : '1');

      const payload: Partial<Peserta> = {
        namaLengkap,
        nikNip,
        jenisKelamin,
        statusPernikahan,
        unitKerjaId,
        unitKerjaNama: cleanUnitNama,
        jabatanId,
        jabatanNama: cleanJabatanNama,
        noHpWa,
        email: '',
        ukuranKaosId,
        ukuranKaosNama: selectedKaos?.ukuran || '',
        bisId,
        bisNama: selectedBis?.namaBis || '',
        hotelId,
        hotelNama: selectedHotel?.namaHotel || '',
        lantaiHotel: calculatedFloor,
        noKamar: noKamar || '101',
        tipeKamar: selectedRoomObj?.tipe || 'Standard',
        tempatMakanId,
        tempatMakanNama: selectedMakan?.namaTempat || '',
        sesiMakan: selectedMakan?.sesiMakan[0] || 'Sesi Utama',
        tempatAcaraId,
        tempatAcaraNama: selectedAcara?.namaTempat || '',
        tempatAcara: selectedAcara?.namaTempat || '',
        catatanKhusus,
        riwayatPenyakit,
        keluarga: keluargaList,
        dokumen: dokumenList,
      };

      const res = await api.registerPeserta(payload);
      
      // Trigger confetti celebration
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });

      if (onRegistrationSuccess) {
        onRegistrationSuccess(res.peserta);
      } else if (onSuccessRegistered) {
        onSuccessRegistered(res.peserta);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses pendaftaran.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMaster) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium text-slate-300">Menghubungkan ke Server & LockService Pangandaran 2026...</p>
      </div>
    );
  }

  const selectedHotelObj = masterData?.hotel.find(h => h.id === hotelId);

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 sm:px-4">
      {/* Simulation / Info Pill Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 px-4 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            Periode Pendaftaran: <strong className="text-white">9 Agustus 2026 – 20 September 2026</strong>
          </span>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
            isRegistrationClosed 
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isRegistrationClosed ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'}`} />
            {isRegistrationClosed ? 'Pendaftaran Ditutup' : 'Pendaftaran Dibuka'}
          </span>
          <button
            type="button"
            onClick={() => setSimulateClosed(prev => !prev)}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors cursor-pointer"
            title="Klik untuk menguji tampilan saat pendaftaran dibuka atau ditutup"
          >
            {simulateClosed ? '↺ Batalkan Simulasi' : '⚡ Uji Tampilan Tutup'}
          </button>
        </div>
      </div>

      {/* Event Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 border border-slate-800 shadow-2xl mb-8">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            {isRegistrationClosed ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold mb-3 border border-rose-500/40 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> PENDAFTARAN SUDAH DITUTUP
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold mb-3 border border-cyan-500/30">
                <Sparkles className="w-3.5 h-3.5" /> PENDAFTARAN DIBUKA (9 AGS - 20 SEP 2026)
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight font-['Outfit',sans-serif]">
              REKREASI PANGANDARAN <span className="text-cyan-400">2026</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-xl">
              Family Gathering Akbar & Kebersamaan Keluarga Besar. Silakan lengkapi formulir pendaftaran peserta, anggota keluarga, serta pilihan logistik.
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0 bg-slate-900/80 p-4 rounded-2xl border border-slate-700/80 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>Pantai Pangandaran</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Masa Daftar: 9 Ags - 20 Sep 2026</span>
            </div>
            <div className={`flex items-center gap-2 font-semibold pt-1 border-t border-slate-800 ${
              isRegistrationClosed ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {isRegistrationClosed ? (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>Pendaftaran Sudah Ditutup</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Nomor Peserta Terproteksi</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {isRegistrationClosed ? (
        /* Prominent "Pendaftaran Sudah Ditutup" Notification Card */
        <div className="bg-slate-900/95 border border-rose-500/40 rounded-3xl p-6 sm:p-10 text-center shadow-2xl backdrop-blur-md max-w-2xl mx-auto my-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-5 text-rose-400 shadow-xl shadow-rose-950/40">
            <Lock className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold mb-4 border border-rose-500/30">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>PEMBERITAHUAN RESMI PANITIA</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3 font-['Outfit',sans-serif]">
            Pendaftaran Sudah Ditutup
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 max-w-lg mx-auto">
            Mohon maaf, batas waktu pendaftaran peserta baru <strong className="text-white">Gathering Rekreasi Pangandaran 2026</strong> telah resmi berakhir pada <strong className="text-rose-300">20 September 2026 pukul 23:59 WIB</strong>. Sistem formulir tidak lagi menerima pendaftaran baru.
          </p>

          <div className="bg-slate-800/70 rounded-2xl p-4 sm:p-5 border border-slate-700/60 text-xs sm:text-sm text-slate-300 mb-6 max-w-lg mx-auto text-left space-y-3 shadow-inner">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-700/60">
              <span className="text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                Masa Pendaftaran:
              </span>
              <span className="font-semibold text-white">9 Agustus 2026 – 20 September 2026</span>
            </div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-700/60">
              <span className="text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-400" />
                Status Formulir:
              </span>
              <span className="font-bold text-rose-400">Pendaftaran Sudah Ditutup</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-400" />
                Pelaksanaan Acara:
              </span>
              <span className="font-semibold text-cyan-300">7 - 8 November 2026 (Pantai Pangandaran)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 mb-6 max-w-lg mx-auto text-center">
            <p className="font-bold text-white mb-1">Sudah pernah mendaftar sebelum batas akhir?</p>
            <p className="text-slate-300 leading-relaxed">
              Bagi peserta yang telah mendaftar, data Anda tetap tersimpan dengan aman. Anda dapat memeriksa status pendaftaran, alokasi armada bus, kamar hotel, serta mencetak kartu peserta resmi melalui menu Cek Status.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('cek-status')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Cek Status & Kartu Peserta</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Progress Step Navigation */}
          <div className="flex items-center justify-between mb-8 px-2 sm:px-6">
        {[
          { num: 1, label: 'Data Diri' },
          { num: 2, label: 'Keluarga' },
          { num: 3, label: 'Akomodasi & Kaos' },
          { num: 4, label: 'Dokumen & Konfirmasi' },
        ].map((s, idx) => (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => {
                  if (s.num === 1) setStep(1);
                  else if (s.num === 2 && validateStep1()) setStep(2);
                  else if (s.num === 3 && validateStep1() && validateStep2()) setStep(3);
                  else if (s.num === 4 && validateStep1() && validateStep2()) setStep(4);
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                  step === s.num
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400/50'
                    : step > s.num
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
              </button>
              <span className={`text-[11px] font-medium mt-1.5 hidden sm:block ${
                step === s.num ? 'text-cyan-300 font-semibold' : 'text-slate-400'
              }`}>
                {s.label}
              </span>
            </div>
            {idx < 3 && (
              <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                step > idx + 1 ? 'bg-emerald-500/50' : 'bg-slate-800'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Alert Error Messages */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Perhatian</p>
            <p className="text-xs text-rose-200 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Registration Form Card */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        
        {/* STEP 1: Data Diri Peserta */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                Data Diri & Kepegawaian Peserta
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Isi identitas diri pegawai/peserta yang akan menjadi penanggung jawab rombongan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nama Lengkap (Beserta Gelar) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso, S.Kom."
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Jenis Kelamin <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['Laki-laki', 'Perempuan'] as const).map((jk) => (
                    <button
                      key={jk}
                      type="button"
                      onClick={() => setJenisKelamin(jk)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        jenisKelamin === jk
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {jk}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Status Perkawinan <span className="text-rose-400">*</span>
                </label>
                <select
                  value={statusPernikahan}
                  onChange={(e) => setStatusPernikahan(e.target.value as any)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="Menikah" className="bg-slate-900 text-white">Menikah</option>
                  <option value="Belum Menikah" className="bg-slate-900 text-white">Belum Menikah</option>
                  <option value="Cerai Hidup" className="bg-slate-900 text-white">Cerai Hidup</option>
                  <option value="Cerai Mati" className="bg-slate-900 text-white">Cerai Mati</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  No. WhatsApp / HP Aktif <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={noHpWa}
                  onChange={(e) => setNoHpWa(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Unit Kerja / Divisi <span className="text-rose-400">*</span>
                </label>
                <select
                  value={unitKerjaId}
                  onChange={(e) => setUnitKerjaId(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  {masterData?.unitKerja.map((u) => {
                    const cleanName = u.nama.replace(/\s*\([^)]*\)/g, '').trim();
                    return (
                      <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                        {cleanName}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Jabatan / Posisi <span className="text-rose-400">*</span>
                </label>
                <select
                  value={jabatanId}
                  onChange={(e) => setJabatanId(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  {masterData?.jabatan.map((j) => {
                    const cleanNama = j.nama.replace(/\s*\([^)]*\)/g, '').trim();
                    return (
                      <option key={j.id} value={j.id} className="bg-slate-900 text-white">
                        {cleanNama}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-cyan-500/20"
              >
                <span>Lanjut: Anggota Keluarga</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Anggota Keluarga */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  Anggota Keluarga yang Ikut Serta
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tambahkan data suami/istri dan anak-anak yang akan mendampingi.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddKeluarga}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Anggota Keluarga</span>
              </button>
            </div>

            {/* Info Kebijakan Kaos */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-200">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">Ketentuan Kaos Gathering:</span> Fasilitas kaos resmi hanya dialokasikan untuk <strong>peserta/pegawai ybs</strong> ditambah <strong>suami/istrinya</strong>. Anggota keluarga lainnya (anak, orang tua, dll) terdaftar tanpa alokasi kaos.
              </div>
            </div>

            {/* Kalkulasi Rombongan Real-time */}
            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-indigo-300 font-bold">Kalkulasi Rombongan: </span>
                <span className="text-slate-300">
                  <strong>1 Pegawai</strong> {namaLengkap ? `(${namaLengkap})` : ''} + <strong>{keluargaList.length} Anggota Keluarga</strong>
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/25 text-indigo-300 font-bold border border-indigo-500/40 font-mono self-start sm:self-auto">
                Total {1 + keluargaList.length} Jiwa
              </span>
            </div>

            {keluargaList.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-800/40 border border-dashed border-slate-700 text-center">
                <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">Belum ada anggota keluarga ditambahkan</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Jika berangkat sendiri tanpa keluarga, Anda bisa langsung lanjut ke langkah berikutnya.
                </p>
                <button
                  type="button"
                  onClick={handleAddKeluarga}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold border border-slate-700"
                >
                  + Tambah Sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {keluargaList.map((k, idx) => (
                  <div key={k.id || idx} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                        Anggota Keluarga #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeluarga(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nama Lengkap</label>
                        <input
                          type="text"
                          required
                          placeholder="Nama Anggota"
                          value={k.nama}
                          onChange={(e) => handleUpdateKeluarga(idx, 'nama', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Hubungan</label>
                        <select
                          value={k.hubungan}
                          onChange={(e) => handleUpdateKeluarga(idx, 'hubungan', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
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
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Kategori Usia</label>
                        <select
                          value={k.kategoriUsia}
                          onChange={(e) => handleUpdateKeluarga(idx, 'kategoriUsia', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="Dewasa">Dewasa (&gt; 12 th)</option>
                          <option value="Anak-anak">Anak-anak (4 - 12 th)</option>
                          <option value="Balita">Balita (&lt; 4 th)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Ukuran Kaos {(k.hubungan === 'Suami' || k.hubungan === 'Istri') ? '(Suami/Istri)' : ''}
                        </label>
                        {(k.hubungan === 'Suami' || k.hubungan === 'Istri') ? (
                          <select
                            value={k.ukuranKaosId}
                            onChange={(e) => handleUpdateKeluarga(idx, 'ukuranKaosId', e.target.value)}
                            className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                          >
                            {masterData?.kaos.map((ks) => (
                              <option key={ks.id} value={ks.id}>
                                {ks.ukuran.replace(/\s*Dewasa/gi, '').trim()}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-500 italic select-none">
                            Tanpa Kaos
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validateStep2()) setStep(3);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-cyan-500/20"
              >
                <span>Lanjut: Logistik & Kaos</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Logistik, Kaos, Bis, Hotel & Tempat Makan */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Bus className="w-5 h-5 text-cyan-400" />
                Akomodasi, Kaos, Armada Bis & Makan
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Pilih ukuran seragam kaos, armada bus rombongan, alokasi hotel dan tempat makan gathering.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kaos Peserta */}
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/70">
                <label className="block text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                  <Shirt className="w-4 h-4" />
                  Ukuran Kaos_Pes <span className="text-rose-400">*</span>
                </label>
                <select
                  value={ukuranKaosId}
                  onChange={(e) => setUkuranKaosId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  {masterData?.kaos.map((ks) => (
                    <option key={ks.id} value={ks.id}>
                      {ks.ukuran.replace(/\s*Dewasa/gi, '').trim()}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-2">
                  Bahan: Cotton Combed 24s Premium Anti-Bacterial khusus gathering Pangandaran.
                </p>
              </div>

              {/* Pilihan Armada Bis */}
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/70">
                <label className="block text-xs font-bold text-blue-400 mb-2 flex items-center gap-1.5">
                  <Bus className="w-4 h-4" />
                  Pilihan Armada Bis <span className="text-rose-400">*</span>
                </label>
                <select
                  value={bisId}
                  onChange={(e) => setBisId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  {masterData?.bis.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nomorBis} - {b.namaBis} ({b.kapasitas} Kursi)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-2">
                  {masterData?.bis.find(b => b.id === bisId)?.keterangan || 'Armada full AC & reclining seat.'}
                </p>
              </div>

              {/* Pilihan Hotel */}
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/70">
                <label className="block text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                  <Hotel className="w-4 h-4" />
                  Pilihan Hotel / Penginapan <span className="text-rose-400">*</span>
                </label>
                <select
                  value={hotelId}
                  onChange={(e) => {
                    setHotelId(e.target.value);
                    const h = masterData?.hotel.find(item => item.id === e.target.value);
                    if (h && h.daftarKamar.length > 0) {
                      setNoKamar(h.daftarKamar[0].noKamar);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  {masterData?.hotel.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.namaHotel}
                    </option>
                  ))}
                </select>

                <div className="mt-3">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Pilihan Nomor Kamar & Lantai:
                  </label>
                  <select
                    value={noKamar}
                    onChange={(e) => setNoKamar(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {selectedHotelObj?.daftarKamar.map((km) => {
                      const floor = km.lantai || (km.noKamar.length >= 3 ? km.noKamar.charAt(0) : '1');
                      return (
                        <option key={km.noKamar} value={km.noKamar}>
                          Kamar {km.noKamar} (Lantai {floor}) - {km.tipe} • Kapasitas {km.kapasitas} Orang
                        </option>
                      );
                    })}
                  </select>

                  {selectedHotelObj && noKamar && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 text-amber-200">
                      <span className="text-[11px] text-slate-400">Kamar Terpilih:</span>
                      <span className="font-mono font-bold text-white">No. {noKamar}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/90 border border-amber-500/30 text-amber-300 font-bold font-mono">
                        Lantai {selectedHotelObj.daftarKamar.find(k => k.noKamar === noKamar)?.lantai || (noKamar.length >= 3 ? noKamar.charAt(0) : '1')}
                      </span>
                      <span className="text-[11px] text-slate-300">
                        ({selectedHotelObj.daftarKamar.find(k => k.noKamar === noKamar)?.tipe || 'Standard'} • Maks. {selectedHotelObj.daftarKamar.find(k => k.noKamar === noKamar)?.kapasitas || 2} Orang)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pilihan Tempat Makan */}
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/70">
                <label className="block text-xs font-bold text-rose-400 mb-2 flex items-center gap-1.5">
                  <Utensils className="w-4 h-4" />
                  Tempat Makan Gathering <span className="text-rose-400">*</span>
                </label>
                <select
                  value={tempatMakanId}
                  onChange={(e) => setTempatMakanId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  {masterData?.tempatMakan.map((tm) => (
                    <option key={tm.id} value={tm.id}>
                      {tm.namaTempat}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-2">
                  Menu: {masterData?.tempatMakan.find(t => t.id === tempatMakanId)?.menuUtama || 'Seafood Buffet'}
                </p>
              </div>

              {/* Pilihan Tempat Acara (setelah Tempat Makan) */}
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/70">
                <label className="block text-xs font-bold text-violet-400 mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Tempat Acara Gathering <span className="text-rose-400">*</span>
                </label>
                <select
                  value={tempatAcaraId}
                  onChange={(e) => setTempatAcaraId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  {masterData?.tempatAcara?.map((ta) => (
                    <option key={ta.id} value={ta.id}>
                      {ta.namaTempat} ({ta.kegiatan})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-2">
                  Lokasi: {masterData?.tempatAcara?.find(t => t.id === tempatAcaraId)?.lokasi || 'Area Pangandaran'}
                </p>
              </div>

              {/* Catatan Alergi & Riwayat Kesehatan */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Catatan Khusus / Alergi Makanan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Alergi udang, vegetarian, perlu kursi dekat pintu..."
                    value={catatanKhusus}
                    onChange={(e) => setCatatanKhusus(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Riwayat Penyakit / Catatan Medis (Jika Ada)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Asma ringan, mabuk darat, bawa obat pribadi..."
                    value={riwayatPenyakit}
                    onChange={(e) => setRiwayatPenyakit(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-cyan-500/20"
              >
                <span>Lanjut: Upload Dokumen & Simpan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Upload Dokumen, Google Drive Sync & Final Submit */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                Lampiran Dokumen & Konfirmasi Pendaftaran
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Unggah dokumen pendukung seperti KTP / Kartu Pegawai (Maks. 5 MB format PDF, JPG, PNG).
              </p>
            </div>

            {/* Document Upload Zone */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Unggah Dokumen (KTP / Surat Tugas / ID Card Pegawai) - Maks. 5 MB
              </label>

              <div className="relative border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-2xl p-6 text-center bg-slate-800/30 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    Klik atau seret berkas ke area ini
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Mendukung PDF, JPG, PNG (Batas ketat 5 MB per berkas)
                  </p>
                </div>
              </div>

              {uploadError && (
                <p className="text-xs text-rose-400 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> {uploadError}
                </p>
              )}

              {/* Uploaded Documents List */}
              {dokumenList.length > 0 && (
                <div className="space-y-2 mt-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Berkas Terunggah ({dokumenList.length})
                  </p>
                  {dokumenList.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{doc.namaFile}</p>
                          <p className="text-[10px] text-slate-400">
                            {(doc.ukuranBytes / (1024 * 1024)).toFixed(2)} MB • Tersimpan lokal & Sinkron G-Drive
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.id)}
                        className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Registration Summary Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Ringkasan Pendaftaran
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Pegawai (Peserta):</span>
                  <p className="font-bold text-white truncate">{namaLengkap || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Total Rombongan:</span>
                  <p className="font-bold text-cyan-300">{1 + keluargaList.length} Jiwa</p>
                  <p className="text-[10px] text-slate-400">1 Pegawai + {keluargaList.length} Keluarga</p>
                </div>
                <div>
                  <span className="text-slate-400">Armada Bis:</span>
                  <p className="font-bold text-white truncate">
                    {masterData?.bis.find(b => b.id === bisId)?.nomorBis}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Kamar & Lantai:</span>
                  <p className="font-bold text-amber-300 truncate">
                    No. {noKamar} (Lt. {selectedHotelObj?.daftarKamar.find(k => k.noKamar === noKamar)?.lantai || (noKamar.length >= 3 ? noKamar.charAt(0) : '1')})
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Tempat Makan:</span>
                  <p className="font-bold text-rose-300 truncate">
                    {masterData?.tempatMakan.find(m => m.id === tempatMakanId)?.namaTempat || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Tempat Acara:</span>
                  <p className="font-bold text-violet-300 truncate">
                    {masterData?.tempatAcara?.find(a => a.id === tempatAcaraId)?.namaTempat || '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                id="btn-submit-registration"
                className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm transition-all shadow-xl shadow-cyan-500/25 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>Mengunci Nomor Peserta...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Konfirmasi & Daftar Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </>
  )}
</div>
);
};
