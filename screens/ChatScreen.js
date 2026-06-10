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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

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

  // Buyer actions
  const handleMakeOffer = () => {
    const itemPrice = item?.price || chat?.itemPrice || chat?.listing?.price || 50;
    Alert.prompt(
      'Make an Offer',
      `Enter your offer (Listed at $${itemPrice})`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Offer',
          onPress: (value) => {
            if (value && !isNaN(value)) {
              handleSend(`💰 I'd like to offer $${value} for this item. Let me know if that works!`);
            }
          }
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const handleScheduleMeetup = () => {
    Alert.alert(
      'Schedule Meetup',
      'Choose a suggested time:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Today',
          onPress: () => handleSend("📅 Can we meet today? I'm flexible with the time.")
        },
        {
          text: 'Tomorrow',
          onPress: () => handleSend("📅 How about meeting tomorrow? What time works for you?")
        },
        {
          text: 'This Week',
          onPress: () => handleSend("📅 I'm free this week. When would be a good time to meet?")
        },
      ]
    );
  };

  // Seller actions
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
                handleSend("✅ Great doing business with you! I've marked this item as sold.");
                Alert.alert('Success', 'Item marked as sold!');
              } catch (error) {
                Alert.alert('Error', 'Failed to mark as sold.');
              }
            }
          }
        },
      ]
    );
  };

  const handleAcceptOffer = () => {
    Alert.alert(
      'Accept Offer',
      'Accept the buyer\'s latest offer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => handleSend("✅ I accept your offer! Let's arrange a meetup.")
        },
      ]
    );
  };

  const handleDeclineOffer = () => {
    const itemPrice = item?.price || chat?.itemPrice || chat?.listing?.price || 50;
    Alert.alert(
      'Decline Offer',
      'How would you like to respond?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          onPress: () => handleSend("Sorry, I can't accept that offer. Are you able to come up a bit?")
        },
        {
          text: 'Counter',
          onPress: () => {
            Alert.prompt(
              'Counter Offer',
              `Enter your counter offer (Listed at $${itemPrice})`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Send',
                  onPress: (value) => {
                    if (value && !isNaN(value)) {
                      handleSend(`💰 I can do $${value}. Does that work for you?`);
                    }
                  }
                },
              ],
              'plain-text',
              '',
              'numeric'
            );
          }
        },
      ]
    );
  };

  const handleSuggestMeetup = () => {
    const meetupLocation = item?.meetupLocation;
    if (meetupLocation) {
      handleSend(`📍 I usually meet at ${meetupLocation}. Does that work for you?`);
    } else {
      Alert.prompt(
        'Suggest Meetup Location',
        'Enter a meetup location',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send',
            onPress: (value) => {
              if (value) {
                handleSend(`📍 How about we meet at ${value}? Let me know if that works!`);
              }
            }
          },
        ],
        'plain-text',
        ''
      );
    }
  };

  const renderMessage = ({ item: msg, index }) => {
    const isUser = msg.senderId === currentUserId;
    const isLastMessage = index === messages.length - 1;

    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.sellerMessageContainer
      ]}>
        {!isUser && (
          <View style={[
            styles.otherAvatarSmall,
            isBuyer ? styles.avatarSeller : styles.avatarBuyer
          ]}>
            <Ionicons
              name="person"
              size={14}
              color={isBuyer ? "#4CAF50" : "#2196F3"}
            />
          </View>
        )}
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
              <View style={styles.readReceipt}>
                <Ionicons
                  name={msg.readAt ? "checkmark-done" : "checkmark"}
                  size={14}
                  color={msg.readAt ? "#4FC3F7" : "#F0E6FF"}
                />
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const otherUserName = chat?.sellerName || 'User';
  const itemTitle = item?.title || chat?.itemTitle || 'Item';
  const itemPrice = item?.price || chat?.itemPrice || chat?.listing?.price || 0;
  const itemImage = item?.imageUrls?.[0] || chat?.listing?.imageUrl;
  const quickReplies = isBuyer ? BUYER_QUICK_REPLIES : SELLER_QUICK_REPLIES;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, isBuyer ? styles.headerBuyer : styles.headerSeller]}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={styles.headerAvatarContainer}>
              <View style={[
                styles.headerAvatar,
                isBuyer ? styles.headerAvatarBuyer : styles.headerAvatarSeller
              ]}>
                <Ionicons
                  name="person"
                  size={18}
                  color={isBuyer ? "#4CAF50" : "#2196F3"}
                />
              </View>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{otherUserName}</Text>
            </View>
          </View>
          <View style={styles.moreButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isBuyer ? "#2196F3" : "#4CAF50"} />
          <Text style={styles.loadingText}>Loading messages...</Text>
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
      {/* Header with role indicator */}
      <View style={[styles.header, isBuyer ? styles.headerBuyer : styles.headerSeller]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerInfo}>
          <View style={styles.headerAvatarContainer}>
            <View style={[
              styles.headerAvatar,
              isBuyer ? styles.headerAvatarBuyer : styles.headerAvatarSeller
            ]}>
              <Ionicons
                name="person"
                size={18}
                color={isBuyer ? "#4CAF50" : "#2196F3"}
              />
            </View>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{otherUserName}</Text>
            <View style={styles.roleIndicator}>
              <Ionicons
                name={isBuyer ? "cart" : "storefront"}
                size={12}
                color="rgba(255,255,255,0.8)"
              />
              <Text style={styles.roleText}>
                {isBuyer ? "You're buying" : "You're selling"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Item Preview Card */}
      <TouchableOpacity style={[
        styles.itemPreviewCard,
        isBuyer ? styles.itemPreviewBuyer : styles.itemPreviewSeller
      ]}>
        <Image
          source={itemImage ? { uri: itemImage } : require('../images/grey_circle.png')}
          style={styles.itemPreviewImage}
          resizeMode="cover"
        />
        <View style={styles.itemPreviewInfo}>
          <Text style={styles.itemPreviewTitle} numberOfLines={1}>{itemTitle}</Text>
          <Text style={[
            styles.itemPreviewPrice,
            isBuyer ? styles.priceBuyer : styles.priceSeller
          ]}>
            ${itemPrice}
          </Text>
        </View>

        {/* Role-specific quick actions */}
        <View style={styles.itemPreviewActions}>
          {isBuyer ? (
            <>
              <TouchableOpacity
                style={[styles.itemPreviewAction, styles.actionBuyer]}
                onPress={handleMakeOffer}
              >
                <MaterialCommunityIcons name="tag-outline" size={18} color="#2196F3" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.itemPreviewAction, styles.actionBuyer]}
                onPress={handleScheduleMeetup}
              >
                <Ionicons name="calendar-outline" size={18} color="#2196F3" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.itemPreviewAction, styles.actionSeller]}
                onPress={handleAcceptOffer}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#4CAF50" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.itemPreviewAction, styles.actionSeller]}
                onPress={handleMarkAsSold}
              >
                <Ionicons name="pricetag-outline" size={18} color="#4CAF50" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>

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
            <Ionicons
              name={isBuyer ? "cart-outline" : "storefront-outline"}
              size={48}
              color={isBuyer ? "#2196F3" : "#4CAF50"}
            />
            <Text style={styles.emptyText}>Start the conversation!</Text>
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
          <Text style={styles.quickRepliesLabel}>
            {isBuyer ? "Buyer quick replies:" : "Seller quick replies:"}
          </Text>
          <View style={styles.quickReplies}>
            {quickReplies.map((reply, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.quickReplyButton,
                  isBuyer ? styles.quickReplyBuyer : styles.quickReplySeller
                ]}
                onPress={() => handleQuickReply(reply)}
              >
                <Text style={[
                  styles.quickReplyText,
                  isBuyer ? styles.quickReplyTextBuyer : styles.quickReplyTextSeller
                ]}>
                  {reply}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Seller Action Bar */}
      {!isBuyer && (
        <View style={styles.sellerActionsBar}>
          <TouchableOpacity style={styles.sellerActionBtn} onPress={handleAcceptOffer}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.sellerActionText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sellerActionBtn} onPress={handleDeclineOffer}>
            <Ionicons name="close-circle" size={20} color="#FF6B6B" />
            <Text style={styles.sellerActionText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sellerActionBtn} onPress={handleSuggestMeetup}>
            <Ionicons name="location" size={20} color="#FF9800" />
            <Text style={styles.sellerActionText}>Meetup</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sellerActionBtn} onPress={handleMarkAsSold}>
            <Ionicons name="pricetag" size={20} color="#9C27B0" />
            <Text style={styles.sellerActionText}>Sold</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="add-circle-outline" size={26} color={isBuyer ? "#2196F3" : "#4CAF50"} />
        </TouchableOpacity>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#999999"
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
            isBuyer ? styles.sendButtonBuyer : styles.sendButtonSeller,
            (inputText.trim() === '' || isSending) && styles.sendButtonDisabled
          ]}
          onPress={() => handleSend()}
          disabled={inputText.trim() === '' || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() === '' ? '#CCCCCC' : '#FFFFFF'}
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerBuyer: {
    backgroundColor: '#1976D2',
  },
  headerSeller: {
    backgroundColor: '#388E3C',
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
    marginHorizontal: 8,
  },
  headerAvatarContainer: {
    position: 'relative',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarBuyer: {
    backgroundColor: '#E8F5E9',
  },
  headerAvatarSeller: {
    backgroundColor: '#E3F2FD',
  },
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  roleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  moreButton: {
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
  itemPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemPreviewBuyer: {
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  itemPreviewSeller: {
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  itemPreviewImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  itemPreviewInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemPreviewTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#333333',
    marginBottom: 2,
  },
  itemPreviewPrice: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  priceBuyer: {
    color: '#2196F3',
  },
  priceSeller: {
    color: '#4CAF50',
  },
  itemPreviewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  itemPreviewAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBuyer: {
    backgroundColor: '#E3F2FD',
  },
  actionSeller: {
    backgroundColor: '#E8F5E9',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 10,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  sellerMessageContainer: {
    alignSelf: 'flex-start',
  },
  otherAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarSeller: {
    backgroundColor: '#E8F5E9',
  },
  avatarBuyer: {
    backgroundColor: '#E3F2FD',
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '100%',
  },
  userBubble: {
    backgroundColor: '#B39BD5',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    color: '#333333',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  timestamp: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
  },
  userTimestamp: {
    color: '#F0E6FF',
  },
  otherTimestamp: {
    color: '#999999',
  },
  readReceipt: {
    marginLeft: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  quickRepliesContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  quickRepliesLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
    marginBottom: 8,
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
    borderWidth: 1,
  },
  quickReplyBuyer: {
    backgroundColor: '#E3F2FD',
    borderColor: '#BBDEFB',
  },
  quickReplySeller: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
  },
  quickReplyText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  quickReplyTextBuyer: {
    color: '#1976D2',
  },
  quickReplyTextSeller: {
    color: '#388E3C',
  },
  sellerActionsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    justifyContent: 'space-around',
  },
  sellerActionBtn: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sellerActionText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: '#666666',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 8,
  },
  attachButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#333333',
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonBuyer: {
    backgroundColor: '#2196F3',
  },
  sendButtonSeller: {
    backgroundColor: '#4CAF50',
  },
  sendButtonDisabled: {
    backgroundColor: '#F0F0F0',
  },
});
