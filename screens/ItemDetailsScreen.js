import React, { useState, useRef } from 'react';
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
  Animated
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Dummy similar items
const SIMILAR_ITEMS = [
  { id: 's1', title: 'Similar Item 1', price: 35, condition: 'Good' },
  { id: 's2', title: 'Similar Item 2', price: 40, condition: 'Like New' },
  { id: 's3', title: 'Similar Item 3', price: 25, condition: 'Fair' },
];

export default function ItemDetailsScreen({ item, onBack, onChatWithSeller, onItemPress }) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;
  
  // Mock multiple images for gallery
  const images = [1, 2, 3]; // Simulating 3 images
  
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
  
  const handleImageScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentImageIndex(index);
  };
  
  const timePosted = '2 days ago'; // Mock data
  const views = 47; // Mock data
  
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
          <TouchableOpacity onPress={handleFavorite} style={styles.headerButton}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons 
                name={isFavorited ? "heart" : "heart-outline"} 
                size={24} 
                color={isFavorited ? "#FF6B6B" : "#333333"} 
              />
            </Animated.View>
          </TouchableOpacity>
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
            {images.map((_, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image 
                  source={require('../images/grey_circle.png')}
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
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              This is a great {item.title.toLowerCase()} in {item.condition.toLowerCase()} condition. 
              Perfect for students looking for quality items at affordable prices. 
              Feel free to message me with any questions!
            </Text>
          </View>
          
          {/* Meetup Preferences */}
          <View style={styles.meetupSection}>
            <Text style={styles.sectionTitle}>Meetup Preferences</Text>
            <View style={styles.meetupCard}>
              <View style={styles.meetupRow}>
                <Ionicons name="location-outline" size={20} color="#B39BD5" />
                <View style={styles.meetupInfo}>
                  <Text style={styles.meetupLabel}>Preferred Location</Text>
                  <Text style={styles.meetupValue}>Campus Library, Student Center</Text>
                </View>
              </View>
              <View style={styles.meetupDivider} />
              <View style={styles.meetupRow}>
                <Ionicons name="calendar-outline" size={20} color="#B39BD5" />
                <View style={styles.meetupInfo}>
                  <Text style={styles.meetupLabel}>Availability</Text>
                  <Text style={styles.meetupValue}>Weekdays 10am - 6pm</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Seller Info */}
          <View style={styles.sellerSection}>
            <Text style={styles.sectionTitle}>Seller</Text>
            <TouchableOpacity style={styles.sellerCard}>
              <View style={styles.sellerAvatar}>
                <Ionicons name="person" size={32} color="#B39BD5" />
                <View style={styles.onlineIndicator} />
              </View>
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>John Doe</Text>
                <Text style={styles.sellerMeta}>Computer Science • 3rd Year</Text>
                <View style={styles.sellerStats}>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#FFB800" />
                    <Text style={styles.ratingText}>4.8</Text>
                  </View>
                  <Text style={styles.sellerListings}>• 12 listings</Text>
                  <Text style={styles.responseTime}>• Responds quickly</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>
          </View>
          
          {/* Safety Tips */}
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
          
          {/* Similar Items */}
          <View style={styles.similarSection}>
            <Text style={styles.sectionTitle}>Similar Items</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarList}
            >
              {SIMILAR_ITEMS.map((similarItem) => (
                <TouchableOpacity 
                  key={similarItem.id} 
                  style={styles.similarCard}
                  onPress={() => onItemPress && onItemPress(similarItem)}
                >
                  <View style={styles.similarImageContainer}>
                    <Image 
                      source={require('../images/grey_circle.png')}
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
          
          {/* Bottom Spacer */}
          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
  },
  sellerListings: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
    marginLeft: 6,
  },
  responseTime: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#4CAF50',
    marginLeft: 6,
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
});
