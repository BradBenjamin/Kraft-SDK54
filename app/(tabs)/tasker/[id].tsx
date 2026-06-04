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
        // Fetch tasker
        const { data: taskerData, error: taskerError } = await supabase.from('taskers').select('*').eq('id', id).single();
        if (taskerError) throw taskerError;
        setTasker(taskerData);

        // Fetch profile (by user_id)
        if (taskerData?.user_id) {
          const { data: profData } = await supabase.from('profiles').select('*').eq('id', taskerData.user_id).single();
          setProfile(profData ?? null);
        }

        // Fetch reviews if table exists
        try {
          const { data: reviewData } = await supabase.from('reviews').select('*').eq('tasker_id', id).order('created_at', { ascending: false });
          setReviews(reviewData || []);
        } catch (e) {
          // ignore if reviews table doesn't exist
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
      <SafeAreaView style={{flex:1,justifyContent:'center',alignItems:'center'}}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!tasker) {
    return (
      <SafeAreaView style={{flex:1,justifyContent:'center',alignItems:'center'}}>
        <Text>No profile found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{marginTop:12}}>
          <Text style={{color: COLORS.darkBlue}}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={22} color={COLORS.darkBlue} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{tasker.name}</Text>
      </View>

      <ScrollView contentContainerStyle={{padding:20}}>
        <View style={styles.card}>
          <View style={styles.topRow}>
            <Image source={{ uri: tasker.image }} style={styles.avatar} />
            <View style={{flex:1, marginLeft:16}}>
              <Text style={styles.name}>{tasker.name}</Text>
              <View style={{flexDirection:'row', alignItems:'center', marginTop:6}}>
                <Ionicons name="star" size={14} color="#BFA056" />
                <Text style={{marginLeft:6, fontWeight:'700'}}>{tasker.rating ?? '0.0'}</Text>
                <Text style={{marginLeft:8, color:'#999'}}>{tasker.reviews} reviews</Text>
              </View>

              <Text style={{marginTop:8, color:'#666', fontWeight:'600'}}>{tasker.rate} RON/hr</Text>
            </View>
          </View>

          <View style={{marginTop:16}}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.paragraph}>{profile?.bio || 'No bio available.'}</Text>

            <Text style={[styles.sectionTitle, {marginTop:12}]}>Skills</Text>
            <View style={{flexDirection:'row',flexWrap:'wrap',marginTop:8}}>
              {(tasker.tags || []).map((t:string,i:number)=>(
                <View key={i} style={{backgroundColor:'#F5F6F8', paddingHorizontal:10, paddingVertical:6, borderRadius:8, marginRight:8, marginBottom:8}}>
                  <Text style={{fontWeight:'700', color: '#666'}}>{t}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, {marginTop:12}]}>Portfolio</Text>

            { (tasker.portfolio && tasker.portfolio.length > 0) ? (
              <ScrollView horizontal style={{marginTop:8}} showsHorizontalScrollIndicator={false}>
                {tasker.portfolio.map((uri:string, i:number) => (
                  <Image key={i} source={{uri}} style={{width:200,height:140,borderRadius:10,marginRight:12}} />
                ))}
              </ScrollView>
            ) : tasker.image ? (
              <View style={{marginTop:8}}>
                <Image source={{uri: tasker.image}} style={{width:200,height:140,borderRadius:10}} />
              </View>
            ) : (
              <Text style={{color:'#777', marginTop:8, fontStyle: 'italic'}}>No pictures available.</Text>
            ) }

            <Text style={[styles.sectionTitle, {marginTop:12}]}>Reviews</Text>
            {reviews.length === 0 ? (
              <Text style={{color:'#777', marginTop:8}}>No reviews yet.</Text>
            ) : (
              reviews.map((r) => (
                <View key={r.id} style={{marginTop:12,borderTopWidth:1,borderTopColor:'#F0F0F0',paddingTop:12}}>
                  <Text style={{fontWeight:'700'}}>{r.title || 'Review'}</Text>
                  <Text style={{color:'#666',marginTop:6}}>{r.body}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={{height:40}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor: COLORS.white },
  header: { flexDirection:'row', alignItems:'center', paddingTop:12, paddingHorizontal:8, paddingBottom:6 },
  backBtn: { padding:8 },
  headerTitle: { fontSize:18, fontWeight:'900', color: COLORS.darkBlue, marginLeft:6 },
  card: { backgroundColor: 'white', padding:16, borderRadius:12, shadowColor:'#000', shadowOffset:{width:0,height:6}, shadowOpacity:0.06, shadowRadius:12, elevation:4 },
  topRow: { flexDirection:'row', alignItems:'center' },
  avatar: { width:110, height:110, borderRadius:12 },
  name: { fontSize:20, fontWeight:'900', color: COLORS.darkBlue },
  sectionTitle: { fontSize:13, fontWeight:'900', color: COLORS.darkBlue },
  paragraph: { color:'#666', marginTop:6 }
});