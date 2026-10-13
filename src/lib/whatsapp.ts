/**
 * Utility functions for WhatsApp links and formatting
 */

export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  // Remove spaces, dashes, parentheses, plus signs, dots
  let cleaned = phone.replace(/[^0-9]/g, '');
  
  // Handle Indonesian local prefix '08...' -> '628...'
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62') && cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  
  return cleaned;
}

export function getWhatsAppUrl(phone: string, text?: string): string {
  const number = formatWhatsAppNumber(phone);
  if (!number) return '#';
  if (text) {
    return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
  }
  return `https://wa.me/${number}`;
}

export function getHotelContact(hotelNama?: string, hotelId?: string, explicitContact?: string): string {
  if (explicitContact) return explicitContact;
  const key = ((hotelNama || '') + ' ' + (hotelId || '')).toLowerCase();
  if (key.includes('grand cahaya') || key.includes('htl-gc')) return '(0265) 639888';
  if (key.includes('sinar rahayu 1') || key.includes('htl-sr1')) return '(0265) 639001';
  if (key.includes('sinar rahayu 2') || key.includes('htl-sr2')) return '(0265) 639002';
  if (key.includes('sinar rahayu 3') || key.includes('htl-sr3')) return '(0265) 639003';
  if (key.includes('sinar rahayu 4') || key.includes('htl-sr4')) return '(0265) 639004';
  if (key.includes('suligar wangi') || key.includes('htl-sw1')) return '(0265) 639777';
  return '(0265) 639001';
}
