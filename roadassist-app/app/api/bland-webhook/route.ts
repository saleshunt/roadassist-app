import { NextResponse } from 'next/server';
import * as crypto from 'crypto';
import { processBlandWebhook } from '../../../lib/bland-api';
import fs from 'fs/promises';
import path from 'path';
import { WebhookCallData } from '../../../components/app-context';

// Path to store webhook data
const dataDir = path.join(process.cwd(), 'data');
const webhookLogFile = path.join(dataDir, 'bland-webhooks.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(dataDir);
  } catch (error) {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Log webhook data for debugging and persistence
async function logWebhook(data: WebhookCallData) {
  try {
    await ensureDataDir();
    
    // Try to read existing log
    let webhooks = [];
    try {
      const existingData = await fs.readFile(webhookLogFile, 'utf-8');
      webhooks = JSON.parse(existingData);
    } catch (error) {
      // File doesn't exist or is invalid, start with empty array
      webhooks = [];
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

export async function POST(request: Request) {
  try {
    // Get the request body
    const body = await request.json();
    
    // Get the webhook signature from headers
    const webhookSignature = request.headers.get('x-webhook-signature');
    
    // Verify the webhook signature if provided
    if (webhookSignature && process.env.BLAND_WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature(
        process.env.BLAND_WEBHOOK_SECRET,
        JSON.stringify(body),
        webhookSignature
      );
      
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
    
    // Log the webhook data for debugging and persistence
    await logWebhook(body);
    
    // Process the webhook data
    console.log('Received Bland AI webhook:', body);
    
    // In a real implementation, we would use a context or communication mechanism
    // to notify the app about the webhook. Since we can't directly access the app context
    // in an API route, we'll store the data and let the app fetch/poll for updates.
    
    // For now, we'll just acknowledge receipt
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook received and logged successfully',
      callId: body.call_id,
      status: body.status
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}

// Function to verify the webhook signature
function verifyWebhookSignature(key: string, data: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', key)
    .update(data)
    .digest('hex');
  return expectedSignature === signature;
}

// Optional: Function to handle call completion
async function handleCallCompleted(callData: any) {
  // Process completed call - e.g., update ticket status, notify agents, etc.
  const { call_id, transcript, call_details } = callData;
  
  // Example implementation:
  // 1. Find the associated ticket using call_id
  // 2. Update the ticket with transcript
  // 3. If needed, change ticket status
  // 4. Store data for later analysis
  
  console.log(`Call ${call_id} completed. Transcript length: ${transcript?.length || 0}`);
} 