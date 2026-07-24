// src/components/ui/BottomSheet.tsx
// Bottom-sheet reutilizable estilo Cyberpunk (RN Modal + Animated + PanResponder).
// - Slide-up animado, backdrop tap-to-close, drag-handle para cerrar deslizando.
// - Borde superior con gradiente flame→magenta sobre fondo obsidian.
// - KeyboardAvoidingView interno para que los inputs no queden bajo el teclado.
// - Usa la Animated API nativa de RN (igual que SlideToConfirm) → funciona en
//   iOS / Android / web y Expo Go sin dependencias ni config extra.
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt } from './Text';

const { height: SCREEN_H } = Dimensions.get('window');

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  testID?: string;
}

export function BottomSheet({ visible, onClose, title, children, testID }: BottomSheetProps) {
  const [mounted, setMounted] = useState(visible);
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    } else if (mounted) {
      Animated.timing(translateY, { toValue: SCREEN_H, duration: 220, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 130 || g.vy > 1.2) {
          Animated.timing(translateY, { toValue: SCREEN_H, duration: 200, useNativeDriver: true }).start(({ finished }) => {
            if (finished) onClose();
          });
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
        }
      },
    }),
  ).current;

  if (!mounted) return null;

  return (
    <Modal visible transparent statusBarTranslucent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          testID={testID ? `${testID}-backdrop` : 'bottom-sheet-backdrop'}
          onPress={onClose}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.66)' }}
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View style={{ maxHeight: SCREEN_H * 0.92, transform: [{ translateY }] }} testID={testID}>
            <View style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' }}>
              <LinearGradient
                colors={['#FF5637', '#FF45A1']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ height: 3 }}
              />
              <View className="bg-obsidian-void border-x border-obsidian-hi" style={{ paddingBottom: insets.bottom + 10 }}>
                <View {...panResponder.panHandlers} className="items-center pt-3 pb-1">
                  <View className="w-10 h-1.5 rounded-full bg-obsidian-hi" />
                </View>

                {title ? (
                  <View className="flex-row items-center justify-between px-5 pt-2 pb-3 border-b border-obsidian-border">
                    <Txt variant="heading" weight="bold" font="heading">{title}</Txt>
                    <Pressable
                      testID="bottom-sheet-close"
                      onPress={onClose}
                      hitSlop={10}
                      className="w-9 h-9 rounded-full items-center justify-center bg-obsidian-surface border border-obsidian-border active:opacity-70"
                    >
                      <Ionicons name="close" size={18} color="#fff" />
                    </Pressable>
                  </View>
                ) : null}

                {children}
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
