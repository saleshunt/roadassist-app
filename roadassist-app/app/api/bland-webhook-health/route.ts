import { NextResponse } from 'next/server';

// Simple health check for the Bland webhook API route
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Bland webhook endpoint is ready',
    timestamp: new Date().toISOString()
  });
} 