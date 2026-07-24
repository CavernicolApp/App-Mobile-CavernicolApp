// app/(auth)/forgot-password.tsx — Forgot cyberpunk
import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Txt } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { requestPost } from '@/api/client';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit() {
    if (!email) return;
    setLoading(true);
    try { await requestPost('/api/auth/forgot-password', { email }); setSent(true); }
    catch { setSent(true); }
    finally { setLoading(false); }
  }

  return (
    <SafeAreaView className="flex-1 bg-obsidian-void">
      <View className="px-6 pt-6">
        <Button label="VOLVER" variant="ghost" size="sm" icon={<Ionicons name="chevron-back" size={16} color="#FF5637" />} onPress={() => router.back()} />
      </View>
      <View className="flex-1 px-6 pt-6">
        <Txt variant="title" weight="bold" font="heading" className="mb-2">Recuperar acceso</Txt>
        {sent ? (
          <>
            <Txt variant="body" tone="muted" className="mb-8">
              Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.
            </Txt>
            <Button label="VOLVER AL INICIO" onPress={() => router.replace('/(auth)/login')} fullWidth size="lg" />
          </>
        ) : (
          <>
            <Txt variant="small" tone="muted" className="mb-8">
              Ingresa el correo con el que registraste tu cuenta.
            </Txt>

            <Input
              testID="forgot-email-input"
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@empresa.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View className="mt-6">
              <Button
                testID="forgot-submit-button"
                label="ENVIAR ENLACE"
                onPress={submit}
                loading={loading}
                disabled={!email}
                size="lg"
                fullWidth
              />
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
