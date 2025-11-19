import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Dummy chat data - will be replaced with real data later
const DUMMY_CHATS = [
  {
    id: '1',
    sellerName: 'John Smith',
    itemTitle: 'Calculus Textbook',
    lastMessage: 'Is this still available?',
    timestamp: '2m ago',
    unread: true,
  },
  {
    id: '2',
    sellerName: 'Sarah Johnson',
    itemTitle: 'Desk Lamp',
    lastMessage: 'Sure, I can meet tomorrow',
    timestamp: '1h ago',
    unread: false,
  },
  {
    id: '3',
    sellerName: 'Mike Chen',
    itemTitle: 'Winter Jacket',
    lastMessage: 'Thanks for your interest!',
    timestamp: '3h ago',
    unread: false,
  },
];

export default function MessagesListScreen({ onBack, onChatPress }) {
  const renderChatItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.chatItem}
      onPress={() => onChatPress(item)}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={28} color="#B39BD5" />
        </View>
        {item.unread && <View style={styles.unreadBadge} />}
      </View>
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.sellerName}>{item.sellerName}</Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.itemTitle}</Text>
        <Text 
          style={[styles.lastMessage, item.unread && styles.unreadMessage]} 
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-ellipses-outline" size={80} color="#CCCCCC" />
      <Text style={styles.emptyTitle}>No chats yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a conversation by messaging a seller on an item you're interested in
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Chat List */}
      <FlatList
        data={DUMMY_CHATS}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={DUMMY_CHATS.length === 0 ? styles.emptyList : styles.chatList}
        ListEmptyComponent={renderEmptyState}
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
  placeholder: {
    width: 40,
  },
  chatList: {
    paddingVertical: 8,
  },
  emptyList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#B39BD5',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
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
  lastMessage: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666666',
  },
  unreadMessage: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
    textAlign: 'center',
    lineHeight: 22,
  },
});
