import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';
// Comment out the unused import
// import { processBlandWebhook } from '../../../lib/bland-api';
import fs from 'fs/promises';
import path from 'path';

// Define types for webhook data
interface WebhookData {
  call_id?: string;
  event?: string;
  transcript?: string;
  [key: string]: unknown;
}

// Path to store webhook data
const dataDir = path.join(process.cwd(), 'data');
const webhookLogFile = path.join(dataDir, 'bland-webhooks.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Log webhook data for debugging and persistence
async function logWebhook(data: WebhookData) {
  try {
    await ensureDataDir();
    
    // Try to read existing log
    let webhooks: WebhookData[] = [];
    try {
      const existingData = await fs.readFile(webhookLogFile, 'utf-8');
      webhooks = JSON.parse(existingData);
    } catch {
      // File doesn't exist or is invalid, start with empty array
    }
    
    // Add new webhook with timestamp
    webhooks.push({
      ...data,
      timestamp: new Date().toISOString()
    });
    
    // Write updated log back to file
    await fs.writeFile(webhookLogFile, JSON.stringify(webhooks, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error logging webhook:', error);
  }
}

/**
 * Verifies the webhook signature from Bland AI
 */
function verifyWebhookSignature(secret: string, body: string, signature: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the webhook secret from environment variables
    const webhookSecret = process.env.BLAND_WEBHOOK_SECRET;
    
    // Get the raw body for signature verification
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody) as WebhookData;
    
    // Get the signature header from Bland AI
    const signature = request.headers.get('x-webhook-signature');
    
    // Log webhook in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Received Bland AI webhook:', payload);
      console.log('Webhook signature:', signature);
    }
    
    // Verify the signature if one is provided
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(webhookSecret, rawBody, signature);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === 'production') {
      // In production, require signature verification
      console.error('Missing webhook signature or secret');
      return NextResponse.json({ success: false, error: 'Missing signature or secret' }, { status: 401 });
    }
    
    // Log the webhook for debugging and auditing
    await logWebhook(payload);
    
    // Forward to backend via fetch for processing
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
    try {
      const backendResponse = await fetch(`${backendUrl}/api/bland-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Verified': 'true' // Indicate we verified the signature
        },
        body: rawBody,
      });
      
      if (!backendResponse.ok) {
        console.error(`Backend webhook processing failed with status ${backendResponse.status}`);
      }
    } catch (error) {
      console.error('Error forwarding webhook to backend:', error);
      // Continue processing even if forwarding fails - we'll handle locally too
    }
    
    // Handle different webhook events locally as well
    const eventType = payload.event || '';
    
    switch(eventType) {
      case 'call.started':
        console.log(`Call started: ${payload.call_id}`);
        break;
        
      case 'transcript.partial':
        // Handle real-time transcript updates
        console.log(`Partial transcript for call: ${payload.call_id}`);
        break;
        
      case 'call.in_progress':
        console.log(`Call in progress: ${payload.call_id}`);
        break;
        
      case 'call.completed':
        console.log(`Call completed: ${payload.call_id}`);
        if (payload.transcript) {
          console.log('Call transcript length:', payload.transcript.length);
        }
        break;
        
      default:
        console.log(`Received event type: ${eventType}`);
    }
    
    // Always return a 200 success response to Bland AI quickly
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling Bland AI webhook:', error);
    // Still return 200 to prevent Bland AI from retrying
    // But log this error to your monitoring system
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 200 });
  }
}

// Comment out the unused function
/*
async function handleCallCompleted(callData: CallData) {
  // Process completed call - e.g., update ticket status, notify agents, etc.
  const { call_id, transcript } = callData;
  
  // Example implementation:
  // 1. Find the associated ticket using call_id
  // 2. Update the ticket with transcript
  // 3. If needed, change ticket status
  // 4. Store data for later analysis
  
  console.log(`Call ${call_id} completed. Transcript length: ${transcript?.length || 0}`);
}
*/ 