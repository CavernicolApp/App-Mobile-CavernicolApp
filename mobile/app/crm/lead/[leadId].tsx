// app/crm/lead/[leadId].tsx — Lead detail
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Txt } from '@/components/ui/Text';
import { Card, PressableCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorView } from '@/components/ui/ErrorView';
import { useLead } from '@/hooks/useCrm';
import { formatDateTime, formatPhone, timeAgo } from '@/lib/format';

export default function LeadDetailScreen() {
  const { leadId } = useLocalSearchParams<{ leadId: string }>();
  const router = useRouter();
  const query = useLead(leadId);

  if (query.isLoading) return <LoadingScreen />;
  if (query.isError || !query.data) return <ErrorView onRetry={() => query.refetch()} />;

  const lead = query.data;

  const call = () => lead.primary_phone && Linking.openURL(`tel:${lead.primary_phone}`);
  const wa = () => lead.primary_phone && Linking.openURL(`https://wa.me/${lead.primary_phone.replace(/\D/g, '')}`);
  const email = () => lead.primary_email && Linking.openURL(`mailto:${lead.primary_email}`);

  return (
    <SafeAreaView className="flex-1 bg-obsidian-void" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-3 py-2 bg-white border-b border-obsidian-border">
        <Pressable testID="lead-back" onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Txt variant="heading" weight="bold" className="flex-1 ml-2" numberOfLines={1}>
          Lead
        </Txt>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Identidad */}
        <Card>
          <View className="items-center py-2">
            <Avatar name={lead.display_name} size={72} />
            <Txt variant="heading" weight="bold" className="mt-3">{lead.display_name ?? 'Sin nombre'}</Txt>
            {lead.assigned_to_name ? (
              <View className="flex-row items-center gap-1 mt-1">
                <Ionicons name="person" size={12} color="#A0A0A0" />
                <Txt variant="caption" tone="muted">Asignado a {lead.assigned_to_name}</Txt>
              </View>
            ) : (
              <Badge label="Sin asignar" tone="warning" />
            )}
            <View className="flex-row items-center gap-2 mt-2 flex-wrap justify-center">
              {lead.source_type ? <Badge label={lead.source_type} tone="muted" /> : null}
              {lead.campaign_name ? <Badge label={lead.campaign_name} tone="info" /> : null}
              {lead.channel ? <Badge label={lead.channel} tone="brand" /> : null}
            </View>
          </View>

          {/* Acciones rápidas */}
          <View className="flex-row gap-2 mt-4">
            <PressableCard
              testID="lead-action-call"
              onPress={call}
              padded={false}
              className="flex-1 items-center py-3"
            >
              <Ionicons name="call" size={22} color="#3B82F6" />
              <Txt variant="caption" weight="semibold" className="mt-1">Llamar</Txt>
            </PressableCard>
            <PressableCard
              testID="lead-action-whatsapp"
              onPress={wa}
              padded={false}
              className="flex-1 items-center py-3"
            >
              <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
              <Txt variant="caption" weight="semibold" className="mt-1">WhatsApp</Txt>
            </PressableCard>
            <PressableCard
              testID="lead-action-email"
              onPress={email}
              padded={false}
              className="flex-1 items-center py-3"
            >
              <Ionicons name="mail" size={22} color="#FF45A1" />
              <Txt variant="caption" weight="semibold" className="mt-1">Email</Txt>
            </PressableCard>
          </View>
        </Card>

        {/* Contacto */}
        <View className="gap-2">
          <Txt variant="small" weight="semibold" tone="muted" className="uppercase tracking-wider">Contacto</Txt>
          <Card padded={false}>
            <Row icon="call-outline" label="Teléfono" value={formatPhone(lead.primary_phone) || '—'} />
            <Divider />
            <Row icon="mail-outline" label="Email" value={lead.primary_email ?? '—'} />
          </Card>
        </View>

        {/* Estado */}
        <View className="gap-2">
          <Txt variant="small" weight="semibold" tone="muted" className="uppercase tracking-wider">Estado</Txt>
          <Card padded={false}>
            <Row icon="pulse-outline" label="Status" value={lead.status} />
            <Divider />
            <Row icon="flag-outline" label="Etapa" value={lead.stage ?? '—'} />
            <Divider />
            <Row icon="star-outline" label="Score" value={lead.score !== null ? String(lead.score) : '—'} />
          </Card>
        </View>

        {/* Origen */}
        <View className="gap-2">
          <Txt variant="small" weight="semibold" tone="muted" className="uppercase tracking-wider">Origen</Txt>
          <Card padded={false}>
            <Row icon="link-outline" label="Fuente" value={lead.source_name ?? lead.source_type ?? '—'} />
            <Divider />
            <Row icon="megaphone-outline" label="Campaña" value={lead.campaign_name ?? '—'} />
            <Divider />
            <Row icon="git-network-outline" label="Medio" value={lead.medium ?? '—'} />
          </Card>
        </View>

        {/* Timestamps */}
        <View className="gap-2">
          <Txt variant="small" weight="semibold" tone="muted" className="uppercase tracking-wider">Actividad</Txt>
          <Card padded={false}>
            <Row icon="time-outline" label="Creado" value={formatDateTime(lead.created_at)} />
            <Divider />
            <Row icon="refresh-outline" label="Última actividad" value={lead.last_activity_at ? timeAgo(lead.last_activity_at) : '—'} />
            <Divider />
            <Row icon="calendar-outline" label="Próxima acción" value={lead.next_action_at ? formatDateTime(lead.next_action_at) : '—'} />
          </Card>
        </View>

        {/* Notas */}
        {lead.notes ? (
          <View className="gap-2">
            <Txt variant="small" weight="semibold" tone="muted" className="uppercase tracking-wider">Notas</Txt>
            <Card>
              <Txt variant="body">{lead.notes}</Txt>
            </Card>
          </View>
        ) : null}

        <View className="pb-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <Ionicons name={icon} size={18} color="#A0A0A0" />
      <Txt variant="body" className="flex-1" tone="muted">{label}</Txt>
      <Txt variant="body" weight="semibold" className="max-w-[60%]" numberOfLines={1}>{value}</Txt>
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-brand-border ml-11" />;
}
