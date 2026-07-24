// app/index.tsx — splash / redirect según estado
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function Index() {
  const status = useAuthStore((s) => s.status);

  if (status === 'idle' || status === 'checking') {
    return <LoadingScreen message="Cargando…" />;
  }
  if (status === 'authenticated') return <Redirect href="/(tabs)/dashboard" />;
  return <Redirect href="/(auth)/login" />;
}
