import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/constants/data';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

export default function KrafterScreen() {
  const router = useRouter();
  const [tasker, setTasker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);

  const fetchTasker = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setTasker(null);
      const { data } = await supabase.from('taskers').select('*').eq('user_id', user.id).maybeSingle();
      setTasker(data);
    } catch (e) {
      console.log('Dashboard fetch error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchTasker(); }, [fetchTasker]));

  const toggleOnline = async (value: boolean) => {
    if (!tasker) return;
    setTogglingOnline(true);
    setTasker({ ...tasker, is_online: value }); // optimistic
    const { error } = await supabase.from('taskers').update({ is_online: value }).eq('id', tasker.id);
    if (error) setTasker({ ...tasker, is_online: !value }); // revert on failure
    setTogglingOnline(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator color={COLORS.orange} />
      </SafeAreaView>
    );
  }

  if (!tasker) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.emptyText}>No Krafter profile found.</Text>
      </SafeAreaView>
    );
  }

  const estEarnings = (tasker.tasks || 0) * (tasker.rate || 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl tintColor={COLORS.orange} refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTasker(); }} />}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{tasker.name}</Text>
          </View>
          <TouchableOpacity style={styles.viewProfileBtn} onPress={() => router.push(`/tasker/${tasker.id}`)}>
            <Text style={styles.viewProfileText}>View profile</Text>
          </TouchableOpacity>
        </View>

        {/* Availability */}
        <View style={styles.availabilityCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.statusDot, { backgroundColor: tasker.is_online ? COLORS.green : COLORS.textLight }]} />
            <Text style={styles.availabilityText}>{tasker.is_online ? 'You are online' : 'You are offline'}</Text>
            {togglingOnline && <ActivityIndicator size="small" color={COLORS.textLight} style={{ marginLeft: 8 }} />}
          </View>
          <Switch
            value={!!tasker.is_online}
            onValueChange={toggleOnline}
            trackColor={{ false: COLORS.lightGray, true: COLORS.green }}
            thumbColor={COLORS.white}
          />
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard icon="star" label="Rating" value={tasker.rating ?? '0.0'} />
          <StatCard icon="checkmark-done" label="Jobs done" value={tasker.tasks || 0} />
          <StatCard icon="chatbubbles" label="Reviews" value={tasker.reviews || 0} />
          <StatCard icon="cash" label="Rate/hr" value={`$${tasker.rate || 0}`} />
        </View>

        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Estimated lifetime earnings</Text>
          <Text style={styles.earningsValue}>${estEarnings.toLocaleString()}</Text>
          <Text style={styles.earningsSub}>{tasker.tasks || 0} jobs × ${tasker.rate || 0}/hr</Text>
        </View>

        <Text style={styles.sectionTitle}>Quick actions</Text>
        <ActionRow icon="briefcase-outline" label="Incoming requests" onPress={() => {}} />
        <ActionRow icon="calendar-outline" label="My schedule" onPress={() => {}} />
        <ActionRow icon="create-outline" label="Edit my profile" onPress={() => router.push(`/tasker/${tasker.id}`)} />
      </ScrollView>
    </SafeAreaView>
  );
}

const StatCard = ({ icon, label, value }: any) => (
  <View style={styles.statCard}>
    <Ionicons name={icon} size={20} color={COLORS.orange} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ActionRow = ({ icon, label, onPress }: any) => (
  <TouchableOpacity style={styles.actionRow} onPress={onPress}>
    <Ionicons name={icon} size={20} color={COLORS.white} />
    <Text style={styles.actionLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: COLORS.textLight },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { color: COLORS.textLight, fontSize: 14 },
  name: { color: COLORS.white, fontSize: 24, fontWeight: '700' },
  viewProfileBtn: { backgroundColor: COLORS.cardBg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.lightGray },
  viewProfileText: { color: COLORS.orange, fontSize: 12, fontWeight: '700' },

  availabilityCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: COLORS.lightGray },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  availabilityText: { color: COLORS.white, fontWeight: '600', fontSize: 15 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 },
  statCard: { width: '48%', backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: COLORS.lightGray },
  statValue: { color: COLORS.white, fontSize: 22, fontWeight: '700', marginTop: 8 },
  statLabel: { color: COLORS.textLight, fontSize: 12, marginTop: 2 },

  earningsCard: { backgroundColor: COLORS.orange, borderRadius: 16, padding: 22, marginBottom: 25 },
  earningsLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  earningsValue: { color: COLORS.white, fontSize: 32, fontWeight: '900', marginTop: 6 },
  earningsSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4 },

  sectionTitle: { color: COLORS.white, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.lightGray },
  actionLabel: { flex: 1, color: COLORS.white, fontSize: 15, fontWeight: '600', marginLeft: 14 },
});
