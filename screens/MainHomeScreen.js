import React, { useState, useRef, useMemo, useEffect } from 'react';
import { StyleSheet, View, Image, ScrollView, StatusBar, Text, TouchableOpacity, TextInput, FlatList, Animated, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import ListingCard from '../components/explore/ListingCard';
import FilterModal from '../components/explore/FilterModal';
import ActiveFilters from '../components/explore/ActiveFilters';
import { DEFAULT_FILTERS, PRICE_CAP } from '../components/explore/filters';
import MessagesListScreen from './MessagesListScreen';
import ItemDetailsScreen from './ItemDetailsScreen';
import ChatScreen from './ChatScreen';
import CreateListingScreen from './CreateListingScreen';
import ProfileScreen from './ProfileScreen';

export default function MainHomeScreen({ firstName, onLogout, userId }) {
  const [searchText, setSearchText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Navigation state
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);

  // Debounced server-side search — the feed query uses the full-text index
  // on listing titles, so results aren't limited to the first 50 rows.
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchText]);
  const isSearching = debouncedSearch.length > 0;

  // Reactive listings — Convex pushes updates, so there's no fetch, no
  // realtime subscription to manage, and no pull-to-refresh needed.
  const feed = useQuery(api.listings.feed, {
    limit: 50,
    search: isSearching ? debouncedSearch : undefined,
  });
  const trendingItems = useQuery(api.listings.trending, { limit: 10 });

  const isLoading = feed === undefined || trendingItems === undefined;
  const forYouItems = feed ?? [];
  const recentItems = useMemo(() => (feed ?? []).slice(0, 10), [feed]);


  const handlePinkCirclePress = () => {
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);
    
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  };
  
  const activeFilterCount = [
    filters.category !== 'All',
    filters.condition !== 'All',
    filters.minPrice > 0 || filters.maxPrice < PRICE_CAP,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };
  
  const handleCategoryFilterPress = (category) => {
    setFilters({ ...filters, category });
  };
  
  // Filter function to apply filters to items
  const filterItems = (items) => {
    return items.filter(item => {
      // Category filter
      if (filters.category !== 'All' && item.category !== filters.category) {
        return false;
      }
      
      // Condition filter
      if (filters.condition !== 'All' && item.condition !== filters.condition) {
        return false;
      }
      
      // Price range filter (maxPrice at the cap means "no upper limit")
      if (item.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice < PRICE_CAP && item.price > filters.maxPrice) {
        return false;
      }

      return true;
    });
  };

  // Apply filters to each section using useMemo for performance
  // (text search happens server-side in the feed query)
  const filteredForYou = useMemo(() => filterItems(forYouItems), [filters, forYouItems]);
  const filteredTrending = useMemo(() => filterItems(trendingItems ?? []), [filters, trendingItems]);
  const filteredRecentlyListed = useMemo(() => filterItems(recentItems), [filters, recentItems]);
  
  // Navigation handlers
  const handleItemPress = (item) => {
    setSelectedItem(item);
    setCurrentScreen('itemDetails');
  };
  
  const handleMessagesPress = () => {
    setCurrentScreen('messagesList');
  };
  
  const handleChatWithSeller = (item) => {
    setSelectedItem(item);
    // Seller summary comes hydrated on every Convex listing
    const sellerName = item.seller
      ? `${item.seller.firstName || ''} ${item.seller.lastName || ''}`.trim() || 'Seller'
      : 'Seller';
    setSelectedChat({
      sellerName,
      itemTitle: item.title,
      sellerId: item.sellerId,
      listingId: item._id,
    });
    setCurrentScreen('chat');
  };
  
  const handleChatPress = (chat) => {
    setSelectedChat(chat);
    setCurrentScreen('chat');
  };
  
  const handleBackToHome = () => {
    setCurrentScreen('home');
    setSelectedItem(null);
    setSelectedChat(null);
  };
  
  const handleBackToMessages = () => {
    setCurrentScreen('messagesList');
    setSelectedChat(null);
  };

  const handleSellPress = () => {
    setCurrentScreen('createListing');
  };

  const handleProfilePress = () => {
    setCurrentScreen('profile');
  };

  const handleEditListing = (listing) => {
    setSelectedItem(listing);
    setCurrentScreen('editListing');
  };

  const handleBackToProfile = () => {
    setCurrentScreen('profile');
    setSelectedItem(null);
  };

  const handleListingCreated = () => {
    // Go back to home — the reactive feed query picks up the new listing
    setCurrentScreen('home');
  };
  
  // Render different screens based on navigation state
  if (currentScreen === 'messagesList') {
    return (
      <MessagesListScreen 
        onBack={handleBackToHome}
        onChatPress={handleChatPress}
      />
    );
  }
  
  if (currentScreen === 'itemDetails' && selectedItem) {
    return (
      <ItemDetailsScreen
        item={selectedItem}
        onBack={handleBackToHome}
        onChatWithSeller={handleChatWithSeller}
        onItemPress={handleItemPress}
        onEditListing={handleEditListing}
      />
    );
  }
  
  if (currentScreen === 'chat') {
    return (
      <ChatScreen
        chat={selectedChat}
        item={selectedItem}
        onBack={selectedItem ? handleBackToHome : handleBackToMessages}
      />
    );
  }

  if (currentScreen === 'createListing') {
    return (
      <CreateListingScreen
        onBack={handleBackToHome}
        onSuccess={handleListingCreated}
      />
    );
  }

  if (currentScreen === 'profile') {
    return (
      <ProfileScreen
        onBack={handleBackToHome}
        onLogout={onLogout}
        onItemPress={handleItemPress}
        onEditListing={handleEditListing}
      />
    );
  }

  if (currentScreen === 'editListing' && selectedItem) {
    return (
      <CreateListingScreen
        listing={selectedItem}
        onBack={handleBackToProfile}
        onSuccess={handleBackToProfile}
      />
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.headerContainer}>
        <Image 
          source={require('../images/homepage_header.png')}
          style={styles.headerImage}
          resizeMode="stretch"
        />
        
        {/* Purple extension when filters are active */}
        {activeFilterCount > 0 && (
          <View style={styles.headerExtension} />
        )}
        
        {/* Placing header in overlay section */}
        <View style={styles.headerOverlay}>
          {/* Icon for Profile */}
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={handleProfilePress}
          >
            <Image 
              source={require('../images/profile_icon.png')}
              style={styles.profileIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          
          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome,</Text>
            <Text style={styles.nameText}>{firstName || 'User'}</Text>
          </View>
          
        </View>
        
        {/* Search Bar with Filter Button */}
        <View style={styles.searchRow}>
          <View style={styles.searchBarContainer}>
            <Image 
              source={require('../images/search_icon.png')}
              style={styles.searchIcon}
              resizeMode="contain"
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search here"
              placeholderTextColor="#999999"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          
          {/* Filter Button */}
          <Pressable 
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.filterIcon}>☰</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
        
        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <View style={styles.filtersRow}>
            <ActiveFilters
              filters={filters}
              onUpdateFilters={setFilters}
              onResetFilters={resetFilters}
            />
          </View>
        )}
      </View>
      {/* Category Circles */}
      <View style={[
        styles.categoriesContainer,
        activeFilterCount > 0 && styles.categoriesContainerWithFilters
      ]}>
        {/* Pink Circle - Main button */}
        <TouchableOpacity style={styles.categoryCircleFirst} onPress={handlePinkCirclePress} activeOpacity={1}>
          <Ionicons name="menu" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        
        {/* Animated sliding circles */}
        <Animated.View style={[
          styles.slidingCircle,
          {
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-72, 0],
                }),
              },
            ],
            opacity: slideAnim,
          },
        ]}>
          <TouchableOpacity style={styles.categoryCircle} onPress={() => handleCategoryFilterPress('Books')}>
            <Ionicons name="book-outline" size={28} color="#502E82" />
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View style={[
          styles.slidingCircle,
          {
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-72, 0],
                }),
              },
            ],
            opacity: slideAnim,
          },
        ]}>
          <TouchableOpacity style={styles.categoryCircle} onPress={() => handleCategoryFilterPress('Electronics')}>
            <Ionicons name="laptop-outline" size={28} color="#502E82" />
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View style={[
          styles.slidingCircle,
          {
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-72, 0],
                }),
              },
            ],
            opacity: slideAnim,
          },
        ]}>
          <TouchableOpacity style={styles.categoryCircle} onPress={() => handleCategoryFilterPress('Furniture')}>
            <MaterialCommunityIcons name="bed-outline" size={28} color="#502E82" />
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View style={[
          styles.slidingCircle,
          {
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-72, 0],
                }),
              },
            ],
            opacity: slideAnim,
          },
        ]}>
          <TouchableOpacity style={styles.categoryCircle} onPress={() => handleCategoryFilterPress('Clothing')}>
            <Ionicons name="shirt-outline" size={28} color="#502E82" />
          </TouchableOpacity>
        </Animated.View>
      </View>
      
      <ScrollView
        style={[
          styles.content,
          activeFilterCount > 0 && styles.contentWithFilters
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading State */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#B39BD5" />
            <Text style={styles.loadingText}>Loading listings...</Text>
          </View>
        ) : (
          <>
            {/* For You Section (doubles as search results) */}
        {filteredForYou.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{isSearching ? 'Results' : 'For You'}</Text>
            </View>
            <FlatList
              data={filteredForYou}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.horizontalCard}>
                  <ListingCard listing={item} onPress={() => handleItemPress(item)} />
                </View>
              )}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}

        {/* Trending Section */}
        {!isSearching && filteredTrending.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trending</Text>
            </View>
            <FlatList
              data={filteredTrending}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.horizontalCard}>
                  <ListingCard listing={item} onPress={() => handleItemPress(item)} />
                </View>
              )}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}

        {/* Recently Listed Section */}
        {!isSearching && filteredRecentlyListed.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recently Listed</Text>
            </View>
            <FlatList
              data={filteredRecentlyListed}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.horizontalCard}>
                  <ListingCard listing={item} onPress={() => handleItemPress(item)} />
                </View>
              )}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}
        
        {/* No results message */}
        {filteredForYou.length === 0 && (isSearching || (filteredTrending.length === 0 && filteredRecentlyListed.length === 0)) && (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={64} color="#999999" />
            <Text style={styles.noResultsText}>No items found</Text>
            <Text style={styles.noResultsSubtext}>
              {!isSearching && forYouItems.length === 0 && trendingItems.length === 0 && recentItems.length === 0
                ? 'Be the first to list an item!'
                : 'Try adjusting your filters or search terms'}
            </Text>
            {!isSearching && forYouItems.length === 0 && trendingItems.length === 0 && recentItems.length === 0 && (
              <TouchableOpacity style={styles.createFirstButton} onPress={handleSellPress}>
                <Text style={styles.createFirstButtonText}>Create Listing</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
          </>
        )}
      </ScrollView>
      
      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        filters={filters}
        onClose={() => setShowFilters(false)}
        onUpdateFilters={setFilters}
        onResetFilters={resetFilters}
      />
      
      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={28} color="#B39BD5" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.sellButton} onPress={handleSellPress}>
          <View style={styles.addButtonCircle}>
            <Ionicons name="add" size={32} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={handleMessagesPress}>
          <Ionicons name="chatbubble-ellipses-outline" size={28} color="#999999" />
          <Text style={styles.navLabel}>Messages</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={handleProfilePress}>
          <Ionicons name="person-outline" size={28} color="#999999" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECECEC',
  },
  headerContainer: {
    position: 'absolute',
    top: -50,
    left: 0,
    right: 0,
    width: '100%',
    minHeight: 295,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'visible',
    zIndex: 1,
  },
  headerImage: {
    width: '100%',
    height: 295,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  headerExtension: {
    position: 'absolute',
    top: 185,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: '#502E82',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#ECECEC',
    marginTop: 210,
    paddingTop: 60,
    paddingBottom: 100,
    zIndex: 0,
  },
  contentWithFilters: {
    paddingTop: 150,
  },
  headerOverlay: {
    position: 'absolute',
    top: 115,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  welcomeContainer: {
    flex: 1,
    marginLeft: 15,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
  },
  nameText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    marginTop: -2,
  },
  searchRow: {
    position: 'absolute',
    top: 185,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 2,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  searchIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#000000',
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    position: 'relative',
  },
  filterIcon: {
    fontSize: 22,
    color: '#B39BD5',
  },
  filterBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#B39BD5',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Poppins_600SemiBold',
  },
  filtersRow: {
    position: 'absolute',
    top: 250,
    left: 20,
    right: 20,
  },
  categoriesContainer: {
    position: 'absolute',
    top: 200,
    left: 20,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 3,
  },
  categoriesContainerWithFilters: {
    top: 245,
  },
  slidingCircle: {
    marginLeft: 0,
  },
  categoryCircleFirst: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#B39BD5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categoryCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  navLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
    marginTop: 4,
  },
  navLabelActive: {
    color: '#B39BD5',
  },
  sellButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    marginTop: -30,
  },
  addButtonCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#B39BD5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    fontFamily: 'Poppins_600SemiBold',
  },
  horizontalList: {
    paddingHorizontal: 12,
  },
  horizontalCard: {
    width: 160,
    marginHorizontal: 8,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noResultsText: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
    marginTop: 16,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
    marginTop: 12,
  },
  createFirstButton: {
    marginTop: 20,
    backgroundColor: '#502E82',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createFirstButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});
