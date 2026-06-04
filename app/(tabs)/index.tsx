import { COLORS, Category, Tasker } from '@/constants/data';
import { supabase } from '@/lib/supabase';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, RefreshControl, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const Header = ({ avatarUrl, onPressProfile, userEmail }: { avatarUrl?: string; onPressProfile?: () => void; userEmail?: string }) => (
  <View style={styles.headerContainer}>
    <View style={styles.logoContainer}>
      <View style={styles.logoBox}><Text style={styles.logoText}>C</Text></View>
      <Text style={styles.brandName}>CRAFTIE</Text>
    </View>
    <View style={styles.authButtons}>
      {avatarUrl ? (
        <TouchableOpacity onPress={onPressProfile} style={styles.headerAvatarTouchable}>
          <Image source={{ uri: avatarUrl }} style={styles.headerAvatar} />
        </TouchableOpacity>
      ) : userEmail ? (
        <TouchableOpacity onPress={onPressProfile} style={styles.headerAvatarTouchable}>
          <View style={styles.headerAvatarPlaceholder}><Text style={{color: 'white', fontWeight:'700'}}>{userEmail.charAt(0).toUpperCase()}</Text></View>
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity><Text style={styles.loginText}>Log In</Text></TouchableOpacity>
          <TouchableOpacity style={styles.signUpBtn}><Text style={styles.signUpText}>Sign Up</Text></TouchableOpacity>
        </>
      )}
    </View>
  </View>
);

