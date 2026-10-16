export const IIUM_EMAIL_DOMAIN = 'live.iium.edu.my';

export function isIiumEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${IIUM_EMAIL_DOMAIN}`);
}

export function validateIiumEmail(email: string): string | null {
  if (!email.trim()) return 'Email IIUM diperlukan.';
  if (!isIiumEmail(email)) return `Guna email @${IIUM_EMAIL_DOMAIN} sahaja.`;
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password diperlukan.';
  if (password.length < 6) return 'Password minima 6 aksara.';
  return null;
}

export function validateWhatsappMY(raw: string): string | null {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return 'Nombor WhatsApp diperlukan.';
  if (!/^60\d{8,10}$/.test(digits))
    return 'Format: 60123456789 (mula dengan 60).';
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
