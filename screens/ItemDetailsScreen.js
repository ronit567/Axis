import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Share,
  Alert,
  Animated,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ItemDetailsScreen({ item, onBack, onChatWithSeller, onItemPress, onEditListing }) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const heartScale = useRef(new Animated.Value(1)).current;

  // Get images from item or use placeholder
  const images = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls : [null];

  // All reactive: ownership, seller card, and similar items
  const me = useQuery(api.users.current);
  const isOwner = me != null && me._id === item.sellerId;
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
    const diffMs = now - created;
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

  const handleFavorite = () => {
    // Animate heart
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setIsFavorited(!isFavorited);
  };

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

  const handleMakeOffer = () => {
    Alert.prompt(
      'Make an Offer',
      `Enter your offer for "${item.title}" (Listed at $${item.price})`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Offer',
          onPress: (value) => {
            if (value && !isNaN(value)) {
              Alert.alert('Offer Sent!', `Your offer of $${value} has been sent to the seller.`);
            }
          }
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
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

  const handleBoostListing = () => {
    Alert.alert('Boost Listing', 'This feature will help your listing get more visibility. Coming soon!');
  };

  const handleImageScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentImageIndex(index);
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
      {/* Header - Now overlaid on image */}
      <View style={styles.headerOverlay}>
        <TouchableOpacity onPress={onBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color="#333333" />
          </TouchableOpacity>
          {!isOwner && (
            <TouchableOpacity onPress={handleFavorite} style={styles.headerButton}>
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Ionicons
                  name={isFavorited ? "heart" : "heart-outline"}
                  size={24}
                  color={isFavorited ? "#FF6B6B" : "#333333"}
                />
              </Animated.View>
            </TouchableOpacity>
          )}
          {isOwner && (
            <TouchableOpacity onPress={handleEditListing} style={styles.headerButton}>
              <Ionicons name="create-outline" size={24} color="#333333" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
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
                <Image
                  source={imageUrl ? { uri: imageUrl } : require('../images/grey_circle.png')}
                  style={styles.itemImage}
                  resizeMode="cover"
                />
              </View>
            ))}
          </ScrollView>

          {/* Image Pagination Dots */}
          <View style={styles.paginationDots}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentImageIndex === index && styles.activeDot
                ]}
              />
            ))}
          </View>

          {/* Image Counter */}
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {currentImageIndex + 1}/{images.length}
            </Text>
          </View>

          {/* Owner Badge */}
          {isOwner && (
            <View style={styles.ownerBadge}>
              <Ionicons name="person-circle" size={14} color="#FFFFFF" />
              <Text style={styles.ownerBadgeText}>Your Listing</Text>
            </View>
          )}
        </View>

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
                <View style={styles.ownerStatDivider} />
                <View style={styles.ownerStatItem}>
                  <Ionicons name="chatbubbles" size={24} color="#B39BD5" />
                  <Text style={styles.ownerStatValue}>--</Text>
                  <Text style={styles.ownerStatLabel}>Inquiries</Text>
                </View>
                <View style={styles.ownerStatDivider} />
                <View style={styles.ownerStatItem}>
                  <Ionicons name="heart" size={24} color="#B39BD5" />
                  <Text style={styles.ownerStatValue}>--</Text>
                  <Text style={styles.ownerStatLabel}>Saves</Text>
                </View>
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              {item.description || `This is a great ${item.title.toLowerCase()} in ${item.condition.toLowerCase()} condition. Perfect for students looking for quality items at affordable prices. Feel free to message me with any questions!`}
            </Text>
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
              <TouchableOpacity style={styles.sellerCard}>
                <View style={styles.sellerAvatar}>
                  {sellerLoading ? (
                    <ActivityIndicator size="small" color="#B39BD5" />
                  ) : (
                    <Ionicons name="person" size={32} color="#B39BD5" />
                  )}
                  <View style={styles.onlineIndicator} />
                </View>
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>{sellerName}</Text>
                  {sellerMeta ? (
                    <Text style={styles.sellerMeta}>{sellerMeta}</Text>
                  ) : null}
                  <View style={styles.sellerStats}>
                    <Text style={styles.responseTime}>Responds quickly</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
              </TouchableOpacity>
            </View>
          )}

          {/* Safety Tips - Only show if not owner */}
          {!isOwner && (
            <View style={styles.safetySection}>
              <View style={styles.safetyHeader}>
                <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
                <Text style={styles.safetyTitle}>Safety Tips</Text>
              </View>
              <View style={styles.safetyTips}>
                <View style={styles.safetyTip}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.safetyTipText}>Meet in public places on campus</Text>
                </View>
                <View style={styles.safetyTip}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.safetyTipText}>Inspect items before paying</Text>
                </View>
                <View style={styles.safetyTip}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.safetyTipText}>Use secure payment methods</Text>
                </View>
              </View>
            </View>
          )}

          {/* Seller Tips - Only show if owner */}
          {isOwner && (
            <View style={styles.sellerTipsSection}>
              <View style={styles.sellerTipsHeader}>
                <Ionicons name="bulb" size={20} color="#FF9800" />
                <Text style={styles.sellerTipsTitle}>Seller Tips</Text>
              </View>
              <View style={styles.sellerTips}>
                <View style={styles.sellerTip}>
                  <Ionicons name="camera" size={16} color="#FF9800" />
                  <Text style={styles.sellerTipText}>Add more photos to increase interest</Text>
                </View>
                <View style={styles.sellerTip}>
                  <Ionicons name="pricetag" size={16} color="#FF9800" />
                  <Text style={styles.sellerTipText}>Consider lowering price if no inquiries</Text>
                </View>
                <View style={styles.sellerTip}>
                  <Ionicons name="chatbubble" size={16} color="#FF9800" />
                  <Text style={styles.sellerTipText}>Respond quickly to buyers for better sales</Text>
                </View>
              </View>
            </View>
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
                      <Image
                        source={similarItem.imageUrls && similarItem.imageUrls[0]
                          ? { uri: similarItem.imageUrls[0] }
                          : require('../images/grey_circle.png')}
                        style={styles.similarImage}
                        resizeMode="cover"
                      />
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
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.ownerActionButton}
            onPress={handleBoostListing}
          >
            <Ionicons name="rocket-outline" size={20} color="#B39BD5" />
            <Text style={styles.ownerActionButtonText}>Boost</Text>
          </TouchableOpacity>
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
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.offerButton}
            onPress={handleMakeOffer}
          >
            <MaterialCommunityIcons name="tag-outline" size={20} color="#B39BD5" />
            <Text style={styles.offerButtonText}>Make Offer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => onChatWithSeller(item)}
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
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  content: {
    flex: 1,
  },
  imageGallery: {
    position: 'relative',
    marginTop: 90,
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
    top: 16,
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
    color: '#B39BD5',
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
  ownerStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5E5',
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
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#F9F9F9',
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
    marginBottom: 4,
  },
  sellerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  responseTime: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#4CAF50',
  },
  safetySection: {
    marginBottom: 24,
    backgroundColor: '#F0FFF4',
    borderRadius: 12,
    padding: 16,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  safetyTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
  },
  safetyTips: {
    gap: 8,
  },
  safetyTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  safetyTipText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#666666',
  },
  sellerTipsSection: {
    marginBottom: 24,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
  },
  sellerTipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sellerTipsTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
  },
  sellerTips: {
    gap: 8,
  },
  sellerTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellerTipText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#666666',
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
    color: '#B39BD5',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    gap: 12,
  },
  offerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#B39BD5',
  },
  offerButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#B39BD5',
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B39BD5',
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
    backgroundColor: '#4CAF50',
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
