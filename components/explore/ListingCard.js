import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from '../ui/PressableScale';

export default function ListingCard({ listing, onPress, isSaved, onToggleSave }) {
  // Get the first image URL or use placeholder (imageUrls is resolved
  // server-side from the storage IDs in listing.images)
  const imageSource = listing.imageUrls && listing.imageUrls[0]
    ? { uri: listing.imageUrls[0] }
    : require('../../images/grey_circle.png');

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
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.35, speed: 60, bounciness: 12, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, speed: 40, bounciness: 8, useNativeDriver: true }),
    ]).start();
    onToggleSave();
  };

  return (
    <PressableScale style={styles.card} onPress={onPress}>
      <View style={styles.imagePlaceholder}>
        <Animated.Image
          source={imageSource}
          style={[styles.placeholderImage, { opacity: imageOpacity }]}
          resizeMode="cover"
          onLoad={handleImageLoad}
        />
        {/* Heart only appears when a save handler is wired in. Its own Pressable
            handles the tap, so hearting doesn't open the listing. */}
        {onToggleSave && (
          <Pressable
            style={styles.heartButton}
            hitSlop={8}
            onPress={handleHeartPress}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={isSaved ? 'heart' : 'heart-outline'}
                size={20}
                color={isSaved ? '#E0245E' : '#FFFFFF'}
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
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Poppins_600SemiBold',
  },
  price: {
    fontSize: 17,
    fontWeight: '700',
    color: '#B39BD5',
    marginBottom: 6,
    fontFamily: 'Poppins_600SemiBold',
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
