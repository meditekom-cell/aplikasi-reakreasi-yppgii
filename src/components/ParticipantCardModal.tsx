import React from 'react';
import { Peserta } from '../types';
import { X, Printer, CheckCircle, Bus, Hotel, Utensils, Shirt, Users, Sparkles, MessageCircle, Phone, MapPin } from 'lucide-react';
import { getWhatsAppUrl, getHotelContact } from '../lib/whatsapp';

interface ParticipantCardModalProps {
  peserta: Peserta | null;
  onClose: () => void;
}

export const ParticipantCardModal: React.FC<ParticipantCardModalProps> = ({ peserta, onClose }) => {
  if (!peserta) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalJiwa = 1 + peserta.keluarga.length;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex justify-center items-start"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-2 sm:my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sticky Action Header Bar (Excluded during print) */}
        <div className="print:hidden sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 truncate">
              Kartu Registrasi Resmi Peserta
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              id="btn-print-card"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kartu</span>
            </button>
            <button
              onClick={onClose}
              id="btn-close-card"
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Tutup Kartu Peserta"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Card Canvas Area */}
        <div id="printable-card" className="p-3.5 sm:p-6 md:p-8 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 overflow-hidden">
          
          {/* Card Brand Banner */}
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-cyan-900 p-4 sm:p-6 border border-cyan-500/30 shadow-lg mb-4 sm:mb-6">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-400/20 text-cyan-300 text-[10px] sm:text-[11px] font-bold tracking-wider mb-2 border border-cyan-400/30">
                  <Sparkles className="w-3 h-3 shrink-0" /> OFFICIAL PARTICIPANT PASS
                </div>
                <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white font-['Outfit',sans-serif] leading-tight">
                  REKREASI PANGANDARAN 2026
                </h2>
                <p className="text-xs text-cyan-200/80 font-medium mt-0.5">
                  Family Gathering & Team Building Akbar
                </p>
              </div>

              {/* Unique Participant Number Badge */}
              <div className="w-full sm:w-auto bg-slate-950/90 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-cyan-400/50 shadow-md text-center shrink-0">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-cyan-200/90 font-bold">
                    NOMOR PESERTA
                  </p>
                </div>
                <div className="text-base sm:text-lg md:text-xl font-mono font-black text-cyan-300 tracking-wide break-all leading-tight">
                  <span className="select-all">{peserta.nomorAgenda}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Participant Primary Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="md:col-span-2 space-y-3 bg-slate-800/60 p-3.5 sm:p-4 rounded-xl border border-slate-700/60">
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Nama Peserta</p>
                <p className="text-base sm:text-lg font-bold text-white tracking-tight break-words">{peserta.namaLengkap}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="min-w-0">
                  <span className="text-slate-400 text-[11px] block">Status:</span>
                  <p className="font-semibold text-slate-200 truncate">{peserta.statusPernikahan || 'Menikah'}</p>
                </div>
                <div className="min-w-0">
                  <span className="text-slate-400 text-[11px] block">WhatsApp:</span>
                  <p className="font-semibold text-slate-200 truncate">
                    {peserta.noHpWa ? (
                      <a
                        href={getWhatsAppUrl(peserta.noHpWa, `Halo ${peserta.namaLengkap}, terkait Registrasi Gathering Pangandaran 2026 (${peserta.nomorAgenda})`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                        title="Buka Chat WhatsApp"
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{peserta.noHpWa}</span>
                      </a>
                    ) : '-'}
                  </p>
                </div>
                <div className="min-w-0">
                  <span className="text-slate-400 text-[11px] block">Unit Kerja:</span>
                  <p className="font-semibold text-slate-200 truncate">{peserta.unitKerjaNama || '-'}</p>
                </div>
                <div className="min-w-0">
                  <span className="text-slate-400 text-[11px] block">Jabatan:</span>
                  <p className="font-semibold text-slate-200 truncate">{peserta.jabatanNama || '-'}</p>
                </div>
                <div className="min-w-0">
                  <span className="text-slate-400 text-[11px] block">Gender:</span>
                  <p className="font-semibold text-slate-200 truncate">{peserta.jenisKelamin}</p>
                </div>
                <div className="min-w-0">
                  <span className="text-slate-400 text-[11px] block">NIK/NIP:</span>
                  <p className="font-semibold text-slate-200 font-mono text-[11px] truncate">{peserta.nikNip || '-'}</p>
                </div>
              </div>
            </div>

            {/* Total Rombongan & Status Box */}
            <div className="bg-slate-800/60 p-3.5 sm:p-4 rounded-xl border border-slate-700/60 flex flex-col justify-between text-center">
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Rombongan</p>
                <div className="text-2xl sm:text-3xl font-black text-cyan-400 my-1 font-['Outfit',sans-serif]">
                  {totalJiwa} <span className="text-xs sm:text-sm font-normal text-slate-400">Orang</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  (1 Pegawai + {peserta.keluarga.length} Anggota Keluarga)
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-700/60">
                <span className="inline-flex items-center justify-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" /> {peserta.status}
                </span>
              </div>
            </div>
          </div>

          {/* Logistics & Accommodation Allocation Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-4 sm:mb-6">
            {/* Bus Allocation */}
            <div className="bg-slate-800/40 p-3 sm:p-3.5 rounded-xl border border-slate-700/60 flex items-start gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                <Bus className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-bold text-blue-300">Armada Transportasi (Bis)</p>
                <p className="text-sm font-bold text-white truncate">{peserta.bisNama || 'Belum Ditentukan'}</p>
                {(() => {
                  const seats = [
                    peserta.kursi1 || peserta.nomorKursi,
                    peserta.kursi2,
                    peserta.kursi3,
                    peserta.kursi4,
                    peserta.kursi5,
                    peserta.kursi6,
                    peserta.kursi7
                  ].filter(Boolean);
                  if (seats.length > 0) {
                    return (
                      <div className="flex items-center gap-1.5 flex-wrap mt-1 text-xs text-cyan-300 font-semibold">
                        <span>Kursi:</span>
                        {seats.map((st, sIdx) => (
                          <span key={sIdx} className="bg-slate-900 border border-cyan-500/40 px-1.5 py-0.5 rounded text-cyan-200 font-mono text-[11px] font-bold">
                            {st}
                          </span>
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}
                {(peserta.namaSupir || peserta.noHpSopir) && (
                  <div className="text-[11px] text-slate-300 mt-1 flex flex-wrap items-center gap-1.5">
                    <span>Supir: <span className="font-semibold text-slate-100">{peserta.namaSupir || 'Supir'}</span></span>
                    {peserta.noHpSopir && (
                      <a
                        href={getWhatsAppUrl(peserta.noHpSopir, `Halo Pak ${peserta.namaSupir || 'Supir'}, saya ${peserta.namaLengkap} peserta Gathering Pangandaran 2026 (${peserta.bisNama || 'Bis'})...`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-emerald-400 hover:text-emerald-300 hover:underline font-mono"
                        title={`Chat WhatsApp ke Supir (${peserta.noHpSopir})`}
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-400 inline" />
                        <span>({peserta.noHpSopir})</span>
                      </a>
                    )}
                  </div>
                )}
                {(peserta.tourLeader || peserta.noHpTourLeader) && (
                  <div className="text-[11px] text-slate-300 mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span>TL: <span className="font-semibold text-slate-100">{peserta.tourLeader || 'Tour Leader'}</span></span>
                    {peserta.noHpTourLeader && (
                      <a
                        href={getWhatsAppUrl(peserta.noHpTourLeader, `Halo ${peserta.tourLeader || 'Tour Leader'}, saya ${peserta.namaLengkap} peserta Gathering Pangandaran 2026 (${peserta.bisNama || 'Bis'})...`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-emerald-400 hover:text-emerald-300 hover:underline font-mono"
                        title={`Chat WhatsApp ke Tour Leader (${peserta.noHpTourLeader})`}
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-400 inline" />
                        <span>({peserta.noHpTourLeader})</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Hotel Allocation */}
            <div className="bg-slate-800/40 p-3 sm:p-3.5 rounded-xl border border-slate-700/60 flex items-start gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                <Hotel className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-bold text-amber-300">Akomodasi Hotel & Kamar</p>
                <p className="text-sm font-bold text-white truncate">{peserta.hotelNama || 'Hotel Pangandaran'}</p>
                <div className="flex items-center gap-1.5 mt-1 text-xs flex-wrap">
                  <span className="text-slate-300">Kamar: <strong className="font-mono text-amber-300">No. {peserta.noKamar || '-'}</strong></span>
                  {(peserta.lantaiHotel || (peserta.noKamar && peserta.noKamar !== '-')) && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-500/30 text-amber-300 text-[10px] font-bold font-mono">
                      Lantai {peserta.lantaiHotel || (peserta.noKamar && peserta.noKamar.length >= 3 ? peserta.noKamar.charAt(0) : '1')}
                    </span>
                  )}
                </div>
                {(() => {
                  const hotelContact = getHotelContact(peserta.hotelNama, peserta.hotelId, peserta.noHpHotel);
                  if (!hotelContact) return null;
                  return (
                    <div className="text-[11px] text-slate-300 flex items-center gap-1.5 mt-1">
                      <span className="text-slate-400 text-[10px]">Kontak Hotel:</span>
                      <a
                        href={`tel:${hotelContact.replace(/[^\d+]/g, '')}`}
                        className="text-amber-300 hover:text-amber-200 hover:underline font-mono inline-flex items-center gap-1"
                        title={`Hubungi Kontak Hotel (${hotelContact})`}
                      >
                        <Phone className="w-3 h-3 text-amber-400 inline shrink-0" />
                        <span>{hotelContact}</span>
                      </a>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Dining Allocation */}
            <div className="bg-slate-800/40 p-3 sm:p-3.5 rounded-xl border border-slate-700/60 flex items-start gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 shrink-0">
                <Utensils className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-bold text-rose-300">Tempat Makan</p>
                <p className="text-sm font-bold text-white truncate">{peserta.tempatMakanNama || 'Restoran Rekreasi'}</p>
                <p className="text-[11px] text-slate-400 mt-1">Makan Bersama Rombongan</p>
              </div>
            </div>

            {/* Tempat Acara */}
            <div className="bg-slate-800/40 p-3 sm:p-3.5 rounded-xl border border-slate-700/60 flex items-start gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-bold text-purple-300">Tempat Acara</p>
                <p className="text-sm font-bold text-white truncate">{peserta.tempatAcaraNama || peserta.tempatAcara || 'Pantai Barat Pangandaran'}</p>
                <p className="text-xs text-slate-300 mt-0.5">
                  Venue & Panggung Gathering 2026
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 flex-wrap">
                  <span className="px-1.5 py-0.2 rounded bg-purple-950/80 border border-purple-500/30 text-purple-300 font-medium">
                    Titik Kumpul & Kegiatan
                  </span>
                  <span>• Area Pangandaran</span>
                </div>
              </div>
            </div>

            {/* T-Shirt Size Primary */}
            <div className="bg-slate-800/40 p-3 sm:p-3.5 rounded-xl border border-slate-700/60 flex items-start gap-3 min-w-0 sm:col-span-2">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                <Shirt className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-bold text-emerald-300">Ukuran Kaos Peserta</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-bold text-white font-mono bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded text-emerald-300">
                    {(peserta.ukuranKaosNama || 'L').replace(/\s*Dewasa/gi, '').trim()}
                  </span>
                  <span className="text-xs text-slate-300">Bahan Cotton Combed 24s Premium Anti-Bacterial</span>
                </div>
                {peserta.catatanKhusus && (
                  <p className="text-xs text-amber-300 truncate mt-1">Catatan: {peserta.catatanKhusus}</p>
                )}
              </div>
            </div>
          </div>

          {/* Family Members Breakdown List if any */}
          {peserta.keluarga.length > 0 && (
            <div className="bg-slate-800/40 p-3.5 sm:p-4 rounded-xl border border-slate-700/60 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 mb-2.5">
                <Users className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Rincian Anggota Keluarga Terdaftar ({peserta.keluarga.length})
                </h4>
              </div>
              <div className="divide-y divide-slate-700/60 text-xs">
                {peserta.keluarga.map((k, idx) => (
                  <div key={k.id || idx} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                    <div className="min-w-0">
                      <span className="font-semibold text-white break-words">{k.nama}</span>
                      <span className="text-slate-400 ml-1 sm:ml-2">({k.hubungan} - {k.kategoriUsia})</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(k.hubungan === 'Suami' || k.hubungan === 'Istri') && k.ukuranKaosNama && !k.ukuranKaosNama.toLowerCase().includes('tanpa') && k.ukuranKaosNama !== '-' ? (
                        <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-md font-mono font-medium text-[11px]">
                          Kaos: {k.ukuranKaosNama.replace(/\s*Dewasa/gi, '').trim()}
                        </span>
                      ) : (
                        <span className="bg-slate-900/80 text-slate-400 px-2 py-0.5 rounded-md text-[11px]">
                          Tanpa Kaos
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Card Info */}
          <div className="pt-3.5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <div className="text-[11px] text-slate-400">
              <p className="font-mono text-cyan-400 font-semibold tracking-wider">PANGANDARAN-GATHERING-2026</p>
            </div>
            <div className="text-left sm:text-right text-[11px] text-slate-400 w-full sm:w-auto shrink-0">
              <p>Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar for Mobile Convenience (Print:hidden) */}
        <div className="print:hidden flex items-center justify-end gap-2 px-4 py-3 bg-slate-950/90 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Kartu</span>
          </button>
        </div>

      </div>
    </div>
  );
};
