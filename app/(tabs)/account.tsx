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

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

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
      aspect: [1, 1],
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
            <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={COLORS.textLight} style={[styles.input, styles.inputCentered]} />

            <Text style={styles.emailTextCenter}>{userEmail}</Text>

            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 18 }]} onPress={saveProfile} disabled={savingProfile}>
              {savingProfile ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save Profile</Text>}
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
        <Image
          source={require('@/assets/images/logo-white.png')}
          style={styles.loginIcon}
          resizeMode="contain"
        />
        <Image
          source={require('@/assets/images/logo-white.png')}
          style={styles.loginWordmark}
          resizeMode="contain"
        />

        {/* Removed the accidental duplicate wrapper here */}
        <View style={styles.welcomeBox}>
          <Text style={styles.authTitle}>Welcome</Text>
          <Text style={styles.authSubtitle}>Sign in to your account</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.textLight}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={COLORS.textLight}
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.forgotPassword}>Forgot password?</Text>

          <TouchableOpacity style={styles.loginBtn} onPress={() => handleAuth('LOGIN')} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Sign in</Text>}
          </TouchableOpacity>

          <Text style={styles.orText}>or</Text>

          <TouchableOpacity style={styles.googleBtn}>
            <Text style={styles.googleBtnText}>G  Continue with Google</Text>
          </TouchableOpacity>

          <Text style={styles.signupPrompt}>
            Don't have an account? <Text style={styles.signupLink} onPress={() => handleAuth('SIGNUP')}>Sign up</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  authLogoBox: { width: 40, height: 40, backgroundColor: COLORS.orange, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  authLogoText: { fontSize: 24, color: 'white', fontWeight: 'bold' },
  brandTitle: { fontSize: 32, fontWeight: '400', color: COLORS.white, marginBottom: 40, letterSpacing: 1 },
  welcomeBox: { alignItems: 'center', marginBottom: 30 },
  authTitle: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  authSubtitle: { color: COLORS.textLight, fontSize: 13, marginTop: 5 },
  formContainer: { width: '100%' },
  label: { fontSize: 10, fontWeight: '700', color: COLORS.textLight, marginBottom: 8, textTransform: 'uppercase' },
  labelSmallCenter: { fontSize: 10, fontWeight: 'bold', color: COLORS.textLight, marginBottom: 8, letterSpacing: 0.5, textAlign: 'center' },
  input: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 10, padding: 14, marginBottom: 15, color: COLORS.white, fontSize: 14 },
  inputCentered: { textAlign: 'center' },
  forgotPassword: { color: COLORS.orange, fontSize: 11, textAlign: 'right', marginBottom: 20 },
  loginBtn: { backgroundColor: COLORS.orange, padding: 16, borderRadius: 12, alignItems: 'center' },
  loginBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  orText: { color: COLORS.textLight, textAlign: 'center', fontSize: 11, marginVertical: 15 },
  googleBtn: { backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.lightGray, padding: 16, borderRadius: 12, alignItems: 'center' },
  googleBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
  signupPrompt: { color: COLORS.textLight, textAlign: 'center', fontSize: 12, marginTop: 25 },
  signupLink: { color: COLORS.green, fontWeight: 'bold' },

  // Account Logged In Styles
  card: { width: '100%', backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 22, alignItems: 'center' },
  avatarTouchable: { width: 120, height: 120, borderRadius: 60, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  avatarRow: { width: '100%', alignItems: 'center', marginBottom: 20 },
  avatarImage: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { color: 'white', fontSize: 40, fontWeight: 'bold' },
  avatarEdit: { position: 'absolute', right: 6, bottom: 6, width: 34, height: 34, borderRadius: 18, backgroundColor: COLORS.orange, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  emailTextCenter: { color: COLORS.textLight, fontWeight: '600', textAlign: 'center', marginTop: 6 },
  primaryBtn: { width: '100%', backgroundColor: COLORS.orange, padding: 14, borderRadius: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  ghostBtn: { width: '100%', backgroundColor: 'transparent', padding: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.lightGray },
  ghostBtnText: { color: COLORS.white, fontWeight: '700' },
  loginIcon: {
    width: 45,
    height: 45,
    marginBottom: 15,
  },
  loginWordmark: {
    width: 120,
    height: 40,
    marginBottom: 40,
  },
});