import React, { useState } from 'react';
import { StyleSheet, View, Image, ScrollView, StatusBar, Text, TouchableOpacity, TextInput } from 'react-native';

export default function MainHomeScreen({ firstName }) {
  const [searchText, setSearchText] = useState('');
  
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
        <View style={styles.categoryItem}>
          <TouchableOpacity style={styles.categoryCircleFirst}>
            <Image 
              source={require('../images/all_icon.png')}
              style={styles.categoryIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.categoryLabel}>All</Text>
        </View>
        
        <View style={styles.categoryItem}>
          <TouchableOpacity style={styles.categoryCircle}>
          </TouchableOpacity>
          <Text style={styles.categoryLabel}>category</Text>
        </View>
        
        <View style={styles.categoryItem}>
          <TouchableOpacity style={styles.categoryCircle}>
          </TouchableOpacity>
          <Text style={styles.categoryLabel}>category</Text>
        </View>
        
        <View style={styles.categoryItem}>
          <TouchableOpacity style={styles.categoryCircle}>
          </TouchableOpacity>
          <Text style={styles.categoryLabel}>category</Text>
        </View>
        
        <View style={styles.categoryItem}>
          <TouchableOpacity style={styles.categoryCircle}>
          </TouchableOpacity>
          <Text style={styles.categoryLabel}>category</Text>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Content will be added here */}
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
    marginTop: 305,
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
  categoryItem: {
    alignItems: 'center',
    marginRight: 12,
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
});
