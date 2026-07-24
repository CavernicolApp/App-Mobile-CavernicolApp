// app/(tabs)/_layout.tsx — Bottom tabs cyberpunk (dark)
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useAuthStore } from '@/stores/auth';
import { useInboxStats } from '@/hooks/useInbox';
import { Txt } from '@/components/ui/Text';

function InboxTabIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
  const { data } = useInboxStats();
  const unread = data?.unread_total ?? 0;
  return (
    <View className="relative">
      <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={size} color={color} />
      {unread > 0 ? (
        <View className="absolute -right-2 -top-1.5 bg-magenta rounded-full min-w-[16px] h-4 items-center justify-center px-1">
          <Txt variant="caption" weight="bold" tone="inverse" style={{ fontSize: 10, lineHeight: 12 }}>
            {unread > 99 ? '99+' : unread}
          </Txt>
        </View>
      ) : null}
    </View>
  );
}

export default function TabsLayout() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF45A1',
        tabBarInactiveTintColor: '#A0A0A0',
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#1A1A1A',
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 12,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter_500Medium',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Conversaciones',
          tabBarIcon: (props) => <InboxTabIcon {...props} />,
        }}
      />
      <Tabs.Screen
        name="crm"
        options={{
          title: 'CRM',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
