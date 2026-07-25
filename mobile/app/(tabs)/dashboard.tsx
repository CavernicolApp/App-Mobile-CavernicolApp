// app/(tabs)/dashboard.tsx — Inicio (Buenos días · KPIs verticales · Necesita tu atención)
import { ScrollView, View, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Txt } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorView } from '@/components/ui/ErrorView';
import { Badge } from '@/components/ui/Badge';
import { Logo } from '@/components/ui/Logo';
import { useAuthStore } from '@/stores/auth';
import { useCrmStatus } from '@/hooks/useCrm';
import { useInboxStats } from '@/hooks/useInbox';
import { useAgendaStatus } from '@/hooks/useAgenda';
import { useDashboard } from '@/hooks/useDashboard';

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasFullAccess = useAuthStore((s) => s.hasFullTenantAccess());
  const [refreshing, setRefreshing] = useState(false);

  const dashboard = useDashboard();
  const crmStatus = useCrmStatus();
  const inboxStats = useInboxStats();
  const agendaStatus = useAgendaStatus();

  const loading = dashboard.isLoading && crmStatus.isLoading && inboxStats.isLoading && agendaStatus.isLoading;
  const hasErr = dashboard.isError && crmStatus.isError && inboxStats.isError && agendaStatus.isError;

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([dashboard.refetch(), crmStatus.refetch(), inboxStats.refetch(), agendaStatus.refetch()]);
    setRefreshing(false);
  }

  if (loading) return <LoadingScreen />;
  if (hasErr) return <ErrorView onRetry={onRefresh} />;

  const greeting = getGreeting();
  const firstName = user?.name?.split(' ')[0] ?? 'Equipo';

  return (
    <SafeAreaView className="flex-1 bg-obsidian-void" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF45A1" />}
      >
        {/* Top bar: rocket + logo */}
        <View className="flex-row items-center justify-between py-4">
          <View className="w-10 h-10 rounded-full bg-obsidian-surface border border-obsidian-border items-center justify-center">
            <Ionicons name="rocket-outline" size={18} color="#FF45A1" />
          </View>
          <Logo size="md" />
        </View>

        {/* Greeting */}
        <View className="mt-4 mb-2">
          <Txt variant="display" weight="bold" font="heading">
            {greeting}, {firstName}
          </Txt>
          <Txt variant="body" tone="muted" className="mt-1">
            Aquí tienes el resumen de tu ecosistema.
          </Txt>
        </View>

        {/* Chips: Hoy + Nuevo Lead — envueltos en flex-row con self-start para que no se deformen */}
        <View className="flex-row items-center gap-3 mt-4 mb-6">
          <Pressable
            testID="dashboard-hoy-chip"
            className="flex-row items-center gap-2 px-4 py-2.5 rounded-pill border border-obsidian-hi bg-obsidian-surface self-start"
          >
            <Ionicons name="calendar-outline" size={14} color="#fff" />
            <Txt variant="small" weight="semibold">Hoy</Txt>
          </Pressable>
          <Pressable testID="dashboard-new-lead" onPress={() => router.push('/(tabs)/crm')} className="self-start">
            <LinearGradient
              colors={['#FF5637', '#FF45A1']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ borderRadius: 9999 }}
              className="flex-row items-center gap-2 px-4 py-2.5"
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Txt variant="small" weight="bold" tone="inverse">Nuevo Lead</Txt>
            </LinearGradient>
          </Pressable>
        </View>

        {/* KPI cards apiladas verticalmente */}
        <View className="gap-3">
          <KpiCardV2
            testID="kpi-conversations"
            icon="mail"
            iconTone="magenta"
            label="SIN LEER"
            value={inboxStats.data?.unread_total ?? 0}
            trend="+12%"
            onPress={() => router.push('/(tabs)/inbox')}
          />
          <KpiCardV2
            testID="kpi-leads"
            icon="person-add"
            iconTone="flame"
            label="LEADS ACTIVOS"
            value={crmStatus.data?.active_leads ?? 0}
            hint={hasFullAccess ? `${crmStatus.data?.unassigned ?? 0} sin asignar` : undefined}
            onPress={() => router.push('/(tabs)/crm')}
          />
          <KpiCardV2
            testID="kpi-appointments"
            icon="calendar"
            iconTone="amber"
            label="CITAS HOY"
            value={agendaStatus.data?.today_count ?? 0}
            onPress={() => router.push('/(tabs)/agenda')}
          />
          <KpiCardV2
            testID="kpi-tasks"
            icon="checkbox"
            iconTone="default"
            label={hasFullAccess ? 'TAREAS EQUIPO' : 'MIS TAREAS'}
            value={crmStatus.data?.tasks_due_today ?? 0}
            onPress={() => router.push('/(tabs)/crm')}
          />
        </View>

        {/* Necesita tu atención */}
        {dashboard.data?.attention_needed?.length ? (
          <View className="mt-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="warning-outline" size={18} color="#FFBA20" />
              <Txt variant="heading" weight="bold" font="heading">Necesita tu atención</Txt>
            </View>
            <Card className="gap-3">
              {dashboard.data.attention_needed.map((a) => (
                <View key={a.kind} className="flex-row items-start gap-3 py-1">
                  <View className={`w-9 h-9 rounded-lg items-center justify-center ${
                    a.kind === 'unassigned_lead' ? 'bg-flame/15' :
                    a.kind === 'overdue_task' ? 'bg-amber/15' :
                    'bg-magenta/15'
                  }`}>
                    <Ionicons
                      name={
                        a.kind === 'unassigned_lead' ? 'person-add' :
                        a.kind === 'overdue_task' ? 'time' :
                        'chatbox'
                      }
                      size={16}
                      color={a.kind === 'unassigned_lead' ? '#FF5637' : a.kind === 'overdue_task' ? '#FFBA20' : '#FF45A1'}
                    />
                  </View>
                  <View className="flex-1">
                    <Txt variant="small" weight="semibold">
                      <Txt weight="bold">{a.count}</Txt> {a.label}
                    </Txt>
                    <Pressable className="mt-1">
                      <Txt variant="caption" tone="flame" weight="semibold">Revisar</Txt>
                    </Pressable>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        {/* Ingresos por mes (últimos 6 meses) */}
        <View className="mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Txt variant="heading" weight="bold" font="heading">Ingresos por mes</Txt>
            <View className="flex-row items-center gap-1">
              <Ionicons name="trending-up" size={16} color="#22C55E" />
              <Txt variant="label" weight="semibold" tone="muted">MXN</Txt>
            </View>
          </View>
          <Card>
            <RevenueChart series={dashboard.data?.revenue_series ?? []} />
          </Card>
        </View>

        {/* Aviso de scope */}
        <View className="mt-6 flex-row items-center gap-2 px-3 py-2 rounded-lg bg-obsidian-surface border border-obsidian-border">
          <Ionicons name="eye-outline" size={14} color="#A0A0A0" />
          <Txt variant="caption" tone="muted">
            Estás viendo {hasFullAccess ? 'todos los del negocio' : 'los tuyos'}
          </Txt>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function KpiCardV2({
  icon, iconTone, label, value, trend, hint, onPress, testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconTone: 'magenta' | 'flame' | 'amber' | 'default';
  label: string;
  value: number;
  trend?: string;
  hint?: string;
  onPress?: () => void;
  testID?: string;
}) {
  const iconBg = {
    magenta: 'bg-magenta/15',
    flame: 'bg-flame/15',
    amber: 'bg-amber/15',
    default: 'bg-obsidian-elevated',
  }[iconTone];
  const iconColor = {
    magenta: '#FF45A1',
    flame: '#FF5637',
    amber: '#FFBA20',
    default: '#A0A0A0',
  }[iconTone];

  return (
    <Pressable testID={testID} onPress={onPress}>
      <View className="bg-obsidian-surface border border-obsidian-border rounded-card p-4 relative overflow-hidden">
        {/* Glow decorativo tras el KPI */}
        <View className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20" style={{ backgroundColor: iconColor }} />
        <View className="flex-row items-start justify-between">
          <View className={`w-11 h-11 rounded-lg items-center justify-center ${iconBg}`}>
            <Ionicons name={icon} size={22} color={iconColor} />
          </View>
          {trend ? (
            <View className="flex-row items-center gap-1 bg-obsidian-elevated border border-obsidian-hi rounded-full px-2 py-1">
              <Ionicons name="arrow-up" size={10} color="#FF45A1" />
              <Txt variant="label" weight="medium" tone="magenta">{trend}</Txt>
            </View>
          ) : null}
        </View>
        <Txt variant="label" weight="medium" tone="muted" className="mt-4">{label}</Txt>
        <Txt variant="display" weight="bold" font="heading" className="mt-1">{value}</Txt>
        {hint ? <Txt variant="caption" tone="muted" className="mt-1">{hint}</Txt> : null}
      </View>
    </Pressable>
  );
}

function RevenueChart({ series }: { series: Array<{ month: string; total: number }> }) {
  const maxV = Math.max(1, ...series.map((s) => s.total));
  const totalSemester = series.reduce((s, x) => s + x.total, 0);
  const fmt = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`);

  if (!series.length) {
    return <Txt variant="small" tone="muted">Sin datos de ingresos aún.</Txt>;
  }

  return (
    <View>
      <View className="flex-row items-end justify-between h-44 gap-2.5">
        {series.map((b, i) => {
          const isLast = i === series.length - 1;
          const h = Math.max(6, (b.total / maxV) * 150);
          return (
            <View key={`${b.month}-${i}`} className="flex-1 items-center justify-end">
              <Txt variant="label" weight="semibold" tone={isLast ? 'magenta' : 'muted'} className="mb-1">
                {fmt(b.total)}
              </Txt>
              {isLast ? (
                <LinearGradient
                  colors={['#FF5637', '#FF45A1']}
                  start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                  style={{ height: h, width: '100%', borderRadius: 6 }}
                />
              ) : (
                <View style={{ height: h, width: '100%', borderRadius: 6, backgroundColor: '#3A1E2C' }} />
              )}
            </View>
          );
        })}
      </View>
      <View className="flex-row items-center justify-between mt-2 gap-2.5">
        {series.map((b, i) => (
          <Txt key={`${b.month}-lbl-${i}`} variant="label" tone="muted" className="flex-1 text-center">
            {b.month.toUpperCase()}
          </Txt>
        ))}
      </View>
      <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-obsidian-border">
        <Txt variant="small" tone="muted">Total del semestre</Txt>
        <Txt variant="body" weight="bold" font="heading" tone="flame">
          ${totalSemester.toLocaleString('es-MX')} MXN
        </Txt>
      </View>
    </View>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}
