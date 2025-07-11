// Environment variables debug
export const ENV_DEBUG = {
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***HIDDEN***' : 'MISSING',
  PHOTOS_FOLDER_ID: process.env.NEXT_PUBLIC_PHOTOS_FOLDER_ID
};

console.log('Environment Debug:', ENV_DEBUG);
