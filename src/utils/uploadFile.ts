import { supabase } from '../lib/supabase';

export const BUYER_UPLOADS_BUCKET = 'buyer-uploads';
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
export const FILE_ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf';

export function validateUploadFile(file: { size: number; type: string }): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'File type not allowed. Use JPG, PNG, WEBP or PDF.';
  }
  if (file.size > MAX_FILE_BYTES) {
    return 'File is too large (max 5MB).';
  }
  return null;
}

function sanitizeName(name: string): string {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
  return safe || 'file';
}

export function displayFileName(url: string): string {
  const last = url.split('/').pop() ?? '';
  const stripped = last.replace(/^[0-9a-fA-F-]{36}-/, '');
  try {
    return decodeURIComponent(stripped) || 'View file';
  } catch {
    return stripped || 'View file';
  }
}

export async function uploadBuyerFile(shopId: string, file: File): Promise<string> {
  const id =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `f${Date.now().toString(36)}`;
  const path = `${shopId}/${id}-${sanitizeName(file.name)}`;
  const { error } = await supabase.storage
    .from(BUYER_UPLOADS_BUCKET)
    .upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from(BUYER_UPLOADS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
