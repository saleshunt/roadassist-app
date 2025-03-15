import { NextResponse } from 'next/server';

// This is a placeholder file to fix build errors
// The original functionality may have been moved or renamed
export async function POST() {
  return NextResponse.json({ 
    status: 'deprecated', 
    message: 'This endpoint has been moved or is no longer in use',
    timestamp: new Date().toISOString()
  });
}

export async function GET() {
  return NextResponse.json({ 
    status: 'deprecated', 
    message: 'This endpoint has been moved or is no longer in use',
    timestamp: new Date().toISOString()
  });
} 