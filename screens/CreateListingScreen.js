import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

const CATEGORIES = ['Books', 'Electronics', 'Furniture', 'Clothing', 'Appliances', 'Other'];
const CONDITIONS = ['Like New', 'Good', 'Fair'];

// Pass a `listing` (hydrated, with imageUrls) to edit it instead of creating.
export default function CreateListingScreen({ onBack, onSuccess, listing }) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createListing = useMutation(api.listings.create);
  const updateListing = useMutation(api.listings.update);
  const isEditing = !!listing;
  const [title, setTitle] = useState(listing?.title ?? '');
  const [description, setDescription] = useState(listing?.description ?? '');
  const [price, setPrice] = useState(listing ? String(listing.price) : '');
  const [category, setCategory] = useState(listing?.category ?? '');
  const [condition, setCondition] = useState(listing?.condition ?? '');
  const [meetupLocation, setMeetupLocation] = useState(listing?.meetupLocation ?? '');
  const [meetupAvailability, setMeetupAvailability] = useState(listing?.meetupAvailability ?? '');
  // Each image: { uri, storageId? } — existing images keep their storage ID
  // and are never re-uploaded; new picks upload on submit.
  const [images, setImages] = useState(() =>
    listing
      ? listing.images
          .map((storageId, i) => ({ storageId, uri: listing.imageUrls?.[i] }))
          .filter((img) => img.uri)
      : [],
  );
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can only add up to 5 images.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please grant camera roll permissions to add photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, { uri: result.assets[0].uri }]);
    }
  };

  const takePhoto = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can only add up to 5 images.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, { uri: result.assets[0].uri }]);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title for your listing.');
      return false;
    }
    if (!price.trim() || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      Alert.alert('Required', 'Please enter a valid price.');
      return false;
    }
    // Matches the server cap (LIMITS.maxPrice) so an over-cap price is caught
    // here, before any images upload, instead of failing the mutation after.
    if (parseFloat(price) > 1000000) {
      Alert.alert('Price too high', 'Price must be $1,000,000 or less.');
      return false;
    }
    if (!category) {
      Alert.alert('Required', 'Please select a category.');
      return false;
    }
    if (!condition) {
      Alert.alert('Required', 'Please select the condition.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Upload each image to Convex storage: get a one-time upload URL, POST
      // the file bytes, keep the returned storage ID for the listing.
      // Existing images (edit mode) already have a storage ID and are skipped.
      const storageIds = [];
      for (const img of images) {
        if (img.storageId) {
          storageIds.push(img.storageId);
          continue;
        }
        const uploadUrl = await generateUploadUrl();
        const file = await fetch(img.uri);
        const blob = await file.blob();
        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': blob.type || 'image/jpeg' },
          body: blob,
        });
        if (!result.ok) {
          throw new Error(`Image upload failed (${result.status})`);
        }
        const { storageId } = await result.json();
        storageIds.push(storageId);
      }

      const fields = {
        title: title.trim(),
        description: description.trim() || undefined,
        price: parseFloat(price),
        category,
        condition,
        images: storageIds,
        meetupLocation: meetupLocation.trim() || undefined,
        meetupAvailability: meetupAvailability.trim() || undefined,
      };

      let listingId;
      if (isEditing) {
        await updateListing({ id: listing._id, ...fields });
        listingId = listing._id;
      } else {
        // Create the listing (seller is derived from the session server-side)
        listingId = await createListing(fields);
      }

      Alert.alert('Success', isEditing ? 'Your listing has been updated!' : 'Your listing has been posted!', [
        { text: 'OK', onPress: () => onSuccess && onSuccess(listingId) },
      ]);
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} listing. Please try again.`);
    }

    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Listing' : 'Create Listing'}</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <Text style={styles.sectionSubtitle}>Add up to 5 photos of your item</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imageScroll}
            >
              {images.map((img, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri: img.uri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF4444" />
                  </TouchableOpacity>
                  {index === 0 && (
                    <View style={styles.mainBadge}>
                      <Text style={styles.mainBadgeText}>Main</Text>
                    </View>
                  )}
                </View>
              ))}

              {images.length < 5 && (
                <TouchableOpacity style={styles.addImageButton} onPress={showImageOptions}>
                  <Ionicons name="camera" size={32} color="#B39BD5" />
                  <Text style={styles.addImageText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="What are you selling?"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          {/* Price */}
          <View style={styles.section}>
            <Text style={styles.label}>Price *</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0.00"
                placeholderTextColor="#999"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                maxLength={10}
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.optionsContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.optionButton,
                    category === cat && styles.optionButtonSelected,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      category === cat && styles.optionTextSelected,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Condition */}
          <View style={styles.section}>
            <Text style={styles.label}>Condition *</Text>
            <View style={styles.optionsContainer}>
              {CONDITIONS.map((cond) => (
                <TouchableOpacity
                  key={cond}
                  style={[
                    styles.optionButton,
                    condition === cond && styles.optionButtonSelected,
                  ]}
                  onPress={() => setCondition(cond)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      condition === cond && styles.optionTextSelected,
                    ]}
                  >
                    {cond}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your item (condition details, size, brand, etc.)"
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={1000}
            />
          </View>

          {/* Meetup Location */}
          <View style={styles.section}>
            <Text style={styles.label}>Meetup Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., UWO campus, Taylor Library"
              placeholderTextColor="#999"
              value={meetupLocation}
              onChangeText={setMeetupLocation}
              maxLength={100}
            />
          </View>

          {/* Meetup Availability */}
          <View style={styles.section}>
            <Text style={styles.label}>Availability</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Weekdays after 3pm, Flexible"
              placeholderTextColor="#999"
              value={meetupAvailability}
              onChangeText={setMeetupAvailability}
              maxLength={100}
            />
          </View>

          {/* Spacer for bottom button */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submit Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>{isEditing ? 'Save Changes' : 'Post Listing'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  placeholder: {
    width: 40,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#333333',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  dollarSign: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 18,
    fontFamily: 'Poppins_500Medium',
    color: '#333333',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  optionButtonSelected: {
    backgroundColor: '#F3EAFA',
    borderColor: '#B39BD5',
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666666',
  },
  optionTextSelected: {
    color: '#502E82',
    fontFamily: 'Poppins_500Medium',
  },
  imageScroll: {
    flexDirection: 'row',
  },
  imageContainer: {
    marginRight: 12,
    position: 'relative',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  mainBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#502E82',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mainBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: '#FFFFFF',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
    marginTop: 4,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  submitButton: {
    backgroundColor: '#502E82',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#B39BD5',
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});
