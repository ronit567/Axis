import React, { useState } from 'react';
import { StyleSheet, View, Image, ScrollView, StatusBar, Text, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ListingCard from '../components/explore/ListingCard';

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

export default function MainHomeScreen({ firstName, onNavigateToExplore }) {
  const [searchText, setSearchText] = useState('');
  
  const handleCategoryPress = (category) => {
    if (onNavigateToExplore) {
      onNavigateToExplore(category);
    }
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
        <TouchableOpacity style={styles.categoryCircleFirst} onPress={() => handleCategoryPress('All')}>
          <Ionicons name="menu" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.categoryCircle} onPress={() => handleCategoryPress('Books')}>
          <Ionicons name="book-outline" size={28} color="#502E82" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.categoryCircle} onPress={() => handleCategoryPress('Electronics')}>
          <Ionicons name="laptop-outline" size={28} color="#502E82" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.categoryCircle} onPress={() => handleCategoryPress('Furniture')}>
          <MaterialCommunityIcons name="bed-outline" size={28} color="#502E82" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.categoryCircle} onPress={() => handleCategoryPress('Clothing')}>
          <Ionicons name="shirt-outline" size={28} color="#502E82" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* For You Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>For You</Text>
            <TouchableOpacity onPress={() => handleCategoryPress('All')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={FOR_YOU_ITEMS}
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

        {/* Trending Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending</Text>
            <TouchableOpacity onPress={() => handleCategoryPress('All')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={TRENDING_ITEMS}
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

        {/* Recently Listed Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recently Listed</Text>
            <TouchableOpacity onPress={() => handleCategoryPress('All')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={RECENTLY_LISTED}
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
      </ScrollView>
      
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
          <Ionicons name="home" size={28} color="#B39BD5" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => handleCategoryPress('All')}>
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
    height: 295,
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
    marginTop: 210,
    paddingTop: 60,
    paddingBottom: 100,
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
    top: 185,
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
    top: 200,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    gap: 12,
    zIndex: 3,
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
  seeAllText: {
    fontSize: 14,
    color: '#B39BD5',
    fontFamily: 'Poppins_600SemiBold',
  },
  horizontalList: {
    paddingHorizontal: 12,
  },
  horizontalCard: {
    width: 160,
    marginHorizontal: 8,
  },
});
