import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Image, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

const TABS = ['All', 'Buying', 'Selling'];

export default function MessagesListScreen({ onBack, onChatPress }) {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  // Reactive: new conversations, last-message previews and unread counts all
  // update live — no fetch, no subscription, no pull-to-refresh.
  const conversationsData = useQuery(api.messages.listConversations);
  const isLoading = conversationsData === undefined;
  const conversations = conversationsData ?? [];

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Filter chats based on search and tab
  const filteredChats = useMemo(() => {
    return conversations.filter(conv => {
      // Tab filter
      const type = conv.isBuyer ? 'buying' : 'selling';
      if (activeTab !== 'All' && type !== activeTab.toLowerCase()) {
        return false;
      }

      // Search filter
      if (searchText.trim() !== '') {
        const searchLower = searchText.toLowerCase();
        const nameMatch = conv.otherUser?.firstName?.toLowerCase().includes(searchLower) ||
                          conv.otherUser?.lastName?.toLowerCase().includes(searchLower);
        const itemMatch = conv.listing?.title?.toLowerCase().includes(searchLower);
        const messageMatch = conv.lastMessageText?.toLowerCase().includes(searchLower);
        if (!nameMatch && !itemMatch && !messageMatch) {
          return false;
        }
      }

      return true;
    });
  }, [searchText, activeTab, conversations]);

  // Count conversations by type
  const buyingCount = conversations.filter(c => c.isBuyer).length;
  const sellingCount = conversations.filter(c => !c.isBuyer).length;

  // Count unread messages by type
  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unread || 0), 0);
  const buyingUnread = conversations.filter(c => c.isBuyer).reduce((sum, conv) => sum + (conv.unread || 0), 0);
  const sellingUnread = conversations.filter(c => !c.isBuyer).reduce((sum, conv) => sum + (conv.unread || 0), 0);

  const getTabBadgeCount = (tab) => {
    if (tab === 'All') return totalUnread;
    if (tab === 'Buying') return buyingUnread;
    if (tab === 'Selling') return sellingUnread;
    return 0;
  };

  const renderChatItem = ({ item }) => {
    const otherUserName = item.otherUser
      ? `${item.otherUser.firstName || ''} ${item.otherUser.lastName || ''}`.trim() || 'User'
      : 'User';
    const itemTitle = item.listing?.title || 'Item';
    const itemPrice = item.listing?.price || 0;
    const itemImage = item.listing?.imageUrl;
    const isBuying = item.isBuyer;

    return (
      <TouchableOpacity
        style={[
          styles.chatItem,
          isBuying ? styles.chatItemBuying : styles.chatItemSelling
        ]}
        onPress={() => onChatPress({
          ...item,
          sellerName: otherUserName,
          itemTitle,
          conversationId: item._id,
          isBuyer: isBuying,
        })}
        activeOpacity={0.7}
      >
        {/* Role indicator stripe */}
        <View style={[
          styles.roleStripe,
          isBuying ? styles.roleStripeBuying : styles.roleStripeSelling
        ]} />

        {/* Item Thumbnail */}
        <View style={styles.thumbnailContainer}>
          <Image
            source={itemImage ? { uri: itemImage } : require('../images/grey_circle.png')}
            style={styles.itemThumbnail}
            resizeMode="cover"
          />
          <View style={[
            styles.priceTag,
            isBuying ? styles.priceTagBuying : styles.priceTagSelling
          ]}>
            <Text style={styles.priceTagText}>${itemPrice}</Text>
          </View>
        </View>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={[
            styles.avatar,
            isBuying ? styles.avatarBuying : styles.avatarSelling
          ]}>
            <Ionicons name="person" size={20} color={isBuying ? "#2196F3" : "#4CAF50"} />
          </View>
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <View style={styles.nameContainer}>
              <Text style={styles.sellerName}>{otherUserName}</Text>
              <View style={[
                styles.typeBadge,
                isBuying ? styles.typeBadgeBuying : styles.typeBadgeSelling
              ]}>
                <Ionicons
                  name={isBuying ? "cart" : "storefront"}
                  size={10}
                  color={isBuying ? "#2196F3" : "#4CAF50"}
                />
                <Text style={[
                  styles.typeBadgeText,
                  isBuying ? styles.typeBadgeTextBuying : styles.typeBadgeTextSelling
                ]}>
                  {isBuying ? 'Buying' : 'Selling'}
                </Text>
              </View>
            </View>
            <Text style={styles.timestamp}>{formatTimestamp(item.lastMessageAt)}</Text>
          </View>
          <Text style={styles.itemTitle} numberOfLines={1}>{itemTitle}</Text>
          <View style={styles.messageRow}>
            <Text
              style={[styles.lastMessage, item.unread > 0 && styles.unreadMessage]}
              numberOfLines={1}
            >
              {item.lastMessageText || 'No messages yet'}
            </Text>
            {item.unread > 0 && (
              <View style={[
                styles.unreadBadge,
                isBuying ? styles.unreadBadgeBuying : styles.unreadBadgeSelling
              ]}>
                <Text style={styles.unreadBadgeText}>{item.unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[
        styles.emptyIconContainer,
        activeTab === 'Buying' ? styles.emptyIconBuying :
        activeTab === 'Selling' ? styles.emptyIconSelling : styles.emptyIconAll
      ]}>
        <Ionicons
          name={
            activeTab === 'Buying' ? "cart-outline" :
            activeTab === 'Selling' ? "storefront-outline" :
            "chatbubbles-outline"
          }
          size={60}
          color={
            activeTab === 'Buying' ? "#2196F3" :
            activeTab === 'Selling' ? "#4CAF50" :
            "#B39BD5"
          }
        />
      </View>
      <Text style={styles.emptyTitle}>
        {activeTab === 'All' ? "No messages yet" :
         activeTab === 'Buying' ? "No buying conversations" :
         "No selling conversations"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'All'
          ? "Start a conversation by messaging a seller on an item you're interested in"
          : activeTab === 'Buying'
            ? "When you contact sellers about items, your conversations will appear here"
            : "When buyers message you about your listings, conversations will appear here"
        }
      </Text>
      {activeTab === 'All' && (
        <TouchableOpacity style={styles.browseButton} onPress={onBack}>
          <Text style={styles.browseButtonText}>Browse Items</Text>
        </TouchableOpacity>
      )}
      {activeTab === 'Selling' && (
        <TouchableOpacity style={[styles.browseButton, styles.sellButton]} onPress={onBack}>
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.browseButtonText}>Create a Listing</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Messages</Text>
          </View>
          <View style={styles.headerAction} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B39BD5" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </View>
    );
  }

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

      {/* Tabs with counts */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const badgeCount = getTabBadgeCount(tab);
          const isActive = activeTab === tab;

          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                isActive && styles.activeTab,
                tab === 'Buying' && isActive && styles.activeTabBuying,
                tab === 'Selling' && isActive && styles.activeTabSelling,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              {tab !== 'All' && (
                <Ionicons
                  name={tab === 'Buying' ? "cart" : "storefront"}
                  size={14}
                  color={
                    isActive
                      ? (tab === 'Buying' ? '#2196F3' : '#4CAF50')
                      : '#666666'
                  }
                />
              )}
              <Text style={[
                styles.tabText,
                isActive && styles.activeTabText,
                tab === 'Buying' && isActive && styles.activeTabTextBuying,
                tab === 'Selling' && isActive && styles.activeTabTextSelling,
              ]}>
                {tab}
              </Text>
              {badgeCount > 0 && (
                <View style={[
                  styles.tabBadge,
                  tab === 'Buying' && styles.tabBadgeBuying,
                  tab === 'Selling' && styles.tabBadgeSelling,
                ]}>
                  <Text style={styles.tabBadgeText}>{badgeCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Summary Stats */}
      {conversations.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Ionicons name="cart" size={16} color="#2196F3" />
            <Text style={styles.summaryText}>
              <Text style={styles.summaryCount}>{buyingCount}</Text> buying
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Ionicons name="storefront" size={16} color="#4CAF50" />
            <Text style={styles.summaryText}>
              <Text style={styles.summaryCount}>{sellingCount}</Text> selling
            </Text>
          </View>
        </View>
      )}

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item._id}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
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
  activeTabBuying: {
    backgroundColor: '#E3F2FD',
  },
  activeTabSelling: {
    backgroundColor: '#E8F5E9',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#666666',
  },
  activeTabText: {
    color: '#502E82',
  },
  activeTabTextBuying: {
    color: '#2196F3',
  },
  activeTabTextSelling: {
    color: '#4CAF50',
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
  tabBadgeBuying: {
    backgroundColor: '#2196F3',
  },
  tabBadgeSelling: {
    backgroundColor: '#4CAF50',
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  summaryDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E0E0E0',
  },
  summaryText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#666666',
  },
  summaryCount: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
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
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  chatItemBuying: {
    backgroundColor: '#FAFCFF',
  },
  chatItemSelling: {
    backgroundColor: '#FAFFFA',
  },
  roleStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  roleStripeBuying: {
    backgroundColor: '#2196F3',
  },
  roleStripeSelling: {
    backgroundColor: '#4CAF50',
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
  priceTagBuying: {
    backgroundColor: '#2196F3',
  },
  priceTagSelling: {
    backgroundColor: '#4CAF50',
  },
  priceTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  avatarContainer: {
    position: 'absolute',
    top: 12,
    left: 60,
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
  avatarBuying: {
    backgroundColor: '#E3F2FD',
  },
  avatarSelling: {
    backgroundColor: '#E8F5E9',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeBadgeBuying: {
    backgroundColor: '#E3F2FD',
  },
  typeBadgeSelling: {
    backgroundColor: '#E8F5E9',
  },
  typeBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: '#4CAF50',
  },
  typeBadgeTextBuying: {
    color: '#2196F3',
  },
  typeBadgeTextSelling: {
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
  unreadBadgeBuying: {
    backgroundColor: '#2196F3',
  },
  unreadBadgeSelling: {
    backgroundColor: '#4CAF50',
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
  emptyIconAll: {
    backgroundColor: '#F5F0FF',
  },
  emptyIconBuying: {
    backgroundColor: '#E3F2FD',
  },
  emptyIconSelling: {
    backgroundColor: '#E8F5E9',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#B39BD5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  sellButton: {
    backgroundColor: '#4CAF50',
  },
  browseButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});
