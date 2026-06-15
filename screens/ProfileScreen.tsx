import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Skeleton } from '../components/ui/Skeleton';
import EditProfileForm from '../components/profile/EditProfileForm';
import { Listing, ItemPressHandler, ProfileForm } from '../config/types';

// The white sheet should always reach past the fold so the page reads as one
// surface rising over the banner — no purple gap underneath a short list.
const SHEET_MIN_HEIGHT = Dimensions.get('window').height - 200;
const SCREEN_WIDTH = Dimensions.get('window').width;

type Props = {
  onBack?: () => void;
  onEditListing?: (listing: Listing) => void;
  onItemPress?: ItemPressHandler;
  onOpenSettings?: () => void;
  embedded?: boolean;
};

export default function ProfileScreen({ onBack, onEditListing, onItemPress, onOpenSettings, embedded }: Props) {
  const insets = useSafeAreaInsets();
  const profile = useQuery(api.users.current);

  // One ref per listing row so a tap can measure its rect and let item details
  // grow out of it (container transform), matching the home/saved feeds.
  const rowRefs = useRef<Record<string, View | null>>({});
  const openListing = (listing: Listing) => {
    if (!onItemPress) return;
    const node = rowRefs.current[listing._id];
    if (node && typeof node.measureInWindow === 'function') {
      node.measureInWindow((x, y, width, height) =>
        onItemPress(listing, { x, y, width, height })
      );
    } else {
      onItemPress(listing, null);
    }
  };
  const myListings = useQuery(api.listings.myListings);
  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const markSold = useMutation(api.listings.markSold);
  const removeListing = useMutation(api.listings.remove);

  const [editMounted, setEditMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [form, setForm] = useState<ProfileForm | null>(null);

  // 0 = profile, 1 = edit. Tapping Edit Profile slides the edit layer in from
  // the right (and back out) like the app's other drill-ins.
  const editAnim = useRef(new Animated.Value(0)).current;

  // Parallax: the banner drifts up at half speed as the content scrolls over
  // it, so the page lifts off the header rather than sliding flatly.
  const scrollY = useRef(new Animated.Value(0)).current;
  const bannerShift = scrollY.interpolate({
    inputRange: [0, 220],
    outputRange: [0, 70],
    extrapolate: 'clamp',
  });

  const startEditing = () => {
    setForm({
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      program: profile?.program ?? '',
      yearOfStudy: profile?.yearOfStudy ?? '',
      bio: profile?.bio ?? '',
    });
    setEditMounted(true);
    Animated.timing(editAnim, {
      toValue: 1,
      duration: 340,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  // Slide back out to the right, then unmount the edit layer once it's gone.
  const closeEdit = () => {
    Animated.timing(editAnim, {
      toValue: 0,
      duration: 260,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setEditMounted(false);
    });
  };

  const saveProfile = async () => {
    if (!form) return;
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
      closeEdit();
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

  const handleMarkSold = (listing: Listing) => {
    Alert.alert('Mark as Sold', `Mark "${listing.title}" as sold?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark Sold', onPress: () => markSold({ id: listing._id }) },
    ]);
  };

  const handleDelete = (listing: Listing) => {
    Alert.alert('Delete Listing', `Delete "${listing.title}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeListing({ id: listing._id }),
      },
    ]);
  };

  if (profile === undefined) {
    // Translucent placeholders preview the identity block on the purple hero
    // while the profile loads.
    return (
      <View style={styles.container}>
        <View style={[styles.banner, { paddingTop: insets.top + 12 }]}>
          <View style={styles.bannerTopRow} />
          <View style={[styles.avatar, styles.avatarSkeleton]} />
          <View style={styles.heroSkelLineWide} />
          <View style={styles.heroSkelLine} />
        </View>
      </View>
    );
  }

  const fullName = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'Student';

  // Banner stats — give the purple something to say beyond the name.
  const listingCount = myListings?.length ?? 0;
  const soldCount = myListings?.filter((l) => l.status === 'sold').length ?? 0;
  const activeCount = listingCount - soldCount;
  const editName =
    `${form?.firstName || ''} ${form?.lastName || ''}`.trim() || 'Student';

  // Tapping Edit Profile slides this layout in from the right over the profile,
  // and back out on Cancel/Save — the same page-slide as the app's drill-ins. A
  // pinned, compact banner keeps the photo + Cancel reachable; form scrolls under.
  const editSlide = editAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_WIDTH, 0],
  });
  const editLayer = editMounted && form && profile ? (
    <EditProfileForm
      form={form}
      setForm={setForm}
      profile={profile}
      isSaving={isSaving}
      isUploadingAvatar={isUploadingAvatar}
      editName={editName}
      editSlide={editSlide}
      onChangeAvatar={changeAvatar}
      onCancel={closeEdit}
      onSave={saveProfile}
    />
  ) : null;

  return (
    <View style={styles.root}>
    <View style={styles.container}>
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
      >
        {/* Purple banner: identity + stats on the brand colour, rounded bottom
            like every other header. It drifts up at half speed as you scroll. */}
        <Animated.View
          style={[
            styles.banner,
            { paddingTop: insets.top + 12, transform: [{ translateY: bannerShift }] },
          ]}
        >
          <View style={styles.bannerTopRow}>
            {!embedded && onBack && (
              <TouchableOpacity
                onPress={onBack}
                style={styles.bannerBack}
                hitSlop={8}
                accessibilityLabel="Back"
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <View style={styles.bannerSpacer} />
            <TouchableOpacity
              onPress={() => onOpenSettings && onOpenSettings()}
              hitSlop={8}
              accessibilityLabel="Settings"
            >
              <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* View mode: the photo is just a photo — editing it lives in Edit */}
          <View style={styles.avatarContainer}>
            {profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={44} color="#B39BD5" />
              </View>
            )}
          </View>

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

          <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{listingCount}</Text>
                  <Text style={styles.statLabel}>Listings</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{activeCount}</Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{soldCount}</Text>
                  <Text style={styles.statLabel}>Sold</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.editProfileButton} onPress={startEditing}>
                <Ionicons name="create-outline" size={18} color="#502E82" />
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
        </Animated.View>

        {/* White sheet: rounded lip overlaps the banner so it reads as a panel
            rising over the purple as you scroll. */}
        <View style={styles.sheet}>
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
                  ref={(node) => { rowRefs.current[listing._id] = node; }}
                  style={styles.listingMain}
                  onPress={() => openListing(listing)}
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
        </View>
      </Animated.ScrollView>
    </View>
      {editLayer}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    // White base so over-scrolling (top or bottom) shows white, never a purple
    // gap; the purple header carries its own rounded-bottom curve.
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    // Lets the sheet's tall minHeight push the page past the fold for scroll
    // room without leaving purple showing underneath.
    flexGrow: 1,
  },
  skeletonLine: {
    marginTop: 14,
  },
  skeletonListings: {
    marginTop: 4,
  },
  banner: {
    backgroundColor: '#502E82',
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    // Curve lives on the purple here too, matching every other header
    // (Saved / Messages / Settings / the edit banner).
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    minHeight: 24,
    marginBottom: 6,
  },
  bannerBack: {
    marginRight: 12,
    marginLeft: -4,
  },
  bannerSpacer: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  statNumber: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#C9B8E4',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 11,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  editProfileText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#502E82',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    paddingTop: 4,
    paddingBottom: 100,
    minHeight: SHEET_MIN_HEIGHT,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3EAFA',
  },
  avatarSkeleton: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#B39BD5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#502E82',
  },
  name: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    marginTop: 12,
  },
  email: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#C9B8E4',
    marginTop: 2,
  },
  programLine: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#E2D6F5',
    marginTop: 6,
  },
  bio: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#D8CCEC',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  heroSkelLineWide: {
    width: 150,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    marginTop: 16,
  },
  heroSkelLine: {
    width: 200,
    height: 13,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginTop: 12,
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
    color: '#502E82',
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
});
