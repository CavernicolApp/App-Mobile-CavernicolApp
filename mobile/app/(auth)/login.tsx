// app/(auth)/login.tsx — Login cyberpunk (Stitch design) + biometría (Face ID/Touch ID)
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth';
import { Txt } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { SlideToConfirm } from '@/components/ui/SlideToConfirm';
import { Logo } from '@/components/ui/Logo';
import {
  authenticateWithBiometric,
  disableBiometric,
  enableBiometric,
  getBiometricAvailability,
  isBiometricEnabled,
  type BiometricAvailability,
} from '@/lib/biometric';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [biometric, setBiometric] = useState<BiometricAvailability | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const autoPromptedRef = useRef(false);
  const router = useRouter();

  const login = useAuthStore((s) => s.login);
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);

  const loading = status === 'checking';

  // Detectar biometría disponible + si ya el usuario la activó en un login previo.
  useEffect(() => {
    (async () => {
      const [avail, enabled] = await Promise.all([getBiometricAvailability(), isBiometricEnabled()]);
      setBiometric(avail);
      setBiometricEnabled(enabled);
    })();
  }, []);

  // Ejecuta el flujo biométrico: pide huella/rostro, recupera creds y hace login.
  const handleBiometricLogin = useCallback(async () => {
    if (!biometric?.available || !biometricEnabled || biometricBusy) return;
    setBiometricBusy(true);
    const result = await authenticateWithBiometric(`Inicia sesión con ${biometric.label}`);
    setBiometricBusy(false);

    if (!result.success) {
      if (result.cancelled) return; // silencioso, el usuario canceló
      if (result.error === 'no_credentials') {
        Alert.alert(
          'Biometría desactivada',
          'No encontramos tus credenciales guardadas. Inicia sesión con correo y contraseña para reactivarla.',
        );
        setBiometricEnabled(false);
      }
      return;
    }

    // Rellenamos los inputs (feedback visual) y ejecutamos login
    setEmail(result.email!);
    setPassword(result.password!);
    await login({ email: result.email!, password: result.password! });
    const s = useAuthStore.getState();
    if (s.status === 'mfa_required') router.push('/(auth)/mfa');
    // Si el login falla (creds obsoletas por rotación de password), invalidamos biometría
    if (s.status === 'unauthenticated' && s.error) {
      await disableBiometric();
      setBiometricEnabled(false);
    }
  }, [biometric, biometricEnabled, biometricBusy, login, router]);

  // Auto-prompt biométrico al abrir la pantalla si ya está activo.
  // Solo la primera vez que se monta el componente para no ser invasivo.
  useEffect(() => {
    if (autoPromptedRef.current) return;
    if (biometric?.available && biometricEnabled) {
      autoPromptedRef.current = true;
      // Pequeño delay para que la UI termine de montarse (evita flash del prompt)
      const t = setTimeout(() => { handleBiometricLogin(); }, 350);
      return () => clearTimeout(t);
    }
  }, [biometric, biometricEnabled, handleBiometricLogin]);

  async function handleLogin() {
    if (!email || !password) return;
    await login({ email, password });
    const s = useAuthStore.getState();

    if (s.status === 'mfa_required') {
      router.push('/(auth)/mfa');
      return;
    }

    // Login exitoso → si hay biometría disponible y aún no está activada, ofrecer opt-in
    if (s.status === 'authenticated' && biometric?.available && !biometricEnabled) {
      Alert.alert(
        `Activar ${biometric.label}`,
        `¿Quieres ingresar más rápido la próxima vez usando ${biometric.label}?`,
        [
          { text: 'Ahora no', style: 'cancel' },
          {
            text: 'Activar',
            onPress: async () => {
              const ok = await enableBiometric(email, password);
              if (ok) setBiometricEnabled(true);
            },
          },
        ],
      );
    }
  }

  const showBiometricButton = biometric?.available && biometricEnabled;

  return (
    <View className="flex-1 bg-obsidian-void">
      {/* Radial glow superior magenta */}
      <View className="absolute top-0 left-0 right-0 h-72 items-center justify-center">
        <LinearGradient
          colors={['rgba(255,86,55,0.35)', 'rgba(255,69,161,0.15)', 'rgba(0,0,0,0)']}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={{ width: 400, height: 400, borderRadius: 200 }}
        />
      </View>

      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled">
            {/* Hero con logo centrado (parte superior) */}
            <View className="flex-1 items-center justify-center py-16">
              <Logo size="xl" />
            </View>

            {/* Card form */}
            <View className="bg-obsidian-surface border border-obsidian-border rounded-2xl p-6 mb-6">
              <Input
                testID="login-email-input"
                label="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                leftIcon={<Ionicons name="mail-outline" size={18} color="#A0A0A0" />}
              />

              <View className="flex-row justify-between items-center mt-4 mb-2">
                <Txt variant="label" weight="medium" tone="muted">Contraseña</Txt>
                <Pressable
                  testID="login-forgot-link"
                  onPress={() => router.push('/(auth)/forgot-password')}
                >
                  <Txt variant="caption" tone="flame" weight="semibold">¿Olvidaste?</Txt>
                </Pressable>
              </View>

              <Input
                testID="login-password-input"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                textContentType="password"
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#A0A0A0" />}
                rightIcon={
                  <Pressable onPress={() => setShowPassword(!showPassword)} testID="login-toggle-password">
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#A0A0A0"
                    />
                  </Pressable>
                }
              />

              {error ? (
                <View className="bg-flame/10 border border-flame/30 rounded-lg p-3 mt-4">
                  <Txt variant="small" tone="flame">{error}</Txt>
                </View>
              ) : null}

              {/* Biometría (arriba del slider, solo si está activada) */}
              {showBiometricButton ? (
                <Pressable
                  testID="login-biometric-button"
                  onPress={handleBiometricLogin}
                  disabled={loading || biometricBusy}
                  className="mt-6 flex-row items-center justify-center gap-2 rounded-full border border-flame/40 bg-flame/10 py-4 active:opacity-70"
                  style={{ opacity: loading || biometricBusy ? 0.6 : 1 }}
                >
                  <Ionicons name={biometric!.iconName} size={22} color="#FF5637" />
                  <Txt variant="label" weight="semibold" tone="flame" className="tracking-[2px]">
                    ENTRAR CON {biometric!.label.toUpperCase()}
                  </Txt>
                </Pressable>
              ) : null}

              {/* Separador visual solo si hay botón biométrico */}
              {showBiometricButton ? (
                <View className="flex-row items-center my-5">
                  <View className="flex-1 h-px bg-obsidian-border" />
                  <Txt variant="caption" tone="muted" className="mx-3 tracking-[2px]">O</Txt>
                  <View className="flex-1 h-px bg-obsidian-border" />
                </View>
              ) : (
                <View className="h-6" />
              )}

              <SlideToConfirm
                testID="login-submit-slider"
                label="DESLIZA PARA INGRESAR"
                labelConfirmed="INGRESANDO…"
                onConfirm={handleLogin}
                loading={loading}
                error={error}
                disabled={!email || !password}
                labelPosition="below"
              />
            </View>

            {/* Footer legal */}
            <View className="items-center pb-8">
              <Txt variant="caption" tone="muted" className="text-center">
                Al continuar aceptas los{'\n'}
                <Txt variant="caption" tone="flame" weight="semibold">Términos</Txt>
                {' y el '}
                <Txt variant="caption" tone="flame" weight="semibold">Aviso de Privacidad</Txt>
              </Txt>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
