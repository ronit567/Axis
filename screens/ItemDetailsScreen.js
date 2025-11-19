import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ItemDetailsScreen({ item, onBack, onChatWithSeller }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Item Details</Text>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Item Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={require('../images/grey_circle.png')}
            style={styles.itemImage}
            resizeMode="cover"
          />
        </View>

        {/* Item Info */}
        <View style={styles.infoSection}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemPrice}>${item.price}</Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="pricetag-outline" size={18} color="#666666" />
              <Text style={styles.metaText}>{item.condition}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="grid-outline" size={18} color="#666666" />
              <Text style={styles.metaText}>{item.category}</Text>
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

          {/* Seller Info */}
          <View style={styles.sellerSection}>
            <Text style={styles.sectionTitle}>Seller</Text>
            <View style={styles.sellerCard}>
              <View style={styles.sellerAvatar}>
                <Ionicons name="person" size={32} color="#B39BD5" />
              </View>
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>John Doe</Text>
                <Text style={styles.sellerMeta}>Computer Science • 3rd Year</Text>
              </View>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFB800" />
                <Text style={styles.ratingText}>4.8</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.bottomPrice}>${item.price}</Text>
        </View>
        <TouchableOpacity 
          style={styles.chatButton}
          onPress={() => onChatWithSeller(item)}
        >
          <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
          <Text style={styles.chatButtonText}>Chat with Seller</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#502E82',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#F0F0F0',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    padding: 20,
  },
  itemTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 28,
    fontFamily: 'Poppins_600SemiBold',
    color: '#B39BD5',
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
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
  sellerSection: {
    marginBottom: 100,
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  priceContainer: {
    marginRight: 16,
  },
  priceLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
    marginBottom: 2,
  },
  bottomPrice: {
    fontSize: 24,
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
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});
