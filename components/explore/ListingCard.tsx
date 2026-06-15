import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from '../ui/PressableScale';
import { haptics } from '../../config/haptics';
import { colors, fonts } from '../../config/theme';
import { Listing, Origin } from '../../config/types';

type Props = {
  listing: Listing;
  onPress: (origin: Origin | null) => void;
  isSaved?: boolean;
  onToggleSave?: () => void;
};

export default function ListingCard({ listing, onPress, isSaved, onToggleSave }: Props) {
  // First image URL, resolved server-side from the storage IDs in
  // listing.images. No image → branded placeholder block.
  const imageUrl = listing.imageUrls && listing.imageUrls[0];

  // Measure the card's on-screen rect at tap time and hand it up, so the
  // details screen can grow out of exactly this card (container transform).
  const cardRef = useRef<View>(null);
  const handlePress = () => {
    const node = cardRef.current;
    if (node && typeof node.measureInWindow === 'function') {
      node.measureInWindow((x, y, width, height) => onPress({ x, y, width, height }));
    } else {
      onPress(null);
    }
  };

  // Remote images fade in once loaded so cards don't pop harshly.
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const handleImageLoad = () => {
    Animated.timing(imageOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const heartScale = useRef(new Animated.Value(1)).current;
  const handleHeartPress = () => {
    haptics.tap();
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.35, speed: 60, bounciness: 12, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, speed: 40, bounciness: 8, useNativeDriver: true }),
    ]).start();
    onToggleSave?.();
  };

  return (
    <PressableScale ref={cardRef} style={styles.card} onPress={handlePress}>
      <View style={styles.imagePlaceholder}>
        {imageUrl ? (
          <Animated.Image
            source={{ uri: imageUrl }}
            style={[styles.placeholderImage, { opacity: imageOpacity }]}
            resizeMode="cover"
            onLoad={handleImageLoad}
          />
        ) : (
          <Ionicons name="image-outline" size={32} color="#B39BD5" />
        )}
        {/* Heart only appears when a save handler is wired in. Its own Pressable
            handles the tap, so hearting doesn't open the listing. */}
        {onToggleSave && (
          <Pressable
            style={styles.heartButton}
            hitSlop={8}
            onPress={handleHeartPress}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? 'Remove from saved' : 'Save listing'}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={isSaved ? 'heart' : 'heart-outline'}
                size={20}
                color={isSaved ? colors.save : '#FFFFFF'}
              />
            </Animated.View>
          </Pressable>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
        <Text style={styles.price}>${listing.price}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.condition}>{listing.condition}</Text>
          <Text style={styles.category}>{listing.category}</Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    maxWidth: 180,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: '#F0EDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: 12,
  },
  title: {
    fontSize: 15,
    color: colors.textBody,
    marginBottom: 4,
    fontFamily: fonts.semibold,
  },
  price: {
    fontSize: 17,
    color: colors.primary,
    marginBottom: 6,
    fontFamily: fonts.semibold,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  condition: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  category: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'Poppins_400Regular',
  },
});
