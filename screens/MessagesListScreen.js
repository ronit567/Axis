import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Image, TextInput, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Dummy chat data - will be replaced with real data later
const DUMMY_CHATS = [
  {
    id: '1',
    sellerName: 'John Smith',
    itemTitle: 'Calculus Textbook',
    itemPrice: 45,
    lastMessage: 'Is this still available?',
    timestamp: '2m ago',
    unread: true,
    unreadCount: 2,
    isOnline: true,
    type: 'buying', // buying or selling
  },
  {
    id: '2',
    sellerName: 'Sarah Johnson',
    itemTitle: 'Desk Lamp',
    itemPrice: 20,
    lastMessage: 'Sure, I can meet tomorrow at the library',
    timestamp: '1h ago',
    unread: false,
    unreadCount: 0,
    isOnline: false,
    type: 'selling',
  },
  {
    id: '3',
    sellerName: 'Mike Chen',
    itemTitle: 'Winter Jacket',
    itemPrice: 60,
    lastMessage: 'Thanks for your interest! Is $55 okay?',
    timestamp: '3h ago',
    unread: false,
    unreadCount: 0,
    isOnline: true,
    type: 'buying',
  },
  {
    id: '4',
    sellerName: 'Emily Davis',
    itemTitle: 'Laptop Stand',
    itemPrice: 35,
    lastMessage: 'Perfect, see you then!',
    timestamp: 'Yesterday',
    unread: false,
    unreadCount: 0,
    isOnline: false,
    type: 'selling',
  },
];

const TABS = ['All', 'Buying', 'Selling'];

export default function MessagesListScreen({ onBack, onChatPress }) {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  
  // Filter chats based on search and tab
  const filteredChats = useMemo(() => {
    return DUMMY_CHATS.filter(chat => {
      // Tab filter
      if (activeTab !== 'All' && chat.type !== activeTab.toLowerCase()) {
        return false;
      }
      
      // Search filter
      if (searchText.trim() !== '') {
        const searchLower = searchText.toLowerCase();
        const nameMatch = chat.sellerName.toLowerCase().includes(searchLower);
        const itemMatch = chat.itemTitle.toLowerCase().includes(searchLower);
        const messageMatch = chat.lastMessage.toLowerCase().includes(searchLower);
        if (!nameMatch && !itemMatch && !messageMatch) {
          return false;
        }
      }
      
      return true;
    });
  }, [searchText, activeTab]);
  
  // Count unread messages
  const totalUnread = DUMMY_CHATS.reduce((sum, chat) => sum + chat.unreadCount, 0);

  const renderChatItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.chatItem}
      onPress={() => onChatPress(item)}
      activeOpacity={0.7}
    >
      {/* Item Thumbnail */}
      <View style={styles.thumbnailContainer}>
        <Image 
          source={require('../images/grey_circle.png')}
          style={styles.itemThumbnail}
          resizeMode="cover"
        />
        <View style={styles.priceTag}>
          <Text style={styles.priceTagText}>${item.itemPrice}</Text>
        </View>
      </View>
      
      {/* Avatar with online indicator */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color="#B39BD5" />
        </View>
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <View style={styles.nameContainer}>
            <Text style={styles.sellerName}>{item.sellerName}</Text>
            {item.type === 'selling' && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>Selling</Text>
              </View>
            )}
          </View>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.itemTitle}</Text>
        <View style={styles.messageRow}>
          <Text 
            style={[styles.lastMessage, item.unread && styles.unreadMessage]} 
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="chatbubbles-outline" size={60} color="#B39BD5" />
      </View>
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'All' 
          ? "Start a conversation by messaging a seller on an item you're interested in"
          : activeTab === 'Buying'
            ? "You haven't contacted any sellers yet"
            : "You haven't received any messages from buyers yet"
        }
      </Text>
      {activeTab === 'All' && (
        <TouchableOpacity style={styles.browseButton} onPress={onBack}>
          <Text style={styles.browseButtonText}>Browse Items</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Messages</Text>
          {totalUnread > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{totalUnread}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            placeholderTextColor="#999999"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#CCCCCC" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
            {tab === 'All' && totalUnread > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{totalUnread}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={filteredChats.length === 0 ? styles.emptyList : styles.chatList}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
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
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  headerBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
  headerAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    backgroundColor: '#502E82',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#333333',
    paddingVertical: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#F5F0FF',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#666666',
  },
  activeTabText: {
    color: '#502E82',
  },
  tabBadge: {
    backgroundColor: '#B39BD5',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  chatList: {
    paddingVertical: 4,
  },
  emptyList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#FFFFFF',
  },
  thumbnailContainer: {
    position: 'relative',
    marginRight: 12,
  },
  itemThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  priceTag: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#B39BD5',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priceTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  avatarContainer: {
    position: 'absolute',
    top: 12,
    left: 56,
    zIndex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 24,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sellerName: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
  },
  typeBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: '#4CAF50',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
  },
  itemTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#B39BD5',
    marginBottom: 2,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666666',
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
  },
  unreadBadge: {
    backgroundColor: '#B39BD5',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#B39BD5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  browseButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});
