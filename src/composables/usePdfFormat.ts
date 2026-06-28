import type { SupportedLocale } from '@/types/pdf';

const DATE_LOCALES: Record<SupportedLocale, string> = {
  it: 'it-IT',
  en: 'en-US',
  fr: 'fr-FR',
  de: 'de-DE',
};

// PDF date format: "D:YYYYMMDDHHmmSSOHH'mm'" (e.g. "D:20220820125845+01'00'").
// The date-time digits are captured as a single run and the timezone
// separately; slicing the digit run below handles the "every part after the
// year is optional" rule without a pile of individually optional groups.
const PDF_DATE_PATTERN = /^D:(\d{4,14})(Z|[+-]\d{2}'?\d{2}'?)?/i;

/** Converts a PDF timezone suffix (e.g. "+01'00'", "-05'00'", "Z") to a UTC offset in minutes. */
function parseTzOffsetMinutes(tz: string | undefined): number {
  if (!tz || tz.toUpperCase() === 'Z')
    return 0;

  const sign = tz.startsWith('-') ? -1 : 1;
  const digits = tz.slice(1).replaceAll("'", '');
  const hours = Number(digits.slice(0, 2));
  const minutes = Number(digits.slice(2, 4) || '0');

  return sign * (hours * 60 + minutes);
}

/**
 * Formats a raw PDF date string for display, localized to `locale` (EU-style
 * for it/fr/de, US-style for en). Falls back to the original string if it
 * doesn't match the expected PDF date format.
 */
export function formatPdfDate(raw: string, locale: SupportedLocale): string {
  const match = PDF_DATE_PATTERN.exec(raw);
  if (!match)
    return raw;

  const digits = match[1];
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6) || '01';
  const day = digits.slice(6, 8) || '01';
  const hour = digits.slice(8, 10) || '00';
  const minute = digits.slice(10, 12) || '00';
  const second = digits.slice(12, 14) || '00';

  const utcMs = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  const offsetMs = parseTzOffsetMinutes(match[2]) * 60000;

  const date = new Date(utcMs - offsetMs);
  if (Number.isNaN(date.getTime()))
    return raw;

  return new Intl.DateTimeFormat(DATE_LOCALES[locale], { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

/** Formats a page size in points, rounded to whole points (PDFium reports them with float noise). */
export function formatPageSize(widthPt: number, heightPt: number): string {
  return `${Math.round(widthPt)} × ${Math.round(heightPt)} pt`;
}
