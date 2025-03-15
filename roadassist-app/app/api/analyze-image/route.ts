import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Get the backend URL from environment variables or use default
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
  
  try {
    // Forward the entire request to the backend
    console.log(`Forwarding image analysis request to ${backendUrl}/api/analyze-image`);
    
    // We need to clone the request body since it can only be read once
    const formData = await request.formData();
    
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/api/analyze-image`, {
      method: 'POST',
      body: formData,
      // Set a longer timeout since image analysis might take time
      signal: AbortSignal.timeout(30000)
    });
    
    if (!response.ok) {
      throw new Error(`Backend server responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error forwarding image analysis request:', error);
    
    // Return a 500 Internal Server Error status if the backend is down
    return NextResponse.json(
      { success: false, message: 'Image analysis failed', error: String(error) },
      { status: 500 }
    );
  }
} 