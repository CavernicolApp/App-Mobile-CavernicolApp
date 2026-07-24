// app/(auth)/mfa.tsx — MFA cyberpunk
import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Txt } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth';

export default function MfaScreen() {
  const [code, setCode] = useState('');
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const challengeToken = useAuthStore((s) => s.challengeToken);
  const status = useAuthStore((s) => s.status);

  async function handleVerify() {
    if (!challengeToken || !code) return;
    await login({ email: '', password: '', mfa_token: `${challengeToken}:${code}` });
    const s = useAuthStore.getState();
    if (s.status === 'authenticated') router.replace('/(tabs)/dashboard');
  }

  return (
    <SafeAreaView className="flex-1 bg-obsidian-void">
      <View className="flex-1 px-6 pt-12">
        <Txt variant="title" weight="bold" font="heading" className="mb-2">Verificación en dos pasos</Txt>
        <Txt variant="small" tone="muted" className="mb-8">
          Ingresa el código de 6 dígitos de tu app autenticadora.
        </Txt>

        <Input
          testID="mfa-code-input"
          label="Código"
          value={code}
          onChangeText={setCode}
          placeholder="000 000"
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />

        <View className="mt-6">
          <Button
            testID="mfa-verify-button"
            label="VERIFICAR"
            onPress={handleVerify}
            loading={status === 'checking'}
            disabled={code.length !== 6}
            size="lg"
            fullWidth
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
