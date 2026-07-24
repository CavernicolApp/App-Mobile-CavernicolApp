// src/lib/format.ts — helpers de formato (fecha, moneda, teléfono)
import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(iso: string | Date | null | undefined, pattern = "d 'de' MMM yyyy"): string {
  if (!iso) return '';
  const d = typeof iso === 'string' ? parseISO(iso) : iso;
  return format(d, pattern, { locale: es });
}

export function formatTime(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const d = typeof iso === 'string' ? parseISO(iso) : iso;
  return format(d, 'HH:mm', { locale: es });
}

export function formatDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const d = typeof iso === 'string' ? parseISO(iso) : iso;
  return format(d, "d MMM · HH:mm", { locale: es });
}

export function formatRelativeDay(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const d = typeof iso === 'string' ? parseISO(iso) : iso;
  if (isToday(d)) return `Hoy · ${formatTime(d)}`;
  if (isTomorrow(d)) return `Mañana · ${formatTime(d)}`;
  if (isYesterday(d)) return `Ayer · ${formatTime(d)}`;
  return formatDateTime(d);
}

export function timeAgo(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const d = typeof iso === 'string' ? parseISO(iso) : iso;
  return formatDistanceToNow(d, { locale: es, addSuffix: true });
}

export function formatCurrency(amount: number | null | undefined, currency = 'MXN'): string {
  if (amount === null || amount === undefined) return '—';
  try {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  // Formato MX básico: +52 55 1234 5678
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('52') && clean.length >= 12) {
    return `+52 ${clean.slice(2, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)}`;
  }
  if (clean.length === 10) return `${clean.slice(0, 2)} ${clean.slice(2, 6)} ${clean.slice(6, 10)}`;
  return phone;
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function truncate(text: string | null | undefined, max = 100): string {
  if (!text) return '';
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}
