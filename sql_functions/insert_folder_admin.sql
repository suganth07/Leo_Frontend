-- Create this function in your Supabase SQL Editor
-- This function will bypass RLS and allow admin insertion of folders

CREATE OR REPLACE FUNCTION insert_folder_admin(
  p_folder_id TEXT,
  p_folder_name TEXT,
  p_password TEXT
)
RETURNS TABLE(
  folder_id TEXT,
  folder_name TEXT,
  password TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
BEGIN
  -- Check if folder already exists
  IF EXISTS (SELECT 1 FROM folders WHERE folders.folder_id = p_folder_id) THEN
    RAISE EXCEPTION 'Folder already exists with ID: %', p_folder_id;
  END IF;

  -- Insert the new folder
  RETURN QUERY
  INSERT INTO folders (folder_id, folder_name, password, is_active, created_at, updated_at)
  VALUES (p_folder_id, p_folder_name, p_password, true, NOW(), NOW())
  RETURNING folders.folder_id, folders.folder_name, folders.password, folders.is_active, folders.created_at, folders.updated_at;
END;
$$;

-- Grant execute permission to the anon role (or your specific role)
GRANT EXECUTE ON FUNCTION insert_folder_admin TO anon;
GRANT EXECUTE ON FUNCTION insert_folder_admin TO authenticated;
