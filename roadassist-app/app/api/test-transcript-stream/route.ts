import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { call_id, text, speaker } = body;
    
    // Validate required fields
    if (!call_id || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Forward the request to the backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
    const response = await fetch(`${backendUrl}/api/test-transcript-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        call_id,
        text,
        speaker: speaker || 'ai'
      })
    });
    
    // Get response from backend
    const data = await response.json();
    
    // Return response to client
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in test transcript stream API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 