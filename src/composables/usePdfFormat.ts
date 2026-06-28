import type { SupportedLocale } from '@/types/pdf';

const DATE_LOCALES: Record<SupportedLocale, string> = {
  it: 'it-IT',
  en: 'en-US',
  fr: 'fr-FR',
  de: 'de-DE',
};

// PDF date format: "D:YYYYMMDDHHmmSSOHH'mm'" (e.g. "D:20220820125845+01'00'").
// Every part after the year is optional, per the PDF spec.
const PDF_DATE_PATTERN =
  /^D:(?<year>\d{4})(?<month>\d{2})?(?<day>\d{2})?(?<hour>\d{2})?(?<minute>\d{2})?(?<second>\d{2})?(?<tzSign>[+\-Zz])?(?<tzHour>\d{2})?'?(?<tzMinute>\d{2})?/;

/**
 * Formats a raw PDF date string for display, localized to `locale` (EU-style
 * for it/fr/de, US-style for en). Falls back to the original string if it
 * doesn't match the expected PDF date format.
 */
export function formatPdfDate(raw: string, locale: SupportedLocale): string {
  const match = PDF_DATE_PATTERN.exec(raw);
  if (!match?.groups)
    return raw;

  const { year, month = '01', day = '01', hour = '00', minute = '00', second = '00', tzSign, tzHour, tzMinute = '00' } = match.groups;

  const utcMs = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  const offsetMs = tzSign && tzSign !== 'Z' && tzSign !== 'z'
    ? (tzSign === '-' ? -1 : 1) * (Number(tzHour ?? '0') * 60 + Number(tzMinute)) * 60000
    : 0;

  const date = new Date(utcMs - offsetMs);
  if (Number.isNaN(date.getTime()))
    return raw;

  return new Intl.DateTimeFormat(DATE_LOCALES[locale], { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

/** Formats a page size in points, rounded to whole points (PDFium reports them with float noise). */
export function formatPageSize(widthPt: number, heightPt: number): string {
  return `${Math.round(widthPt)} × ${Math.round(heightPt)} pt`;
}
