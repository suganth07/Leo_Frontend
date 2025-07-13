import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create service client with fallback
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
  }

  // Try to use service role key first, fallback to anon key
  const key = serviceRoleKey || anonKey;
  if (!key) {
    throw new Error('Either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  }

  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

const supabase = getSupabaseClient();

export async function GET() {
  try {
    const { data: folders, error } = await supabase
      .from('folders')
      .select('folder_id, folder_name, is_active, created_at, updated_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching folders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch folders' },
        { status: 500 }
      );
    }

    return NextResponse.json({ folders });
  } catch (error) {
    console.error('Error in GET /api/admin/folders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { folder_id, folder_name, password } = body;

    if (!folder_id || !folder_name || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: folder_id, folder_name, and password' },
        { status: 400 }
      );
    }

    // Check if folder already exists
    const { data: existingFolder } = await supabase
      .from('folders')
      .select('folder_id')
      .eq('folder_id', folder_id)
      .single();

    if (existingFolder) {
      return NextResponse.json(
        { error: 'Folder already exists in database' },
        { status: 409 }
      );
    }

    // Try direct insert first
    let insertResult = await supabase
      .from('folders')
      .insert({
        folder_id,
        folder_name,
        password,
        is_active: true
      })
      .select()
      .single();

    // If RLS is blocking, try using RPC function as fallback
    if (insertResult.error && insertResult.error.code === '42501') {
      console.log('RLS blocked insert, trying RPC function...');
      
      insertResult = await supabase.rpc('insert_folder_admin', {
        p_folder_id: folder_id,
        p_folder_name: folder_name,
        p_password: password
      });
    }

    if (insertResult.error) {
      console.error('Error inserting folder:', insertResult.error);
      return NextResponse.json(
        { error: 'Failed to add folder to database' },
        { status: 500 }
      );
    }

    const newFolder = insertResult.data;
    return NextResponse.json({ 
      message: 'Folder added successfully',
      folder: {
        folder_id: newFolder.folder_id,
        folder_name: newFolder.folder_name,
        is_active: newFolder.is_active,
        created_at: newFolder.created_at,
        updated_at: newFolder.updated_at
      }
    });
  } catch (error) {
    console.error('Error in POST /api/admin/folders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
