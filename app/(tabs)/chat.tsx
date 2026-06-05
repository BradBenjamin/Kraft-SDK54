import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Image, TouchableOpacity, TextInput } from 'react-native';
import { COLORS } from '@/constants/data';
import { Ionicons } from '@expo/vector-icons';

const MESSAGES = [
  { id: '1', name: 'John Doe', lastMessage: 'On my way, be there in 10 mins!', time: '2m ago', unread: 2, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=60' },
  { id: '2', name: 'Maria Reyes', lastMessage: 'Sure, I can come Saturday morning', time: '1h ago', unread: 0, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=60' },
  { id: '3', name: 'Tom Kline', lastMessage: 'Thanks for the great review! Really appreciate it 🙏', time: 'Yesterday', unread: 0, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=60' },
  { id: '4', name: 'Ana Silva', lastMessage: 'You: Does that include primer coat too?', time: 'Mon', unread: 0, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=60' },
  { id: '5', name: 'Ryan Brooks', lastMessage: 'Just sent over the invoice for the job', time: 'Sun', unread: 1, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=60' },
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
        
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={COLORS.textLight} />
          <TextInput 
            placeholder="Search conversations..." 
            placeholderTextColor={COLORS.textLight} 
            style={styles.searchInput} 
          />
        </View>

        <View style={styles.pillContainer}>
          <View style={[styles.pill, styles.pillActive]}>
            <Text style={styles.pillTextActive}>All</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Bookings</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Unread</Text>
          </View>
        </View>
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
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.white, marginBottom: 15 },
  searchBar: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.cardBg, 
    padding: 12, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginBottom: 15 
  },
  searchInput: { color: COLORS.white, marginLeft: 10, flex: 1, fontSize: 14 },
  pillContainer: { flexDirection: 'row', marginBottom: 10 },
  pill: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: COLORS.cardBg, 
    marginRight: 10 
  },
  pillActive: { backgroundColor: COLORS.orange },
  pillText: { color: COLORS.textLight, fontSize: 13, fontWeight: '600' },
  pillTextActive: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  list: { paddingHorizontal: 20 },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  avatar: { width: 50, height: 50, borderRadius: 14, marginRight: 15 },
  content: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  name: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
  time: { fontSize: 12, color: COLORS.textLight },
  message: { color: COLORS.textLight, fontSize: 14, flex: 1, marginRight: 10 },
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