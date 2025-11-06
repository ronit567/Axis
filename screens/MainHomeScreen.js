import React, { useRef, useState, useMemo } from 'react';
import { StyleSheet, View, Image, ScrollView, StatusBar, Text, TouchableOpacity, TextInput, Animated, FlatList, Modal } from 'react-native';

export default function MainHomeScreen({ firstName }) {
  const [searchText, setSearchText] = useState('');
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const baseCategories = [];
  const expandedCategories = ['Electronics', 'Books', 'Furniture', 'Custom'];
  const expandAnim = useRef(new Animated.Value(0)).current; // 0: collapsed, 1: expanded
  
  // Filter state
  const [showFilter, setShowFilter] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100);
  const filterSlideAnim = useRef(new Animated.Value(0)).current; // 0: hidden, 1: visible

  // Placeholder products
  const allProducts = [
    { id: '1', title: 'Calculus Textbook', condition: 'Like New', category: 'Books', location: 'North Campus', price: 45 },
    { id: '2', title: 'Desk Lamp', condition: 'Good', category: 'Furniture', location: 'South Campus', price: 20 },
    { id: '3', title: 'Winter Jacket', condition: 'Like New', category: 'Clothing', location: 'East Campus', price: 60 },
    { id: '4', title: 'Laptop Stand', condition: 'Fair', category: 'Furniture', location: 'North Campus', price: 35 },
    { id: '5', title: 'Keyboard', condition: 'Good', category: 'Electronics', location: 'West Campus', price: 25 },
    { id: '6', title: 'Chemistry Notes', condition: 'Good', category: 'Books', location: 'South Campus', price: 10 },
    { id: '7', title: 'Headphones', condition: 'Like New', category: 'Electronics', location: 'North Campus', price: 70 },
    { id: '8', title: 'Backpack', condition: 'Good', category: 'Other', location: 'East Campus', price: 30 },
    { id: '9', title: 'Graphing Calculator', condition: 'Good', category: 'Electronics', location: 'West Campus', price: 50 },
    { id: '10', title: 'Bluetooth Speaker', condition: 'Like New', category: 'Electronics', location: 'North Campus', price: 40 },
    { id: '11', title: 'Notebook Bundle', condition: 'New', category: 'Books', location: 'South Campus', price: 15 },
    { id: '12', title: 'Water Bottle', condition: 'Good', category: 'Other', location: 'East Campus', price: 8 },
    { id: '13', title: 'Dorm Lamp', condition: 'Fair', category: 'Furniture', location: 'West Campus', price: 12 },
    { id: '14', title: 'Hoodie', condition: 'Like New', category: 'Clothing', location: 'North Campus', price: 22 },
    { id: '15', title: 'Bike Lock', condition: 'Good', category: 'Other', location: 'South Campus', price: 18 },
  ];
  
  // Filtered products
  const products = useMemo(() => {
    return allProducts.filter(item => {
      const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchCondition = selectedCondition === 'All' || item.condition === selectedCondition;
      const matchLocation = selectedLocation === 'All' || item.location === selectedLocation;
      const matchPrice = item.price >= minPrice && item.price <= maxPrice;
      return matchCategory && matchCondition && matchLocation && matchPrice;
    });
  }, [selectedCategory, selectedCondition, selectedLocation, minPrice, maxPrice]);

  const toggleCategories = () => {
    const toVal = categoriesExpanded ? 0 : 1;
    Animated.timing(expandAnim, {
      toValue: toVal,
      duration: 280,
      useNativeDriver: false, // animating width/margins
    }).start(() => setCategoriesExpanded(!categoriesExpanded));
  };
  
  const openFilter = () => {
    setShowFilter(true);
    Animated.timing(filterSlideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  
  const closeFilter = () => {
    Animated.timing(filterSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowFilter(false));
  };
  
  const applyFilters = () => {
    closeFilter();
  };
  
  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedCondition('All');
    setSelectedLocation('All');
    setMinPrice(0);
    setMaxPrice(100);
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.headerContainer}>
        <Image 
          source={require('../images/homepage_header.png')}
          style={styles.headerImage}
          resizeMode="stretch"
        />
        
        {/* Placing header in overlay section */}
        <View style={styles.headerOverlay}>
          {/* Icon for Profile */}
          <TouchableOpacity style={styles.iconContainer}>
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
        
        {/* Search Bar */}
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
      </View>
      {/* Category Circles */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          <View style={styles.categoryItem}>
            <TouchableOpacity
              style={styles.categoryCircleFirst}
              onPress={toggleCategories}
              activeOpacity={0.8}
            >
              <Image 
                source={require('../images/all_icon.png')}
                style={styles.categoryIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.categoryLabel}>All</Text>
          </View>

          {(() => {
            const totalWidth = expandedCategories.length * (60 + 12);
            const maskWidth = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, totalWidth] });
            return (
              <Animated.View style={[styles.categoryMask, { width: maskWidth }]}> 
                <View style={styles.categoryRowInner}>
                  {expandedCategories.map((label, idx) => {
                    const translateX = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [-(idx + 1) * 12, 0] });
                    const opacity = expandAnim;
                    const scale = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
                    const isCustom = label === 'Custom';
                    return (
                      <Animated.View key={`${label}-${idx}`} style={[styles.categoryItemFixed, { transform: [{ translateX }, { scale }], opacity }]}> 
                        <TouchableOpacity 
                          style={styles.categoryCircle} 
                          activeOpacity={0.8}
                          onPress={() => isCustom && openFilter()}
                        />
                        <Text style={styles.categoryLabel}>{label}</Text>
                      </Animated.View>
                    );
                  })}
                </View>
              </Animated.View>
            );
          })()}
        </ScrollView>
      </View>
      
      {/* Product Grid */}
      <View style={styles.content}>
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContainer}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardImagePlaceholder}>
                <View style={styles.imageIconStub} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={styles.conditionRow}>
                  <View style={styles.tagStub} />
                  <Text style={styles.conditionText}>{item.condition}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceText}>${item.price}</Text>
                  <View style={styles.pinCircle} />
                </View>
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
      
      {/* Cart Icon */}
      <TouchableOpacity style={styles.cartButton}>
        <Image 
          source={require('../images/cart_icon.png')}
          style={styles.cartIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
      
      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Image 
            source={require('../images/home_icon.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Image 
            source={require('../images/heart_icon.png')}
            style={styles.favoritesIcon}
            resizeMode="contain"
          />
          <Text style={styles.navLabel}>Favorites</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.sellButton}>
          <Image 
            source={require('../images/add_icon.png')}
            style={styles.addIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Image 
            source={require('../images/messages_icon.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navLabel}>Messages</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Image 
            source={require('../images/profile_icon.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
      
      {/* Filter Modal */}
      {showFilter && (
        <Modal
          transparent
          visible={showFilter}
          animationType="none"
          onRequestClose={closeFilter}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.modalOverlay} 
              activeOpacity={1}
              onPress={closeFilter}
            />
            <Animated.View 
              style={[
                styles.filterPanel,
                {
                  transform: [{
                    translateY: filterSlideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [700, 0],
                    }),
                  }],
                },
              ]}
            >
              <View style={styles.filterHeader}>
                <Text style={styles.filterTitle}>Filters</Text>
                <TouchableOpacity onPress={closeFilter}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
                {/* Category Section */}
                <Text style={styles.sectionTitle}>Category</Text>
                <View style={styles.filterRow}>
                  {['All', 'Books', 'Electronics', 'Furniture', 'Clothing', 'Appliances', 'Other'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.filterChip,
                        selectedCategory === cat && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedCategory === cat && styles.filterChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* Condition Section */}
                <Text style={styles.sectionTitle}>Condition</Text>
                <View style={styles.filterRow}>
                  {['All', 'Like New', 'Good', 'Fair'].map((cond) => (
                    <TouchableOpacity
                      key={cond}
                      style={[
                        styles.filterChip,
                        selectedCondition === cond && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedCondition(cond)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedCondition === cond && styles.filterChipTextActive,
                        ]}
                      >
                        {cond}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* Location Section */}
                <Text style={styles.sectionTitle}>Location</Text>
                <View style={styles.filterRow}>
                  {['All', 'North Campus', 'South Campus', 'East Campus', 'West Campus'].map((loc) => (
                    <TouchableOpacity
                      key={loc}
                      style={[
                        styles.filterChip,
                        selectedLocation === loc && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedLocation(loc)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedLocation === loc && styles.filterChipTextActive,
                        ]}
                      >
                        {loc}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* Price Range Section */}
                <Text style={styles.sectionTitle}>Price Range</Text>
                <View style={styles.priceRange}>
                  <Text style={styles.priceLabel}>${minPrice}</Text>
                  <Text style={styles.priceLabel}>${maxPrice}</Text>
                </View>
              </ScrollView>
              
              <View style={styles.filterFooter}>
                <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
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
    height: 310,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    zIndex: 1,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    backgroundColor: '#ECECEC',
    marginTop: 320,
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
  searchBarContainer: {
    position: 'absolute',
    top: 195,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 2,
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
  categoriesContainer: {
    position: 'absolute',
    top: 215,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  categoriesRow: {
    alignItems: 'flex-start',
  },
  categoryMask: {
    overflow: 'hidden',
    flexDirection: 'row',
  },
  categoryRowInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 12,
  },
  categoryItemFixed: {
    alignItems: 'center',
    marginRight: 12,
  },
  categoryItemAnimated: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  categoryCircleFirst: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#B39BD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    width: 30,
    height: 30,
  },
  categoryLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#000000',
    marginTop: 5,
    textAlign: 'center',
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
  // Product grid styles
  gridContainer: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 140, // room for bottom nav
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: '48%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardImagePlaceholder: {
    height: 110,
    backgroundColor: '#E6E6E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageIconStub: {
    width: 46,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#CFCFCF',
  },
  cardBody: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
  },
  cardTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 6,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagStub: {
    width: 16,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#CFCFCF',
    marginRight: 6,
  },
  conditionText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#6B6B6B',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#4b307d',
  },
  pinCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5DAF8',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 10,
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
  navIcon: {
    width: 32,
    height: 32,
    marginBottom: 4,
  },
  favoritesIcon: {
    width: 36,
    height: 36,
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
  },
  sellButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  addIcon: {
    width: 95,
    height: 95,
    marginTop: -40,
  },
  // Filter modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  filterPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1A1A1A',
  },
  closeButton: {
    fontSize: 28,
    color: '#1A1A1A',
    fontWeight: '300',
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: '#6B4FA0',
  },
  filterChipText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666666',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  priceRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#6B4FA0',
  },
  filterFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: '#666666',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#6B4FA0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: '#FFFFFF',
  },
});
