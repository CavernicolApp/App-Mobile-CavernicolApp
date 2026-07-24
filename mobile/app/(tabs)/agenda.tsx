// app/(tabs)/agenda.tsx — Agenda con vistas Día/Semana/Mes/Lista + FAB
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  addDays, addMonths, addWeeks, eachDayOfInterval, endOfMonth, endOfWeek,
  format, getHours, getMinutes, isSameDay, isSameMonth, isToday,
  parseISO, startOfDay, startOfMonth, startOfWeek, subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Txt } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingInline } from '@/components/ui/LoadingScreen';
import { Logo } from '@/components/ui/Logo';
import { useToast } from '@/components/ui/Toast';
import { NewAppointmentSheet } from '@/components/agenda/NewAppointmentSheet';
import { useAppointments } from '@/hooks/useAgenda';
import { useAuthStore } from '@/stores/auth';
import { formatTime } from '@/lib/format';
import type { Appointment, AppointmentStatus } from '@/types';

const STATUS_TONE: Record<AppointmentStatus, 'muted' | 'success' | 'magenta' | 'flame' | 'amber' | 'info'> = {
  scheduled: 'info', confirmed: 'magenta', in_progress: 'amber',
  completed: 'success', cancelled: 'muted', no_show: 'flame',
};
const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: 'AGENDADA', confirmed: 'CONFIRMADA', in_progress: 'EN CURSO',
  completed: 'COMPLETADA', cancelled: 'CANCELADA', no_show: 'NO ASISTIÓ',
};

type ViewMode = 'day' | 'week' | 'month' | 'list';

