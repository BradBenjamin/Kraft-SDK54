import { COLORS, Category, Tasker } from '@/constants/data';
import { supabase } from '@/lib/supabase';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, RefreshControl, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const Header = () => (
  <View style={styles.headerContainer}>
    <Text style={styles.brandTitle}>kraft</Text>
    <TouchableOpacity style={styles.bellButton}>
      <Ionicons name="notifications-outline" size={20} color={COLORS.white} />
      <View style={styles.notificationDot} />
    </TouchableOpacity>
  </View>
);

export default function HomeScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [taskers, setTaskers] = useState<Tasker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const router = useRouter();

  const fetchData = async (filters?: { search?: string; category?: string | null }) => {
    setLoading(true);
    try {
      const { data: catData, error: catError } = await supabase.from('categories').select('*');
      if (catError) throw catError;
      if (catData) setCategories(catData);

      let query: any = supabase.from('taskers').select('*');

      if (filters?.search && filters.search.trim().length > 0) {
        query = query.ilike('name', `%${filters.search.trim()}%`);
      }

      if (filters?.category) {
        query = query.contains('tags', [filters.category]);
      }

      const { data: taskerData, error: taskerError } = await query;
      if (taskerError) throw taskerError;
      if (taskerData) setTaskers(taskerData);
      
    } catch (error) {
      console.log('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCategoryPress = (catName: string) => {
    const newSelected = selectedCategory === catName ? null : catName;
    setSelectedCategory(newSelected);
    fetchData({ search: searchQuery, category: newSelected });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView 
        style={styles.screenScroll} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl tintColor={COLORS.orange} refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData({ search: searchQuery, category: selectedCategory });}} />}
      >
        <Header />
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textLight} style={{marginRight: 10}} />
          <TextInput 
            placeholder="Search trade, skill or name..." 
            style={styles.searchInput} 
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => fetchData({ search: searchQuery, category: selectedCategory })}
          />
          {(searchQuery.length > 0) ? (
            <TouchableOpacity onPress={() => {setSearchQuery(''); fetchData({category: selectedCategory});}}>
              <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          ) : (
            <Ionicons name="filter" size={18} color={COLORS.textLight} />
          )}
        </View>

        {/* Location Row */}
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.orange} />
          <Text style={styles.locationText}>Cluj-Napoca, RO</Text>
          <TouchableOpacity><Text style={styles.changeText}>Change</Text></TouchableOpacity>
          <View style={{flex: 1}} />
          <Text style={styles.nearbyText}>{taskers.length} Krafters nearby</Text>
        </View>

        {/* Categories (Horizontal Scroll) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          <TouchableOpacity 
            style={styles.catItem} 
            onPress={() => {setSelectedCategory(null); fetchData({search: searchQuery});}}
          >
            <View style={[styles.catIconBox, !selectedCategory && styles.catIconBoxActive]}>
              <Ionicons name="list" size={24} color={!selectedCategory ? COLORS.white : COLORS.textLight} />
            </View>
            <Text style={[styles.catText, !selectedCategory && {color: COLORS.white}]}>All</Text>
          </TouchableOpacity>

          {categories.map((cat) => {
             const isSelected = selectedCategory === cat.name;
             return (
              <TouchableOpacity key={cat.id} style={styles.catItem} onPress={() => handleCategoryPress(cat.name)}>
                <View style={[styles.catIconBox, isSelected && styles.catIconBoxActive]}>
                  <MaterialCommunityIcons name={cat.icon as any} size={24} color={isSelected ? COLORS.white : COLORS.textLight} />
                </View>
                <Text style={[styles.catText, isSelected && {color: COLORS.white}]}>{cat.name}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
          <TouchableOpacity style={styles.filterBtnPrimary} onPress={() => router.push('/modal')}>
            <Ionicons name="options-outline" size={16} color={COLORS.white} style={{marginRight: 6}} />
            <Text style={styles.filterBtnPrimaryText}>Filters</Text>
          </TouchableOpacity>
          <View style={styles.filterPill}><Text style={styles.filterPillText}>Available today</Text></View>
          <View style={styles.filterPill}>
            <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.textLight} style={{marginRight: 4}}/>
            <Text style={styles.filterPillText}>Verified</Text>
          </View>
          <View style={styles.filterPill}>
            <Ionicons name="star" size={12} color={COLORS.textLight} style={{marginRight: 4}}/>
            <Text style={styles.filterPillText}>4.5+</Text>
          </View>
        </ScrollView>

        <View style={styles.sortRow}>
          <Text style={styles.sortText}>Top rated</Text>
          <Ionicons name="chevron-down" size={14} color={COLORS.textLight} style={{marginLeft: 4}} />
        </View>

        {/* Taskers List */}
        {taskers.map((tasker) => (
          <TouchableOpacity 
            key={tasker.id} 
            style={styles.taskerCard}
            onPress={() => router.push(`/tasker/${tasker.id}`)}
          >
            <View style={styles.cardHeader}>
              {tasker.image ? (
                <Image source={{ uri: tasker.image }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}><Text style={styles.avatarInitials}>{tasker.name.charAt(0)}</Text></View>
              )}
              
              <View style={styles.taskerInfo}>
                <Text style={styles.taskerName}>{tasker.name}</Text>
                <Text style={styles.taskerTrade}>{tasker.tags?.[0] || 'Professional'}</Text>
                
                <View style={styles.statsRow}>
                  <Text style={styles.priceText}>${tasker.rate}<Text style={styles.priceSubtext}>/hr</Text></Text>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Ionicons name="star" size={12} color="#F5A623" />
                  <Text style={styles.ratingText}>{tasker.rating ?? '0.0'}</Text>
                  <Text style={styles.reviewsText}>({tasker.reviews})</Text>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Text style={styles.reviewsText}>2.1 mi</Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.heartBtn}>
                <Ionicons name="heart-outline" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.tagsRow}>
              {(tasker.tags || []).slice(0, 3).map((tag, idx) => (
                <View key={idx} style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{tag}</Text>
                </View>
              ))}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.jobsText}>{tasker.tasks || 0} jobs</Text>
              <View style={styles.bookBtn}>
                <Text style={styles.bookBtnText}>Book now</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {taskers.length === 0 && !loading && (
          <Text style={styles.emptyText}>No krafters found.</Text>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  screenScroll: { paddingHorizontal: 20 },
  
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  brandTitle: { fontSize: 28, fontWeight: '400', color: COLORS.white, letterSpacing: 0.5 },
  bellButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.cardBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.lightGray },
  notificationDot: { position: 'absolute', top: 10, right: 12, width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.orange },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 14, paddingHorizontal: 15, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.lightGray },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.white },

  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 20 },
  locationText: { color: COLORS.textLight, fontSize: 12, marginLeft: 4, marginRight: 8 },
  changeText: { color: COLORS.orange, fontSize: 12, fontWeight: '600' },
  nearbyText: { color: COLORS.textLight, fontSize: 12 },

  categoriesContainer: { flexDirection: 'row', marginBottom: 20 },
  catItem: { alignItems: 'center', marginRight: 15 },
  catIconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.cardBg, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: COLORS.lightGray },
  catIconBoxActive: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  catText: { color: COLORS.textLight, fontSize: 11, fontWeight: '600' },

  filtersRow: { flexDirection: 'row', marginBottom: 20 },
  filterBtnPrimary: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.orange, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  filterBtnPrimaryText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  filterPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: COLORS.lightGray },
  filterPillText: { color: COLORS.textLight, fontSize: 12, fontWeight: '600' },

  sortRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sortText: { color: COLORS.textLight, fontSize: 12 },

  taskerCard: { backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.lightGray },
  cardHeader: { flexDirection: 'row' },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarInitials: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  taskerInfo: { flex: 1 },
  taskerName: { fontSize: 16, fontWeight: '700', color: COLORS.white, marginBottom: 2 },
  taskerTrade: { fontSize: 12, color: COLORS.textLight, marginBottom: 6 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  priceText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  priceSubtext: { color: COLORS.textLight, fontWeight: '400', fontSize: 11 },
  dotSeparator: { color: COLORS.textLight, marginHorizontal: 6, fontSize: 10 },
  ratingText: { color: '#F5A623', fontWeight: '700', fontSize: 12, marginLeft: 4 },
  reviewsText: { color: COLORS.textLight, fontSize: 11, marginLeft: 4 },
  heartBtn: { padding: 4 },

  tagsRow: { flexDirection: 'row', marginTop: 16, marginBottom: 16, flexWrap: 'wrap' },
  tagPill: { backgroundColor: COLORS.lightGray, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8, marginBottom: 8 },
  tagPillText: { color: COLORS.textLight, fontSize: 10, fontWeight: '600' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobsText: { color: COLORS.textLight, fontSize: 12 },
  bookBtn: { backgroundColor: COLORS.orange, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  bookBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  
  emptyText: { textAlign: 'center', marginTop: 30, color: COLORS.textLight },
});