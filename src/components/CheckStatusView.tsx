import React, { useState, useEffect } from 'react';
import { Search, Sparkles, AlertCircle, CheckCircle, Bus, Hotel, Shirt, Users, Printer, Phone, MessageCircle, Calendar, Clock, PartyPopper } from 'lucide-react';
import { api } from '../services/api';
import { Peserta } from '../types';
import { ParticipantCardModal } from './ParticipantCardModal';
import { getWhatsAppUrl, getHotelContact } from '../lib/whatsapp';

interface CheckStatusViewProps {
  onNavigate?: (tab: any) => void;
}

export const CheckStatusView: React.FC<CheckStatusViewProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasilList, setHasilList] = useState<Peserta[]>([]);
  const [selectedPeserta, setSelectedPeserta] = useState<Peserta | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Jadwal Kegiatan Gathering: 7-8 November 2026 (WIB / UTC+7)
  const EVENT_START_DATE = new Date('2026-11-07T00:00:00+07:00').getTime();
  const EVENT_END_DATE = new Date('2026-11-08T23:59:59+07:00').getTime();

  type EventStatus = 'COUNTDOWN' | 'ONGOING' | 'COMPLETED';

  const calculateEventCountdown = () => {
    const now = Date.now();

    // 1. Jika waktu sudah melewati akhir kegiatan (setelah 8 November 2026)
    if (now > EVENT_END_DATE) {
      return {
        status: 'COMPLETED' as EventStatus,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    // 2. Jika sedang masuk hari H kegiatan (7 - 8 November 2026)
    if (now >= EVENT_START_DATE && now <= EVENT_END_DATE) {
      return {
        status: 'ONGOING' as EventStatus,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    // 3. Sebelum hari H (Hitung mundur hari, jam, menit, detik)
    const diff = Math.max(0, EVENT_START_DATE - now);
    return {
      status: 'COUNTDOWN' as EventStatus,
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };

  const [eventCountdown, setEventCountdown] = useState(calculateEventCountdown);

  useEffect(() => {
    const interval = setInterval(() => {
      setEventCountdown(calculateEventCountdown());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setErrorMsg('Silakan masukkan Nomor WhatsApp Anda yang terdaftar.');
      return;
    }

    const cleanDigits = trimmed.replace(/\D/g, '');
    if (cleanDigits.length > 0 && cleanDigits.length < 8 && !trimmed.toUpperCase().startsWith('REG-')) {
      setErrorMsg('Nomor WhatsApp tidak lengkap. Silakan masukkan nomor WhatsApp Anda minimal 9–13 digit (contoh: 081234567890).');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setHasSearched(true);
      const results = await api.checkStatus(trimmed);
      setHasilList(results);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nomor WhatsApp tidak ditemukan. Pastikan nomor sesuai dengan yang didaftarkan.');
      setHasilList([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-2 sm:px-4">
      {/* Header Banner */}
      <div className="text-center mb-8">
        {/* Tanda Hari Mundur / Status Pelaksanaan Kegiatan */}
        <div className="mb-4 inline-flex flex-col items-center">
          {eventCountdown.status === 'ONGOING' && (
            <div className="bg-gradient-to-b from-emerald-950/90 to-slate-900/90 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-xl shadow-emerald-950/30 backdrop-blur-md text-center max-w-md mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-2 border border-emerald-500/40">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <PartyPopper className="w-3.5 h-3.5 text-emerald-400" />
                <span>HARI H SEDANG BERLANGSUNG</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Selamat Mengikuti Kegiatan
              </h3>
              <p className="text-xs text-emerald-200/90 mt-1 font-medium">
                Family Gathering & Rekreasi Pangandaran 2026
              </p>
              <div className="mt-3 pt-2.5 border-t border-emerald-800/50 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-300">
                <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Pelaksanaan 7-8 November 2026</span>
              </div>
            </div>
          )}

          {eventCountdown.status === 'COMPLETED' && (
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl shadow-black/40 backdrop-blur-md text-center max-w-md mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold mb-2 border border-slate-700">
                <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>KEGIATAN TELAH SELESAI</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Kegiatan Telah Selesai
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Terima kasih atas partisipasi dan kebersamaan seluruh peserta & keluarga besar.
              </p>
              <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Pelaksanaan 7-8 November 2026</span>
              </div>
            </div>
          )}

          {eventCountdown.status === 'COUNTDOWN' && (
            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-3 sm:p-4 shadow-xl shadow-cyan-950/20 backdrop-blur-md">
              {/* Timer boxes */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-3 text-center">
                <div className="bg-slate-800/90 border border-slate-700/70 rounded-xl px-2.5 py-1.5 sm:px-4 sm:py-2 min-w-[54px] sm:min-w-[68px]">
                  <span className="font-mono text-xl sm:text-3xl font-extrabold text-cyan-400 block leading-tight">
                    {eventCountdown.days}
                  </span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider block mt-0.5">
                    Hari
                  </span>
                </div>

                <span className="text-slate-600 font-bold text-lg sm:text-2xl pb-2 sm:pb-3">:</span>

                <div className="bg-slate-800/90 border border-slate-700/70 rounded-xl px-2.5 py-1.5 sm:px-4 sm:py-2 min-w-[54px] sm:min-w-[68px]">
                  <span className="font-mono text-xl sm:text-3xl font-extrabold text-cyan-400 block leading-tight">
                    {String(eventCountdown.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider block mt-0.5">
                    Jam
                  </span>
                </div>

                <span className="text-slate-600 font-bold text-lg sm:text-2xl pb-2 sm:pb-3">:</span>

                <div className="bg-slate-800/90 border border-slate-700/70 rounded-xl px-2.5 py-1.5 sm:px-4 sm:py-2 min-w-[54px] sm:min-w-[68px]">
                  <span className="font-mono text-xl sm:text-3xl font-extrabold text-cyan-400 block leading-tight">
                    {String(eventCountdown.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider block mt-0.5">
                    Menit
                  </span>
                </div>

                <span className="text-slate-600 font-bold text-lg sm:text-2xl pb-2 sm:pb-3">:</span>

                <div className="bg-slate-800/90 border border-slate-700/70 rounded-xl px-2.5 py-1.5 sm:px-4 sm:py-2 min-w-[54px] sm:min-w-[68px]">
                  <span className="font-mono text-xl sm:text-3xl font-extrabold text-amber-400 block leading-tight animate-pulse">
                    {String(eventCountdown.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider block mt-0.5">
                    Detik
                  </span>
                </div>
              </div>

              {/* Di bawahnya: Pelaksanaan 7-8 November 2026 */}
              <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-cyan-200">
                <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Pelaksanaan 7-8 November 2026</span>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-semibold mb-3 border border-cyan-500/30">
            <Sparkles className="w-3.5 h-3.5" /> VERIFIKASI PESERTA GATHERING
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-['Outfit',sans-serif]">
          Cek Status Pendaftaran & Kartu Peserta
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-lg mx-auto">
          Cari data pendaftaran Anda menggunakan Nomor WhatsApp Anda.
        </p>
      </div>

      {/* Search Bar Input */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <div className="flex items-center bg-slate-900 border-2 border-slate-700 hover:border-cyan-500/60 focus-within:border-cyan-500 rounded-2xl p-2 shadow-2xl transition-all">
            <Search className="w-6 h-6 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              id="input-check-status"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nomor WhatsApp Anda (contoh: 081234567890)..."
              className="w-full bg-transparent border-none text-white px-4 py-2.5 text-sm sm:text-base focus:outline-none placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={loading}
              id="btn-search-status"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm transition-all shadow-md shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Mencari...' : 'Cari Data'}
            </button>
          </div>
        </div>
      </form>

      {/* Error Message Panel / Pencarian Tidak Ditemukan */}
      {errorMsg && (
        <div className="max-w-2xl mx-auto mb-8 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-rose-200">Pencarian Tidak Ditemukan</h4>
            <p className="mt-0.5 text-rose-300/90">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Empty State when searched without explicit error */}
      {!errorMsg && hasSearched && hasilList.length === 0 && !loading && (
        <div className="max-w-2xl mx-auto mb-6 p-4 rounded-2xl bg-slate-900/70 border border-slate-800 text-center text-slate-400 text-sm">
          <p className="font-semibold text-slate-300">Data tidak ditemukan</p>
          <p className="text-xs text-slate-500 mt-1">Pastikan nomor WhatsApp sesuai dengan yang didaftarkan.</p>
        </div>
      )}

      {/* Results List */}
      {hasilList.length > 0 && (
        <div className="space-y-4 max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Ditemukan {hasilList.length} Data Pendaftaran
          </p>

          {hasilList.map((peserta) => (
            <div
              key={peserta.id}
              className="bg-slate-900 border border-slate-700/80 hover:border-cyan-500/50 rounded-2xl p-5 shadow-xl transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
                <div className="space-y-1.5 min-w-0">
                  {/* Nomor Peserta Badge */}
                  <div className="inline-flex items-center gap-2 bg-slate-950/90 border border-cyan-400/40 px-3 py-1 rounded-lg shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/90">
                      NO. PESERTA
                    </span>
                    <span className="font-mono text-sm sm:text-base font-extrabold text-cyan-300 tracking-wide">
                      {peserta.nomorAgenda}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white mt-1">{peserta.namaLengkap}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>{peserta.unitKerjaNama} • {peserta.jabatanNama}</span>
                    {peserta.noHpWa && (
                      <>
                        <span>•</span>
                        <a
                          href={getWhatsAppUrl(peserta.noHpWa, `Halo ${peserta.namaLengkap}, terkait Registrasi Family Gathering Pangandaran 2026 (${peserta.nomorAgenda})`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-mono hover:underline transition-colors"
                          title="Hubungi via WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-400" />
                          <span>{peserta.noHpWa}</span>
                        </a>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> {peserta.status}
                  </span>
                </div>
              </div>

              {/* Fast Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {/* Bis & Kursi */}
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 text-[10px] block uppercase font-bold flex items-center gap-1">
                    <Bus className="w-3 h-3 text-blue-400" /> Bis & Kursi
                  </span>
                  <span className="font-semibold text-white truncate block mt-0.5">{peserta.bisNama || '-'}</span>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span className="text-slate-400 text-[10px]">No. Kursi:</span>
                    <span className="font-mono text-cyan-300 font-bold text-[11px] px-1.5 py-0.2 rounded bg-blue-950/80 border border-blue-500/30">
                      {peserta.nomorKursi || '-'}
                    </span>
                  </div>
                  {peserta.tourLeader && (
                    <span className="text-[10px] text-slate-300 truncate block mt-1">TL: {peserta.tourLeader}</span>
                  )}
                  {peserta.noHpTourLeader && (
                    <div className="mt-0.5">
                      <a
                        href={getWhatsAppUrl(peserta.noHpTourLeader, `Halo Kak ${peserta.tourLeader || 'Tour Leader'}, saya ${peserta.namaLengkap} (No. Peserta: ${peserta.nomorAgenda}, ${peserta.bisNama})...`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline font-mono"
                        title={`Hubungi WhatsApp Tour Leader (${peserta.noHpTourLeader})`}
                      >
                        <MessageCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400 shrink-0" />
                        <span>{peserta.noHpTourLeader}</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Hotel & Kamar */}
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 text-[10px] block uppercase font-bold flex items-center gap-1">
                    <Hotel className="w-3 h-3 text-amber-400" /> Hotel & Kamar
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="font-semibold text-white">No. {peserta.noKamar || '-'}</span>
                    {(peserta.lantaiHotel || (peserta.noKamar && peserta.noKamar !== '-')) && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-500/30 text-amber-300 font-bold font-mono">
                        Lt. {peserta.lantaiHotel || (peserta.noKamar && peserta.noKamar.length >= 3 ? peserta.noKamar.charAt(0) : '1')}
                      </span>
                    )}
                  </div>
                  {peserta.hotelNama && (
                    <span className="text-[10px] text-slate-400 truncate block mt-0.5">{peserta.hotelNama}</span>
                  )}
                  {(() => {
                    const hotelContact = getHotelContact(peserta.hotelNama, peserta.hotelId, peserta.noHpHotel);
                    if (!hotelContact) return null;
                    return (
                      <div className="mt-1">
                        <a
                          href={`tel:${hotelContact.replace(/[^\d+]/g, '')}`}
                          className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-amber-300 hover:text-amber-200 hover:underline font-mono"
                          title={`Hubungi Kontak Hotel (${hotelContact})`}
                        >
                          <Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 shrink-0" />
                          <span>{hotelContact}</span>
                        </a>
                      </div>
                    );
                  })()}
                </div>

                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 text-[10px] block uppercase font-bold flex items-center gap-1">
                    <Shirt className="w-3 h-3 text-emerald-400" /> Kaos
                  </span>
                  <span className="font-semibold text-white truncate block mt-0.5">
                    {(peserta.ukuranKaosNama || '-').replace(/\s*Dewasa/gi, '').trim()}
                  </span>
                  {(() => {
                    const spouse = peserta.keluarga.find(k => k.hubungan === 'Suami' || k.hubungan === 'Istri');
                    if (spouse && spouse.ukuranKaosNama && !spouse.ukuranKaosNama.toLowerCase().includes('tanpa')) {
                      return (
                        <span className="text-[10px] text-emerald-400 font-medium block mt-0.5">
                          + {spouse.hubungan}: {spouse.ukuranKaosNama.replace(/\s*Dewasa/gi, '').trim()}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 text-[10px] block uppercase font-bold flex items-center gap-1">
                    <Users className="w-3 h-3 text-indigo-400" /> Total Rombongan
                  </span>
                  <span className="font-semibold text-cyan-300 block mt-0.5">{1 + peserta.keluarga.length} Orang</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    1 Pegawai {peserta.keluarga.length > 0 ? `+ ${peserta.keluarga.length} Keluarga` : '(Sendiri)'}
                  </span>
                </div>
              </div>

              {/* Action Button to Open Card */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedPeserta(peserta)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Buka & Cetak Kartu Peserta</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}



      {/* Registration Invitation Banner for New Visitors */}
      {onNavigate && (
        <div className={`max-w-2xl mx-auto mt-8 p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left ${
          new Date() > new Date('2026-09-20T23:59:59+07:00')
            ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
            : 'bg-cyan-950/20 border-cyan-500/30 text-cyan-200'
        }`}>
          <div>
            <h4 className="font-semibold text-white">
              {new Date() > new Date('2026-09-20T23:59:59+07:00')
                ? 'Masa Pendaftaran Resmi Berakhir'
                : 'Belum mendaftar Gathering Pangandaran 2026?'}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date() > new Date('2026-09-20T23:59:59+07:00')
                ? 'Batas akhir pendaftaran peserta adalah 20 September 2026.'
                : 'Pendaftaran terbuka sampai 20 September 2026 untuk seluruh pegawai & keluarga.'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('pendaftaran')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              new Date() > new Date('2026-09-20T23:59:59+07:00')
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                : 'bg-cyan-500 text-slate-900 hover:bg-cyan-400 shadow-md shadow-cyan-500/20'
            }`}
          >
            {new Date() > new Date('2026-09-20T23:59:59+07:00')
              ? 'Informasi Pendaftaran'
              : 'Formulir Pendaftaran'}
          </button>
        </div>
      )}
      {selectedPeserta && (
        <ParticipantCardModal
          peserta={selectedPeserta}
          onClose={() => setSelectedPeserta(null)}
        />
      )}
    </div>
  );
};
