// src/components/ui/SlideToConfirm.tsx
// Slider "desliza para confirmar" — reemplaza el botón primary cuando queremos gesto elegante.
// Usa PanResponder nativo de RN (funciona en iOS/Android/web sin reanimated).

import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, PanResponder, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Txt } from './Text';

interface SlideToConfirmProps {
  label?: string;
  labelConfirmed?: string;
  onConfirm: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Cuando cambia a truthy (ej: error de login), el slider se resetea al inicio */
  error?: string | null;
  testID?: string;
  /** Ancho total del track. Si no se pasa, ocupa 100% del padre (medido en layout). */
  trackWidth?: number;
  /** Posición del label: 'inside' (default legacy) o 'below' (nueva UX) */
  labelPosition?: 'inside' | 'below';
}

const TRACK_HEIGHT = 60;
const THUMB_SIZE = 52;
const THUMB_MARGIN = (TRACK_HEIGHT - THUMB_SIZE) / 2;
const CONFIRM_THRESHOLD = 0.85; // 85% del track para confirmar

export function SlideToConfirm({
  label = 'DESLIZA PARA INGRESAR',
  labelConfirmed = 'INGRESANDO…',
  onConfirm,
  disabled,
  loading,
  error,
  testID,
  trackWidth,
  labelPosition = 'below',
}: SlideToConfirmProps) {
  const [width, setWidth] = useState(trackWidth ?? 0);
  const translateX = useRef(new Animated.Value(0)).current;
  const [confirmed, setConfirmed] = useState(false);

  const maxTranslate = Math.max(0, width - THUMB_SIZE - THUMB_MARGIN * 2);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled && !loading && !confirmed,
      onMoveShouldSetPanResponder: () => !disabled && !loading && !confirmed,
      onPanResponderGrant: () => {
        Haptics.selectionAsync().catch(() => {});
      },
      onPanResponderMove: (_, gesture) => {
        if (disabled || loading || confirmed) return;
        const x = Math.max(0, Math.min(gesture.dx, maxTranslate));
        translateX.setValue(x);
      },
      onPanResponderRelease: (_, gesture) => {
        if (disabled || loading || confirmed) return;
        const x = Math.max(0, Math.min(gesture.dx, maxTranslate));
        if (x >= maxTranslate * CONFIRM_THRESHOLD) {
          // ¡Confirmado!
          Animated.timing(translateX, {
            toValue: maxTranslate,
            duration: 120,
            useNativeDriver: true,
          }).start(() => {
            setConfirmed(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            onConfirm();
          });
        } else {
          // No llegó — vuelve al inicio
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 8,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      },
    }),
  ).current;

  // Reset del slider cuando aparece un error del padre (ej: login inválido).
  // Sin esto, el usuario quedaría atrapado con el slider bloqueado tras un fallo.
  useEffect(() => {
    if (error && confirmed) {
      setConfirmed(false);
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 8,
      }).start();
    }
  }, [error, confirmed, translateX]);

  // Reset también si el loading terminó pero el flujo no navegó (caso de fallo silencioso).
  useEffect(() => {
    if (!loading && confirmed) {
      // Damos un pequeño delay antes de resetear para que si hay navegación exitosa,
      // el slider no parpadee. Si a los 400ms sigue en la misma pantalla, resetea.
      const timer = setTimeout(() => {
        setConfirmed(false);
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 8,
        }).start();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [loading, confirmed, translateX]);

  // Opacidad del label: fade a medida que se arrastra
  const labelOpacity = maxTranslate > 0
    ? translateX.interpolate({
        inputRange: [0, maxTranslate * 0.5],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      })
    : new Animated.Value(1);

  // Progreso de fill del gradient tras el thumb (efecto glow)
  const fillWidth = maxTranslate > 0
    ? translateX.interpolate({
        inputRange: [0, maxTranslate],
        outputRange: [THUMB_SIZE + THUMB_MARGIN * 2, TRACK_HEIGHT + maxTranslate],
        extrapolate: 'clamp',
      })
    : new Animated.Value(THUMB_SIZE + THUMB_MARGIN * 2);

  const isBusy = loading || confirmed;
  const displayLabel = isBusy ? labelConfirmed : label;

  const track = (
    <View
      onLayout={(e) => {
        if (!trackWidth) setWidth(e.nativeEvent.layout.width);
      }}
      style={{ width: '100%', height: TRACK_HEIGHT }}
      className={`bg-obsidian-surface border border-obsidian-hi rounded-full relative overflow-hidden ${disabled ? 'opacity-50' : ''}`}
    >
      {/* Fill gradient detrás del thumb */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: fillWidth,
          borderRadius: TRACK_HEIGHT / 2,
        }}
      >
        <LinearGradient
          colors={['#FF5637', '#FF45A1']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ flex: 1, borderRadius: TRACK_HEIGHT / 2, opacity: 0.28 }}
        />
      </Animated.View>

      {/* Doble chevron interno (hint visual siempre visible dentro del track) */}
      {labelPosition === 'below' ? (
        <Animated.View
          pointerEvents="none"
          className="absolute inset-0 items-center justify-center flex-row"
          style={{ opacity: labelOpacity }}
        >
          <Ionicons name="chevron-forward" size={16} color="#A0A0A0" />
          <Ionicons name="chevron-forward" size={16} color="#A0A0A0" style={{ marginLeft: -6 }} />
          <Ionicons name="chevron-forward" size={16} color="#A0A0A0" style={{ marginLeft: -6 }} />
        </Animated.View>
      ) : (
        <Animated.View
          pointerEvents="none"
          className="absolute inset-0 items-center justify-center"
          style={{ opacity: labelOpacity }}
        >
          <View className="flex-row items-center gap-2">
            <Txt variant="label" weight="medium" tone="muted">{displayLabel}</Txt>
            <Ionicons name="chevron-forward" size={14} color="#A0A0A0" />
            <Ionicons name="chevron-forward" size={14} color="#A0A0A0" style={{ marginLeft: -10 }} />
          </View>
        </Animated.View>
      )}

      {/* Thumb */}
      <Animated.View
        {...panResponder.panHandlers}
        testID={testID ? `${testID}-thumb` : undefined}
        style={{
          position: 'absolute',
          left: THUMB_MARGIN,
          top: THUMB_MARGIN,
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: THUMB_SIZE / 2,
          transform: [{ translateX }],
          shadowColor: '#FF45A1',
          shadowOpacity: 0.5,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        }}
      >
        <LinearGradient
          colors={['#FF5637', '#FF45A1']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            borderRadius: THUMB_SIZE / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isBusy ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="arrow-forward" size={22} color="#fff" />
          )}
        </LinearGradient>
      </Animated.View>
    </View>
  );

  if (labelPosition === 'inside') {
    return <View testID={testID}>{track}</View>;
  }

  return (
    <View testID={testID} className="w-full">
      {track}
      <Animated.View
        pointerEvents="none"
        className="items-center justify-center mt-3"
        style={{ opacity: labelOpacity }}
      >
        <Txt variant="label" weight="medium" tone="muted" className="tracking-[3px] text-center">
          {displayLabel}
        </Txt>
      </Animated.View>
    </View>
  );
}
