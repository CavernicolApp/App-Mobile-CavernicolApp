// app/(tabs)/crm.tsx — Gestión de Leads cyberpunk
import { useState } from 'react';
import { FlatList, RefreshControl, View, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Txt } from '@/components/ui/Text';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingInline } from '@/components/ui/LoadingScreen';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Logo } from '@/components/ui/Logo';
import { useLeads, useDeals, useTasks, useCompleteTask } from '@/hooks/useCrm';
import { useAuthStore } from '@/stores/auth';
import { formatCurrency, timeAgo, initials, formatPhone } from '@/lib/format';
import type { Deal, Lead, Task } from '@/types';

type Tab = 'leads' | 'pipeline' | 'tasks';

export default function CrmScreen() {
  const [tab, setTab] = useState<Tab>('leads');
  const [q, setQ] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const hasFullAccess = useAuthStore((s) => s.hasFullTenantAccess());

  return (
    <SafeAreaView className="flex-1 bg-obsidian-void" edges={['top']}>
      {/* Top brand */}
      <View className="flex-row items-center px-5 pt-4 pb-3 border-b border-obsidian-border">
        <Logo size="sm" />
      </View>

      {/* Title */}
      <View className="px-5 pt-6">
        <Txt variant="display" weight="bold" font="heading">Gestión de Leads</Txt>
        <Txt variant="body" tone="muted" className="mt-1">
          Administra y da seguimiento a tus prospectos.
        </Txt>

        {/* Nuevo Lead gradient btn */}
        <Pressable testID="crm-new-lead" className="mt-4">
          <LinearGradient
            colors={['#FF5637', '#FF45A1']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            className="flex-row items-center justify-center gap-2 py-3.5 rounded-lg"
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Txt variant="body" weight="bold" tone="inverse">Nuevo Lead</Txt>
          </LinearGradient>
        </Pressable>

        {/* Search + filtros */}
        <View className="flex-row items-center bg-obsidian-surface border border-obsidian-hi rounded-lg px-4 mt-3">
          <Ionicons name="search" size={18} color="#A0A0A0" />
          <TextInput
            testID="crm-search-input"
            value={q}
            onChangeText={setQ}
            placeholder="Buscar leads por nombre o email..."
            placeholderTextColor="#666"
            selectionColor="#FF45A1"
            className="flex-1 py-3 pl-3 text-white"
            style={{ fontFamily: 'Inter_400Regular', fontSize: 15 }}
          />
        </View>

        <Pressable className="flex-row items-center gap-2 bg-obsidian-surface border border-obsidian-hi rounded-lg py-3 px-4 mt-3">
          <Ionicons name="options" size={16} color="#fff" />
          <Txt variant="small" weight="semibold">Filtros</Txt>
        </Pressable>

        {/* Tabs */}
        <View className="flex-row gap-2 mt-4">
          <TabChip label="LEADS" active={tab === 'leads'} onPress={() => setTab('leads')} testID="crm-tab-leads" />
          <TabChip label="PIPELINE" active={tab === 'pipeline'} onPress={() => setTab('pipeline')} testID="crm-tab-pipeline" />
          <TabChip label="TAREAS" active={tab === 'tasks'} onPress={() => setTab('tasks')} testID="crm-tab-tasks" />
        </View>

        {!hasFullAccess ? (
          <View className="flex-row items-center gap-2 mt-3">
            <Ionicons name="eye-outline" size={12} color="#A0A0A0" />
            <Txt variant="label" tone="muted">Solo tus registros</Txt>
          </View>
        ) : null}
      </View>

      {tab === 'leads' && <LeadsList q={q} refreshing={refreshing} setRefreshing={setRefreshing} />}
      {tab === 'pipeline' && <PipelineList q={q} refreshing={refreshing} setRefreshing={setRefreshing} />}
      {tab === 'tasks' && <TasksList refreshing={refreshing} setRefreshing={setRefreshing} />}
    </SafeAreaView>
  );
}

function TabChip({ label, active, onPress, testID }: { label: string; active: boolean; onPress: () => void; testID?: string }) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      className={`px-4 py-2 rounded-pill border-2 ${active ? 'border-flame bg-flame/5' : 'border-obsidian-hi bg-obsidian-surface'}`}
    >
      <Txt variant="label" weight="medium" tone={active ? 'flame' : 'muted'}>{label}</Txt>
    </Pressable>
  );
}

