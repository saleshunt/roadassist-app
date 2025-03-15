import { NextResponse } from 'next/server';
import type { BlandCallRequest } from '../../../lib/bland-api';

export async function POST(request: Request) {
  try {
    // Get the Bland API key from environment variables
    const apiKey = process.env.BLAND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: 'Bland API key not configured'
      }, { status: 500 });
    }
    
    // Get the webhook URL from environment variables
    const webhookUrl = process.env.BLAND_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('Bland webhook URL not configured, webhooks will not work');
    }
    
    // Get the request data
    const requestData = await request.json() as BlandCallRequest;
    
    // Validate phone number
    if (!requestData.phone_number || requestData.phone_number.length < 10) {
      return NextResponse.json({
        error: 'Invalid phone number'
      }, { status: 400 });
    }
    
    // Build the task content for the AI call
    const taskContent = buildTaskContent(requestData);
    
    // Prepare the API request payload
    const apiPayload = {
      phone_number: requestData.phone_number,
      task: taskContent,
      webhook: webhookUrl || requestData.webhook, // Use environment variable or fallback to request
      webhook_events: requestData.webhook_events || ['call.completed', 'call.started', 'call.in_progress'],
      reduce_latency: true,
      wait_for_greeting: true,
      record: true
    };
    
    console.log('Calling Bland API with payload:', {
      ...apiPayload,
      phone_number: '****' // Mask phone number in logs
    });
    
    // Call the Bland API
    const response = await fetch('https://api.bland.ai/v1/calls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(apiPayload)
    });
    
    // Parse the response
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Bland API error:', responseData);
      return NextResponse.json({
        error: responseData.error || 'Failed to initiate call',
        details: responseData
      }, { status: response.status });
    }
    
    // Return the successful response with callId
    return NextResponse.json({
      callId: responseData.call_id,
      status: 'initiated',
      message: 'Call initiated successfully',
      details: responseData
    });
  } catch (error) {
    console.error('Error making Bland AI call:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * Build the task content for the Bland AI call based on the request data
 */
function buildTaskContent(requestData: BlandCallRequest): string {
  // Construct a task prompt for the AI agent based on the available information
  let prompt = 'You are a professional automotive roadside assistance agent. ';
  
  if (requestData.vehicle) {
    prompt += `The customer owns a ${requestData.vehicle}. `;
  }
  
  if (requestData.location) {
    prompt += `They are currently located at ${requestData.location}. `;
  }
  
  if (requestData.issue) {
    prompt += `They reported the following issue: "${requestData.issue}". `;
  } else {
    prompt += 'Ask them about their automotive issue. ';
  }
  
  prompt += `
Your goal is to:
1. Introduce yourself as a roadside assistance agent
2. Confirm their identity and vehicle information
3. Understand the specific issue they're experiencing
4. Gather necessary information (location details, symptoms)
5. Offer assistance or dispatch a service technician if needed
6. Provide an estimated arrival time
7. Thank them for calling RoadAssist

Be patient, professional, and reassuring throughout the call.`;

  return prompt;
} 