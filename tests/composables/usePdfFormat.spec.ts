import { describe, it, expect } from 'vitest';
import { formatPdfDate, formatPageSize } from '@/composables/usePdfFormat';

describe('formatPdfDate', () => {
  it('formats a PDF date string per locale, EU style for it/fr/de and US style for en', () => {
    const raw = "D:20220820125845+01'00'";

    expect(formatPdfDate(raw, 'it')).toMatch(/20 ago\.? 2022/);
    expect(formatPdfDate(raw, 'fr')).toMatch(/20 août 2022/);
    expect(formatPdfDate(raw, 'de')).toMatch(/20\.08\.2022/);
    expect(formatPdfDate(raw, 'en')).toMatch(/Aug 20, 2022/);
  });

  it('parses a negative timezone offset without throwing and keeps the right year', () => {
    const result = formatPdfDate("D:20240101120000-05'00'", 'en');

    expect(result).toContain('2024');
  });

  it('handles a date with no timezone (treated as UTC)', () => {
    const result = formatPdfDate('D:20240101120000', 'en');

    expect(result).toContain('2024');
  });

  it('handles a date-only string with missing time parts', () => {
    const result = formatPdfDate('D:20240101', 'en');

    expect(result).toContain('2024');
  });

  it('falls back to the original string when it does not match the PDF date format', () => {
    const result = formatPdfDate('2024-01-01', 'en');

    expect(result).toBe('2024-01-01');
  });

  it('falls back to the original string for an empty value', () => {
    expect(formatPdfDate('', 'en')).toBe('');
  });

  it('treats a Z timezone as UTC (same result as no timezone)', () => {
    const withZ = formatPdfDate('D:20240101120000Z', 'en');
    const withoutTz = formatPdfDate('D:20240101120000', 'en');
    expect(withZ).toBe(withoutTz);
    expect(withZ).toContain('2024');
  });
});

describe('formatPageSize', () => {
  it('rounds fractional point values from PDFium', () => {
    expect(formatPageSize(595.2000122070312, 841.7999877929688)).toBe('595 × 842 pt');
  });

  it('keeps already-whole values unchanged', () => {
    expect(formatPageSize(595, 842)).toBe('595 × 842 pt');
  });
});
