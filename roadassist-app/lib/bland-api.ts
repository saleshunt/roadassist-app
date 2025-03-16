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
  pathway_id?: string;        // Add support for Conversational Pathway
  variables?: Record<string, any>; // Add support for Pathway variables
  // Additional custom fields for our application
  location?: string;
  vehicle?: string;
  issue?: string;
}

/**
 * Makes a call using the Bland AI API with support for Conversational Pathways
 * @param customerPhone Customer's phone number
 * @param issue The issue description (will be ignored if pathway_id is used)
 * @param options Additional options including pathway configuration
 * @returns Call response with callId
 */
export async function makeAiCall(
  customerPhone: string, 
  issue: string,
  options: {
    vehicle?: string;
    location?: string;
    pathwayId?: string;        // Pathway ID from Bland AI portal
    variables?: Record<string, any>; // Variables to pass to the Pathway
  } = {}
): Promise<BlandCallResponse> {
  // Clean the phone number (remove non-digits except leading +)
  const hasPlus = customerPhone.startsWith('+');
  const cleanedPhone = customerPhone.replace(/[^\d+]/g, '').replace(/^\+/, ''); // Remove all non-digits and handle + separately
  
  if (!cleanedPhone || cleanedPhone.length < 10) {
    throw new Error('Invalid phone number');
  }
  
  // Construct the payload
  const payload: BlandCallRequest = {
    phone_number: hasPlus ? "+" + cleanedPhone : "+" + cleanedPhone, // Always ensure it starts with +
    issue,
    vehicle: options.vehicle,
    location: options.location,
  };
  
  // Add the pathway_id if provided
  if (options.pathwayId) {
    payload.pathway_id = options.pathwayId;
    
    // When using pathways, the task/issue is ignored by Bland AI
    // So we can remove it to avoid confusion
    delete payload.issue;
  }
  
  // Add variables if provided
  if (options.variables) {
    payload.variables = options.variables;
  }
  
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