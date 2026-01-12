import { supabase } from '../config/supabase';

/**
 * Get or create a conversation between a buyer and seller for a listing
 * @param {string} listingId - The listing ID
 * @param {string} sellerId - The seller's user ID
 * @returns {object} - { conversation, error }
 */
export const getOrCreateConversation = async (listingId, sellerId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { conversation: null, error: { message: 'User not authenticated' } };
    }

    // Don't create conversation with yourself
    if (user.id === sellerId) {
      return { conversation: null, error: { message: 'Cannot message yourself' } };
    }

    // First, try to find existing conversation
    const { data: existing, error: findError } = await supabase
      .from('conversations')
      .select('*')
      .eq('listing_id', listingId)
      .eq('buyer_id', user.id)
      .eq('seller_id', sellerId)
      .single();

    if (existing) {
      return { conversation: existing, error: null };
    }

    // If not found (PGRST116), create new conversation
    if (findError && findError.code !== 'PGRST116') {
      console.error('Find conversation error:', findError);
      return { conversation: null, error: findError };
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: sellerId,
      })
      .select()
      .single();

    if (createError) {
      console.error('Create conversation error:', createError);
      return { conversation: null, error: createError };
    }

    return { conversation: newConversation, error: null };
  } catch (error) {
    console.error('Get or create conversation error:', error);
    return { conversation: null, error };
  }
};

/**
 * Get all conversations for the current user
 * @returns {object} - { conversations, error }
 */
export const getConversations = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { conversations: [], error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        listing:listing_id (
          id,
          title,
          price,
          images,
          status
        )
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Get conversations error:', error);
      return { conversations: [], error };
    }

    // Fetch profile info for the other party in each conversation
    const conversationsWithProfiles = await Promise.all(
      (data || []).map(async (conv) => {
        const otherUserId = conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, program')
          .eq('id', otherUserId)
          .single();

        return {
          ...conv,
          otherUser: profile,
          isBuyer: conv.buyer_id === user.id,
          unreadCount: conv.buyer_id === user.id ? conv.buyer_unread_count : conv.seller_unread_count,
        };
      })
    );

    return { conversations: conversationsWithProfiles, error: null };
  } catch (error) {
    console.error('Get conversations error:', error);
    return { conversations: [], error };
  }
};

/**
 * Get messages for a conversation
 * @param {string} conversationId - The conversation ID
 * @param {number} limit - Number of messages to fetch
 * @param {number} offset - Offset for pagination
 * @returns {object} - { messages, error }
 */
export const getMessages = async (conversationId, limit = 50, offset = 0) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Get messages error:', error);
      return { messages: [], error };
    }

    return { messages: data || [], error: null };
  } catch (error) {
    console.error('Get messages error:', error);
    return { messages: [], error };
  }
};

/**
 * Send a message in a conversation
 * @param {string} conversationId - The conversation ID
 * @param {string} content - The message content
 * @param {string} messageType - Type of message ('text', 'offer', 'image', 'system')
 * @param {number} offerAmount - Optional offer amount for offer messages
 * @returns {object} - { message, error }
 */
export const sendMessage = async (conversationId, content, messageType = 'text', offerAmount = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { message: null, error: { message: 'User not authenticated' } };
    }

    const messageData = {
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      message_type: messageType,
    };

    if (offerAmount !== null) {
      messageData.offer_amount = offerAmount;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error('Send message error:', error);
      return { message: null, error };
    }

    return { message: data, error: null };
  } catch (error) {
    console.error('Send message error:', error);
    return { message: null, error };
  }
};

/**
 * Mark messages as read in a conversation
 * @param {string} conversationId - The conversation ID
 * @returns {object} - { success, error }
 */
export const markMessagesAsRead = async (conversationId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: { message: 'User not authenticated' } };
    }

    // Mark all messages not sent by current user as read
    const { error: messageError } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .eq('is_read', false);

    if (messageError) {
      console.error('Mark messages as read error:', messageError);
      return { success: false, error: messageError };
    }

    // Reset unread count for current user in conversation
    const { data: conv } = await supabase
      .from('conversations')
      .select('buyer_id, seller_id')
      .eq('id', conversationId)
      .single();

    if (conv) {
      const updateField = conv.buyer_id === user.id ? 'buyer_unread_count' : 'seller_unread_count';
      await supabase
        .from('conversations')
        .update({ [updateField]: 0 })
        .eq('id', conversationId);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Mark messages as read error:', error);
    return { success: false, error };
  }
};

/**
 * Subscribe to new messages in a conversation
 * @param {string} conversationId - The conversation ID
 * @param {function} onNewMessage - Callback when a new message arrives
 * @returns {object} - Subscription object
 */
export const subscribeToMessages = (conversationId, onNewMessage) => {
  const subscription = supabase
    .channel(`messages-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        if (onNewMessage) onNewMessage(payload.new);
      }
    )
    .subscribe();

  return subscription;
};

/**
 * Subscribe to conversation updates (for unread counts, etc.)
 * @param {function} onUpdate - Callback when a conversation is updated
 * @returns {object} - Subscription object
 */
export const subscribeToConversations = (onUpdate) => {
  const subscription = supabase
    .channel('conversations-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
      },
      (payload) => {
        if (onUpdate) onUpdate(payload.eventType, payload.new, payload.old);
      }
    )
    .subscribe();

  return subscription;
};

/**
 * Unsubscribe from a channel
 * @param {object} subscription - The subscription to remove
 */
export const unsubscribe = async (subscription) => {
  if (subscription) {
    await supabase.removeChannel(subscription);
  }
};

/**
 * Get total unread message count for current user
 * @returns {object} - { count, error }
 */
export const getUnreadCount = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { count: 0, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('buyer_id, buyer_unread_count, seller_unread_count')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

    if (error) {
      console.error('Get unread count error:', error);
      return { count: 0, error };
    }

    const totalUnread = (data || []).reduce((sum, conv) => {
      const count = conv.buyer_id === user.id ? conv.buyer_unread_count : conv.seller_unread_count;
      return sum + (count || 0);
    }, 0);

    return { count: totalUnread, error: null };
  } catch (error) {
    console.error('Get unread count error:', error);
    return { count: 0, error };
  }
};
