import React, { useState, useEffect } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ActiveFilters from '../components/explore/ActiveFilters';
import FilterModal from '../components/explore/FilterModal';
import ListingCard from '../components/explore/ListingCard';

// Dummy data for listings
const DUMMY_LISTINGS = [
  { id: '1', title: 'Calculus Textbook', price: 45, condition: 'Like New', category: 'Books' },
  { id: '2', title: 'Desk Lamp', price: 20, condition: 'Good', category: 'Furniture' },
  { id: '3', title: 'Winter Jacket', price: 60, condition: 'Like New', category: 'Clothing' },
  { id: '4', title: 'Laptop Stand', price: 35, condition: 'Fair', category: 'Electronics' },
  { id: '5', title: 'Biology Notes', price: 15, condition: 'Good', category: 'Books' },
  { id: '6', title: 'Mini Fridge', price: 80, condition: 'Like New', category: 'Appliances' },
  { id: '7', title: 'Chemistry Lab Coat', price: 25, condition: 'Good', category: 'Clothing' },
  { id: '8', title: 'Graphing Calculator', price: 50, condition: 'Like New', category: 'Electronics' },
  { id: '9', title: 'Office Chair', price: 70, condition: 'Fair', category: 'Furniture' },
  { id: '10', title: 'Physics Textbook', price: 55, condition: 'Good', category: 'Books' },
];

export default function ExploreScreen({ onBack, initialCategory = 'All' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: initialCategory,
    condition: 'All',
    minPrice: 0,
    maxPrice: 100,
  });

  // Update filters when initialCategory changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, category: initialCategory }));
  }, [initialCategory]);

  const filteredListings = DUMMY_LISTINGS.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filters.category === 'All' || listing.category === filters.category;
    const matchesCondition = filters.condition === 'All' || listing.condition === filters.condition;
    const matchesPrice = listing.price >= filters.minPrice && listing.price <= filters.maxPrice;
    return matchesSearch && matchesCategory && matchesCondition && matchesPrice;
  });

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with gradient background */}
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
        
        <View style={styles.headerOverlay}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Explore</Text>
            <Text style={styles.headerSubtitle}>{filteredListings.length} items available</Text>
          </View>
        </View>

        {/* Search Bar with Filter Button */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Image 
              source={require('../images/search_icon.png')}
              style={styles.searchIcon}
              resizeMode="contain"
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search items..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearchText}>✕</Text>
              </Pressable>
            )}
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

        {/* Active Filters Display - Inside Header */}
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

      {/* Listings Grid */}
      <FlatList
        data={filteredListings}
        numColumns={2}
        key="two-columns"
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listingsContainer,
          { paddingTop: activeFilterCount > 0 ? 240 : 210 }
        ]}
        columnWrapperStyle={styles.listingsRow}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <ListingCard listing={item} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateText}>No items found</Text>
            <Text style={styles.emptyStateSubtext}>Try adjusting your filters</Text>
          </View>
        }
      />

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={onBack}>
          <Ionicons name="home-outline" size={28} color="#999999" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="search" size={28} color="#B39BD5" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Explore</Text>
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

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        filters={filters}
        onClose={() => setShowFilters(false)}
        onUpdateFilters={setFilters}
        onResetFilters={resetFilters}
      />
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
    minHeight: 250,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'visible',
    zIndex: 1,
  },
  headerImage: {
    width: '100%',
    height: 250,
  },
  headerExtension: {
    position: 'absolute',
    top: 185,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: '#502E82',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerOverlay: {
    position: 'absolute',
    top: 105,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
    fontFamily: 'Poppins_600SemiBold',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Poppins_400Regular',
  },
  searchRow: {
    position: 'absolute',
    top: 165,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filtersRow: {
    position: 'absolute',
    top: 227,
    left: 20,
    right: 20,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  searchIcon: {
    width: 22,
    height: 22,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins_400Regular',
  },
  clearSearchText: {
    fontSize: 18,
    color: '#999',
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
  listingsContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  listingsRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    fontFamily: 'Poppins_400Regular',
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
});