export default function AgendaScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [view, setView] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [refreshing, setRefreshing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const hasFullAccess = useAuthStore((s) => s.hasFullTenantAccess());

  // Rango de fetch según vista (para no llamar 30 días innecesariamente)
  const { from, to } = useMemo(() => {
    if (view === 'day') {
      return {
        from: format(selectedDate, "yyyy-MM-dd'T'00:00:00"),
        to: format(addDays(selectedDate, 1), "yyyy-MM-dd'T'00:00:00"),
      };
    }
    if (view === 'week') {
      const wStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const wEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return {
        from: format(wStart, "yyyy-MM-dd'T'00:00:00"),
        to: format(addDays(wEnd, 1), "yyyy-MM-dd'T'00:00:00"),
      };
    }
    if (view === 'month') {
      const mStart = startOfMonth(selectedDate);
      const mEnd = endOfMonth(selectedDate);
      return {
        from: format(mStart, "yyyy-MM-dd'T'00:00:00"),
        to: format(addDays(mEnd, 1), "yyyy-MM-dd'T'00:00:00"),
      };
    }
    // list = próximos 14 días
    return {
      from: format(startOfDay(new Date()), "yyyy-MM-dd'T'00:00:00"),
      to: format(addDays(new Date(), 14), "yyyy-MM-dd'T'00:00:00"),
    };
  }, [view, selectedDate]);

  const query = useAppointments({ from, to, limit: 200 });

  async function onRefresh() { setRefreshing(true); await query.refetch(); setRefreshing(false); }

  const items = (query.data?.items ?? []).slice().sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  function handleNewAppointment() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSheetOpen(true);
  }

  async function handleAppointmentCreated() {
    setSheetOpen(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('Cita creada correctamente', 'success');
    await query.refetch();
  }

  return (
    <View className="flex-1 bg-obsidian-void">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Top brand */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-obsidian-border">
          <Logo size="sm" />
          <View className="flex-row items-center gap-2">
            <Pressable testID="agenda-today-btn" onPress={() => setSelectedDate(startOfDay(new Date()))} className="px-3 py-1.5 rounded-pill border border-obsidian-hi bg-obsidian-surface">
              <Txt variant="label" weight="medium">HOY</Txt>
            </Pressable>
            <Pressable testID="agenda-filter-btn" className="w-9 h-9 rounded-full items-center justify-center border border-obsidian-hi bg-obsidian-surface">
              <Ionicons name="options" size={16} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View className="px-5 pt-5 pb-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Txt variant="display" weight="bold" font="heading">Agenda</Txt>
              <Txt variant="body" tone="muted" className="mt-1">
                {view === 'month' ? format(selectedDate, "MMMM yyyy", { locale: es })
                  : view === 'week' ? `Semana del ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'd MMM', { locale: es })}`
                  : format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
              </Txt>
            </View>
            {!hasFullAccess ? <Badge label="MÍAS" tone="magenta" /> : null}
          </View>

          {/* View toggle: Día / Semana / Mes / Lista */}
          <View className="flex-row gap-2 mt-4">
            {(['day', 'week', 'month', 'list'] as ViewMode[]).map((v) => {
              const active = view === v;
              const label = v === 'day' ? 'DÍA' : v === 'week' ? 'SEMANA' : v === 'month' ? 'MES' : 'LISTA';
              return (
                <Pressable
                  key={v}
                  testID={`agenda-view-${v}`}
                  onPress={() => setView(v)}
                  className={`flex-1 py-2 rounded-lg items-center border ${active ? 'border-flame bg-flame/5' : 'border-obsidian-hi bg-obsidian-surface'}`}
                >
                  <Txt variant="label" weight="medium" tone={active ? 'flame' : 'muted'}>{label}</Txt>
                </Pressable>
              );
            })}
          </View>
        </View>

        {query.isLoading ? (
          <LoadingInline />
        ) : (
          <>
            {view === 'day' && <DayView date={selectedDate} items={items} onSelectDate={setSelectedDate} onOpenAppt={(id) => router.push({ pathname: '/agenda/appointment/[id]', params: { id } })} refreshing={refreshing} onRefresh={onRefresh} />}
            {view === 'week' && <WeekView date={selectedDate} items={items} onSelectDate={(d) => { setSelectedDate(d); setView('day'); }} onOpenAppt={(id) => router.push({ pathname: '/agenda/appointment/[id]', params: { id } })} refreshing={refreshing} onRefresh={onRefresh} />}
            {view === 'month' && <MonthView date={selectedDate} items={items} onNavigate={setSelectedDate} onSelectDay={(d) => { setSelectedDate(d); setView('day'); }} />}
            {view === 'list' && <ListView items={items} onOpenAppt={(id) => router.push({ pathname: '/agenda/appointment/[id]', params: { id } })} refreshing={refreshing} onRefresh={onRefresh} />}
          </>
        )}
      </SafeAreaView>

      {/* FAB Nueva Cita */}
      <Pressable
        testID="agenda-fab-new"
        onPress={handleNewAppointment}
        className="absolute bottom-24 right-5"
        style={{ shadowColor: '#FF45A1', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
      >
        <LinearGradient
          colors={['#FF5637', '#FF45A1']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 9999 }}
          className="flex-row items-center gap-2 px-5 py-3.5"
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Txt variant="small" weight="bold" tone="inverse">Nueva Cita</Txt>
        </LinearGradient>
      </Pressable>

      <NewAppointmentSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCreated={handleAppointmentCreated}
      />
    </View>
  );
}

// ============ Vista DÍA (timeline horas) ============
function DayView({ date, items, onSelectDate, onOpenAppt, refreshing, onRefresh }: {
  date: Date; items: Appointment[]; onSelectDate: (d: Date) => void;
  onOpenAppt: (id: string) => void; refreshing: boolean; onRefresh: () => void;
}) {
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i - 2)), []);
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 - 20:00

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 120 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF45A1" />}
    >
      {/* Date strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 16 }}>
        {days.map((d) => {
          const active = isSameDay(d, date);
          if (active) {
            return (
              <Pressable key={d.toISOString()} testID={`agenda-day-${format(d, 'yyyy-MM-dd')}`} onPress={() => onSelectDate(d)}>
                <LinearGradient colors={['#FF5637', '#FF45A1']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ borderRadius: 12 }} className="w-14 py-2.5 items-center">
                  <Txt variant="label" weight="medium" tone="inverse">{format(d, 'EEE', { locale: es }).toUpperCase().slice(0, 3)}</Txt>
                  <Txt variant="heading" weight="bold" font="heading" tone="inverse">{format(d, 'd')}</Txt>
                </LinearGradient>
              </Pressable>
            );
          }
          return (
            <Pressable key={d.toISOString()} testID={`agenda-day-${format(d, 'yyyy-MM-dd')}`} onPress={() => onSelectDate(d)} className="w-14 py-2.5 rounded-lg items-center bg-obsidian-surface border border-obsidian-border">
              <Txt variant="label" tone={isToday(d) ? 'flame' : 'muted'}>{format(d, 'EEE', { locale: es }).toUpperCase().slice(0, 3)}</Txt>
              <Txt variant="heading" weight="bold" font="heading" tone={isToday(d) ? 'flame' : 'default'}>{format(d, 'd')}</Txt>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Timeline */}
      <View className="px-5">
        {hours.map((h) => {
          const hourAppts = items.filter((a) => getHours(parseISO(a.starts_at)) === h);
          return (
            <View key={h} className="flex-row py-2 border-t border-obsidian-border/60 min-h-[60px]">
              <View className="w-14">
                <Txt variant="label" tone="muted">{String(h).padStart(2, '0')}:00</Txt>
              </View>
              <View className="flex-1 gap-2">
                {hourAppts.length === 0 ? (
                  <View className="h-8" />
                ) : (
                  hourAppts.map((a) => (
                    <Pressable key={a.id} testID={`appt-timeline-${a.id}`} onPress={() => onOpenAppt(a.id)}>
                      <View className="bg-magenta/10 border-l-4 border-magenta rounded-lg p-3">
                        <View className="flex-row items-center justify-between">
                          <Txt variant="small" weight="bold">{a.contact_name ?? 'Sin nombre'}</Txt>
                          <Txt variant="label" tone="magenta">{formatTime(a.starts_at)}–{formatTime(a.ends_at)}</Txt>
                        </View>
                        <Txt variant="caption" tone="muted" className="mt-0.5">{a.service_name ?? '—'}</Txt>
                        {a.resource_name ? <Txt variant="caption" tone="muted">{a.resource_name}</Txt> : null}
                      </View>
                    </Pressable>
                  ))
                )}
              </View>
            </View>
          );
        })}
      </View>

      {items.length === 0 ? (
        <View className="items-center py-10">
          <Ionicons name="calendar-clear-outline" size={36} color="#666" />
          <Txt variant="small" tone="muted" className="mt-3">Sin citas este día</Txt>
        </View>
      ) : null}
    </ScrollView>
  );
}

