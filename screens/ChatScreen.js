import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Skeleton } from '../components/ui/Skeleton';

const BUYER_QUICK_REPLIES = [
  "Is this still available?",
  "What's your lowest price?",
  "Can we meet today?",
];

const SELLER_QUICK_REPLIES = [
  "Yes, it's still available!",
  "When can you pick it up?",
  "I can do a small discount",
];

export default function ChatScreen({ chat, item, onBack }) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [conversationId, setConversationId] = useState(chat?.conversationId || null);
  const isBuyer = chat?.isBuyer ?? true;
  const flatListRef = useRef(null);

  const me = useQuery(api.users.current);
  const currentUserId = me?._id;

  const getOrCreateConversation = useMutation(api.messages.getOrCreateConversation);
  const sendMessage = useMutation(api.messages.send);
  const markRead = useMutation(api.messages.markRead);
  const markListingAsSold = useMutation(api.listings.markSold);

  // Opened from a listing (no conversation yet): create/find the thread.
  // The mutation is idempotent, keyed on (listing, buyer, seller).
  useEffect(() => {
    if (conversationId || !chat?.sellerId) return;
    const listingId = item?._id || chat?.listingId;
    if (!listingId) return;
    getOrCreateConversation({ listingId, sellerId: chat.sellerId })
      .then(setConversationId)
      .catch((error) => console.error('Error creating conversation:', error));
  }, [conversationId, chat?.sellerId, item?._id, chat?.listingId]);

  // Live message stream — new messages from either side just appear.
  const messagesData = useQuery(
    api.messages.listMessages,
    conversationId ? { conversationId } : 'skip',
  );
  const messages = messagesData ?? [];
  // Loading while the thread is being created or its history is in flight
  const isLoading = conversationId === null || messagesData === undefined;

  // Anything unread in this thread is read now (covers messages that arrive
  // while the screen is open, since this re-runs as the list grows).
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      markRead({ conversationId });
    }
  }, [conversationId, messages.length]);

  // Hide quick replies once the thread has history
  useEffect(() => {
    if (messages.length > 0) {
      setShowQuickReplies(false);
    }
  }, [messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleSend = useCallback(async (text = inputText) => {
    if (text.trim() === '' || isSending) return;

    const messageText = text.trim();
    setInputText('');
    setShowQuickReplies(false);
    Keyboard.dismiss();

    try {
      setIsSending(true);

      let convId = conversationId;

      // Create conversation if needed
      if (!convId && chat?.sellerId) {
        const listingId = item?._id || chat?.listingId;
        if (!listingId) {
          Alert.alert('Error', 'Unable to create conversation.');
          setInputText(messageText);
          return;
        }
        convId = await getOrCreateConversation({ listingId, sellerId: chat.sellerId });
        setConversationId(convId);
      }

      if (!convId) {
        Alert.alert('Error', 'Unable to create conversation.');
        setInputText(messageText);
        return;
      }

      await sendMessage({ conversationId: convId, body: messageText });
      // The reactive listMessages query delivers the new message — no manual
      // state patching needed.
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setInputText(messageText);
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, conversationId, item, chat?.sellerId, chat?.listingId]);

  const handleQuickReply = (reply) => {
    handleSend(reply);
  };

  // Buyer: compose an offer message
  const handleMakeOffer = () => {
    const itemPrice = item?.price || chat?.itemPrice || chat?.listing?.price || 0;
    Alert.prompt(
      'Make an Offer',
      `Enter your offer (listed at $${itemPrice})`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Offer',
          onPress: (value) => {
            if (value && !isNaN(value)) {
              handleSend(`I'd like to offer $${value} for this item. Let me know if that works!`);
            }
          }
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  // Seller: mark the listing sold and confirm in the thread
  const handleMarkAsSold = () => {
    Alert.alert(
      'Mark as Sold',
      'Mark this item as sold to this buyer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Sold',
          onPress: async () => {
            const listingId = item?._id || chat?.listing?._id || chat?.listingId;
            if (listingId) {
              try {
                await markListingAsSold({ id: listingId });
                handleSend("Great doing business with you! I've marked this item as sold.");
              } catch (error) {
                Alert.alert('Error', 'Failed to mark as sold.');
              }
            }
          }
        },
      ]
    );
  };

  const renderMessage = ({ item: msg, index }) => {
    const isUser = msg.senderId === currentUserId;
    const isLastMessage = index === messages.length - 1;

    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.otherMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.otherBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.otherMessageText
          ]}>
            {msg.body}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.timestamp,
              isUser ? styles.userTimestamp : styles.otherTimestamp
            ]}>
              {formatTimestamp(msg._creationTime)}
            </Text>
            {isUser && isLastMessage && (
              <Ionicons
                name={msg.readAt ? 'checkmark-done' : 'checkmark'}
                size={14}
                color="#D8CCEC"
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const otherUserName = chat?.sellerName || 'User';
  const itemTitle = item?.title || chat?.itemTitle || 'Item';
  const itemPrice = item?.price ?? chat?.itemPrice ?? chat?.listing?.price ?? 0;
  const itemImage = item?.imageUrls?.[0] || chat?.listing?.imageUrl;
  const quickReplies = isBuyer ? BUYER_QUICK_REPLIES : SELLER_QUICK_REPLIES;

  const header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityLabel="Back">
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={styles.headerInfo}>
        <View style={styles.headerAvatar}>
          <Ionicons name="person" size={18} color="#502E82" />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{otherUserName}</Text>
          <Text style={styles.roleText}>
            {isBuyer ? "You're buying" : "You're selling"}
          </Text>
        </View>
      </View>
      <View style={styles.backButton} />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        {header}
        {/* Skeleton bubbles preview the conversation shape while loading */}
        <View style={styles.loadingContainer}>
          <Skeleton width="55%" height={42} borderRadius={18} style={styles.skeletonBubbleLeft} />
          <Skeleton width="42%" height={42} borderRadius={18} style={styles.skeletonBubbleRight} />
          <Skeleton width="62%" height={42} borderRadius={18} style={styles.skeletonBubbleLeft} />
          <Skeleton width="38%" height={42} borderRadius={18} style={styles.skeletonBubbleRight} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {header}

      {/* Item context card with one role-appropriate action */}
      <View style={styles.itemPreviewCard}>
        {itemImage ? (
          <Image source={{ uri: itemImage }} style={styles.itemPreviewImage} resizeMode="cover" />
        ) : (
          <View style={[styles.itemPreviewImage, styles.itemPreviewPlaceholder]}>
            <Ionicons name="image-outline" size={20} color="#B39BD5" />
          </View>
        )}
        <View style={styles.itemPreviewInfo}>
          <Text style={styles.itemPreviewTitle} numberOfLines={1}>{itemTitle}</Text>
          <Text style={styles.itemPreviewPrice}>${itemPrice}</Text>
        </View>
        {isBuyer ? (
          <TouchableOpacity style={styles.itemActionChip} onPress={handleMakeOffer}>
            <Ionicons name="pricetag-outline" size={14} color="#502E82" />
            <Text style={styles.itemActionText}>Make offer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.itemActionChip} onPress={handleMarkAsSold}>
            <Ionicons name="checkmark-circle-outline" size={14} color="#502E82" />
            <Text style={styles.itemActionText}>Mark sold</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(msg) => msg._id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="chatbubble-ellipses-outline" size={36} color="#502E82" />
            </View>
            <Text style={styles.emptyText}>Start the conversation</Text>
            <Text style={styles.emptySubtext}>
              {isBuyer
                ? `Ask ${otherUserName} about "${itemTitle}"`
                : `Reply to the buyer about "${itemTitle}"`
              }
            </Text>
          </View>
        }
      />

      {/* Quick Replies */}
      {showQuickReplies && messages.length === 0 && (
        <View style={styles.quickRepliesContainer}>
          <View style={styles.quickReplies}>
            {quickReplies.map((reply, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickReplyButton}
                onPress={() => handleQuickReply(reply)}
              >
                <Text style={styles.quickReplyText}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#9B91A8"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isSending}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.sendButton,
            (inputText.trim() === '' || isSending) && styles.sendButtonDisabled
          ]}
          onPress={() => handleSend()}
          disabled={inputText.trim() === '' || isSending}
          accessibilityLabel="Send message"
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons
              name="arrow-up"
              size={20}
              color={inputText.trim() === '' ? '#B9B3C4' : '#FFFFFF'}
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#502E82',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#D8CCEC',
    marginTop: -2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  skeletonBubbleLeft: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  skeletonBubbleRight: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  itemPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE8F4',
  },
  itemPreviewImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3EFF9',
  },
  itemPreviewPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemPreviewInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  itemPreviewTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#1F1B29',
  },
  itemPreviewPrice: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#502E82',
    marginTop: -1,
  },
  itemActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3EAFA',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 32,
  },
  itemActionText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#502E82',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 10,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#502E82',
    borderBottomRightRadius: 6,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 21,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#1F1B29',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
    gap: 4,
  },
  timestamp: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
  },
  userTimestamp: {
    color: '#D8CCEC',
  },
  otherTimestamp: {
    color: '#9B91A8',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3EAFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1F1B29',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#9B91A8',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  quickRepliesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  quickReplies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickReplyButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E3F1',
  },
  quickReplyText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#502E82',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    borderTopWidth: 1,
    borderTopColor: '#EDE8F4',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F3EFF9',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#1F1B29',
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#502E82',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#EDE8F4',
  },
});
