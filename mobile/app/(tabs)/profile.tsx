// app/(tabs)/profile.tsx — Perfil cyberpunk
import { useState } from 'react';
import { ScrollView, View, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Txt } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useAuthStore } from '@/stores/auth';
import { labelForRole } from '@/lib/roleLabels';
import { initials } from '@/lib/format';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const hasFullAccess = useAuthStore((s) => s.hasFullTenantAccess());
  const [confirmLogout, setConfirmLogout] = useState(false);

  if (!user) return null;

  return (
    <SafeAreaView className="flex-1 bg-obsidian-void" edges={['top']}>
      <View className="flex-row items-center px-5 pt-4 pb-3 border-b border-obsidian-border">
        <Logo size="sm" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        {/* Avatar + name */}
        <Card>
          <View className="items-center py-4">
            <View className="w-20 h-20 rounded-full items-center justify-center border-2 border-flame bg-obsidian-elevated">
              <Txt variant="title" weight="bold" font="heading" tone="flame">{initials(user.name)}</Txt>
            </View>
            <Txt variant="heading" weight="bold" font="heading" className="mt-3">{user.name}</Txt>
            <Txt variant="small" tone="muted" className="mt-1">{user.email}</Txt>
            <View className="flex-row gap-2 mt-4">
              <Badge label={labelForRole(user.tenant_role).toUpperCase()} tone="muted" />
              {hasFullAccess
                ? <Badge label="ACCESO TOTAL" tone="magenta" />
                : <Badge label="SOLO LO TUYO" tone="flame" />}
            </View>
          </View>
        </Card>

        {/* Cuenta */}
        <View className="gap-2">
          <Txt variant="label" weight="medium" tone="muted" className="ml-1">CUENTA</Txt>
          <Card padded={false}>
            <LinkRow icon="card-outline" label="Mi Tarjeta Virtual" onPress={() => router.push('/(tabs)/tarjeta')} />
            <Divider />
            <Row icon="globe-outline" label="Idioma" value={user.locale} />
            <Divider />
            <Row icon="time-outline" label="Zona horaria" value={user.timezone} />
            <Divider />
            <Row icon="finger-print-outline" label="ID" value={user.id.slice(0, 8) + '…'} />
          </Card>
        </View>

        {/* Notificaciones */}
        <View className="gap-2">
          <Txt variant="label" weight="medium" tone="muted" className="ml-1">NOTIFICACIONES</Txt>
          <Card>
            <View className="flex-row items-center gap-3">
              <View className="w-11 h-11 rounded-lg items-center justify-center bg-magenta/15">
                <Ionicons name="notifications-outline" size={22} color="#FF45A1" />
              </View>
              <View className="flex-1">
                <Txt variant="body" weight="semibold">Alertas push</Txt>
                <Txt variant="caption" tone="muted">Leads, mensajes y recordatorios</Txt>
              </View>
              <Badge label="PENDIENTE" tone="amber" />
            </View>
            <Txt variant="caption" tone="muted" className="mt-3">
              Se activan cuando el equipo de plataforma habilite el endpoint de registro de dispositivo.
            </Txt>
          </Card>
        </View>

        {/* Legales */}
        <View className="gap-2">
          <Txt variant="label" weight="medium" tone="muted" className="ml-1">LEGAL</Txt>
          <Card padded={false}>
            <LinkRow icon="document-text-outline" label="Términos y condiciones" onPress={() => Linking.openURL('https://cavernicolapp.com/terminos')} />
            <Divider />
            <LinkRow icon="shield-checkmark-outline" label="Aviso de privacidad" onPress={() => Linking.openURL('https://cavernicolapp.com/privacidad')} />
            <Divider />
            <LinkRow icon="help-circle-outline" label="Contacto y soporte" onPress={() => Linking.openURL('mailto:contacto@cavernicolacreativo.com')} />
          </Card>
        </View>

        <Button
          testID="profile-logout-button"
          label="CERRAR SESIÓN"
          variant="outline"
          onPress={() => setConfirmLogout(true)}
          size="lg"
          fullWidth
          icon={<Ionicons name="log-out-outline" size={16} color="#FF5637" />}
        />

        <View className="items-center py-4">
          <Txt variant="caption" tone="muted">CavernicolApp Mobile · v0.1.0</Txt>
          <Txt variant="caption" tone="muted">© Dragon Technologies S.A.P.I. de C.V.</Txt>
        </View>
      </ScrollView>

      <BottomSheet visible={confirmLogout} onClose={() => setConfirmLogout(false)} title="Cerrar sesión" testID="logout-confirm-sheet">
        <View className="px-5 pt-4">
          <Txt variant="body" tone="muted">¿Seguro que quieres salir de tu cuenta?</Txt>
          <Pressable
            testID="logout-confirm-button"
            onPress={() => { setConfirmLogout(false); logout(); }}
            className="mt-5 py-4 rounded-lg items-center bg-flame active:opacity-80"
          >
            <Txt variant="body" weight="bold" tone="inverse">SALIR</Txt>
          </Pressable>
          <Pressable
            testID="logout-cancel-button"
            onPress={() => setConfirmLogout(false)}
            className="mt-3 py-4 rounded-lg items-center bg-obsidian-surface border border-obsidian-hi active:opacity-70"
          >
            <Txt variant="body" weight="semibold">Cancelar</Txt>
          </Pressable>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

function Row({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3.5">
      <Ionicons name={icon} size={18} color="#A0A0A0" />
      <Txt variant="body" className="flex-1" tone="muted">{label}</Txt>
      <Txt variant="small" weight="semibold">{value}</Txt>
    </View>
  );
}

function LinkRow({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 px-4 py-3.5 active:bg-obsidian-elevated">
      <Ionicons name={icon} size={18} color="#A0A0A0" />
      <Txt variant="body" className="flex-1">{label}</Txt>
      <Ionicons name="chevron-forward" size={16} color="#666" />
    </Pressable>
  );
}

function Divider() {
  return <View className="h-px bg-obsidian-border ml-11" />;
}
