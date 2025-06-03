import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('file_id');

  // Return a mock blob response
  const mockData = new Uint8Array(1024);
  return new NextResponse(mockData, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="photo-${fileId}.jpg"`,
    },
  });
}