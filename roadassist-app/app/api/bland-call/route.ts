import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.phone_number) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }
    
    // Forward the request to the backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
    console.log(`Forwarding Bland AI call request to ${backendUrl}/api/bland-call`);
    
    const response = await fetch(`${backendUrl}/api/bland-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    // Get response data
    const responseData = await response.json();
    
    // Check if the call was successful
    if (!response.ok) {
      console.error('Backend returned error:', responseData);
      return NextResponse.json(responseData, { status: response.status });
    }
    
    // Return the response to the client
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error initiating Bland AI call:', error);
    return NextResponse.json(
      { error: 'Failed to initiate call', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 