import { NextResponse } from 'next/server';

export async function GET() {
  // Mock folder data
  const folders = [
    { id: '1', name: 'Wedding Portfolio' },
    { id: '2', name: 'Portrait Session' },
    { id: '3', name: 'Event Photography' },
  ];

  return NextResponse.json({ folders });
}