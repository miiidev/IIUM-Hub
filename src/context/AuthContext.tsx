import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { slugifyShopName } from '../utils/validation';
import type { Profile, Shop } from '../types';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  shop: Shop | null;
  loading: boolean;
  signUp: (args: {
    email: string;
    password: string;
    whatsappNumber: string;
    shopName: string;
    mahalla: string;
    category: string;
  }) => Promise<{ needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshShop: () => Promise<void>;
  setupShop: (args: {
    whatsappNumber: string;
    shopName: string;
    mahalla: string;
    category: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function fetchProfileAndShop(userId: string): Promise<{
  profile: Profile | null;
  shop: Shop | null;
}> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('owner_id', userId)
    .maybeSingle();
  return {
    profile: (profile as Profile | null) ?? null,
    shop: (shop as Shop | null) ?? null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadForUser(userId: string) {
    try {
      const { profile: p, shop: s } = await fetchProfileAndShop(userId);
      setProfile(p);
      setShop(s);
    } catch {
      setProfile(null);
      setShop(null);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) await loadForUser(data.session.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        await loadForUser(sess.user.id);
      } else {
        setProfile(null);
        setShop(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function ensureProfileAndShop(
    userId: string,
    whatsappNumber: string,
    shopName: string,
    mahalla: string,
    category: string,
    slug: string
  ): Promise<void> {
    const { data: existing } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();
    if (!existing) {
      const { error: pErr } = await supabase
        .from('profiles')
        .upsert({ id: userId, whatsapp_number: whatsappNumber });
      if (pErr) throw pErr;
      const { error: sErr } = await supabase.from('shops').insert({
        slug,
        name: shopName.trim(),
        whatsapp_number: whatsappNumber,
        category,
        mahalla,
        is_active: true,
        owner_id: userId,
      });
      if (sErr) throw sErr;
    }
    await loadForUser(userId);
  }

  async function signUp(args: {
    email: string;
    password: string;
    whatsappNumber: string;
    shopName: string;
    mahalla: string;
    category: string;
  }): Promise<{ needsConfirmation: boolean }> {
    const { data, error } = await supabase.auth.signUp({
      email: args.email.trim(),
      password: args.password,
    });
    if (error) throw error;
    if (!data.session || !data.user) {
      // Email confirmation ON — seller confirms email, then logs in.
      // Stash pending shop details locally to finish setup after login.
      localStorage.setItem(
        'iium-pending-shop',
        JSON.stringify({
          whatsappNumber: args.whatsappNumber,
          shopName: args.shopName,
          mahalla: args.mahalla,
          category: args.category,
          slug: slugifyShopName(args.shopName),
        })
      );
      return { needsConfirmation: true };
    }
    await ensureProfileAndShop(
      data.user.id,
      args.whatsappNumber,
      args.shopName,
      args.mahalla,
      args.category,
      slugifyShopName(args.shopName)
    );
    return { needsConfirmation: false };
  }

  async function signIn(email: string, password: string): Promise<void> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    if (data.user) {
      // Finish pending shop setup (user signed up while confirmation was ON)
      const raw = localStorage.getItem('iium-pending-shop');
      if (raw) {
        try {
          const p = JSON.parse(raw) as {
            whatsappNumber: string;
            shopName: string;
            mahalla: string;
            category: string;
            slug: string;
          };
          await ensureProfileAndShop(
            data.user.id,
            p.whatsappNumber,
            p.shopName,
            p.mahalla,
            p.category,
            p.slug
          );
        } finally {
          localStorage.removeItem('iium-pending-shop');
        }
      } else {
        await loadForUser(data.user.id);
      }
    }
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
    setProfile(null);
    setShop(null);
  }

  async function refreshShop(): Promise<void> {
    if (user) await loadForUser(user.id);
  }

  async function setupShop(args: {
    whatsappNumber: string;
    shopName: string;
    mahalla: string;
    category: string;
  }): Promise<void> {
    if (!user) throw new Error('Sesi tamat. Sila log masuk semula.');
    let slug = slugifyShopName(args.shopName);
    let attempt = 0;
    while (true) {
      try {
        await ensureProfileAndShop(
          user.id,
          args.whatsappNumber,
          args.shopName,
          args.mahalla,
          args.category,
          attempt === 0 ? slug : `${slug}-${attempt + 1}`
        );
        return;
      } catch (e: unknown) {
        if (typeof e === 'object' && e && (e as Record<string, string>).code === '23505') {
          attempt++;
          continue;
        }
        throw e;
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, session, profile, shop, loading, signUp, signIn, signOut, refreshShop, setupShop }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
