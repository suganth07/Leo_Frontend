import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Mock encoding deletion
  return NextResponse.json({ 
    status: 'Encoding deleted successfully!',
    success: true 
  });
}