import React, { useState, useRef, useMemo } from 'react';
import { StyleSheet, View, Image, ScrollView, StatusBar, Text, TouchableOpacity, TextInput, FlatList, Animated, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ListingCard from '../components/explore/ListingCard';
import FilterModal from '../components/explore/FilterModal';
import ActiveFilters from '../components/explore/ActiveFilters';

// Dummy data for home page sections
const FOR_YOU_ITEMS = [
  { id: '1', title: 'Calculus Textbook', price: 45, condition: 'Like New', category: 'Books' },
  { id: '2', title: 'Desk Lamp', price: 20, condition: 'Good', category: 'Furniture' },
  { id: '3', title: 'Winter Jacket', price: 60, condition: 'Like New', category: 'Clothing' },
  { id: '4', title: 'Laptop Stand', price: 35, condition: 'Fair', category: 'Electronics' },
];

const TRENDING_ITEMS = [
  { id: '5', title: 'Biology Notes', price: 15, condition: 'Good', category: 'Books' },
  { id: '6', title: 'Mini Fridge', price: 80, condition: 'Like New', category: 'Appliances' },
  { id: '7', title: 'Graphing Calculator', price: 50, condition: 'Like New', category: 'Electronics' },
  { id: '8', title: 'Office Chair', price: 70, condition: 'Fair', category: 'Furniture' },
];

const RECENTLY_LISTED = [
  { id: '9', title: 'Physics Textbook', price: 55, condition: 'Good', category: 'Books' },
  { id: '10', title: 'Desk Organizer', price: 12, condition: 'Like New', category: 'Furniture' },
  { id: '11', title: 'Backpack', price: 30, condition: 'Good', category: 'Clothing' },
  { id: '12', title: 'Wireless Mouse', price: 18, condition: 'Like New', category: 'Electronics' },
];

export default function MainHomeScreen({ firstName, onLogout }) {
  const [searchText, setSearchText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: 'All',
    condition: 'All',
    minPrice: 0,
    maxPrice: 100,
  });
  
  
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
    filters.minPrice > 0 || filters.maxPrice < 100,
  ].filter(Boolean).length;
  
  const resetFilters = () => {
    setFilters({
      category: 'All',
      condition: 'All',
      minPrice: 0,
      maxPrice: 100,
    });
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
      
      // Price range filter
      if (item.price < filters.minPrice || item.price > filters.maxPrice) {
        return false;
      }
      
      // Search text filter
      if (searchText.trim() !== '') {
        const searchLower = searchText.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(searchLower);
        const categoryMatch = item.category.toLowerCase().includes(searchLower);
        if (!titleMatch && !categoryMatch) {
          return false;
        }
      }
      
      return true;
    });
  };
  
  // Apply filters to each section using useMemo for performance
  const filteredForYou = useMemo(() => filterItems(FOR_YOU_ITEMS), [filters, searchText]);
  const filteredTrending = useMemo(() => filterItems(TRENDING_ITEMS), [filters, searchText]);
  const filteredRecentlyListed = useMemo(() => filterItems(RECENTLY_LISTED), [filters, searchText]);
  
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
          {/* Icon for Profile - Tap to logout */}
          <TouchableOpacity 
            style={styles.iconContainer}
            onPress={onLogout}
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
          
          {/* Notification Icon */}
          <TouchableOpacity style={styles.iconContainer}>
            <Image 
              source={require('../images/notification_icon.png')}
              style={styles.notificationIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
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
        {/* For You Section */}
        {filteredForYou.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>For You</Text>
            </View>
            <FlatList
              data={filteredForYou}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.horizontalCard}>
                  <ListingCard listing={item} />
                </View>
              )}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}

        {/* Trending Section */}
        {filteredTrending.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trending</Text>
            </View>
            <FlatList
              data={filteredTrending}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.horizontalCard}>
                  <ListingCard listing={item} />
                </View>
              )}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}

        {/* Recently Listed Section */}
        {filteredRecentlyListed.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recently Listed</Text>
            </View>
            <FlatList
              data={filteredRecentlyListed}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.horizontalCard}>
                  <ListingCard listing={item} />
                </View>
              )}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}
        
        {/* No results message */}
        {filteredForYou.length === 0 && filteredTrending.length === 0 && filteredRecentlyListed.length === 0 && (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={64} color="#999999" />
            <Text style={styles.noResultsText}>No items found</Text>
            <Text style={styles.noResultsSubtext}>Try adjusting your filters or search terms</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Cart Icon */}
      <TouchableOpacity style={styles.cartButton}>
        <Image 
          source={require('../images/cart_icon.png')}
          style={styles.cartIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
      
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
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="search-outline" size={28} color="#999999" />
          <Text style={styles.navLabel}>Explore</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.sellButton}>
          <View style={styles.addButtonCircle}>
            <Ionicons name="add" size={32} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="chatbubble-ellipses-outline" size={28} color="#999999" />
          <Text style={styles.navLabel}>Messages</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
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
  notificationIcon: {
    width: 28,
    height: 28,
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
  cartButton: {
    position: 'absolute',
    bottom: 110,
    right: 20,
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
    zIndex: 3,
  },
  cartIcon: {
    width: 35,
    height: 35,
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
});
