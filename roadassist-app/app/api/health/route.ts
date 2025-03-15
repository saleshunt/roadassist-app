import { NextResponse } from 'next/server';

export async function GET() {
  // Get the backend URL from environment variables or use default
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
  
  try {
    console.log(`Forwarding health check request to ${backendUrl}/api/health`);
    
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      // Set a timeout to avoid hanging if backend is unreachable
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error(`Backend server responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking backend health:', error);
    
    // Return a 503 Service Unavailable status if the backend is down
    return NextResponse.json(
      { status: 'error', message: 'Backend server is unavailable' },
      { status: 503 }
    );
  }
} 