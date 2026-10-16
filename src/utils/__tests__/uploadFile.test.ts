import { describe, expect, it } from 'vitest';
import {
  displayFileName,
  fileNameFromValue,
  isFilePath,
  isLegacyFileUrl,
  storagePathFromValue,
  validateUploadFile,
} from '../uploadFile';

describe('validateUploadFile', () => {
  it('accepts an in-limit image', () => {
    expect(validateUploadFile({ size: 1024, type: 'image/jpeg' })).toBeNull();
  });

  it('rejects disallowed types', () => {
    expect(validateUploadFile({ size: 1024, type: 'application/x-msdownload' })).toContain(
      'not allowed'
    );
  });

  it('rejects files over 5MB', () => {
    expect(validateUploadFile({ size: 6 * 1024 * 1024, type: 'application/pdf' })).toContain('5MB');
  });
});

describe('displayFileName', () => {
  it('strips the uuid prefix and decodes', () => {
    expect(
      displayFileName('https://x/abc/12345678-1234-1234-1234-123456789012-my%20doc.pdf')
    ).toBe('my doc.pdf');
  });

  it('falls back for plain urls', () => {
    expect(displayFileName('https://x/y.pdf')).toBe('y.pdf');
  });

  it('detects storage paths vs legacy urls', () => {
    expect(isFilePath('shop1/12345678-1234-1234-1234-123456789012-a.pdf')).toBe(true);
    expect(isFilePath('https://x/y.pdf')).toBe(false);
    expect(isFilePath('')).toBe(false);
    expect(isLegacyFileUrl('https://x/y.pdf')).toBe(true);
    expect(isLegacyFileUrl('shop1/a.pdf')).toBe(false);
  });

  it('extracts names from storage paths', () => {
    expect(fileNameFromValue('shop1/12345678-1234-1234-1234-123456789012-doc.pdf')).toBe('doc.pdf');
    expect(fileNameFromValue('')).toBe('View file');
  });

  it('resolves signable paths from values', () => {
    expect(storagePathFromValue('shop1/abc.pdf')).toBe('shop1/abc.pdf');
    expect(
      storagePathFromValue('https://xyz.supabase.co/storage/v1/object/public/buyer-uploads/shop1/12345678-1234-1234-1234-123456789012-doc.pdf')
    ).toBe('shop1/12345678-1234-1234-1234-123456789012-doc.pdf');
    expect(storagePathFromValue('https://drive.google.com/x')).toBeNull();
    expect(storagePathFromValue('')).toBeNull();
  });
});