// ============ Vista SEMANA (grid con dots) ============
function WeekView({ date, items, onSelectDate, refreshing, onRefresh }: {
  date: Date; items: Appointment[]; onSelectDate: (d: Date) => void;
  onOpenAppt: (id: string) => void; refreshing: boolean; onRefresh: () => void;
}) {
  const wStart = startOfWeek(date, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(wStart, i));

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF45A1" />}
    >
      <View className="flex-row gap-2">
        {days.map((d) => {
          const dayAppts = items.filter((a) => isSameDay(parseISO(a.starts_at), d));
          const active = isSameDay(d, date);
          const today = isToday(d);
          return (
            <Pressable
              key={d.toISOString()}
              onPress={() => onSelectDate(d)}
              className={`flex-1 py-3 rounded-lg items-center border ${active ? 'border-flame bg-flame/5' : today ? 'border-magenta/40 bg-obsidian-surface' : 'border-obsidian-border bg-obsidian-surface'}`}
            >
              <Txt variant="label" tone={active ? 'flame' : today ? 'magenta' : 'muted'}>
                {format(d, 'EEE', { locale: es }).toUpperCase().slice(0, 3)}
              </Txt>
              <Txt variant="heading" weight="bold" font="heading" tone={active ? 'flame' : 'default'}>
                {format(d, 'd')}
              </Txt>
              {dayAppts.length > 0 ? (
                <View className="flex-row gap-0.5 mt-1">
                  {dayAppts.slice(0, 3).map((_, i) => (
                    <View key={i} className="w-1 h-1 rounded-full bg-magenta" />
                  ))}
                  {dayAppts.length > 3 ? <Txt variant="label" tone="magenta">+</Txt> : null}
                </View>
              ) : (
                <View className="h-2 mt-1" />
              )}
              <Txt variant="label" tone="muted" className="mt-0.5">{dayAppts.length}</Txt>
            </Pressable>
          );
        })}
      </View>

      {/* Summary de la semana */}
      <View className="mt-6">
        <Txt variant="label" weight="medium" tone="muted" className="mb-3">RESUMEN DE LA SEMANA</Txt>
        <Card>
          <View className="flex-row justify-between">
            <MetricPill label="TOTAL" value={String(items.length)} tone="magenta" />
            <MetricPill label="CONFIRMADAS" value={String(items.filter((i) => i.status === 'confirmed').length)} tone="magenta" />
            <MetricPill label="PENDIENTES" value={String(items.filter((i) => i.status === 'scheduled').length)} tone="amber" />
          </View>
        </Card>
      </View>

      {/* Lista de todas las citas */}
      <Txt variant="label" weight="medium" tone="muted" className="mt-6 mb-3">CITAS DE LA SEMANA</Txt>
      <View className="gap-2">
        {items.length === 0 ? (
          <Txt variant="small" tone="muted" className="text-center py-6">Sin citas esta semana</Txt>
        ) : (
          items.map((a) => (
            <Card key={a.id}>
              <View className="flex-row items-center gap-3">
                <View className="w-1 h-10 bg-magenta rounded" />
                <View className="flex-1">
                  <Txt variant="body" weight="semibold" numberOfLines={1}>{a.contact_name ?? '—'}</Txt>
                  <Txt variant="caption" tone="muted">{format(parseISO(a.starts_at), "EEE d · HH:mm", { locale: es })}</Txt>
                </View>
                <Badge label={STATUS_LABEL[a.status as AppointmentStatus]} tone={STATUS_TONE[a.status as AppointmentStatus] as 'magenta'} />
              </View>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

// ============ Vista MES (mini-calendario) ============
function MonthView({ date, items, onNavigate, onSelectDay }: {
  date: Date; items: Appointment[];
  onNavigate: (d: Date) => void; onSelectDay: (d: Date) => void;
}) {
  const mStart = startOfMonth(date);
  const mEnd = endOfMonth(date);
  const gridStart = startOfWeek(mStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(mEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const dayApptCount = (d: Date) => items.filter((a) => isSameDay(parseISO(a.starts_at), d)).length;

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
      {/* Month nav */}
      <View className="flex-row items-center justify-between mb-4">
        <Pressable testID="month-prev" onPress={() => onNavigate(subMonths(date, 1))} className="w-9 h-9 rounded-full items-center justify-center bg-obsidian-surface border border-obsidian-border">
          <Ionicons name="chevron-back" size={16} color="#fff" />
        </Pressable>
        <Txt variant="heading" weight="bold" font="heading">
          {format(date, 'MMMM yyyy', { locale: es })}
        </Txt>
        <Pressable testID="month-next" onPress={() => onNavigate(addMonths(date, 1))} className="w-9 h-9 rounded-full items-center justify-center bg-obsidian-surface border border-obsidian-border">
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </Pressable>
      </View>

      {/* Weekday header */}
      <View className="flex-row mb-2">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <View key={i} className="flex-1 items-center">
            <Txt variant="label" tone="muted">{d}</Txt>
          </View>
        ))}
      </View>

      {/* Grid días */}
      <View className="flex-row flex-wrap">
        {days.map((d) => {
          const inMonth = isSameMonth(d, date);
          const today = isToday(d);
          const active = isSameDay(d, date);
          const count = dayApptCount(d);
          return (
            <Pressable
              key={d.toISOString()}
              testID={`month-day-${format(d, 'yyyy-MM-dd')}`}
              onPress={() => onSelectDay(d)}
              style={{ width: `${100 / 7}%` }}
              className="items-center py-2"
            >
              <View className={`w-9 h-9 rounded-full items-center justify-center ${active ? 'bg-flame' : today ? 'border border-magenta' : ''}`}>
                <Txt
                  variant="small"
                  weight={today || active ? 'bold' : 'regular'}
                  tone={active ? 'inverse' : today ? 'magenta' : inMonth ? 'default' : 'muted'}
                >
                  {format(d, 'd')}
                </Txt>
              </View>
              {count > 0 ? <View className="w-1 h-1 rounded-full bg-magenta mt-0.5" /> : <View className="h-1 mt-0.5" />}
            </Pressable>
          );
        })}
      </View>

      {/* Resumen del mes */}
      <View className="mt-6">
        <Txt variant="label" weight="medium" tone="muted" className="mb-3">RESUMEN DEL MES</Txt>
        <Card>
          <View className="flex-row justify-between">
            <MetricPill label="TOTAL" value={String(items.length)} tone="magenta" />
            <MetricPill label="COMPLETADAS" value={String(items.filter((i) => i.status === 'completed').length)} tone="magenta" />
            <MetricPill label="CANCELADAS" value={String(items.filter((i) => i.status === 'cancelled' || i.status === 'no_show').length)} tone="flame" />
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

// ============ Vista LISTA ============
function ListView({ items, onOpenAppt, refreshing, onRefresh }: {
  items: Appointment[]; onOpenAppt: (id: string) => void; refreshing: boolean; onRefresh: () => void;
}) {
  if (items.length === 0) return <EmptyState icon="calendar-outline" title="Sin citas próximas" subtitle="En los próximos 14 días no hay citas." />;

  return (
    <FlatList
      testID="agenda-list"
      data={items}
      keyExtractor={(a) => a.id}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF45A1" />}
      renderItem={({ item }) => (
        <Pressable onPress={() => onOpenAppt(item.id)}>
          <Card>
            <View className="flex-row gap-4">
              <View className="items-center pr-4 border-r border-obsidian-border">
                <Txt variant="heading" weight="bold" font="heading" tone="flame">{formatTime(item.starts_at)}</Txt>
                <Txt variant="label" tone="muted">A {formatTime(item.ends_at)}</Txt>
                <Txt variant="caption" tone="muted" className="mt-1">
                  {format(parseISO(item.starts_at), 'd MMM', { locale: es })}
                </Txt>
              </View>
              <View className="flex-1">
                <View className="flex-row items-start justify-between">
                  <Txt variant="body" weight="bold" numberOfLines={1} className="flex-1">
                    {item.contact_name ?? 'Sin contacto'}
                  </Txt>
                  <Badge label={STATUS_LABEL[item.status as AppointmentStatus]} tone={STATUS_TONE[item.status as AppointmentStatus] as 'magenta'} />
                </View>
                <Txt variant="small" tone="muted" numberOfLines={1} className="mt-1">
                  {item.service_name ?? '—'}
                </Txt>
                {item.resource_name ? (
                  <View className="flex-row items-center gap-1.5 mt-2">
                    <Ionicons name="person-outline" size={12} color="#A0A0A0" />
                    <Txt variant="caption" tone="muted">{item.resource_name}</Txt>
                  </View>
                ) : null}
              </View>
            </View>
          </Card>
        </Pressable>
      )}
    />
  );
}

function MetricPill({ label, value, tone }: { label: string; value: string; tone: 'magenta' | 'flame' | 'amber' }) {
  return (
    <View className="items-center flex-1">
      <Txt variant="display" weight="bold" font="heading" tone={tone}>{value}</Txt>
      <Txt variant="label" tone="muted" className="mt-1">{label}</Txt>
    </View>
  );
}

// Función `getMinutes` sobra pero la dejo por si se usa en futura extensión
void getMinutes;
