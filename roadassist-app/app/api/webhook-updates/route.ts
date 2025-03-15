import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Path to the webhook log file
const dataDir = path.join(process.cwd(), 'data');
const webhookLogFile = path.join(dataDir, 'bland-webhooks.json');

// Define a type for webhook data
interface WebhookData {
  call_id: string;
  timestamp: string;
  status?: string;
  [key: string]: unknown;
}

export async function GET(request: Request) {
  try {
    // Get query params
    const url = new URL(request.url);
    const callId = url.searchParams.get('callId');
    const sinceParam = url.searchParams.get('since');
    
    // Parse the since parameter if provided
    let since: Date | null = null;
    if (sinceParam) {
      try {
        since = new Date(sinceParam);
      } catch {
        // Invalid date format
        console.warn('Invalid since parameter:', sinceParam);
      }
    }
    
    // Try to read the webhook log file
    let webhooks: WebhookData[] = [];
    try {
      const existingData = await fs.readFile(webhookLogFile, 'utf-8');
      webhooks = JSON.parse(existingData);
    } catch {
      // File doesn't exist or is invalid, return empty array
      return NextResponse.json({ webhooks: [] });
    }
    
    // Apply filters
    if (webhooks.length > 0) {
      // Filter by callId if provided
      if (callId) {
        webhooks = webhooks.filter((webhook) => webhook.call_id === callId);
      }
      
      // Filter by timestamp if provided
      if (since instanceof Date && !isNaN(since.getTime())) {
        webhooks = webhooks.filter((webhook) => {
          const webhookTime = new Date(webhook.timestamp);
          return webhookTime > since;
        });
      }
      
      // Sort by timestamp (newest first)
      webhooks.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
    }
    
    return NextResponse.json({ 
      webhooks,
      filters: {
        callId: callId || undefined,
        since: since ? since.toISOString() : undefined
      }
    });
  } catch {
    // Error processing request
    console.error('Error fetching webhook updates');
    return NextResponse.json({ error: 'Failed to fetch webhook updates' }, { status: 500 });
  }
} 