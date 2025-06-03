import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Mock encoding creation
  return NextResponse.json({ 
    status: 'Encoding created successfully!',
    success: true 
  });
}