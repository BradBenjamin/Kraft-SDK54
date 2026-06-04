import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Image, TouchableOpacity } from 'react-native';
import { COLORS } from '@/constants/data';
import { Ionicons } from '@expo/vector-icons';

// Mock Data for MVP appearance
const MESSAGES = [
  { id: '1', name: 'Mike Chen', lastMessage: 'I can be there by 2 PM.', time: '10:30 AM', unread: 2, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=60' },
  { id: '2', name: 'Sarah Jones', lastMessage: 'Thanks for the booking!', time: 'Yesterday', unread: 0, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=60' },
  { id: '3', name: 'Emily Ross', lastMessage: 'Do you provide the cleaning supplies?', time: 'Tue', unread: 0, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=60' },
];

export default function ChatScreen() {
  const renderItem = ({ item }: {item: any}) => (
    <TouchableOpacity style={styles.chatItem}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.message} numberOfLines={1}>{item.lastMessage}</Text>
          {item.unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity>
           <Ionicons name="create-outline" size={24} color={COLORS.darkBlue} />
        </TouchableOpacity>
      </View>
      <FlatList 
        data={MESSAGES}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.darkBlue },
  list: { padding: 20 },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  avatar: { width: 55, height: 55, borderRadius: 14, marginRight: 15 },
  content: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  name: { fontSize: 16, fontWeight: 'bold', color: COLORS.darkBlue },
  time: { fontSize: 12, color: '#999' },
  message: { color: '#666', fontSize: 14, flex: 1, marginRight: 10 },
  badge: {
    backgroundColor: COLORS.orange,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
});