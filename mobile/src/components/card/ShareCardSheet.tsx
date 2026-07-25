// src/components/card/ShareCardSheet.tsx — Compartir Tarjeta Virtual (QR · WhatsApp · Enlace · NFC)
import { Platform, Pressable, Share, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Txt } from '@/components/ui/Text';
import { useToast } from '@/components/ui/Toast';
import type { VirtualCard } from '@/types';

export const cardUrl = (card: VirtualCard) => `https://app.cavernicolapp.com/vcard/${card.slug}`;

interface Props {
  visible: boolean;
  onClose: () => void;
  card: VirtualCard;
}

export function ShareCardSheet({ visible, onClose, card }: Props) {
  const { showToast } = useToast();
  const url = cardUrl(card);

  async function shareWhatsApp() {
    Haptics.selectionAsync().catch(() => {});
    const text = `Hola 👋 Te comparto mi tarjeta digital de ${card.company}: ${url}`;
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
    try {
      await Linking.openURL(wa);
    } catch {
      showToast('No se pudo abrir WhatsApp', 'error');
    }
  }

  async function copyLink() {
    await Clipboard.setStringAsync(url);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('Enlace copiado al portapapeles', 'success');
  }

  async function shareNative() {
    Haptics.selectionAsync().catch(() => {});
    try {
      await Share.share({ message: `Mi tarjeta digital: ${url}`, url });
    } catch {
      /* usuario canceló */
    }
  }

  function shareNfc() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    // El escritura NFC requiere módulo nativo (no disponible en Expo Go / web).
    showToast('NFC se activa en la app instalada (genera un build)', 'info');
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Compartir Tarjeta" testID="share-card-sheet">
      <View className="px-5 pt-4 pb-2 items-center">
        {/* QR */}
        <View className="p-4 rounded-2xl bg-white" testID="share-card-qr">
          <QRCode value={url} size={190} backgroundColor="#ffffff" color="#0A0A0F" />
        </View>
        <Txt variant="small" tone="muted" className="mt-3 text-center">
          Escanea el código para abrir la tarjeta de {card.name.split(' ')[0]}
        </Txt>

        {/* Enlace + copiar */}
        <Pressable
          testID="share-card-copy"
          onPress={copyLink}
          className="flex-row items-center gap-2 mt-4 w-full bg-obsidian-surface border border-obsidian-hi rounded-lg px-3 py-3"
        >
          <Ionicons name="link-outline" size={16} color="#A0A0A0" />
          <Txt variant="small" tone="muted" className="flex-1" numberOfLines={1}>{url}</Txt>
          <Ionicons name="copy-outline" size={16} color="#FF45A1" />
        </Pressable>

        {/* WhatsApp */}
        <Pressable testID="share-card-whatsapp" onPress={shareWhatsApp} className="w-full mt-3">
          <View className="flex-row items-center justify-center gap-2 py-3.5 rounded-lg" style={{ backgroundColor: '#25D366' }}>
            <Ionicons name="logo-whatsapp" size={18} color="#0A0A0F" />
            <Txt variant="body" weight="bold" style={{ color: '#0A0A0F' }}>Compartir por WhatsApp</Txt>
          </View>
        </Pressable>

        {/* NFC (Plus — requiere build) */}
        <Pressable testID="share-card-nfc" onPress={shareNfc} className="w-full mt-3">
          <LinearGradient
            colors={['#FF5637', '#FF45A1']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ borderRadius: 12 }}
            className="flex-row items-center justify-center gap-2 py-3.5"
          >
            <Ionicons name="radio-outline" size={18} color="#fff" />
            <Txt variant="body" weight="bold" tone="inverse">Compartir por NFC</Txt>
            <View className="px-1.5 py-0.5 rounded-full bg-white/25">
              <Txt variant="label" weight="bold" tone="inverse">PLUS</Txt>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Compartir nativo (sistema) */}
        {Platform.OS !== 'web' ? (
          <Pressable
            testID="share-card-native"
            onPress={shareNative}
            className="flex-row items-center justify-center gap-2 mt-3 w-full py-3 rounded-lg bg-obsidian-surface border border-obsidian-hi active:opacity-70"
          >
            <Ionicons name="share-social-outline" size={16} color="#fff" />
            <Txt variant="small" weight="semibold">Más opciones…</Txt>
          </Pressable>
        ) : null}
      </View>
    </BottomSheet>
  );
}
