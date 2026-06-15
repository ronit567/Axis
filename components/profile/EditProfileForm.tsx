import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileForm, UserProfile } from '../../config/types';

type Props = {
  form: ProfileForm;
  setForm: (form: ProfileForm) => void;
  profile: UserProfile;
  isSaving: boolean;
  isUploadingAvatar: boolean;
  editName: string;
  editSlide: Animated.AnimatedInterpolation<number>;
  onChangeAvatar: () => void;
  onCancel: () => void;
  onSave: () => void;
};

/**
 * The Edit Profile layer: a compact pinned banner (photo + Cancel) over a
 * scrolling form, sliding in from the right over the profile view. The parent
 * owns the animation value and the save/avatar logic; this is presentational.
 */
export default function EditProfileForm({
  form,
  setForm,
  profile,
  isSaving,
  isUploadingAvatar,
  editName,
  editSlide,
  onChangeAvatar,
  onCancel,
  onSave,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.editContainer,
        { transform: [{ translateX: editSlide }] },
      ]}
    >
      <View style={[styles.editBanner, { paddingTop: insets.top + 12 }]}>
        <View style={styles.bannerTopRow}>
          <View style={styles.bannerSpacer} />
          <TouchableOpacity onPress={onCancel} hitSlop={8} accessibilityLabel="Cancel">
            <Text style={styles.bannerAction}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.editIdentityRow}>
          <TouchableOpacity
            style={styles.avatarContainerSm}
            onPress={onChangeAvatar}
            disabled={isUploadingAvatar}
          >
            {profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatarSm} />
            ) : (
              <View style={[styles.avatarSm, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={30} color="#B39BD5" />
              </View>
            )}
            <View style={styles.avatarBadgeSm}>
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={12} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.editIdentityInfo}>
            <Text style={styles.editName} numberOfLines={1}>{editName}</Text>
            <Text style={styles.editEmail} numberOfLines={1}>{profile?.email}</Text>
            <Text style={styles.editHint}>Tap the photo to change it</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.editFormFlex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.editFormFlex}
          contentContainerStyle={styles.editScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
            onPress={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  editContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  editBanner: {
    backgroundColor: '#502E82',
    paddingBottom: 22,
    paddingHorizontal: 24,
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
  bannerSpacer: {
    flex: 1,
  },
  bannerAction: {
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    color: '#FFFFFF',
  },
  editIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  avatarContainerSm: {
    position: 'relative',
    marginRight: 16,
  },
  avatarSm: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3EAFA',
  },
  avatarBadgeSm: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#B39BD5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#502E82',
  },
  editIdentityInfo: {
    flex: 1,
  },
  editName: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  editEmail: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#C9B8E4',
    marginTop: 1,
  },
  editHint: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#E2D6F5',
    marginTop: 5,
  },
  editFormFlex: {
    flex: 1,
  },
  editScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
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
});
