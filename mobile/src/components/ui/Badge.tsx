// src/components/ui/Badge.tsx — Cyberpunk chips uppercase Geist
import { View } from 'react-native';
import { Txt } from './Text';

type Tone = 'default' | 'brand' | 'flame' | 'magenta' | 'amber' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

interface Cfg { bg: string; textTone: 'default' | 'brand' | 'flame' | 'magenta' | 'amber' | 'success' | 'warning' | 'danger' | 'inverse' | 'muted'; }

const toneCfg: Record<Tone, Cfg> = {
  default:  { bg: 'bg-obsidian-surface border border-obsidian-border', textTone: 'muted' },
  brand:    { bg: 'bg-magenta/15 border border-magenta/40', textTone: 'magenta' },
  flame:    { bg: 'bg-flame/15 border border-flame/40', textTone: 'flame' },
  magenta:  { bg: 'bg-magenta/15 border border-magenta/40', textTone: 'magenta' },
  amber:    { bg: 'bg-amber/15 border border-amber/40', textTone: 'amber' },
  success:  { bg: 'bg-emerald-500/15 border border-emerald-500/40', textTone: 'success' },
  warning:  { bg: 'bg-amber/15 border border-amber/40', textTone: 'amber' },
  danger:   { bg: 'bg-flame/20 border border-flame/40', textTone: 'flame' },
  info:     { bg: 'bg-blue-500/15 border border-blue-500/40', textTone: 'default' },
  muted:    { bg: 'bg-obsidian-elevated border border-obsidian-hi', textTone: 'muted' },
};

export function Badge({ label, tone = 'default', dot }: { label: string; tone?: Tone; dot?: boolean }) {
  const t = toneCfg[tone];
  return (
    <View className={`flex-row items-center gap-1 px-2 py-1 rounded ${t.bg}`}>
      {dot ? <View className="w-1.5 h-1.5 rounded-full bg-current" /> : null}
      <Txt variant="label" weight="medium" tone={t.textTone as 'default'}>
        {label}
      </Txt>
    </View>
  );
}
