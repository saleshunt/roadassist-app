import type { WebhookCallData } from '../components/app-context';

// Type for Bland API call response
export type BlandCallResponse = {
  callId: string;
  status: string;
  message: string;
}

// Type for Bland API call request
export type BlandCallRequest = {
  phone_number: string;
  task?: string;
  phone_number_to?: string;
  reduce_latency?: boolean;
  wait_for_greeting?: boolean;
  record?: boolean;
  webhook?: string;
  webhook_events?: string[];
  // Additional custom fields for our application
  location?: string;
  vehicle?: string;
  issue?: string;
}

/**
 * Processes webhook data from Bland AI
 * @param appContext App context instance
 * @param data Webhook payload from Bland AI
 */
export function processBlandWebhook(
  updateTicketFromWebhook: (callId: string, data: WebhookCallData) => void,
  data: WebhookCallData
) {
  if (!data.call_id) {
    console.error('Invalid webhook data: missing call_id');
    return;
  }

  try {
    console.log(`Processing webhook for call ${data.call_id}, status: ${data.status}`);
    
    // Update ticket with the webhook data
    updateTicketFromWebhook(data.call_id, data);
    
    return { success: true };
  } catch (error) {
    console.error('Error processing Bland webhook:', error);
    return { success: false, error };
  }
}

/**
 * Makes a call using the Bland AI API
 * @param customerPhone Customer's phone number
 * @param issue The issue description
 * @param additionalInfo Additional context information
 * @returns Call response with callId
 */
export async function makeAiCall(
  customerPhone: string, 
  issue: string,
  additionalInfo: {
    vehicle?: string;
    location?: string;
  } = {}
): Promise<BlandCallResponse> {
  // Clean the phone number (remove non-digits)
  const cleanedPhone = customerPhone.replace(/\D/g, '');
  
  if (!cleanedPhone || cleanedPhone.length < 10) {
    throw new Error('Invalid phone number');
  }
  
  // Construct the payload
  const payload: BlandCallRequest = {
    phone_number: "+" + cleanedPhone,
    issue,
    vehicle: additionalInfo.vehicle,
    location: additionalInfo.location,
    webhook: process.env.BLAND_WEBHOOK_URL,
    webhook_events: ['call.started', 'call.in_progress', 'call.completed'],
  };
  
  try {
    // Call the backend which has the Bland API key
    const response = await fetch('/api/bland-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      callId: data.callId,
      status: data.status,
      message: data.message || 'Call initiated successfully',
    };
  } catch (error) {
    console.error('Error making AI call:', error);
    throw error;
  }
} 