// src/components/agenda/NewAppointmentSheet.tsx
// Formulario real "Nueva Cita" — bottom-sheet Cyberpunk.
// Campos: Cliente/Lead (typeahead) · Servicio · Fecha · Slot de horario · Recurso (opcional) · Notas.
// Toda la data es mock (MOCK_MODE) con contrato idéntico al backend real (BACKEND_MOBILE_SPEC.md).
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { addDays, format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Txt } from '@/components/ui/Text';
import { listLeads } from '@/api/crm';
import { useAgendaResources, useAgendaServices, useAvailability, useCreateAppointment } from '@/hooks/useAgenda';
import { useAuthStore } from '@/stores/auth';
import { formatTime } from '@/lib/format';
import type { AvailabilitySlot, Lead } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const DAYS = Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i));

export function NewAppointmentSheet({ visible, onClose, onCreated }: Props) {
  const user = useAuthStore((s) => s.user);
  const assignedTo = useAuthStore((s) => s.assignedToFilter());

  const servicesQ = useAgendaServices();
  const resourcesQ = useAgendaResources();
  const createMut = useCreateAppointment();

  const [leadQuery, setLeadQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(startOfDay(new Date()));
  const [slot, setSlot] = useState<AvailabilitySlot | null>(null);
  const [resourceId, setResourceId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const dateStr = format(date, 'yyyy-MM-dd');

  const leadsQ = useQuery({
    queryKey: ['lead-search', leadQuery, assignedTo],
    queryFn: () => listLeads({ q: leadQuery, assigned_to: assignedTo, limit: 6 }),
    enabled: visible && !selectedLead && leadQuery.trim().length >= 2,
    staleTime: 15_000,
  });

  const availabilityQ = useAvailability(
    { date: dateStr, service_id: serviceId ?? undefined, resource_id: resourceId ?? undefined },
    visible && !!serviceId,
  );

  const services = servicesQ.data?.items ?? [];
  const resources = resourcesQ.data?.items ?? [];

  // Reset del slot cuando cambia servicio / fecha / recurso (deja de ser válido)
  useEffect(() => { setSlot(null); }, [serviceId, dateStr, resourceId]);

  // Reset total al cerrar
  useEffect(() => {
    if (!visible) {
      setLeadQuery(''); setSelectedLead(null); setServiceId(null);
      setDate(startOfDay(new Date())); setSlot(null); setResourceId(null); setNotes('');
    }
  }, [visible]);

  const slotsByHour = useMemo(() => {
    const groups: { hour: string; slots: AvailabilitySlot[] }[] = [];
    const map = new Map<string, AvailabilitySlot[]>();
    (availabilityQ.data?.slots ?? []).forEach((s) => {
      const hour = `${formatTime(s.start).slice(0, 2)}:00`;
      if (!map.has(hour)) { map.set(hour, []); groups.push({ hour, slots: map.get(hour)! }); }
      map.get(hour)!.push(s);
    });
    return groups;
  }, [availabilityQ.data]);

  const canCreate = !!selectedLead && !!serviceId && !!slot && !createMut.isPending;

  async function handleCreate() {
    if (!selectedLead || !serviceId || !slot) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await createMut.mutateAsync({
      crm_lead_id: selectedLead.id,
      contact_id: selectedLead.contact_id,
      contact_name: selectedLead.display_name,
      service_id: serviceId,
      resource_id: resourceId,
      starts_at: slot.start,
      ends_at: slot.end,
      notes: notes.trim() || null,
      assigned_to_user_id: user?.id ?? null,
    });
    onCreated();
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Nueva Cita" testID="new-appointment-sheet">
      <ScrollView
        style={{ maxHeight: 520 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 8 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Cliente / Lead */}
        <SectionLabel step="1" text="CLIENTE / LEAD" />
        {selectedLead ? (
          <Pressable
            testID="new-appt-selected-lead"
            onPress={() => { setSelectedLead(null); setLeadQuery(''); }}
            className="flex-row items-center justify-between bg-magenta/10 border border-magenta/40 rounded-lg px-3 py-3 mb-1"
          >
            <View className="flex-1">
              <Txt variant="body" weight="semibold" numberOfLines={1}>{selectedLead.display_name ?? 'Sin nombre'}</Txt>
              {selectedLead.primary_phone ? (
                <Txt variant="caption" tone="muted">{selectedLead.primary_phone}</Txt>
              ) : null}
            </View>
            <Ionicons name="close-circle" size={20} color="#FF45A1" />
          </Pressable>
        ) : (
          <>
            <View className="flex-row items-center bg-obsidian-surface border border-obsidian-hi rounded-lg px-3">
              <Ionicons name="search-outline" size={18} color="#A0A0A0" />
              <TextInput
                testID="new-appt-lead-search"
                value={leadQuery}
                onChangeText={setLeadQuery}
                placeholder="Buscar cliente o lead…"
                placeholderTextColor="#666666"
                selectionColor="#FF45A1"
                autoCapitalize="none"
                className="flex-1 py-3 ml-2 text-white text-base"
                style={{ fontFamily: 'Inter_400Regular' }}
              />
              {leadsQ.isFetching ? <ActivityIndicator size="small" color="#FF45A1" /> : null}
            </View>
            {leadQuery.trim().length >= 2 ? (
              <View className="mt-2 bg-obsidian-surface border border-obsidian-border rounded-lg overflow-hidden">
                {(leadsQ.data?.items ?? []).length === 0 && !leadsQ.isFetching ? (
                  <Txt variant="caption" tone="muted" className="p-3">Sin resultados</Txt>
                ) : (
                  (leadsQ.data?.items ?? []).map((lead) => (
                    <Pressable
                      key={lead.id}
                      testID={`new-appt-lead-option-${lead.id}`}
                      onPress={() => { Haptics.selectionAsync().catch(() => {}); setSelectedLead(lead); }}
                      className="flex-row items-center gap-3 px-3 py-2.5 border-b border-obsidian-border active:bg-magenta/10"
                    >
                      <View className="w-8 h-8 rounded-full bg-magenta/15 items-center justify-center">
                        <Ionicons name="person-outline" size={15} color="#FF45A1" />
                      </View>
                      <View className="flex-1">
                        <Txt variant="small" weight="semibold" numberOfLines={1}>{lead.display_name ?? 'Sin nombre'}</Txt>
                        <Txt variant="caption" tone="muted" numberOfLines={1}>
                          {lead.primary_phone ?? lead.primary_email ?? lead.source_name ?? '—'}
                        </Txt>
                      </View>
                    </Pressable>
                  ))
                )}
              </View>
            ) : (
              <Txt variant="caption" tone="muted" className="mt-1.5">Escribe al menos 2 letras para buscar.</Txt>
            )}
          </>
        )}

        {/* 2. Servicio */}
        <SectionLabel step="2" text="SERVICIO" className="mt-6" />
        {servicesQ.isLoading ? (
          <ActivityIndicator size="small" color="#FF45A1" className="self-start" />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
          >
            {services.map((svc) => {
              const active = serviceId === svc.id;
              return (
                <Pressable
                  key={svc.id}
                  testID={`new-appt-service-${svc.id}`}
                  onPress={() => { Haptics.selectionAsync().catch(() => {}); setServiceId(svc.id); }}
                  style={{ flexShrink: 0 }}
                  className={`px-4 py-2.5 rounded-lg border ${active ? 'border-flame bg-flame/10' : 'border-obsidian-hi bg-obsidian-surface'}`}
                >
                  <Txt variant="small" weight="semibold" tone={active ? 'flame' : 'default'}>{svc.name}</Txt>
                  <Txt variant="caption" tone="muted">{svc.duration_minutes} min · ${svc.price}</Txt>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* 3. Fecha */}
        <SectionLabel step="3" text="FECHA" className="mt-6" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
        >
          {DAYS.map((d) => {
            const active = format(d, 'yyyy-MM-dd') === dateStr;
            if (active) {
              return (
                <Pressable key={d.toISOString()} testID={`new-appt-date-${format(d, 'yyyy-MM-dd')}`} onPress={() => setDate(d)} style={{ flexShrink: 0 }}>
                  <LinearGradient colors={['#FF5637', '#FF45A1']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ borderRadius: 12 }} className="w-14 py-2.5 items-center">
                    <Txt variant="label" weight="medium" tone="inverse">{format(d, 'EEE', { locale: es }).toUpperCase().slice(0, 3)}</Txt>
                    <Txt variant="heading" weight="bold" font="heading" tone="inverse">{format(d, 'd')}</Txt>
                  </LinearGradient>
                </Pressable>
              );
            }
            return (
              <Pressable
                key={d.toISOString()}
                testID={`new-appt-date-${format(d, 'yyyy-MM-dd')}`}
                onPress={() => { Haptics.selectionAsync().catch(() => {}); setDate(d); }}
                style={{ flexShrink: 0 }}
                className="w-14 py-2.5 rounded-lg items-center bg-obsidian-surface border border-obsidian-hi"
              >
                <Txt variant="label" tone="muted">{format(d, 'EEE', { locale: es }).toUpperCase().slice(0, 3)}</Txt>
                <Txt variant="heading" weight="bold" font="heading">{format(d, 'd')}</Txt>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 4. Slot de horario */}
        <SectionLabel step="4" text="HORARIO DISPONIBLE" className="mt-6" />
        {!serviceId ? (
          <Txt variant="caption" tone="muted">Elige un servicio para ver la disponibilidad.</Txt>
        ) : availabilityQ.isLoading ? (
          <ActivityIndicator size="small" color="#FF45A1" className="self-start" />
        ) : slotsByHour.length === 0 ? (
          <Txt variant="caption" tone="muted">Sin horarios este día.</Txt>
        ) : (
          <View testID="new-appt-slot-grid" className="gap-3">
            {slotsByHour.map((group) => (
              <View key={group.hour} className="flex-row">
                <View className="w-12 pt-2">
                  <Txt variant="label" tone="muted">{group.hour}</Txt>
                </View>
                <View className="flex-1 flex-row flex-wrap gap-2">
                  {group.slots.map((s) => {
                    const selected = slot?.start === s.start;
                    return (
                      <Pressable
                        key={s.start}
                        testID={`new-appt-slot-${formatTime(s.start)}`}
                        disabled={!s.available}
                        onPress={() => { Haptics.selectionAsync().catch(() => {}); setSlot(s); }}
                        className={`px-3.5 py-2 rounded-lg border ${
                          selected ? 'border-magenta bg-magenta/15'
                          : s.available ? 'border-obsidian-hi bg-obsidian-surface'
                          : 'border-obsidian-border bg-obsidian-void opacity-40'
                        }`}
                      >
                        <Txt variant="small" weight={selected ? 'bold' : 'medium'} tone={selected ? 'magenta' : s.available ? 'default' : 'muted'}>
                          {formatTime(s.start)}
                        </Txt>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 5. Recurso (opcional) */}
        <SectionLabel step="5" text="RECURSO (OPCIONAL)" className="mt-6" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
        >
          <Pressable
            testID="new-appt-resource-any"
            onPress={() => { Haptics.selectionAsync().catch(() => {}); setResourceId(null); }}
            style={{ flexShrink: 0 }}
            className={`px-4 py-2.5 rounded-lg border ${resourceId === null ? 'border-flame bg-flame/10' : 'border-obsidian-hi bg-obsidian-surface'}`}
          >
            <Txt variant="small" weight="semibold" tone={resourceId === null ? 'flame' : 'default'}>Cualquiera</Txt>
          </Pressable>
          {resources.map((res) => {
            const active = resourceId === res.id;
            return (
              <Pressable
                key={res.id}
                testID={`new-appt-resource-${res.id}`}
                onPress={() => { Haptics.selectionAsync().catch(() => {}); setResourceId(res.id); }}
                style={{ flexShrink: 0 }}
                className={`px-4 py-2.5 rounded-lg border ${active ? 'border-flame bg-flame/10' : 'border-obsidian-hi bg-obsidian-surface'}`}
              >
                <Txt variant="small" weight="semibold" tone={active ? 'flame' : 'default'}>{res.name}</Txt>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 6. Notas */}
        <SectionLabel step="6" text="NOTAS" className="mt-6" />
        <View className="bg-obsidian-surface border border-obsidian-hi rounded-lg px-3 py-1">
          <TextInput
            testID="new-appt-notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Detalles de la cita, preferencias, alergias…"
            placeholderTextColor="#666666"
            selectionColor="#FF45A1"
            multiline
            numberOfLines={3}
            className="text-white text-base py-2"
            style={{ fontFamily: 'Inter_400Regular', minHeight: 72, textAlignVertical: 'top' }}
          />
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View className="px-5 pt-3">
        <Pressable
          testID="new-appt-submit"
          onPress={handleCreate}
          disabled={!canCreate}
          style={{ opacity: canCreate ? 1 : 0.45 }}
        >
          <LinearGradient
            colors={['#FF5637', '#FF45A1']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ borderRadius: 12 }}
            className="flex-row items-center justify-center gap-2 py-4"
          >
            {createMut.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="calendar" size={18} color="#fff" />
            )}
            <Txt variant="body" weight="bold" tone="inverse" className="tracking-wide">
              {createMut.isPending ? 'CREANDO…' : 'CREAR CITA'}
            </Txt>
          </LinearGradient>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

function SectionLabel({ step, text, className }: { step: string; text: string; className?: string }) {
  return (
    <View className={`flex-row items-center gap-2 mb-2.5 ${className ?? ''}`}>
      <View className="w-5 h-5 rounded-full bg-flame/15 items-center justify-center">
        <Txt variant="label" weight="bold" tone="flame">{step}</Txt>
      </View>
      <Txt variant="label" weight="medium" tone="muted">{text}</Txt>
    </View>
  );
}
