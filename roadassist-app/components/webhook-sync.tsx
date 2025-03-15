"use client"

import { useEffect, useState } from 'react'
import { useAppContext, WebhookCallData } from './app-context'

/**
 * This component silently polls for webhook updates and syncs them with the app state.
 * It doesn't render anything visible, just provides the webhook data synchronization.
 */
export default function WebhookSync() {
  const { tickets, updateTicketFromWebhook } = useAppContext()
  const [lastPollTime, setLastPollTime] = useState<Date>(new Date())

  // Collect all call IDs from tickets
  const callIds = tickets
    .filter(ticket => ticket.callId)
    .map(ticket => ticket.callId)
    .filter(Boolean) as string[]

  // Poll for webhook updates every 10 seconds
  useEffect(() => {
    if (callIds.length === 0) return

    const pollInterval = setInterval(async () => {
      try {
        // Check for any updates since last poll
        const webhookUpdates = await fetchWebhookUpdates(lastPollTime)
        
        // Process any new updates
        if (webhookUpdates.length > 0) {
          console.log(`Found ${webhookUpdates.length} new webhook updates`)
          
          // Update the last poll time
          setLastPollTime(new Date())
          
          // Process each update
          webhookUpdates.forEach(update => {
            if (callIds.includes(update.call_id)) {
              updateTicketFromWebhook(update.call_id, update)
            }
          })
        }
      } catch (error) {
        console.error('Error polling for webhook updates:', error)
      }
    }, 10000) // Poll every 10 seconds

    return () => clearInterval(pollInterval)
  }, [callIds, lastPollTime, updateTicketFromWebhook])

  // Return null as this component doesn't render anything visible
  return null
}

/**
 * Fetches webhook updates from the API since a given time
 */
async function fetchWebhookUpdates(since: Date): Promise<WebhookCallData[]> {
  try {
    const response = await fetch(`/api/webhook-updates?since=${since.toISOString()}`)
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.webhooks || []
  } catch (error) {
    console.error('Error fetching webhook updates:', error)
    return []
  }
} 