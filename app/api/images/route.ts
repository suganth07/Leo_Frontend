import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get('folder_id');

  // Mock image data
  const images = [
    { id: 'img1', name: 'photo-001.jpg', url: 'https://via.placeholder.com/400' },
    { id: 'img2', name: 'photo-002.jpg', url: 'https://via.placeholder.com/400' },
    { id: 'img3', name: 'photo-003.jpg', url: 'https://via.placeholder.com/400' },
  ];

  return NextResponse.json({ images });
}