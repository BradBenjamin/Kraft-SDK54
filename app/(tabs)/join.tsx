import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// FIX: Use Safe Area from context (fixes warning)
import { COLORS } from '@/constants/data';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function JoinScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [tags, setTags] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const fetchProfile = async (id?: string) => {
    if (!id) return;
    try {
      const { data } = await supabase.from('profiles').select('full_name').eq('id', id).single();
      setName(data?.full_name ?? '');
    } catch (e) {
      console.log('Fetch profile error', e);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchProfile(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchProfile(u.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleApply = async () => {
    if (!user) {
      Alert.alert("Account Required", "Please log in or sign up from the Account tab first.");
      router.push('/(tabs)/account');
      return;
    }
    setIsApplying(true);
  };

  const pickImage = async () => {
    // FIX: Updated MediaType syntax to avoid deprecation warning
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // FIX: Completely rewritten upload function using fetch (Bypasses FileSystem errors)
  const uploadImageToSupabase = async (uri: string) => {
    try {
      // 1. Fetch the file uri to get a Blob/ArrayBuffer
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      // 2. Define path
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `public/${user.id}/${fileName}`;

      // 3. Upload raw ArrayBuffer to Supabase
      const { error: uploadError } = await supabase
        .storage
        .from('crafter-images')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
        });

      if (uploadError) throw uploadError;

      // 4. Get Public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('crafter-images')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;

    } catch (error: any) {
      console.log('Upload Logic Error:', error);
      // If arrayBuffer fails, check if 'blob()' works better in your specific debug environment
      throw new Error('Failed to upload image. ' + (error.message || ''));
    }
  };

  const submitApplication = async () => {
    if (!rate || !tags || !imageUri) {
      Alert.alert("Missing Info", "Please fill in all fields and upload a photo.");
      return;
    }

    setLoading(true);
    try {
      console.log("Starting upload...");
      const publicImageUrl = await uploadImageToSupabase(imageUri);
      console.log("Upload success:", publicImageUrl);

      // Create/Update Profile (use provided name if available)
      const displayName = (name && name.trim().length > 0) ? name.trim() : user.email.split('@')[0];

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          full_name: displayName, 
        });

      if (profileError) console.log("Profile Warning:", profileError);

      // Create Tasker

      const { error: taskerError } = await supabase
        .from('taskers')
        .insert([{
          user_id: user.id, 
          name: displayName,
          rating: 5.0,     
          reviews: 0,
          tasks: 0,
          tags: tags.split(',').map(t => t.trim().toUpperCase()),
          rate: parseInt(rate),
          is_online: true,
          image: publicImageUrl
        }]);

      if (taskerError) throw taskerError;

      Alert.alert("Success!", "You are now a Tasker. Check the Home Feed!");
      setIsApplying(false);
      setImageUri(null);
      setRate('');
      setTags('');
      router.push('/(tabs)');

    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderApplicationForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>Crafter Application</Text>
      <Text style={styles.formSub}>Complete your profile to start earning.</Text>

      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="camera" size={30} color="#999" />
              <Text style={styles.uploadText}>Upload Photo</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>FULL NAME (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Your display name"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>HOURLY RATE (RON)</Text>
      <TextInput 
        style={styles.input} 
        placeholder="e.g. 60" 
        keyboardType="numeric"
        value={rate}
        onChangeText={setRate}
      />

      <Text style={styles.label}>SKILLS (Comma separated)</Text>
      <TextInput 
        style={styles.input} 
        placeholder="e.g. MOVING, CLEANING" 
        value={tags}
        onChangeText={setTags}
        autoCapitalize="characters"
      />
      
      <TouchableOpacity style={styles.applyBtn} onPress={submitApplication} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.applyBtnText}>SUBMIT APPLICATION</Text>}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => setIsApplying(false)}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLanding = () => (
    <View>
      <View style={styles.heroContainer}>
        <Ionicons name="images-outline" size={60} color="rgba(255,255,255,0.3)" style={{position: 'absolute', top: 20}}/>
        <View style={styles.orangeTag}><Text style={styles.orangeTagText}>OPPORTUNITIES IN CLUJ</Text></View>
        <Text style={styles.heroTitle}>Do you want to{"\n"}become a crafter?</Text>
        <Text style={styles.heroSubtitle}>Turn your skills into earnings today.</Text>
      </View>

      <View style={styles.joinContent}>
        <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
          <Text style={styles.applyBtnText}>APPLY TO JOIN</Text>
        </TouchableOpacity>

        <BenefitRow icon={<Text style={styles.benefitSymbol}>$</Text>} title="SET YOUR RATES" desc="You decide how much your time is worth." />
        <BenefitRow icon={<Ionicons name="time-outline" size={24} color="#8D906D" />} title="FLEXIBLE SCHEDULE" desc="Work when you want. Be your own boss." />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.screenScroll} showsVerticalScrollIndicator={false}>
        {isApplying ? renderApplicationForm() : renderLanding()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const BenefitRow = ({ icon, title, desc }: any) => (
  <View style={styles.benefitRow}>
    <View style={styles.benefitIconBox}>{icon}</View>
    <View style={{flex: 1}}>
      <Text style={styles.benefitTitle}>{title}</Text>
      <Text style={styles.benefitDesc}>{desc}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  screenScroll: { paddingHorizontal: 20, paddingTop: 10 },
  heroContainer: { backgroundColor: COLORS.darkBlue, borderRadius: 20, padding: 25, alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  orangeTag: { backgroundColor: '#D35D47', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 15 },
  orangeTagText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  heroTitle: { fontSize: 26, fontWeight: '900', color: 'white', textAlign: 'center', marginBottom: 10 },
  heroSubtitle: { color: '#ccc', fontSize: 14, textAlign: 'center' },
  joinContent: { paddingHorizontal: 5 },
  applyBtn: { backgroundColor: COLORS.darkBlue, paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginBottom: 30, marginTop: 10 },
  applyBtnText: { color: 'white', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  benefitRow: { flexDirection: 'row', marginBottom: 25 },
  benefitIconBox: { width: 45, height: 45, backgroundColor: '#F3F4ED', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  benefitSymbol: { fontSize: 22, color: '#BFA056', fontWeight: '300' },
  benefitTitle: { fontSize: 14, fontWeight: '900', color: COLORS.darkBlue, marginBottom: 4 },
  benefitDesc: { fontSize: 13, color: '#777', lineHeight: 18 },
  formContainer: { marginTop: 20 },
  formTitle: { fontSize: 22, fontWeight: '900', color: COLORS.darkBlue, marginBottom: 5 },
  formSub: { fontSize: 14, color: '#777', marginBottom: 25 },
  label: { fontSize: 11, fontWeight: 'bold', color: COLORS.darkBlue, marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EEE', borderRadius: 12, padding: 15, fontSize: 14 },
  cancelText: { textAlign: 'center', color: '#999', marginTop: 15, fontWeight: '600' },
  
  imagePicker: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#DDD' },
  previewImage: { width: '100%', height: '100%' },
  placeholderImage: { alignItems: 'center' },
  uploadText: { fontSize: 10, color: '#999', marginTop: 4 }
});