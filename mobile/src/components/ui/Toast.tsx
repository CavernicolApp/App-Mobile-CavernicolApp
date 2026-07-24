// src/components/ui/Toast.tsx
// Toast global estilo Cyberpunk. Se monta una vez en el root (_layout) vía <ToastProvider>.
// Uso: const { showToast } = useToast(); showToast('Cita creada', 'success');
// Usa la Animated API nativa de RN → funciona en web / Expo Go sin config extra.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Txt } from './Text';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

const CONFIG: Record<ToastType, { icon: keyof typeof Ionicons.glyphMap; color: string; border: string }> = {
  success: { icon: 'checkmark-circle', color: '#22C55E', border: 'border-state-success/50' },
  error: { icon: 'alert-circle', color: '#FF5637', border: 'border-flame/50' },
  info: { icon: 'information-circle', color: '#FF45A1', border: 'border-magenta/50' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  const hide = useCallback(() => {
    Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [anim]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    anim.setValue(0);
    setToast({ id: Date.now(), message, type });
  }, [anim]);

  useEffect(() => {
    if (!toast) return;
    Animated.timing(anim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    timer.current = setTimeout(hide, 3200);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [toast, anim, hide]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', top: insets.top + 10, left: 0, right: 0, alignItems: 'center', zIndex: 9999 }}
        >
          <Animated.View
            testID="app-toast"
            style={{
              opacity: anim,
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
            }}
          >
            <View
              className={`flex-row items-center gap-2.5 px-4 py-3 rounded-pill bg-obsidian-surface border ${CONFIG[toast.type].border}`}
              style={{
                maxWidth: 340,
                shadowColor: CONFIG[toast.type].color,
                shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
              }}
            >
              <Ionicons name={CONFIG[toast.type].icon} size={18} color={CONFIG[toast.type].color} />
              <Txt variant="small" weight="semibold" className="flex-1" numberOfLines={2}>
                {toast.message}
              </Txt>
            </View>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}
