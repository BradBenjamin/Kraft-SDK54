import { COLORS } from '@/constants/data';
import { supabase } from '@/lib/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AccountScreen() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Profile state
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Get user and profile if logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchProfile(user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (id: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (error) {
        console.log('Profile fetch error:', error.message);
        setProfile(null);
        return;
      }
      setProfile(data);
      setName(data?.full_name || '');
    } catch (err) {
      console.log('Fetch profile err', err);
    }
  };

  async function handleAuth(type: 'LOGIN' | 'SIGNUP') {
    setLoading(true);
    const { error } = type === 'LOGIN' 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) Alert.alert("Error", error.message);
    else if (type === 'SIGNUP') Alert.alert("Success", "Check your email for a confirmation link.");
    
    setLoading(false);
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1,1],
      quality: 0.6,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      await uploadImageToSupabase(uri);
    }
  };

  const uploadImageToSupabase = async (uri: string) => {
    if (!user) return;
    setAvatarUploading(true);
    try {
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const filePath = `public/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase
        .storage
        .from('crafter-images')
        .upload(filePath, arrayBuffer, { contentType: `image/${fileExt}` });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase
        .storage
        .from('crafter-images')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      // Save to profile
      const { error: profileError } = await supabase.from('profiles').upsert({ id: user.id, avatar_url: publicUrl });
      if (profileError) throw profileError;

      await fetchProfile(user.id);

    } catch (err: any) {
      console.log('Avatar upload error', err);
      Alert.alert('Upload failed', err.message || 'Unable to upload image');
    } finally {
      setAvatarUploading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase.from('profiles').upsert({ id: user.id, full_name: name });
      if (error) throw error;
      await fetchProfile(user.id);
      Alert.alert('Saved', 'Profile updated');
    } catch (err: any) {
      console.log('Save profile err', err);
      Alert.alert('Error', err.message || 'Could not save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  if (session) {
    const userEmail = session.user.email;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ padding: 30, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.avatarRow}>
              <Pressable onPress={pickImage} style={styles.avatarTouchable}>
                {avatarUploading ? (
                  <View style={styles.avatarPlaceholder}><ActivityIndicator color="#fff" /></View>
                ) : profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}><Text style={styles.avatarInitials}>{(userEmail || '').charAt(0).toUpperCase()}</Text></View>
                )}

                <View style={styles.avatarEdit}><Ionicons name="camera" size={16} color="#fff" /></View>
              </Pressable>

            </View>

            <Text style={styles.labelSmallCenter}>FULL NAME</Text>
            <TextInput value={name} onChangeText={setName} placeholder="Your name" style={[styles.input, styles.inputCentered]} />

            <Text style={styles.emailTextCenter}>{userEmail}</Text>

            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 18 }]} onPress={saveProfile} disabled={savingProfile}>
              {savingProfile ? <ActivityIndicator color="#fff"/> : <Text style={styles.primaryBtnText}>Save Profile</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.ghostBtn, { marginTop: 12 }]} onPress={handleSignOut}>
              <Text style={styles.ghostBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.centerContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.authLogoBox}><Text style={styles.authLogoText}>C</Text></View>
        <Text style={styles.authTitle}>Log in to Craftie</Text>

        <View style={styles.formContainer}>
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <TextInput 
            style={styles.input} 
            placeholder="nume@exemplu.ro" 
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <Text style={styles.label}>PASSWORD</Text>
          <TextInput 
            style={styles.input} 
            secureTextEntry 
            value={password}
            onChangeText={setPassword}
          />
          
          <TouchableOpacity style={styles.loginBtn} onPress={() => handleAuth('LOGIN')} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.loginBtnText}>Log in</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleAuth('SIGNUP')} disabled={loading}>
            <Text style={styles.secondaryBtnText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    centerContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    authLogoBox: { width: 60, height: 60, backgroundColor: COLORS.darkBlue, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    authLogoText: { fontSize: 30, color: 'white', fontWeight: 'bold' },
    authTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.darkBlue, marginBottom: 10 },
    authSubtitle: { textAlign: 'center', color: '#777', marginBottom: 40 },
    formContainer: { width: '100%' },
    label: { fontSize: 11, fontWeight: 'bold', color: COLORS.darkBlue, marginBottom: 8, letterSpacing: 0.5 },
    labelSmall: { fontSize: 10, fontWeight: 'bold', color: COLORS.darkBlue, marginBottom: 6, letterSpacing: 0.5 },
    labelSmallCenter: { fontSize: 10, fontWeight: 'bold', color: COLORS.darkBlue, marginBottom: 8, letterSpacing: 0.5, textAlign: 'center' },
    input: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EEE', borderRadius: 12, padding: 12, marginBottom: 10, fontSize: 14 },
    inputCentered: { textAlign: 'center' },
    loginBtn: { backgroundColor: COLORS.darkBlue, padding: 14, borderRadius: 14, alignItems: 'center', marginBottom: 15 },
    loginBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    secondaryBtn: { backgroundColor: 'white', padding: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#eee', marginBottom: 25 },
    secondaryBtnText: { color: COLORS.darkBlue, fontWeight: 'bold', fontSize: 14 },
    accountHeader: { flexDirection: 'row', alignItems: 'center' },
    avatarTouchable: { width: 120, height: 120, borderRadius: 60, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    avatarRow: { width: '100%', alignItems: 'center', marginBottom: 10 },
    avatarImage: { width: 120, height: 120, borderRadius: 60 },
    avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.darkBlue, justifyContent: 'center', alignItems: 'center' },
    avatarInitials: { color: 'white', fontSize: 40, fontWeight: 'bold' },
    avatarEdit: { position: 'absolute', right: 6, bottom: 6, width: 34, height: 34, borderRadius: 18, backgroundColor: COLORS.orange, justifyContent: 'center', alignItems: 'center', elevation: 3 },
    emailText: { color: '#444', fontWeight: '600' },
    emailTextCenter: { color: '#666', fontWeight: '600', textAlign: 'center', marginTop: 6 },

    // Card + buttons
    card: { width: '100%', backgroundColor: 'white', borderRadius: 16, padding: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 6, alignItems: 'center' },
    primaryBtn: { width: '100%', backgroundColor: COLORS.orange, padding: 14, borderRadius: 14, alignItems: 'center' },
    primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    ghostBtn: { width: '100%', backgroundColor: 'transparent', padding: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
    ghostBtnText: { color: COLORS.darkBlue, fontWeight: '700' },
});