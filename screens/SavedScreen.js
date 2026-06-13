import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import ListingCard from '../components/explore/ListingCard';
import FadeInView from '../components/ui/FadeInView';
import ScreenHeader from '../components/ui/ScreenHeader';
import { SkeletonListingCard } from '../components/ui/Skeleton';

export default function SavedScreen({ onBack, onItemPress, embedded }) {
  // Reactive: unsaving from here (or anywhere) drops the card immediately.
  const saved = useQuery(api.saved.listSaved);
  const toggleSave = useMutation(api.saved.toggleSave);

  const isLoading = saved === undefined;
  const savedCount = saved?.length ?? 0;
  // The caption gives the purple band a second line of content so it reads as a
  // header rather than a bare strip; empty state nudges how to fill it.
  const caption =
    !isLoading && savedCount === 0
      ? 'Tap the heart on a listing to save it here'
      : "Things you're keeping an eye on";

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Saved"
        embedded={embedded}
        onBack={onBack}
        badgeCount={savedCount}
      >
        <Text style={styles.headerCaption}>{caption}</Text>
      </ScreenHeader>

      {isLoading ? (
        // Skeleton grid previews the two-column saved layout while loading
        <View style={styles.skeletonGrid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCell}>
              <SkeletonListingCard />
            </View>
          ))}
        </View>
      ) : saved.length === 0 ? (
        <FadeInView style={styles.centered}>
          <Ionicons name="heart-outline" size={64} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No saved items yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart on any listing to save it here for later.
          </Text>
        </FadeInView>
      ) : (
        <FlatList
          data={saved}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <ListingCard
                listing={item}
                onPress={(origin) => onItemPress && onItemPress(item, origin)}
                isSaved
                onToggleSave={() => toggleSave({ listingId: item._id })}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerCaption: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#D8CCEC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  list: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  skeletonCell: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  cardWrap: {
    flex: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
});
