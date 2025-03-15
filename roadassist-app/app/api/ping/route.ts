import { NextResponse } from 'next/server';

export async function GET() {
  // Get the backend URL from environment variables or use default
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
  
  try {
    // Try to forward the request to the backend
    const response = await fetch(`${backendUrl}/api/ping`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      // Set a short timeout to avoid long waits if backend is down
      signal: AbortSignal.timeout(3000)
    });
    
    if (!response.ok) {
      throw new Error(`Backend server responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.warn('Error forwarding ping to backend:', error);
    
    // Provide a fallback response even if backend is down
    // This lets the customer app function in offline mode
    return NextResponse.json({
      status: 'ok',
      message: 'Pong from Next.js API (backend unavailable)',
      backendStatus: 'unavailable'
    });
  }
} 