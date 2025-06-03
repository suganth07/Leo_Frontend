import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Mock face matching endpoint
  return new NextResponse(
    'data: {"progress": 100, "images": [{"id": "img1", "name": "matched-photo.jpg", "url": "https://via.placeholder.com/400"}]}\n\n',
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    }
  );
}