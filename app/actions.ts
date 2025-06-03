'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export async function authenticate(formData: FormData) {
  try {
    const password = formData.get('password') as string;
    
    // Simple password check - in production, use proper authentication
    if (password === 'admin123') {
      return { success: true };
    }
    
    return { success: false, error: 'Invalid password' };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

export async function logout() {
  try {
    // Add logout logic here (clear sessions, etc.)
    redirect('/');
  } catch (error) {
    console.error('Logout error:', error);
    // Fallback redirect using window.location if available
    redirect('/');
  }
}