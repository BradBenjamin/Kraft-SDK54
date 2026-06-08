import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/data';
import { supabase } from '@/lib/supabase';

export default function TabLayout() {
  const [isKrafter, setIsKrafter] = useState(false);

  useEffect(() => {
    const checkKrafter = async (userId?: string) => {
      if (!userId) return setIsKrafter(false);
      const { data } = await supabase.from('taskers').select('id').eq('user_id', userId).maybeSingle();
      setIsKrafter(!!data);
    };

    supabase.auth.getUser().then(({ data: { user } }) => checkKrafter(user?.id));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) =>
      checkKrafter(session?.user?.id)
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.orange,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.cardBg,
          borderTopColor: COLORS.lightGray,
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubble-outline" size={24} color={color} />,
        }}
      />

      {/* JOIN — hidden once the user is a Krafter */}
      <Tabs.Screen
        name="join"
        options={{
          title: 'Join',
          href: isKrafter ? null : '/join',
          tabBarIcon: ({ color }) => <Ionicons name="add-circle-outline" size={24} color={color} />,
        }}
      />

      {/* DASHBOARD — only visible to Krafters */}
      <Tabs.Screen
        name="krafter"
        options={{
          title: 'Dashboard',
          href: isKrafter ? '/krafter' : null,
          tabBarIcon: ({ color }) => <Ionicons name="construct-outline" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
