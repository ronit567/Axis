import React, { useState, useRef, useEffect } from 'react';
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
  Animated
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Dummy messages - will be replaced with real data later
const DUMMY_MESSAGES = [
  {
    id: '1',
    text: 'Hi! Is this item still available?',
    sender: 'user',
    timestamp: '10:30 AM',
    read: true,
  },
  {
    id: '2',
    text: 'Yes, it is! Are you interested?',
    sender: 'seller',
    timestamp: '10:32 AM',
    read: true,
  },
  {
    id: '3',
    text: 'Great! Can we meet on campus tomorrow?',
    sender: 'user',
    timestamp: '10:35 AM',
    read: true,
  },
  {
    id: '4',
    text: 'Sure! How about 2pm at the library?',
    sender: 'seller',
    timestamp: '10:37 AM',
    read: true,
  },
];

const QUICK_REPLIES = [
  "Is this still available?",
  "What's your lowest price?",
  "Can we meet today?",
];

export default function ChatScreen({ chat, item, onBack }) {
  const [messages, setMessages] = useState(DUMMY_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const flatListRef = useRef(null);
  const typingDots = useRef(new Animated.Value(0)).current;

  // Animate typing indicator
  useEffect(() => {
    if (isTyping) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(typingDots, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(typingDots, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isTyping]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Simulate seller typing after user sends message
  const simulateSellerTyping = () => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const handleSend = (text = inputText) => {
    if (text.trim() === '') return;

    const newMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      }),
      read: false,
    };

    setMessages([...messages, newMessage]);
    setInputText('');
    setShowQuickReplies(false);
    Keyboard.dismiss();
    
    // Simulate seller typing response
    simulateSellerTyping();
  };
  
  const handleQuickReply = (reply) => {
    handleSend(reply);
  };
  
  const handleMakeOffer = () => {
    const itemPrice = item?.price || chat?.itemPrice || 50;
    Alert.prompt(
      'Make an Offer',
      `Enter your offer (Listed at $${itemPrice})`,
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
  
  const handleScheduleMeetup = () => {
    Alert.alert(
      'Schedule Meetup',
      'Choose a suggested time:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Today', 
          onPress: () => handleSend("Can we meet today? I'm flexible with the time.")
        },
        { 
          text: 'Tomorrow', 
          onPress: () => handleSend("How about meeting tomorrow? What time works for you?")
        },
        { 
          text: 'This Week', 
          onPress: () => handleSend("I'm free this week. When would be a good time to meet?")
        },
      ]
    );
  };

  const renderMessage = ({ item: msg, index }) => {
    const isUser = msg.sender === 'user';
    const isLastMessage = index === messages.length - 1;
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.sellerMessageContainer
      ]}>
        {!isUser && (
          <View style={styles.sellerAvatarSmall}>
            <Ionicons name="person" size={14} color="#B39BD5" />
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.sellerBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.sellerMessageText
          ]}>
            {msg.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.timestamp,
              isUser ? styles.userTimestamp : styles.sellerTimestamp
            ]}>
              {msg.timestamp}
            </Text>
            {isUser && isLastMessage && (
              <View style={styles.readReceipt}>
                <Ionicons 
                  name={msg.read ? "checkmark-done" : "checkmark"} 
                  size={14} 
                  color={msg.read ? "#4FC3F7" : "#F0E6FF"} 
                />
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };
  
  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={styles.typingContainer}>
        <View style={styles.sellerAvatarSmall}>
          <Ionicons name="person" size={14} color="#B39BD5" />
        </View>
        <View style={styles.typingBubble}>
          <Animated.View style={[styles.typingDot, { opacity: typingDots }]} />
          <Animated.View style={[styles.typingDot, { opacity: typingDots }]} />
          <Animated.View style={[styles.typingDot, { opacity: typingDots }]} />
        </View>
      </View>
    );
  };

  const sellerName = chat?.sellerName || 'Seller';
  const itemTitle = item?.title || chat?.itemTitle || 'Item';
  const itemPrice = item?.price || chat?.itemPrice || 0;
  const isOnline = chat?.isOnline ?? true;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.headerInfo}>
          <View style={styles.headerAvatarContainer}>
            <View style={styles.headerAvatar}>
              <Ionicons name="person" size={18} color="#B39BD5" />
            </View>
            {isOnline && <View style={styles.onlineIndicator} />}
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{sellerName}</Text>
            <Text style={styles.headerSubtitle}>
              {isOnline ? 'Online now' : 'Last seen recently'}
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {/* Item Preview Card */}
      <TouchableOpacity style={styles.itemPreviewCard}>
        <Image 
          source={require('../images/grey_circle.png')}
          style={styles.itemPreviewImage}
          resizeMode="cover"
        />
        <View style={styles.itemPreviewInfo}>
          <Text style={styles.itemPreviewTitle} numberOfLines={1}>{itemTitle}</Text>
          <Text style={styles.itemPreviewPrice}>${itemPrice}</Text>
        </View>
        <View style={styles.itemPreviewActions}>
          <TouchableOpacity 
            style={styles.itemPreviewAction}
            onPress={handleMakeOffer}
          >
            <MaterialCommunityIcons name="tag-outline" size={18} color="#B39BD5" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.itemPreviewAction}
            onPress={handleScheduleMeetup}
          >
            <Ionicons name="calendar-outline" size={18} color="#B39BD5" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(msg) => msg.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={renderTypingIndicator}
      />
      
      {/* Quick Replies */}
      {showQuickReplies && messages.length <= 4 && (
        <View style={styles.quickRepliesContainer}>
          <Text style={styles.quickRepliesLabel}>Quick replies:</Text>
          <View style={styles.quickReplies}>
            {QUICK_REPLIES.map((reply, index) => (
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
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="add-circle-outline" size={26} color="#B39BD5" />
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
          />
        </View>
        <TouchableOpacity 
          style={[
            styles.sendButton,
            inputText.trim() === '' && styles.sendButtonDisabled
          ]}
          onPress={() => handleSend()}
          disabled={inputText.trim() === ''}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={inputText.trim() === '' ? '#CCCCCC' : '#FFFFFF'} 
          />
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
    backgroundColor: '#502E82',
    paddingTop: 60,
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
    marginHorizontal: 8,
  },
  headerAvatarContainer: {
    position: 'relative',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#502E82',
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
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#E0D4F0',
  },
  moreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#B39BD5',
  },
  itemPreviewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  itemPreviewAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 10,
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
  sellerAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
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
  sellerBubble: {
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
  sellerMessageText: {
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
  sellerTimestamp: {
    color: '#999999',
  },
  readReceipt: {
    marginLeft: 2,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B39BD5',
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
    backgroundColor: '#F5F0FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E0F0',
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
    backgroundColor: '#B39BD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#F0F0F0',
  },
});
