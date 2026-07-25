// src/stores/card.ts — Estado de la Tarjeta Virtual (persistido localmente).
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_VIRTUAL_CARDS } from '@/api/mockData';
import type { VirtualCard } from '@/types';

const key = (userId: string) => `ca_vcard_${userId}`;

function defaultCard(userId: string, name: string, email: string): VirtualCard {
  return MOCK_VIRTUAL_CARDS[userId] ?? {
    user_id: userId,
    name,
    position: 'Miembro del equipo',
    company: 'CavernicolApp',
    bio: 'Cuéntale a tus clientes quién eres. Edita tu tarjeta para agregar tu experiencia y tus enlaces.',
    phone: '',
    email,
    whatsapp: '',
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    socials: [
      { platform: 'instagram', enabled: false, url: '' },
      { platform: 'facebook', enabled: false, url: '' },
      { platform: 'tiktok', enabled: false, url: '' },
      { platform: 'linkedin', enabled: false, url: '' },
      { platform: 'threads', enabled: false, url: '' },
    ],
    links: [],
    credentials: [],
  };
}

interface CardState {
  card: VirtualCard | null;
  loaded: boolean;
  load: (userId: string, name: string, email: string) => Promise<void>;
  save: (patch: Partial<VirtualCard>) => Promise<void>;
}

export const useCardStore = create<CardState>((set, get) => ({
  card: null,
  loaded: false,
  load: async (userId, name, email) => {
    try {
      const raw = await AsyncStorage.getItem(key(userId));
      if (raw) {
        set({ card: JSON.parse(raw) as VirtualCard, loaded: true });
        return;
      }
    } catch {
      /* usa default */
    }
    set({ card: defaultCard(userId, name, email), loaded: true });
  },
  save: async (patch) => {
    const current = get().card;
    if (!current) return;
    const next = { ...current, ...patch };
    set({ card: next });
    try {
      await AsyncStorage.setItem(key(next.user_id), JSON.stringify(next));
    } catch {
      /* mock: persistencia best-effort */
    }
  },
}));