export default function HomeScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [taskers, setTaskers] = useState<Tasker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // Advanced Filters
  const [showFilters, setShowFilters] = useState(false);
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [minRating, setMinRating] = useState('');
  // Local master list to support robust filtering (fallback)
  const [allTaskers, setAllTaskers] = useState<Tasker[]>([]);
  const router = useRouter();

  // Auth & profile for header avatar
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchProfile(user.id);
    });

    // subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchProfile(u.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (id?: string) => {
    if (!id) return;
    try {
      const { data } = await supabase.from('profiles').select('avatar_url, full_name').eq('id', id).single();
      setProfile(data ?? null);
    } catch (e) {
      console.log('fetchProfile error', e);
      setProfile(null);
    }
  };

  const fetchData = async (filters?: { search?: string; category?: string | null; minRate?: string; maxRate?: string; minRating?: string }) => {
    setLoading(true);
    try {
      const { data: catData, error: catError } = await supabase.from('categories').select('*');
      if (catError) throw catError;
      if (catData) setCategories(catData);

      // Build server-side tasker query with applied filters
      let query: any = supabase.from('taskers').select('*');

      if (filters?.search && filters.search.trim().length > 0) {
        // Search by name (server-side). We intentionally avoid complex tag substring search here.
        query = query.ilike('name', `%${filters.search.trim()}%`);
      }

      if (filters?.category) {
        // tags is an array column - ensure the selected category exists inside tags
        query = query.contains('tags', [filters.category]);
      }

      if (filters?.minRate) {
        const min = parseInt(filters.minRate || '', 10);
        if (!isNaN(min)) query = query.gte('rate', min);
      }

      if (filters?.maxRate) {
        const max = parseInt(filters.maxRate || '', 10);
        if (!isNaN(max)) query = query.lte('rate', max);
      }

      if (filters?.minRating) {
        const mr = parseFloat(filters.minRating || '');
        if (!isNaN(mr)) query = query.gte('rating', mr);
      }

      // You can add ordering here if desired
      const { data: taskerData, error: taskerError } = await query;
      if (taskerError) throw taskerError;
      if (taskerData) {
        setTaskers(taskerData);
        // If no filters were provided, treat this as the master list
        if (!filters || (Object.keys(filters).length === 0)) setAllTaskers(taskerData);
      }
      
    } catch (error) {
      console.log('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Filtering Logic
  // Results are fetched server-side when filters are applied. Use the returned taskers array directly.
  const filteredTaskers = taskers;

  const handleCategoryPress = (catName: string) => {
    // Toggle: if already selected, deselect
    const newSelected = selectedCategory === catName ? null : catName;
    setSelectedCategory(newSelected);
    // Fetch server-side with new category
    fetchData({ search: searchQuery, category: newSelected, minRate, maxRate, minRating });
  };

  // Apply filters client-side against master list (reliable UX)
  const applyFilters = () => {
    const parseNumberOrNull = (s: string) => {
      const v = s?.toString().trim();
      if (!v) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    let results = allTaskers.slice();

    // Search text: name or tags
    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      results = results.filter(t => t.name.toLowerCase().includes(q) || (t.tags && t.tags.some((tag: string) => tag.toLowerCase().includes(q))));
    }

    // Category exact match if selected
    if (selectedCategory) {
      results = results.filter(t => t.tags && t.tags.includes(selectedCategory));
    }

    // Min/Max price
    const min = parseNumberOrNull(minRate);
    const max = parseNumberOrNull(maxRate);
    if (min !== null) results = results.filter(t => Number(t.rate) >= min);
    if (max !== null) results = results.filter(t => Number(t.rate) <= max);

    // Min rating
    const minR = parseNumberOrNull(minRating);
    if (minR !== null) results = results.filter(t => (t.rating !== undefined && Number(t.rating) >= minR));

    setTaskers(results);
    setShowFilters(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        style={styles.screenScroll} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData({ search: searchQuery, category: selectedCategory, minRate, maxRate, minRating });}} />}
      >
        <Header avatarUrl={profile?.avatar_url} onPressProfile={() => router.push('/(tabs)/account')} userEmail={user?.email} />
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
             <Ionicons name="search" size={20} color="#999" style={{marginRight: 10}} />
             <TextInput 
              placeholder="Search by name or skill..." 
              style={styles.searchInput} 
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {(searchQuery.length > 0 || selectedCategory) && (
              <TouchableOpacity onPress={() => {setSearchQuery(''); setSelectedCategory(null); fetchData();}}>
                <Ionicons name="close-circle" size={20} color={COLORS.orange} />
              </TouchableOpacity>
            )}
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.filterToggle} onPress={() => setShowFilters(prev => !prev)}>
            <Ionicons name="options" size={18} color={showFilters ? COLORS.orange : '#666'} style={{marginRight:8}} />
            <Text style={{color: showFilters ? COLORS.orange : '#666', fontWeight:'700'}}>Filters</Text>
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filtersContainer}>
            <TextInput
              style={styles.filterInput}
              placeholder="Min price"
              keyboardType="numeric"
              value={minRate}
              onChangeText={setMinRate}
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.filterInput}
              placeholder="Max price"
              keyboardType="numeric"
              value={maxRate}
              onChangeText={setMaxRate}
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.filterInput}
              placeholder="Min rating"
              keyboardType="numeric"
              value={minRating}
              onChangeText={setMinRating}
              placeholderTextColor="#999"
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
              <TouchableOpacity style={styles.clearBtn} onPress={() => { setMinRate(''); setMaxRate(''); setMinRating(''); setTaskers(allTaskers); }}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.applyBtn} onPress={() => applyFilters()}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View> 
          </View>
        )}

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>CATEGORIES</Text>
          {selectedCategory && <Text style={{fontSize: 12, color: COLORS.orange, fontWeight: 'bold'}}>Filtering by: {selectedCategory}</Text>}
        </View>
        
        <View style={styles.categoriesGrid}>
          {categories.map((cat) => {
             const isSelected = selectedCategory === cat.name;
             return (
              <TouchableOpacity 
                key={cat.id} 
                style={[styles.categoryCard, isSelected && styles.categoryCardSelected]} 
                onPress={() => handleCategoryPress(cat.name)}
              >
                <Image source={{ uri: cat.image }} style={styles.catImage} />
                <View style={styles.catOverlay} />
                <View style={styles.catContent}>
                  <View style={[styles.catIconBox, isSelected && {backgroundColor: COLORS.orange}]}>
                    <MaterialCommunityIcons name={cat.icon as any} size={20} color={isSelected ? 'white' : COLORS.darkBlue} />
                  </View>
                  <Text style={styles.catName}>{cat.name}</Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Popular Taskers */}
        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>
            {selectedCategory || searchQuery ? 'SEARCH RESULTS' : 'POPULAR TASKERS'}
          </Text>
          <Text style={{color: '#999', fontSize: 12}}>{filteredTaskers.length} Found</Text>
        </View>

        {filteredTaskers.map((tasker) => (
          <View key={tasker.id} style={styles.taskerCard}>
            <View style={styles.taskerHeader}>
              <Image source={{ uri: tasker.image }} style={styles.avatar} />
              <View style={styles.taskerInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.taskerName}>{tasker.name}</Text>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#BFA056" />
                    <Text style={styles.ratingText}>{tasker.rating}</Text>
                  </View>
                </View>
                <Text style={styles.reviewText}>{tasker.reviews} REVIEWS • {tasker.tasks} TASKS</Text>
                
                <View style={styles.tagsRow}>
                  {tasker.tags && tasker.tags.map((tag, idx) => (
                    <View key={idx} style={[styles.tag, selectedCategory === tag && {backgroundColor: COLORS.orange}]}>
                      <Text style={[styles.tagText, selectedCategory === tag && {color: 'white'}]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.priceColumn}>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceText}>{tasker.rate}</Text>
                  <Text style={styles.currencyText}>RON/HR</Text>
                </View>
              </View>
            </View>
            {tasker.is_online && (
              <View style={styles.onlineBadge}><Text style={styles.onlineText}>ONLINE</Text></View>
            )}
          </View>
        ))}
        {filteredTaskers.length === 0 && (
          <Text style={{textAlign: 'center', marginTop: 30, color: '#999'}}>No taskers found matching your filters.</Text>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    screenScroll: { paddingHorizontal: 20, paddingTop: 10 },
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
    logoContainer: { flexDirection: 'row', alignItems: 'center' },
    logoBox: { width: 28, height: 28, backgroundColor: COLORS.darkBlue, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    logoText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    brandName: { fontSize: 20, fontWeight: 'bold', color: COLORS.darkBlue },
    authButtons: { flexDirection: 'row', alignItems: 'center' },
    headerAvatarTouchable: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden' },
    headerAvatar: { width: 36, height: 36, borderRadius: 18 },
    headerAvatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.darkBlue, justifyContent:'center', alignItems:'center' },
    loginText: { fontWeight: '600', color: COLORS.darkBlue, marginRight: 15 },
    signUpBtn: { backgroundColor: COLORS.darkBlue, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
    signUpText: { color: 'white', fontWeight: '600', fontSize: 13 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, marginBottom: 15 },
    searchInput: { flex: 1, fontSize: 15, color: COLORS.textDark },

    // Filters
    filterRow: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 8 },
    filterToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    filtersContainer: { backgroundColor: '#FBFBFC', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' },
    filterInput: { backgroundColor: 'white', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#EEE', marginBottom: 8 },
    clearBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F5F5F5', marginRight: 8 },
    clearBtnText: { color: '#666', fontWeight: '700' },
    applyBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.darkBlue },
    applyBtnText: { color: 'white', fontWeight: '700' },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: COLORS.darkBlue, letterSpacing: 0.5 },
    categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    categoryCard: { width: '48%', height: 140, borderRadius: 20, marginBottom: 15, overflow: 'hidden', position: 'relative' },
    categoryCardSelected: { borderColor: COLORS.orange, borderWidth: 3 }, // Added style for selection
    catImage: { width: '100%', height: '100%' },
    catOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(31, 32, 65, 0.4)' },
    catContent: { position: 'absolute', bottom: 15, left: 15 },
    catIconBox: { width: 32, height: 32, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    catName: { color: 'white', fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5 },
    taskerCard: { backgroundColor: 'white', borderRadius: 24, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#eee', position: 'relative', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    taskerHeader: { flexDirection: 'row' },
    avatar: { width: 70, height: 70, borderRadius: 16, marginRight: 15 },
    taskerInfo: { flex: 1, justifyContent: 'space-between' },
    nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    taskerName: { fontSize: 17, fontWeight: '800', color: COLORS.darkBlue },
    ratingBadge: { flexDirection: 'row', backgroundColor: '#F9F7EF', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, alignItems: 'center' },
    ratingText: { fontWeight: 'bold', fontSize: 12, color: '#9C8C5E', marginLeft: 3 },
    reviewText: { color: '#999', fontSize: 11, fontWeight: '600', marginTop: 2 },
    tagsRow: { flexDirection: 'row', marginTop: 8 },
    tag: { backgroundColor: '#F5F6F8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 6 },
    tagText: { fontSize: 10, fontWeight: 'bold', color: '#8A8D9F' },
    priceColumn: { alignItems: 'flex-end', justifyContent: 'space-between' },
    priceContainer: { alignItems: 'center' },
    priceText: { fontSize: 20, fontWeight: '900', color: COLORS.darkBlue },
    currencyText: { fontSize: 9, fontWeight: 'bold', color: '#8A8D9F' },
    onlineBadge: { position: 'absolute', bottom: 12, left: 15, backgroundColor: COLORS.green, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, width: 70, alignItems: 'center' },
    onlineText: { color: 'white', fontSize: 9, fontWeight: 'bold' },
});