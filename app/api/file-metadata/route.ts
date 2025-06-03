import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('file_id');

  return NextResponse.json({ 
    name: `photo-${fileId}.jpg`,
    size: 1024000 
  });
}