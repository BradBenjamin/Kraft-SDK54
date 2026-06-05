import { COLORS } from '@/constants/data';
import { supabase } from '@/lib/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TaskerProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [tasker, setTasker] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const { data: taskerData, error: taskerError } = await supabase.from('taskers').select('*').eq('id', id).single();
        if (taskerError) throw taskerError;
        setTasker(taskerData);

        if (taskerData?.user_id) {
          const { data: profData } = await supabase.from('profiles').select('*').eq('id', taskerData.user_id).single();
          setProfile(profData ?? null);
        }

        try {
          const { data: reviewData } = await supabase.from('reviews').select('*').eq('tasker_id', id).order('created_at', { ascending: false });
          setReviews(reviewData || []);
        } catch (e) {
          setReviews([]);
        }
      } catch (err: any) {
        console.log('Error loading tasker profile', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor: COLORS.background}}>
        <ActivityIndicator color={COLORS.orange} />
      </SafeAreaView>
    );
  }

  if (!tasker) {
    return (
      <SafeAreaView style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor: COLORS.background}}>
        <Text style={{color: COLORS.white}}>No profile found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{marginTop:12}}>
          <Text style={{color: COLORS.orange}}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Krafter Profile</Text>
        <View style={{width: 36}} /> 
      </View>

      <ScrollView contentContainerStyle={{padding: 20}}>
        
        <View style={styles.topProfile}>
          {tasker.image ? (
             <Image source={{ uri: tasker.image }} style={styles.avatarLarge} />
          ) : (
             <View style={styles.avatarInitials}><Text style={styles.initialsText}>{tasker.name.charAt(0)}</Text></View>
          )}
          <Text style={styles.name}>{tasker.name}</Text>
          <Text style={styles.tradeText}>{tasker.tags?.[0] || 'Professional'} • Available</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{tasker.rating ?? '0.0'}</Text>
            <View style={{flexDirection:'row', marginTop: 4}}>
              <Ionicons name="star" size={10} color="#F5A623"/>
              <Ionicons name="star" size={10} color="#F5A623"/>
              <Ionicons name="star" size={10} color="#F5A623"/>
              <Ionicons name="star" size={10} color="#F5A623"/>
              <Ionicons name="star-half" size={10} color="#F5A623"/>
            </View>
          </View>
          <View style={[styles.statBox, styles.statBorder]}>
            <Text style={styles.statValue}>{tasker.tasks || 0}</Text>
            <Text style={styles.statLabel}>Jobs done</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>${tasker.rate}</Text>
            <Text style={styles.statLabel}>Per hour</Text>
          </View>
        </View>

        <View style={{marginTop: 10}}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.paragraph}>{profile?.bio || 'Licensed professional with years of experience. Fully insured and certified.'}</Text>
          <Text style={styles.readMore}>Read more</Text>

          <Text style={[styles.sectionTitle, {marginTop:25}]}>Skills</Text>
          <View style={{flexDirection:'row', flexWrap:'wrap', marginTop:12}}>
            {(tasker.tags || []).map((t:string, i:number)=>(
              <View key={i} style={styles.skillPill}>
                <Text style={styles.skillPillText}>{t}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, {marginTop:25}]}>Portfolio</Text>
          { (tasker.portfolio && tasker.portfolio.length > 0) ? (
            <ScrollView horizontal style={{marginTop:12}} showsHorizontalScrollIndicator={false}>
              {tasker.portfolio.map((uri:string, i:number) => (
                <Image key={i} source={{uri}} style={styles.portfolioImage} />
              ))}
            </ScrollView>
          ) : (
            <Text style={[styles.paragraph, {fontStyle: 'italic'}]}>No pictures available.</Text>
          ) }

          <Text style={[styles.sectionTitle, {marginTop:25}]}>Reviews</Text>
          {reviews.length === 0 ? (
            <Text style={styles.paragraph}>No reviews yet.</Text>
          ) : (
            reviews.map((r) => (
              <View key={r.id} style={styles.reviewCard}>
                <Text style={{fontWeight:'700', color: COLORS.white}}>{r.title || 'Review'}</Text>
                <Text style={styles.paragraph}>{r.body}</Text>
              </View>
            ))
          )}
        </View>
        <View style={{height: 80}} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.messageBtn}>
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.white} />
          <Text style={styles.messageBtnText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookBtn}>
          <Text style={styles.bookBtnText}>Book now • ${tasker.rate}/hr</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  backBtn: { padding: 10, backgroundColor: COLORS.cardBg, borderRadius: 12 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  
  topProfile: { alignItems: 'center', marginBottom: 25 },
  avatarLarge: { width: 80, height: 80, borderRadius: 25, marginBottom: 12 },
  avatarInitials: { width: 80, height: 80, borderRadius: 25, backgroundColor: COLORS.cardBg, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  initialsText: { color: COLORS.white, fontSize: 28, fontWeight: 'bold' },
  name: { fontSize: 24, fontWeight: '700', color: COLORS.white },
  tradeText: { color: COLORS.textLight, fontSize: 14, marginTop: 4 },
  
  statsRow: { flexDirection: 'row', backgroundColor: COLORS.cardBg, borderRadius: 16, paddingVertical: 18, marginBottom: 25 },
  statBox: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.lightGray },
  statValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  statLabel: { fontSize: 11, color: COLORS.textLight, marginTop: 4 },
  
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  paragraph: { color: COLORS.textLight, marginTop: 8, lineHeight: 22, fontSize: 14 },
  readMore: { color: COLORS.orange, marginTop: 5, fontSize: 13, fontWeight: '600' },
  
  skillPill: { backgroundColor: COLORS.cardBg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginRight: 10, marginBottom: 10, borderWidth: 1, borderColor: COLORS.lightGray },
  skillPillText: { fontWeight: '600', color: COLORS.textLight, fontSize: 12 },
  
  portfolioImage: { width: 160, height: 120, borderRadius: 12, marginRight: 12 },
  
  reviewCard: { marginTop: 15, borderTopWidth: 1, borderTopColor: COLORS.lightGray, paddingTop: 15 },
  
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.background, flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: COLORS.lightGray },
  messageBtn: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.cardBg, paddingVertical: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  messageBtnText: { color: COLORS.white, fontWeight: '700', marginLeft: 8 },
  bookBtn: { flex: 2, backgroundColor: COLORS.orange, paddingVertical: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  bookBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});