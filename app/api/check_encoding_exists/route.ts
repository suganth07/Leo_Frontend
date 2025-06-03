import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Mock encoding existence check
  return NextResponse.json({ 
    exists: false 
  });
}