import { supabase } from '../config/supabase';

const ALLOWED_EMAIL_DOMAINS = [
  '@uwo.ca',
  // Add more allowed domains as needed
];

/**
 * Validates if an email belongs to an allowed school domain
 * @param {string} email - The email to validate
 * @returns {boolean} - True if email is from allowed domain
 */
export const isValidSchoolEmail = (email) => {
  if (!email) return false;
  
  const emailLower = email.toLowerCase().trim();
  return ALLOWED_EMAIL_DOMAINS.some(domain => emailLower.endsWith(domain));
};

/**
 * Gets the domain from an email
 * @param {string} email - The email address
 * @returns {string} - The domain portion
 */
export const getEmailDomain = (email) => {
  if (!email) return '';
  const parts = email.split('@');
  return parts.length > 1 ? `@${parts[1]}` : '';
};

/**
 * Check if an email is already registered
 * @param {string} email - Email to check
 * @returns {object} - { exists, error }
 */
export const checkEmailExists = async (email) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which means email doesn't exist
      return { exists: false, error };
    }

    return { exists: !!data, error: null };
  } catch (error) {
    console.error('Email check error:', error);
    return { exists: false, error };
  }
};

/**
 * Sign up a new user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {object} profileData - Additional profile data (firstName, lastName, etc.)
 * @returns {object} - { user, error }
 */
export const signUp = async (email, password, profileData) => {
  try {
    // Validate email domain first
    if (!isValidSchoolEmail(email)) {
      return {
        user: null,
        error: {
          message: 'Please use a valid school email address',
          code: 'invalid_email_domain'
        }
      };
    }

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          first_name: profileData.firstName,
          last_name: profileData.lastName,
        },
        emailRedirectTo: undefined, // Disable email confirmation redirect for mobile
      }
    });

    if (error) {
      return { user: null, error };
    }

    // Check if user already existed (Supabase returns user even if already exists)
    if (data.user && !data.session) {
      // User exists but no session means email already registered
      return {
        user: null,
        error: {
          message: 'An account with this email already exists. Please sign in instead.',
          code: 'user_already_exists'
        }
      };
    }

    // If signup successful and user is confirmed, create/update profile
    // Note: The database trigger should auto-create the profile, but we update it with additional data
    if (data.user) {
      // Wait a moment for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update profile with additional data (trigger creates basic profile)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          program: profileData.program || '',
          year_of_study: profileData.yearOfStudy || '',
          bio: profileData.bio || '',
          phone_number: profileData.phoneNumber || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Profile exists from trigger, but update failed - not critical
      }
    }

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error('Sign up error:', error);
    return { user: null, error };
  }
};

/**
 * Sign in an existing user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {object} - { user, session, error }
 */
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return { user: null, session: null, error };
    }

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { user: null, session: null, error };
  }
};

/**
 * Sign out the current user
 * @returns {object} - { error }
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error };
  }
};

/**
 * Get the current user session
 * @returns {object} - { session, error }
 */
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  } catch (error) {
    console.error('Get session error:', error);
    return { session: null, error };
  }
};

/**
 * Get the current user
 * @returns {object} - { user, error }
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  } catch (error) {
    console.error('Get user error:', error);
    return { user: null, error };
  }
};

/**
 * Get user profile from profiles table
 * @param {string} userId - The user's ID
 * @returns {object} - { profile, error }
 */
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return { profile: data, error };
  } catch (error) {
    console.error('Get profile error:', error);
    return { profile: null, error };
  }
};

/**
 * Update user profile
 * @param {string} userId - The user's ID
 * @param {object} updates - Profile fields to update
 * @returns {object} - { profile, error }
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    return { profile: data, error };
  } catch (error) {
    console.error('Update profile error:', error);
    return { profile: null, error };
  }
};

/**
 * Reset password for a user
 * @param {string} email - User's email
 * @returns {object} - { error }
 */
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  } catch (error) {
    console.error('Reset password error:', error);
    return { error };
  }
};