// ---------------- LEADS ----------------

function LeadsList({ q, refreshing, setRefreshing }: { q: string; refreshing: boolean; setRefreshing: (b: boolean) => void }) {
  const router = useRouter();
  const query = useLeads({ q: q || undefined, status: 'active', limit: 50 });

  async function onRefresh() {
    setRefreshing(true);
    await query.refetch();
    setRefreshing(false);
  }

  if (query.isLoading) return <LoadingInline />;
  const items = query.data?.items ?? [];
  if (items.length === 0) return <EmptyState icon="people-outline" title="Sin leads" subtitle="Cuando llegue un lead nuevo aparecerá aquí." />;

  return (
    <FlatList
      testID="crm-leads-list"
      data={items}
      keyExtractor={(l) => l.id}
      contentContainerStyle={{ padding: 20, gap: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF45A1" />}
      renderItem={({ item }) => <LeadCardV2 lead={item} onPress={() => router.push({ pathname: '/crm/lead/[leadId]', params: { leadId: item.id } })} />}
    />
  );
}

function LeadCardV2({ lead, onPress }: { lead: Lead; onPress: () => void }) {
  const scoreTone: 'flame' | 'amber' | 'muted' = (lead.score ?? 0) > 80 ? 'flame' : (lead.score ?? 0) > 60 ? 'amber' : 'muted';
  const stageBadge = lead.stage === 'nuevo' ? { label: 'NEW', tone: 'amber' as const }
    : lead.stage === 'contactado' ? { label: 'URGENT', tone: 'flame' as const }
    : { label: (lead.stage ?? 'ACTIVE').toUpperCase(), tone: 'magenta' as const };

  return (
    <Pressable testID={`lead-card-${lead.id}`} onPress={onPress}>
      <Card>
        <View className="flex-row items-start gap-3">
          <View className="w-11 h-11 rounded-full items-center justify-center border-2 border-flame bg-obsidian-elevated">
            <Txt variant="body" weight="bold" tone="flame">{initials(lead.display_name)}</Txt>
          </View>
          <View className="flex-1 min-w-0">
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1">
                <Txt variant="body" weight="bold" numberOfLines={1}>{lead.display_name ?? 'Sin nombre'}</Txt>
                <View className="flex-row items-center gap-1 mt-0.5">
                  <View className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  <Txt variant="caption" tone="muted">{lead.source_name ?? lead.source_type ?? '—'}</Txt>
                </View>
              </View>
              <Badge label={stageBadge.label} tone={stageBadge.tone} />
            </View>

            {lead.primary_email ? (
              <View className="flex-row items-center gap-2 mt-3">
                <Ionicons name="mail-outline" size={14} color="#A0A0A0" />
                <Txt variant="small" tone="muted" numberOfLines={1}>{lead.primary_email}</Txt>
              </View>
            ) : null}
            {lead.primary_phone ? (
              <View className="flex-row items-center gap-2 mt-1.5">
                <Ionicons name="call-outline" size={14} color="#A0A0A0" />
                <Txt variant="small" tone="muted">{formatPhone(lead.primary_phone)}</Txt>
              </View>
            ) : null}

            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-obsidian-border">
              <Txt variant="caption" tone="muted">{timeAgo(lead.created_at)}</Txt>
              {lead.score !== null ? (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="flame" size={12} color={scoreTone === 'flame' ? '#FF5637' : scoreTone === 'amber' ? '#FFBA20' : '#A0A0A0'} />
                  <Txt variant="label" weight="bold" tone={scoreTone}>SCORE {lead.score}</Txt>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

// ---------------- PIPELINE ----------------

function PipelineList({ q, refreshing, setRefreshing }: { q: string; refreshing: boolean; setRefreshing: (b: boolean) => void }) {
  const query = useDeals({ q: q || undefined, status: 'open', limit: 100 });

  async function onRefresh() {
    setRefreshing(true);
    await query.refetch();
    setRefreshing(false);
  }

  if (query.isLoading) return <LoadingInline />;
  const items = query.data?.items ?? [];
  if (items.length === 0) return <EmptyState icon="git-branch-outline" title="Sin negocios" subtitle="Al mover un lead al pipeline aparecerá aquí." />;

  const byStage: Record<string, Deal[]> = {};
  items.forEach((d) => { byStage[d.stage_name] = byStage[d.stage_name] ?? []; byStage[d.stage_name].push(d); });

  return (
    <FlatList
      testID="crm-pipeline-list"
      data={Object.entries(byStage)}
      keyExtractor={([stage]) => stage}
      contentContainerStyle={{ padding: 20, gap: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF45A1" />}
      renderItem={({ item: [stage, deals] }) => (
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Txt variant="label" weight="medium" tone="muted">{stage.toUpperCase()}</Txt>
            <Badge label={String(deals.length)} tone="muted" />
          </View>
          {deals.map((d) => (
            <Card key={d.id}>
              <Txt variant="body" weight="semibold" numberOfLines={1}>{d.title}</Txt>
              <View className="flex-row items-center justify-between mt-2">
                <Txt variant="caption" tone="muted">{d.assigned_to_name ?? 'Sin asignar'}</Txt>
                <Txt variant="small" weight="bold" tone="magenta">{formatCurrency(d.amount, d.currency)}</Txt>
              </View>
            </Card>
          ))}
        </View>
      )}
    />
  );
}

// ---------------- TASKS ----------------

function TasksList({ refreshing, setRefreshing }: { refreshing: boolean; setRefreshing: (b: boolean) => void }) {
  const query = useTasks({ status: 'pending', limit: 50 });
  const complete = useCompleteTask();

  async function onRefresh() {
    setRefreshing(true);
    await query.refetch();
    setRefreshing(false);
  }

  if (query.isLoading) return <LoadingInline />;
  const items = query.data?.items ?? [];
  if (items.length === 0) return <EmptyState icon="checkmark-done-outline" title="Todo al día" subtitle="No tienes tareas pendientes." />;

  return (
    <FlatList
      testID="crm-tasks-list"
      data={items}
      keyExtractor={(t) => t.id}
      contentContainerStyle={{ padding: 20, gap: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF45A1" />}
      renderItem={({ item }) => <TaskItem task={item} onDone={() => complete.mutate(item.id)} />}
    />
  );
}

function TaskItem({ task, onDone }: { task: Task; onDone: () => void }) {
  const tone = task.priority === 'high' ? 'flame' : task.priority === 'medium' ? 'amber' : 'muted';
  return (
    <Card>
      <View className="flex-row items-start gap-3">
        <Pressable
          testID={`task-complete-${task.id}`}
          onPress={onDone}
          className="w-6 h-6 rounded-full border-2 border-flame items-center justify-center mt-0.5 active:bg-flame/10"
        >
          <Ionicons name="checkmark" size={14} color="transparent" />
        </Pressable>
        <View className="flex-1">
          <Txt variant="body" weight="semibold">{task.title}</Txt>
          {task.description ? <Txt variant="caption" tone="muted" numberOfLines={2} className="mt-0.5">{task.description}</Txt> : null}
          <View className="flex-row items-center gap-2 mt-2">
            <Badge label={task.priority.toUpperCase()} tone={tone} />
            {task.due_at ? <Txt variant="caption" tone="muted">Vence {timeAgo(task.due_at)}</Txt> : null}
          </View>
        </View>
      </View>
    </Card>
  );
}
