export const BUYER_UPLOADS_BUCKET = 'buyer-uploads';

export const FILE_ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf';

export const FILE_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

export function isAllowedUploadType(file: File): boolean {
  return ALLOWED_MIME.has(file.type);
}

export function sanitizeFileName(name: string): string {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
  return safe || 'fail';
}

export function uploadPathFor(shopId: string, fileName: string): string {
  const id =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `f${Date.now().toString(36)}`;
  return `${shopId}/${id}-${sanitizeFileName(fileName)}`;
}

export function fileNameFromUrl(url: string): string {
  const last = url.split('/').pop() ?? '';
  const stripped = last.replace(/^[0-9a-fA-F-]{36}-/, '');
  try {
    return decodeURIComponent(stripped);
  } catch {
    return stripped;
  }
}
