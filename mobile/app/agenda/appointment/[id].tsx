// app/agenda/appointment/[id].tsx — detalle de cita
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Txt } from '@/components/ui/Text';
import { Card, PressableCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorView } from '@/components/ui/ErrorView';
import { useAppointment, useUpdateAppointment } from '@/hooks/useAgenda';
import { formatDateTime, formatRelativeDay, formatTime } from '@/lib/format';
import type { AppointmentStatus } from '@/types';

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: 'Agendada',
  confirmed: 'Confirmada',
  in_progress: 'En curso',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
};

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const query = useAppointment(id);
  const update = useUpdateAppointment();

  if (query.isLoading) return <LoadingScreen />;
  if (query.isError || !query.data) return <ErrorView onRetry={() => query.refetch()} />;

  const appt = query.data;

  function changeStatus(status: AppointmentStatus) {
    Alert.alert('Actualizar cita', `¿Marcar como "${STATUS_LABEL[status]}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí',
        onPress: () => update.mutate({ id: appt.id, patch: { status } }),
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-obsidian-void" edges={['top']}>
      <View className="flex-row items-center px-3 py-2 bg-white border-b border-obsidian-border">
        <Pressable testID="appt-back" onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Txt variant="heading" weight="bold" className="flex-1 ml-2">Cita</Txt>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Hero: fecha y hora */}
        <Card>
          <View className="items-center py-3">
            <Ionicons name="calendar" size={36} color="#FF45A1" />
            <Txt variant="heading" weight="bold" className="mt-2">
              {formatRelativeDay(appt.starts_at)}
            </Txt>
            <Txt variant="small" tone="muted">
              {formatTime(appt.starts_at)} – {formatTime(appt.ends_at)}
            </Txt>
            <View className="mt-2">
              <Badge label={STATUS_LABEL[appt.status]} tone={appt.status === 'completed' ? 'success' : appt.status === 'cancelled' ? 'muted' : 'brand'} />
            </View>
          </View>
        </Card>

        {/* Contacto */}
        {appt.contact_name ? (
          <View className="gap-2">
            <Txt variant="small" weight="semibold" tone="muted" className="uppercase tracking-wider">Cliente</Txt>
            <Card>
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-magenta items-center justify-center">
                  <Ionicons name="person" size={20} color="#fff" />
                </View>
                <View className="flex-1">
                  <Txt variant="body" weight="semibold">{appt.contact_name}</Txt>
                </View>
              </View>
            </Card>
          </View>
        ) : null}

        {/* Servicio */}
        <View className="gap-2">
          <Txt variant="small" weight="semibold" tone="muted" className="uppercase tracking-wider">Detalles</Txt>
          <Card padded={false}>
            <Row icon="cut-outline" label="Servicio" value={appt.service_name ?? '—'} />
            <Divider />
            <Row icon="person-outline" label="Recurso" value={appt.resource_name ?? '—'} />
            <Divider />
            <Row icon="pricetag-outline" label="Precio" value={appt.price ? `$${appt.price.toFixed(2)} ${appt.currency}` : '—'} />
            <Divider />
            <Row icon="wallet-outline" label="Anticipo" value={appt.deposit_paid ? 'Pagado' : 'Pendiente'} />
          </Card>
        </View>

        {appt.notes ? (
          <View className="gap-2">
            <Txt variant="small" weight="semibold" tone="muted" className="uppercase tracking-wider">Notas</Txt>
            <Card>
              <Txt variant="body">{appt.notes}</Txt>
            </Card>
          </View>
        ) : null}

        {/* Acciones */}
        <View className="gap-2">
          <Txt variant="small" weight="semibold" tone="muted" className="uppercase tracking-wider">Acciones</Txt>
          <View className="flex-row gap-2 flex-wrap">
            {appt.status === 'scheduled' ? (
              <Button testID="appt-confirm" label="Confirmar" variant="primary" onPress={() => changeStatus('confirmed')} />
            ) : null}
            {['scheduled', 'confirmed'].includes(appt.status) ? (
              <Button testID="appt-start" label="Iniciar" variant="secondary" onPress={() => changeStatus('in_progress')} />
            ) : null}
            {appt.status === 'in_progress' ? (
              <Button testID="appt-complete" label="Completar" variant="primary" onPress={() => changeStatus('completed')} />
            ) : null}
            {!['completed', 'cancelled'].includes(appt.status) ? (
              <>
                <Button testID="appt-noshow" label="No asistió" variant="outline" onPress={() => changeStatus('no_show')} />
                <Button testID="appt-cancel" label="Cancelar" variant="danger" onPress={() => changeStatus('cancelled')} />
              </>
            ) : null}
          </View>
        </View>

        <View className="pb-8">
          <Txt variant="caption" tone="muted" className="text-center">
            Creada {formatDateTime(appt.created_at)}
          </Txt>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <Ionicons name={icon} size={18} color="#A0A0A0" />
      <Txt variant="body" className="flex-1" tone="muted">{label}</Txt>
      <Txt variant="body" weight="semibold">{value}</Txt>
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-brand-border ml-11" />;
}
