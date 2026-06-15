import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  images: (string | null)[];
  isOwner: boolean;
};

/** Swipeable listing photos with paging dots, a counter, and the owner badge. */
export default function ImageGallery({ images, isOwner }: Props) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleImageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentImageIndex(index);
  };

  return (
    <View style={styles.imageGallery}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleImageScroll}
        scrollEventThrottle={16}
      >
        {images.map((imageUrl, index) => (
          <View key={index} style={styles.imageContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.itemImage} resizeMode="cover" />
            ) : (
              <View style={[styles.itemImage, styles.imageMissing]}>
                <Ionicons name="image-outline" size={48} color="#B39BD5" />
                <Text style={styles.imageMissingText}>No photos yet</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.paginationDots}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, currentImageIndex === index && styles.activeDot]}
          />
        ))}
      </View>

      <View style={styles.imageCounter}>
        <Text style={styles.imageCounterText}>
          {currentImageIndex + 1}/{images.length}
        </Text>
      </View>

      {isOwner && (
        <View style={styles.ownerBadge}>
          <Ionicons name="person-circle" size={14} color="#FFFFFF" />
          <Text style={styles.ownerBadgeText}>Your Listing</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  imageGallery: {
    position: 'relative',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: 300,
    backgroundColor: '#F0F0F0',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  imageMissing: {
    backgroundColor: '#F3EFF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageMissingText: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#9B91A8',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  ownerBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#502E82',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ownerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
});
