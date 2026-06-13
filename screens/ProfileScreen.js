import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Skeleton } from '../components/ui/Skeleton';

export default function ProfileScreen({ onBack, onLogout, onEditListing, onItemPress, embedded }) {
  const profile = useQuery(api.users.current);
  const myListings = useQuery(api.listings.myListings);
  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const markSold = useMutation(api.listings.markSold);
  const removeListing = useMutation(api.listings.remove);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [form, setForm] = useState(null);

  const startEditing = () => {
    setForm({
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      program: profile?.program ?? '',
      yearOfStudy: profile?.yearOfStudy ?? '',
      bio: profile?.bio ?? '',
    });
    setIsEditing(true);
  };

  const saveProfile = async () => {
    if (!form.firstName.trim()) {
      Alert.alert('Required', 'Please enter your first name.');
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        program: form.program.trim(),
        yearOfStudy: form.yearOfStudy.trim(),
        bio: form.bio.trim(),
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Profile save error:', error);
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    }
    setIsSaving(false);
  };

  const changeAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please grant camera roll permissions to set a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setIsUploadingAvatar(true);
    try {
      // Same upload flow as listing photos: upload URL → POST bytes → storage ID
      const uploadUrl = await generateUploadUrl();
      const file = await fetch(result.assets[0].uri);
      const blob = await file.blob();
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': blob.type || 'image/jpeg' },
        body: blob,
      });
      if (!response.ok) {
        throw new Error(`Avatar upload failed (${response.status})`);
      }
      const { storageId } = await response.json();
      await updateProfile({ avatarId: storageId });
    } catch (error) {
      console.error('Avatar upload error:', error);
      Alert.alert('Error', 'Failed to update your photo. Please try again.');
    }
    setIsUploadingAvatar(false);
  };

  const handleMarkSold = (listing) => {
    Alert.alert('Mark as Sold', `Mark "${listing.title}" as sold?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark Sold', onPress: () => markSold({ id: listing._id }) },
    ]);
  };

  const handleDelete = (listing) => {
    Alert.alert('Delete Listing', `Delete "${listing.title}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeListing({ id: listing._id }),
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: onLogout },
    ]);
  };

  if (profile === undefined) {
    // Skeleton previews the identity block while the profile loads
    return (
      <View style={styles.container}>
        <View style={styles.skeletonIdentity}>
          <Skeleton width={96} height={96} borderRadius={48} />
          <Skeleton width={160} height={18} style={styles.skeletonLine} />
          <Skeleton width={200} height={13} style={styles.skeletonLine} />
          <Skeleton width={130} height={13} style={styles.skeletonLine} />
        </View>
      </View>
    );
  }

  const fullName = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'Student';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {embedded ? (
          // Reached as a bottom-nav tab — no back arrow, the nav handles it.
          <View style={styles.backButton} />
        ) : (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Profile</Text>
        {isEditing ? (
          <TouchableOpacity style={styles.headerAction} onPress={() => setIsEditing(false)}>
            <Text style={styles.headerActionText}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.headerAction} onPress={startEditing}>
            <Text style={styles.headerActionText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar + identity */}
        <View style={styles.identitySection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={changeAvatar} disabled={isUploadingAvatar}>
            {profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={44} color="#B39BD5" />
              </View>
            )}
            <View style={styles.avatarBadge}>
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>

          {!isEditing && (
            <>
              <Text style={styles.name}>{fullName}</Text>
              <Text style={styles.email}>{profile?.email}</Text>
              {(profile?.program || profile?.yearOfStudy) && (
                <Text style={styles.programLine}>
                  {[profile?.program, profile?.yearOfStudy && `Year ${profile.yearOfStudy}`]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              )}
              {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
            </>
          )}
        </View>

        {/* Edit form */}
        {isEditing && (
          <View style={styles.editSection}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={form.firstName}
                  onChangeText={(v) => setForm({ ...form, firstName: v })}
                  placeholder="First name"
                  placeholderTextColor="#999"
                  maxLength={50}
                />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={form.lastName}
                  onChangeText={(v) => setForm({ ...form, lastName: v })}
                  placeholder="Last name"
                  placeholderTextColor="#999"
                  maxLength={50}
                />
              </View>
            </View>
            <Text style={styles.label}>Program</Text>
            <TextInput
              style={styles.input}
              value={form.program}
              onChangeText={(v) => setForm({ ...form, program: v })}
              placeholder="e.g., Computer Science"
              placeholderTextColor="#999"
              maxLength={100}
            />
            <Text style={styles.label}>Year of Study</Text>
            <TextInput
              style={styles.input}
              value={form.yearOfStudy}
              onChangeText={(v) => setForm({ ...form, yearOfStudy: v })}
              placeholder="e.g., 2"
              placeholderTextColor="#999"
              maxLength={20}
            />
            <Text style={styles.label}>About You</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.bio}
              onChangeText={(v) => setForm({ ...form, bio: v })}
              placeholder="A few words about yourself"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={300}
            />
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={saveProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* My Listings */}
        <View style={styles.listingsSection}>
          <Text style={styles.sectionTitle}>My Listings</Text>
          {myListings === undefined ? (
            <View style={styles.skeletonListings}>
              <Skeleton width="100%" height={72} borderRadius={12} />
              <Skeleton width="100%" height={72} borderRadius={12} style={styles.skeletonLine} />
            </View>
          ) : myListings.length === 0 ? (
            <Text style={styles.emptyText}>You haven't listed anything yet.</Text>
          ) : (
            myListings.map((listing) => (
              <View key={listing._id} style={styles.listingRow}>
                <TouchableOpacity
                  style={styles.listingMain}
                  onPress={() => onItemPress && onItemPress(listing)}
                >
                  <Image
                    source={
                      listing.imageUrls && listing.imageUrls[0]
                        ? { uri: listing.imageUrls[0] }
                        : require('../images/grey_circle.png')
                    }
                    style={styles.listingThumb}
                  />
                  <View style={styles.listingInfo}>
                    <Text style={styles.listingTitle} numberOfLines={1}>
                      {listing.title}
                    </Text>
                    <Text style={styles.listingPrice}>${listing.price}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        listing.status === 'sold' ? styles.statusSold : styles.statusActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          listing.status === 'sold' ? styles.statusTextSold : styles.statusTextActive,
                        ]}
                      >
                        {listing.status === 'sold' ? 'Sold' : 'Active'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <View style={styles.listingActions}>
                  {onEditListing && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => onEditListing(listing)}
                    >
                      <Ionicons name="pencil-outline" size={20} color="#502E82" />
                    </TouchableOpacity>
                  )}
                  {listing.status === 'active' && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleMarkSold(listing)}
                    >
                      <Ionicons name="checkmark-done-outline" size={20} color="#2E7D32" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(listing)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  skeletonIdentity: {
    alignItems: 'center',
    paddingTop: 140,
  },
  skeletonLine: {
    marginTop: 14,
  },
  skeletonListings: {
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
  },
  headerAction: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  headerActionText: {
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    color: '#502E82',
  },
  content: {
    flex: 1,
  },
  identitySection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#502E82',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  name: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
    marginTop: 12,
  },
  email: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
    marginTop: 2,
  },
  programLine: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#502E82',
    marginTop: 6,
  },
  bio: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666666',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  editSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldHalf: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#333333',
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#333333',
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
  },
  saveButton: {
    backgroundColor: '#502E82',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#B39BD5',
  },
  saveButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  listingsSection: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
    marginVertical: 16,
  },
  listingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  listingMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  listingThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
  },
  listingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listingTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#333333',
  },
  listingPrice: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#B39BD5',
    marginTop: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  statusActive: {
    backgroundColor: '#E8F5E9',
  },
  statusSold: {
    backgroundColor: '#EEEEEE',
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
  },
  statusTextActive: {
    color: '#2E7D32',
  },
  statusTextSold: {
    color: '#666666',
  },
  listingActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFF5F5',
  },
  logoutText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#D32F2F',
    marginLeft: 8,
  },
});
