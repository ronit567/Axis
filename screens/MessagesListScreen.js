import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Image, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { SkeletonChatRow } from '../components/ui/Skeleton';
import ScreenHeader from '../components/ui/ScreenHeader';

const TABS = ['All', 'Buying', 'Selling'];

export default function MessagesListScreen({ onBack, onChatPress, embedded }) {
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
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d`;
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

  // Unread counts power the tab badges
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
    const itemPrice = item.listing?.price;
    const itemImage = item.listing?.imageUrl;
    const isBuying = item.isBuyer;
    const hasUnread = item.unread > 0;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => onChatPress({
          ...item,
          sellerName: otherUserName,
          itemTitle,
          conversationId: item._id,
          isBuyer: isBuying,
        })}
        activeOpacity={0.6}
      >
        {/* Listing thumbnail anchors the conversation to the item */}
        {itemImage ? (
          <Image source={{ uri: itemImage }} style={styles.itemThumbnail} resizeMode="cover" />
        ) : (
          <View style={[styles.itemThumbnail, styles.thumbnailPlaceholder]}>
            <Ionicons name="image-outline" size={22} color="#B39BD5" />
          </View>
        )}

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.personName} numberOfLines={1}>{otherUserName}</Text>
            <View style={[styles.roleChip, !isBuying && styles.roleChipSelling]}>
              <Text style={[styles.roleChipText, !isBuying && styles.roleChipTextSelling]}>
                {isBuying ? 'Buying' : 'Selling'}
              </Text>
            </View>
            <Text style={styles.timestamp}>{formatTimestamp(item.lastMessageAt)}</Text>
          </View>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {itemTitle}
            {itemPrice != null ? `  ·  $${itemPrice}` : ''}
          </Text>
          <View style={styles.messageRow}>
            <Text
              style={[styles.lastMessage, hasUnread && styles.unreadMessage]}
              numberOfLines={1}
            >
              {item.lastMessageText || 'No messages yet'}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
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
      <View style={styles.emptyIconContainer}>
        <Ionicons
          name={
            activeTab === 'Buying' ? 'bag-handle-outline' :
            activeTab === 'Selling' ? 'pricetags-outline' :
            'chatbubbles-outline'
          }
          size={48}
          color="#502E82"
        />
      </View>
      <Text style={styles.emptyTitle}>
        {activeTab === 'All' ? 'No messages yet' :
         activeTab === 'Buying' ? 'Nothing you\'re buying' :
         'Nothing you\'re selling'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'All'
          ? 'Message a seller about an item and the conversation will show up here'
          : activeTab === 'Buying'
            ? 'When you contact sellers about items, those chats will appear here'
            : 'When buyers message you about your listings, those chats will appear here'
        }
      </Text>
      <TouchableOpacity style={styles.browseButton} onPress={onBack}>
        <Text style={styles.browseButtonText}>
          {activeTab === 'Selling' ? 'Create a Listing' : 'Browse Items'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const header = (
    <ScreenHeader
      title="Messages"
      badgeCount={totalUnread}
      embedded={embedded}
      onBack={onBack}
    >
      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#9B91A8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages"
          placeholderTextColor="#9B91A8"
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <Pressable onPress={() => setSearchText('')} hitSlop={8} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color="#C4BCD1" />
          </Pressable>
        )}
      </View>
    </ScreenHeader>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        {header}
        {/* Skeleton rows preview the conversation list while loading */}
        <View style={styles.skeletonList}>
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonChatRow key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {header}

      {/* Segmented tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const badgeCount = getTabBadgeCount(tab);
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab}</Text>
              {badgeCount > 0 && (
                <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                    {badgeCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={filteredChats.length === 0 ? styles.emptyList : styles.chatList}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        windowSize={9}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#1F1B29',
    paddingVertical: 0,
  },
  skeletonList: {
    paddingTop: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3EFF9',
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#502E82',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#6B6478',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: '#502E82',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeActive: {
    backgroundColor: '#FFFFFF',
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  tabBadgeTextActive: {
    color: '#502E82',
  },
  chatList: {
    paddingBottom: 24,
  },
  emptyList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFF9',
  },
  itemThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F3EFF9',
    marginRight: 14,
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  personName: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1F1B29',
    flexShrink: 1,
  },
  roleChip: {
    backgroundColor: '#F3EAFA',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  roleChipSelling: {
    backgroundColor: '#502E82',
  },
  roleChipText: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: '#502E82',
  },
  roleChipTextSelling: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#9B91A8',
    marginLeft: 'auto',
  },
  itemTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#7A5FA8',
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
    color: '#6B6478',
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#1F1B29',
  },
  unreadBadge: {
    backgroundColor: '#502E82',
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
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3EAFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1F1B29',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#9B91A8',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#502E82',
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 24,
  },
  browseButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});
