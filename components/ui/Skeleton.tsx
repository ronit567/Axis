import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, StyleProp, ViewStyle, DimensionValue } from 'react-native';

type SkeletonProps = {
  width: DimensionValue;
  height: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

type WrapperProps = { style?: StyleProp<ViewStyle> };

/**
 * Brand-tinted pulsing placeholder block. Compose into screen-specific
 * skeletons so loading states preview the layout instead of showing a
 * bare spinner.
 */
export function Skeleton({ width, height, borderRadius = 8, style }: SkeletonProps) {
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[styles.block, { width, height, borderRadius, opacity: pulse }, style]}
    />
  );
}

/** Mirrors ListingCard's layout: image, title, price, meta row. */
export function SkeletonListingCard({ style }: WrapperProps) {
  return (
    <View style={[styles.card, style]}>
      <Skeleton width="100%" height={140} borderRadius={0} />
      <View style={styles.cardContent}>
        <Skeleton width="85%" height={14} />
        <Skeleton width="40%" height={16} style={styles.gapTop} />
        <View style={[styles.metaRow, styles.gapTop]}>
          <Skeleton width={50} height={10} />
          <Skeleton width={40} height={10} />
        </View>
      </View>
    </View>
  );
}

/** Mirrors a conversation row: thumbnail + two lines + timestamp. */
export function SkeletonChatRow({ style }: WrapperProps) {
  return (
    <View style={[styles.chatRow, style]}>
      <Skeleton width={56} height={56} borderRadius={12} />
      <View style={styles.chatRowText}>
        <Skeleton width="55%" height={14} />
        <Skeleton width="80%" height={11} style={styles.gapTop} />
      </View>
      <Skeleton width={42} height={10} />
    </View>
  );
}

/** A horizontal feed section: title bar + row of listing cards. */
export function SkeletonFeedSection({ style }: WrapperProps) {
  return (
    <View style={style}>
      <Skeleton width={110} height={18} style={styles.sectionTitle} />
      <View style={styles.cardRow}>
        <SkeletonListingCard />
        <SkeletonListingCard />
        <SkeletonListingCard />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: '#E6DFF0',
  },
  card: {
    width: 160,
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
  cardContent: {
    padding: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gapTop: {
    marginTop: 8,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  chatRowText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  sectionTitle: {
    marginLeft: 20,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
});
