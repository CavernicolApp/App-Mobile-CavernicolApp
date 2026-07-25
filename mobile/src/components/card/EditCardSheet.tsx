// src/components/card/EditCardSheet.tsx — Editor de la Tarjeta Virtual
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Txt } from '@/components/ui/Text';
import { useToast } from '@/components/ui/Toast';
import { useCardStore } from '@/stores/card';
import type { CardSocial, VirtualCard } from '@/types';

const SOCIAL_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  instagram: { label: 'Instagram', icon: 'logo-instagram' },
  facebook: { label: 'Facebook', icon: 'logo-facebook' },
  tiktok: { label: 'TikTok', icon: 'logo-tiktok' },
  linkedin: { label: 'LinkedIn', icon: 'logo-linkedin' },
  threads: { label: 'Threads', icon: 'at-outline' },
};

interface Props {
  visible: boolean;
  onClose: () => void;
  card: VirtualCard;
}

export function EditCardSheet({ visible, onClose, card }: Props) {
  const save = useCardStore((s) => s.save);
  const { showToast } = useToast();

  const [name, setName] = useState(card.name);
  const [position, setPosition] = useState(card.position);
  const [company, setCompany] = useState(card.company);
  const [bio, setBio] = useState(card.bio);
  const [phone, setPhone] = useState(card.phone);
  const [email, setEmail] = useState(card.email);
  const [whatsapp, setWhatsapp] = useState(card.whatsapp);
  const [socials, setSocials] = useState<CardSocial[]>(card.socials);
  const [links, setLinks] = useState(card.links);

  useEffect(() => {
    if (visible) {
      setName(card.name); setPosition(card.position); setCompany(card.company);
      setBio(card.bio); setPhone(card.phone); setEmail(card.email); setWhatsapp(card.whatsapp);
      setSocials(card.socials); setLinks(card.links);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function toggleSocial(i: number) {
    Haptics.selectionAsync().catch(() => {});
    setSocials((prev) => prev.map((s, idx) => (idx === i ? { ...s, enabled: !s.enabled } : s)));
  }
  function setSocialUrl(i: number, url: string) {
    setSocials((prev) => prev.map((s, idx) => (idx === i ? { ...s, url } : s)));
  }
  function toggleLink(i: number) {
    Haptics.selectionAsync().catch(() => {});
    setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, enabled: !l.enabled } : l)));
  }

  async function handleSave() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await save({ name, position, company, bio, phone, email, whatsapp, socials, links });
    showToast('Tarjeta actualizada', 'success');
    onClose();
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Editar Tarjeta" testID="edit-card-sheet">
      <ScrollView
        style={{ maxHeight: 520 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 8 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Field label="NOMBRE" value={name} onChange={setName} testID="edit-card-name" />
        <Field label="CARGO" value={position} onChange={setPosition} testID="edit-card-position" />
        <Field label="EMPRESA" value={company} onChange={setCompany} testID="edit-card-company" />
        <Field label="BIO" value={bio} onChange={setBio} testID="edit-card-bio" multiline />
        <Field label="TELÉFONO" value={phone} onChange={setPhone} testID="edit-card-phone" keyboardType="phone-pad" />
        <Field label="EMAIL" value={email} onChange={setEmail} testID="edit-card-email" keyboardType="email-address" />
        <Field label="WHATSAPP" value={whatsapp} onChange={setWhatsapp} testID="edit-card-whatsapp" keyboardType="phone-pad" />

        <Txt variant="label" weight="medium" tone="muted" className="mt-5 mb-2">REDES SOCIALES</Txt>
        {socials.map((s, i) => {
          const meta = SOCIAL_META[s.platform];
          return (
            <View key={s.platform} className="mb-3">
              <Pressable
                testID={`edit-card-social-toggle-${s.platform}`}
                onPress={() => toggleSocial(i)}
                className="flex-row items-center gap-3 py-1"
              >
                <Ionicons name={meta.icon} size={18} color={s.enabled ? '#FF45A1' : '#666'} />
                <Txt variant="small" weight="semibold" tone={s.enabled ? 'default' : 'muted'} className="flex-1">{meta.label}</Txt>
                <Toggle on={s.enabled} />
              </Pressable>
              {s.enabled ? (
                <TextInput
                  testID={`edit-card-social-url-${s.platform}`}
                  value={s.url}
                  onChangeText={(t) => setSocialUrl(i, t)}
                  placeholder={`URL de ${meta.label}`}
                  placeholderTextColor="#666"
                  autoCapitalize="none"
                  selectionColor="#FF45A1"
                  className="bg-obsidian-surface border border-obsidian-hi rounded-lg px-3 py-2.5 mt-1.5 text-white"
                  style={{ fontFamily: 'Inter_400Regular' }}
                />
              ) : null}
            </View>
          );
        })}

        {links.length ? (
          <>
            <Txt variant="label" weight="medium" tone="muted" className="mt-3 mb-2">ENLACES</Txt>
            {links.map((l, i) => (
              <Pressable
                key={l.id}
                testID={`edit-card-link-toggle-${l.id}`}
                onPress={() => toggleLink(i)}
                className="flex-row items-center gap-3 py-2.5"
              >
                <Ionicons name={l.icon as keyof typeof Ionicons.glyphMap} size={18} color={l.enabled ? '#FF5637' : '#666'} />
                <Txt variant="small" weight="semibold" tone={l.enabled ? 'default' : 'muted'} className="flex-1">{l.label}</Txt>
                <Toggle on={l.enabled} />
              </Pressable>
            ))}
          </>
        ) : null}
      </ScrollView>

      <View className="px-5 pt-3">
        <Pressable testID="edit-card-save" onPress={handleSave}>
          <LinearGradient
            colors={['#FF5637', '#FF45A1']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ borderRadius: 12 }}
            className="flex-row items-center justify-center gap-2 py-4"
          >
            <Ionicons name="save-outline" size={18} color="#fff" />
            <Txt variant="body" weight="bold" tone="inverse" className="tracking-wide">GUARDAR CAMBIOS</Txt>
          </LinearGradient>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

function Field({
  label, value, onChange, testID, multiline, keyboardType,
}: {
  label: string; value: string; onChange: (t: string) => void; testID: string;
  multiline?: boolean; keyboardType?: 'default' | 'phone-pad' | 'email-address';
}) {
  return (
    <View className="mb-3.5">
      <Txt variant="label" weight="medium" tone="muted" className="mb-1.5">{label}</Txt>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        placeholderTextColor="#666"
        selectionColor="#FF45A1"
        className="bg-obsidian-surface border border-obsidian-hi rounded-lg px-3 py-3 text-white text-base"
        style={{ fontFamily: 'Inter_400Regular', minHeight: multiline ? 80 : undefined, textAlignVertical: multiline ? 'top' : 'center' }}
      />
    </View>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <View className={`w-11 h-6 rounded-full justify-center px-0.5 ${on ? 'bg-flame' : 'bg-obsidian-hi'}`}>
      <View className={`w-5 h-5 rounded-full bg-white ${on ? 'self-end' : 'self-start'}`} />
    </View>
  );
}
