export const IIUM_EMAIL_DOMAIN = 'live.iium.edu.my';

export function isIiumEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${IIUM_EMAIL_DOMAIN}`);
}

export function validateIiumEmail(email: string): string | null {
  if (!email.trim()) return 'IIUM email is required.';
  if (!isIiumEmail(email)) return `Use @${IIUM_EMAIL_DOMAIN} only.`;
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password minima 6 aksara.';
  return null;
}

export function validateWhatsappMY(raw: string): string | null {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return 'WhatsApp number is required.';
  if (!/^60\d{8,10}$/.test(digits))
    return 'Format: 60123456789 (starts with 60).';
  return null;
}

export function slugifyShopName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || 'kedai'}-${suffix}`;
}
