import { supabase } from '../config/supabase';

const STORAGE_BUCKET = 'listing-images';

/**
 * Upload an image to Supabase Storage
 * @param {string} uri - Local image URI
 * @param {string} userId - User's ID for folder organization
 * @returns {object} - { url, error }
 */
export const uploadListingImage = async (uri, userId) => {
  try {
    const filename = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

    // Fetch the image and convert to blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Convert blob to array buffer for Supabase upload
    const arrayBuffer = await new Response(blob).arrayBuffer();

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filename, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Image upload error:', error);
      return { url: null, error };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Image upload error:', error);
    return { url: null, error };
  }
};

/**
 * Upload multiple images
 * @param {string[]} uris - Array of local image URIs
 * @param {string} userId - User's ID
 * @returns {object} - { urls, errors }
 */
export const uploadListingImages = async (uris, userId) => {
  const results = await Promise.all(
    uris.map(uri => uploadListingImage(uri, userId))
  );

  const urls = results.filter(r => r.url).map(r => r.url);
  const errors = results.filter(r => r.error).map(r => r.error);

  return { urls, errors: errors.length > 0 ? errors : null };
};

/**
 * Create a new listing
 * @param {object} listingData - Listing details
 * @returns {object} - { listing, error }
 */
export const createListing = async (listingData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { listing: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('listings')
      .insert({
        user_id: user.id,
        seller_id: user.id,
        title: listingData.title,
        description: listingData.description || '',
        price: parseFloat(listingData.price),
        category: listingData.category,
        condition: listingData.condition,
        images: listingData.images || [],
        meetup_location: listingData.meetupLocation || '',
        meetup_availability: listingData.meetupAvailability || '',
        location: listingData.meetupLocation || '', // Add this for the location column
      })
      .select()
      .single();

    if (error) {
      console.error('Create listing error:', error);
      return { listing: null, error };
    }

    return { listing: data, error: null };
  } catch (error) {
    console.error('Create listing error:', error);
    return { listing: null, error };
  }
};

/**
 * Get all approved listings
 * @param {object} options - Query options (limit, offset, category, condition, search)
 * @returns {object} - { listings, error }
 */
export const getListings = async (options = {}) => {
  try {
    let query = supabase
      .from('listings')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    // Apply filters
    if (options.category && options.category !== 'All') {
      query = query.eq('category', options.category);
    }

    if (options.condition && options.condition !== 'All') {
      query = query.eq('condition', options.condition);
    }

    if (options.minPrice !== undefined) {
      query = query.gte('price', options.minPrice);
    }

    if (options.maxPrice !== undefined) {
      query = query.lte('price', options.maxPrice);
    }

    if (options.search) {
      query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get listings error:', error);
      return { listings: [], error };
    }

    return { listings: data || [], error: null };
  } catch (error) {
    console.error('Get listings error:', error);
    return { listings: [], error };
  }
};

/**
 * Get a single listing by ID
 * @param {string} listingId - Listing UUID
 * @returns {object} - { listing, error }
 */
export const getListing = async (listingId) => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (error) {
      console.error('Get listing error:', error);
      return { listing: null, error };
    }

    return { listing: data, error: null };
  } catch (error) {
    console.error('Get listing error:', error);
    return { listing: null, error };
  }
};

/**
 * Get listings by current user
 * @returns {object} - { listings, error }
 */
export const getMyListings = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { listings: [], error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get my listings error:', error);
      return { listings: [], error };
    }

    return { listings: data || [], error: null };
  } catch (error) {
    console.error('Get my listings error:', error);
    return { listings: [], error };
  }
};

/**
 * Update a listing
 * @param {string} listingId - Listing UUID
 * @param {object} updates - Fields to update
 * @returns {object} - { listing, error }
 */
export const updateListing = async (listingId, updates) => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId)
      .select()
      .single();

    if (error) {
      console.error('Update listing error:', error);
      return { listing: null, error };
    }

    return { listing: data, error: null };
  } catch (error) {
    console.error('Update listing error:', error);
    return { listing: null, error };
  }
};

/**
 * Mark a listing as sold
 * @param {string} listingId - Listing UUID
 * @returns {object} - { listing, error }
 */
export const markListingAsSold = async (listingId) => {
  return updateListing(listingId, { status: 'sold' });
};

/**
 * Delete a listing (soft delete)
 * @param {string} listingId - Listing UUID
 * @returns {object} - { success, error }
 */
export const deleteListing = async (listingId) => {
  try {
    const { error } = await supabase
      .from('listings')
      .update({ status: 'deleted' })
      .eq('id', listingId);

    if (error) {
      console.error('Delete listing error:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Delete listing error:', error);
    return { success: false, error };
  }
};

/**
 * Increment view count for a listing
 * @param {string} listingId - Listing UUID
 * @returns {object} - { success, error }
 */
export const incrementListingViews = async (listingId) => {
  try {
    const { error } = await supabase.rpc('increment_listing_views', {
      listing_id: listingId,
    });

    // If RPC doesn't exist, fall back to manual update
    if (error && error.code === 'PGRST202') {
      const { data: listing } = await supabase
        .from('listings')
        .select('views')
        .eq('id', listingId)
        .single();

      if (listing) {
        await supabase
          .from('listings')
          .update({ views: (listing.views || 0) + 1 })
          .eq('id', listingId);
      }
      return { success: true, error: null };
    }

    if (error) {
      console.error('Increment views error:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Increment views error:', error);
    return { success: false, error };
  }
};

/**
 * Get trending listings (most views in last 7 days)
 * @param {number} limit - Number of listings to return
 * @returns {object} - { listings, error }
 */
export const getTrendingListings = async (limit = 10) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'approved')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('views', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Get trending listings error:', error);
      return { listings: [], error };
    }

    return { listings: data || [], error: null };
  } catch (error) {
    console.error('Get trending listings error:', error);
    return { listings: [], error };
  }
};

/**
 * Get recently listed items
 * @param {number} limit - Number of listings to return
 * @returns {object} - { listings, error }
 */
export const getRecentListings = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Get recent listings error:', error);
      return { listings: [], error };
    }

    return { listings: data || [], error: null };
  } catch (error) {
    console.error('Get recent listings error:', error);
    return { listings: [], error };
  }
};

/**
 * Get seller profile for a listing
 * @param {string} userId - Seller's user ID
 * @returns {object} - { profile, error }
 */
export const getSellerProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, program, year_of_study')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Get seller profile error:', error);
      return { profile: null, error };
    }

    return { profile: data, error: null };
  } catch (error) {
    console.error('Get seller profile error:', error);
    return { profile: null, error };
  }
};
