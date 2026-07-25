// app/(tabs)/tarjeta.tsx — Tarjeta Virtual (vista compartible por QR / NFC)
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Txt } from '@/components/ui/Text';
import { Logo } from '@/components/ui/Logo';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ShareCardSheet } from '@/components/card/ShareCardSheet';
import { EditCardSheet } from '@/components/card/EditCardSheet';
import { useAuthStore } from '@/stores/auth';
import { useCardStore } from '@/stores/card';
import { initials } from '@/lib/format';
import type { CardSocialPlatform } from '@/types';

const SOCIAL_ICON: Record<CardSocialPlatform, keyof typeof Ionicons.glyphMap> = {
  instagram: 'logo-instagram',
  facebook: 'logo-facebook',
  tiktok: 'logo-tiktok',
  linkedin: 'logo-linkedin',
  threads: 'at-outline',
};

export default function TarjetaScreen() {
  const user = useAuthStore((s) => s.user);
  const card = useCardStore((s) => s.card);
  const loaded = useCardStore((s) => s.loaded);
  const load = useCardStore((s) => s.load);

  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (user) load(user.id, user.name, user.email);
  }, [user, load]);

  if (!loaded || !card) return <LoadingScreen />;

  const openUrl = (url: string) => { if (url) Linking.openURL(url).catch(() => {}); };
  const enabledSocials = card.socials.filter((s) => s.enabled && s.url);
  const enabledLinks = card.links.filter((l) => l.enabled);

  return (
    <SafeAreaView className="flex-1 bg-obsidian-void" edges={['top']}>
      {/* Header sticky */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-obsidian-border">
        <Logo size="sm" />
        <Pressable
          testID="card-edit-button"
          onPress={() => { Haptics.selectionAsync().catch(() => {}); setEditOpen(true); }}
          className="flex-row items-center gap-1.5 px-3 py-2 rounded-pill bg-obsidian-surface border border-obsidian-hi active:opacity-70"
        >
          <Ionicons name="create-outline" size={15} color="#fff" />
          <Txt variant="small" weight="semibold">Editar</Txt>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        {/* Cover + avatar */}
        <View>
          <LinearGradient
            colors={['#2A0E1A', '#FF5637', '#FF45A1']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ height: 128 }}
          />
          <View className="items-center -mt-12 px-5">
            <View className="w-24 h-24 rounded-full items-center justify-center bg-obsidian-elevated border-4 border-obsidian-void" style={{ shadowColor: '#FF45A1', shadowOpacity: 0.5, shadowRadius: 16, elevation: 8 }}>
              <Txt variant="title" weight="bold" font="heading" tone="flame">{initials(card.name)}</Txt>
            </View>
            <Txt variant="title" weight="bold" font="heading" className="mt-3 text-center">{card.name}</Txt>
            <Txt variant="body" weight="semibold" tone="flame" className="mt-0.5 text-center">{card.position}</Txt>
            <View className="flex-row items-center gap-1.5 mt-1">
              <Ionicons name="business-outline" size={13} color="#A0A0A0" />
              <Txt variant="small" tone="muted">{card.company}</Txt>
            </View>
          </View>
        </View>

        {/* Acciones de contacto */}
        <View className="flex-row justify-center gap-3 mt-5 px-5">
          <ContactBtn testID="card-call" icon="call" label="Llamar" onPress={() => openUrl(`tel:${card.phone.replace(/\s/g, '')}`)} disabled={!card.phone} />
          <ContactBtn testID="card-whatsapp" icon="logo-whatsapp" label="WhatsApp" onPress={() => openUrl(`https://wa.me/${card.whatsapp.replace(/[^0-9]/g, '')}`)} disabled={!card.whatsapp} />
          <ContactBtn testID="card-email" icon="mail" label="Correo" onPress={() => openUrl(`mailto:${card.email}`)} disabled={!card.email} />
        </View>

        {/* Botón principal Compartir */}
        <View className="px-5 mt-5">
          <Pressable
            testID="card-share-button"
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); setShareOpen(true); }}
          >
            <LinearGradient
              colors={['#FF5637', '#FF45A1']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ borderRadius: 14 }}
              className="flex-row items-center justify-center gap-2 py-4"
            >
              <Ionicons name="qr-code-outline" size={20} color="#fff" />
              <Txt variant="body" weight="bold" tone="inverse" className="tracking-wide">COMPARTIR TARJETA</Txt>
            </LinearGradient>
          </Pressable>
          <Txt variant="caption" tone="muted" className="text-center mt-2">Por QR, WhatsApp, enlace o NFC (Plus)</Txt>
        </View>

        {/* Bio */}
        {card.bio ? (
          <View className="px-5 mt-6">
            <Txt variant="label" weight="medium" tone="muted" className="mb-2">SOBRE MÍ</Txt>
            <View className="bg-obsidian-surface border border-obsidian-border rounded-card p-4">
              <Txt variant="small" tone="muted" style={{ lineHeight: 20 }}>{card.bio}</Txt>
            </View>
          </View>
        ) : null}

        {/* Redes */}
        {enabledSocials.length ? (
          <View className="px-5 mt-6">
            <Txt variant="label" weight="medium" tone="muted" className="mb-2">REDES</Txt>
            <View className="flex-row gap-3">
              {enabledSocials.map((s) => (
                <Pressable
                  key={s.platform}
                  testID={`card-social-${s.platform}`}
                  onPress={() => openUrl(s.url)}
                  className="w-12 h-12 rounded-full items-center justify-center bg-obsidian-surface border border-obsidian-hi active:opacity-70"
                >
                  <Ionicons name={SOCIAL_ICON[s.platform]} size={22} color="#FF45A1" />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Enlaces */}
        {enabledLinks.length ? (
          <View className="px-5 mt-6 gap-2.5">
            <Txt variant="label" weight="medium" tone="muted" className="mb-0.5">ENLACES</Txt>
            {enabledLinks.map((l) => (
              <Pressable
                key={l.id}
                testID={`card-link-${l.id}`}
                onPress={() => openUrl(l.url)}
                className="flex-row items-center gap-3 bg-obsidian-surface border border-obsidian-border rounded-card p-4 active:opacity-70"
              >
                <View className="w-11 h-11 rounded-lg items-center justify-center bg-flame/15">
                  <Ionicons name={l.icon as keyof typeof Ionicons.glyphMap} size={20} color="#FF5637" />
                </View>
                <View className="flex-1">
                  <Txt variant="body" weight="semibold">{l.label}</Txt>
                  <Txt variant="caption" tone="muted">{l.sublabel}</Txt>
                </View>
                <Ionicons name="open-outline" size={16} color="#666" />
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Trayectoria / certificaciones */}
        {card.credentials.length ? (
          <View className="px-5 mt-6">
            <Txt variant="label" weight="medium" tone="muted" className="mb-2">TRAYECTORIA & CERTIFICACIONES</Txt>
            <View className="bg-obsidian-surface border border-obsidian-border rounded-card p-4 gap-3">
              {card.credentials.map((c) => (
                <View key={c.id} className="flex-row items-center gap-3">
                  <Ionicons name="ribbon-outline" size={18} color="#FFBA20" />
                  <Txt variant="small" weight="semibold" className="flex-1">{c.title}</Txt>
                  <Txt variant="caption" tone="muted">{c.year}</Txt>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <ShareCardSheet visible={shareOpen} onClose={() => setShareOpen(false)} card={card} />
      <EditCardSheet visible={editOpen} onClose={() => setEditOpen(false)} card={card} />
    </SafeAreaView>
  );
}

function ContactBtn({
  icon, label, onPress, disabled, testID,
}: {
  icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; disabled?: boolean; testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={{ opacity: disabled ? 0.4 : 1 }}
      className="items-center gap-1.5"
    >
      <View className="w-14 h-14 rounded-full items-center justify-center bg-obsidian-surface border border-obsidian-hi active:opacity-70">
        <Ionicons name={icon} size={22} color="#fff" />
      </View>
      <Txt variant="caption" tone="muted">{label}</Txt>
    </Pressable>
  );
}
