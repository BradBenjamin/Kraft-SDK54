import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { COLORS } from '@/constants/data'; // Ensure alias is set or use relative path '../../constants/data'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.orange,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.lightGray,
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'CHAT',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubble-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings" // Rename your app/(tabs)/join.tsx file to bookings.tsx
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color }) => <Ionicons name="briefcase-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'ACCOUNT',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}