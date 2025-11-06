import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iabhxzcivlpbicdnlqnw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhYmh4emNpdmxwYmljZG5scW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjE5NzUsImV4cCI6MjA3NzkzNzk3NX0.t9ny3sdXaXCjOSxO3TohANZ8bmfjA2Vk7kpHbBlG4uU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
