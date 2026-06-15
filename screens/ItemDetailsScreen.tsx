import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Share,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { haptics } from '../config/haptics';
import ImageGallery from '../components/details/ImageGallery';
import TipsCard, { SAFETY_TIPS, SELLER_TIPS } from '../components/details/TipsCard';
import { Listing, ItemPressHandler } from '../config/types';

type Props = {
  item: Listing;
  onBack: () => void;
  onChatWithSeller: (item: Listing) => void;
  onItemPress: ItemPressHandler;
  onEditListing?: (item: Listing) => void;
};

export default function ItemDetailsScreen({ item, onBack, onChatWithSeller, onItemPress, onEditListing }: Props) {
  const insets = useSafeAreaInsets();

  // Get images from item or use placeholder
  const images = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls : [null];

  // All reactive: ownership, seller card, and similar items
  const me = useQuery(api.users.current);
  const isOwner = me != null && me._id === item.sellerId;

  // Saved state for this listing (heart). savedIds returns [] when signed out.
  const savedIds = useQuery(api.saved.savedIds);
  const isSaved = (savedIds ?? []).includes(item._id);
  const toggleSave = useMutation(api.saved.toggleSave);
  const sellerProfile = useQuery(api.users.publicProfile, { userId: item.sellerId });
  const sellerLoading = sellerProfile === undefined;
  const categoryFeed = useQuery(api.listings.feed, { category: item.category, limit: 5 });
  const similarItems = (categoryFeed ?? []).filter((l) => l._id !== item._id).slice(0, 3);

  const markListingAsSold = useMutation(api.listings.markSold);
  const removeListing = useMutation(api.listings.remove);
  const incrementViews = useMutation(api.listings.incrementViews);

  // Count the view once per opened listing
  useEffect(() => {
    incrementViews({ id: item._id });
  }, [item._id]);

  // Format time posted
  const getTimePosted = () => {
    if (!item._creationTime) return 'Recently';
    const created = new Date(item._creationTime);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `${diffMinutes} min${diffMinutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const timePosted = getTimePosted();
  const views = item.views || 0;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this ${item.title} for $${item.price} on Axis!`,
        title: item.title,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  // Owner-specific actions
  const handleMarkAsSold = () => {
    Alert.alert(
      'Mark as Sold',
      'Are you sure you want to mark this item as sold? It will be removed from active listings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Sold',
          onPress: async () => {
            try {
              await markListingAsSold({ id: item._id });
              Alert.alert('Success', 'Item marked as sold!', [
                { text: 'OK', onPress: onBack }
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to mark item as sold. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleDeleteListing = () => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeListing({ id: item._id });
              Alert.alert('Deleted', 'Your listing has been removed.', [
                { text: 'OK', onPress: onBack }
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete listing. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleEditListing = () => {
    if (onEditListing) {
      onEditListing(item);
    } else {
      Alert.alert('Coming Soon', 'Edit functionality will be available soon.');
    }
  };

  // Get seller display name
  const sellerName = sellerProfile
    ? `${sellerProfile.firstName || ''} ${sellerProfile.lastName || ''}`.trim() || 'Seller'
    : 'Loading...';

  const sellerMeta = sellerProfile
    ? `${sellerProfile.program || 'Student'}${sellerProfile.yearOfStudy ? ` • ${sellerProfile.yearOfStudy}` : ''}`
    : '';

  return (
    <View style={styles.container}>
      {/* Header — floating buttons over a top scrim so they stay legible on
          any image without a flat white band cutting across the photo. */}
      <LinearGradient
        colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)']}
        style={[styles.headerScrim, { height: insets.top + 72 }]}
        pointerEvents="none"
      />
      <View style={[styles.headerOverlay, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {!isOwner && (
            <TouchableOpacity
              onPress={() => {
                haptics.tap();
                toggleSave({ listingId: item._id });
              }}
              style={styles.headerButton}
              accessibilityRole="button"
              accessibilityLabel={isSaved ? 'Remove from saved' : 'Save listing'}
            >
              <Ionicons
                name={isSaved ? 'heart' : 'heart-outline'}
                size={22}
                color={isSaved ? '#FF6090' : '#FFFFFF'}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleShare}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="Share listing"
          >
            <Ionicons name="share-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          {isOwner && (
            <TouchableOpacity
              onPress={handleEditListing}
              style={styles.headerButton}
              accessibilityRole="button"
              accessibilityLabel="Edit listing"
            >
              <Ionicons name="create-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ImageGallery images={images} isOwner={isOwner} />

        {/* Item Info */}
        <View style={styles.infoSection}>
          {/* Title and Price Row */}
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemPrice}>${item.price}</Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={16} color="#999999" />
              <Text style={styles.statText}>Posted {timePosted}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={16} color="#999999" />
              <Text style={styles.statText}>{views} views</Text>
            </View>
          </View>

          {/* Condition & Category Pills */}
          <View style={styles.pillsContainer}>
            <View style={styles.conditionPill}>
              <Ionicons name="sparkles" size={14} color="#502E82" />
              <Text style={styles.pillText}>{item.condition}</Text>
            </View>
            <View style={styles.categoryPill}>
              <Ionicons name="grid-outline" size={14} color="#666666" />
              <Text style={styles.pillTextGray}>{item.category}</Text>
            </View>
            {item.status === 'sold' && (
              <View style={styles.soldPill}>
                <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                <Text style={styles.soldPillText}>Sold</Text>
              </View>
            )}
          </View>

          {/* Owner Quick Stats */}
          {isOwner && (
            <View style={styles.ownerStatsSection}>
              <Text style={styles.sectionTitle}>Listing Performance</Text>
              <View style={styles.ownerStatsCard}>
                <View style={styles.ownerStatItem}>
                  <Ionicons name="eye" size={24} color="#B39BD5" />
                  <Text style={styles.ownerStatValue}>{views}</Text>
                  <Text style={styles.ownerStatLabel}>Views</Text>
                </View>
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            {item.description ? (
              <Text style={styles.descriptionText}>{item.description}</Text>
            ) : (
              <Text style={styles.descriptionEmpty}>
                No description yet — message the seller for details.
              </Text>
            )}
          </View>

          {/* Meetup Preferences */}
          {(item.meetupLocation || item.meetupAvailability) && (
            <View style={styles.meetupSection}>
              <Text style={styles.sectionTitle}>Meetup Preferences</Text>
              <View style={styles.meetupCard}>
                {item.meetupLocation && (
                  <View style={styles.meetupRow}>
                    <Ionicons name="location-outline" size={20} color="#B39BD5" />
                    <View style={styles.meetupInfo}>
                      <Text style={styles.meetupLabel}>Preferred Location</Text>
                      <Text style={styles.meetupValue}>{item.meetupLocation}</Text>
                    </View>
                  </View>
                )}
                {item.meetupLocation && item.meetupAvailability && (
                  <View style={styles.meetupDivider} />
                )}
                {item.meetupAvailability && (
                  <View style={styles.meetupRow}>
                    <Ionicons name="calendar-outline" size={20} color="#B39BD5" />
                    <View style={styles.meetupInfo}>
                      <Text style={styles.meetupLabel}>Availability</Text>
                      <Text style={styles.meetupValue}>{item.meetupAvailability}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Seller Info - Only show if not owner */}
          {!isOwner && (
            <View style={styles.sellerSection}>
              <Text style={styles.sectionTitle}>Seller</Text>
              <View style={styles.sellerCard}>
                <View style={styles.sellerAvatar}>
                  {sellerLoading ? (
                    <ActivityIndicator size="small" color="#B39BD5" />
                  ) : sellerProfile?.avatarUrl ? (
                    <Image source={{ uri: sellerProfile.avatarUrl }} style={styles.sellerAvatarImage} />
                  ) : (
                    <Ionicons name="person" size={28} color="#B39BD5" />
                  )}
                </View>
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>{sellerName}</Text>
                  {sellerMeta ? (
                    <Text style={styles.sellerMeta}>{sellerMeta}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          )}

          {/* Safety tips for buyers, selling tips for the owner */}
          {!isOwner && (
            <TipsCard
              title="Safety Tips"
              icon="shield-checkmark"
              accent="#4CAF50"
              backgroundColor="#F0FFF4"
              tips={SAFETY_TIPS}
            />
          )}
          {isOwner && (
            <TipsCard
              title="Seller Tips"
              icon="bulb"
              accent="#FF9800"
              backgroundColor="#FFF8E1"
              tips={SELLER_TIPS}
            />
          )}

          {/* Similar Items */}
          {similarItems.length > 0 && (
            <View style={styles.similarSection}>
              <Text style={styles.sectionTitle}>Similar Items</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.similarList}
              >
                {similarItems.map((similarItem) => (
                  <TouchableOpacity
                    key={similarItem._id}
                    style={styles.similarCard}
                    onPress={() => onItemPress && onItemPress(similarItem)}
                  >
                    <View style={styles.similarImageContainer}>
                      {similarItem.imageUrls && similarItem.imageUrls[0] ? (
                        <Image
                          source={{ uri: similarItem.imageUrls[0] }}
                          style={styles.similarImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.similarImage, styles.imageMissing]}>
                          <Ionicons name="image-outline" size={24} color="#B39BD5" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.similarTitle} numberOfLines={1}>{similarItem.title}</Text>
                    <Text style={styles.similarPrice}>${similarItem.price}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Bottom Spacer */}
          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar - Different for owner vs buyer */}
      {isOwner ? (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
          <TouchableOpacity
            style={styles.ownerActionButton}
            onPress={handleDeleteListing}
          >
            <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
            <Text style={[styles.ownerActionButtonText, { color: '#FF6B6B' }]}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.soldButton}
            onPress={handleMarkAsSold}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.soldButtonText}>Mark as Sold</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => {
              haptics.press();
              onChatWithSeller(item);
            }}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
            <Text style={styles.chatButtonText}>Message Seller</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  content: {
    flex: 1,
  },
  infoSection: {
    padding: 20,
  },
  titleRow: {
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 28,
    fontFamily: 'Poppins_600SemiBold',
    color: '#502E82',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
  },
  pillsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  conditionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F0FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  soldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  soldPillText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  pillText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#502E82',
  },
  pillTextGray: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#666666',
  },
  ownerStatsSection: {
    marginBottom: 24,
  },
  ownerStatsCard: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  ownerStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  ownerStatValue: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
    marginTop: 4,
  },
  ownerStatLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#666666',
    lineHeight: 24,
  },
  descriptionEmpty: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#9B91A8',
    fontStyle: 'italic',
  },
  imageMissing: {
    backgroundColor: '#F3EFF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetupSection: {
    marginBottom: 24,
  },
  meetupCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
  },
  meetupRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  meetupInfo: {
    flex: 1,
  },
  meetupLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
    marginBottom: 2,
  },
  meetupValue: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#333333',
  },
  meetupDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 12,
  },
  sellerSection: {
    marginBottom: 24,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
  },
  sellerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  sellerAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
    marginBottom: 2,
  },
  sellerMeta: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
  },
  similarSection: {
    marginBottom: 24,
  },
  similarList: {
    paddingRight: 20,
  },
  similarCard: {
    width: 120,
    marginRight: 12,
  },
  similarImageContainer: {
    width: 120,
    height: 100,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  similarImage: {
    width: '100%',
    height: '100%',
  },
  similarTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#333333',
    marginBottom: 2,
  },
  similarPrice: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#502E82',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    gap: 12,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#502E82',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  chatButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  ownerActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  ownerActionButtonText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#B39BD5',
  },
  soldButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#502E82',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  soldButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});
