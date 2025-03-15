"use client"

import { useState } from 'react'
import { WebhookCallData } from './app-context'

/**
 * A simple component for testing webhook functionality
 * This can be added to a development/debug page
 */
export default function WebhookTest() {
  const [callId, setCallId] = useState('test-call-id')
  const [status, setStatus] = useState('in_progress')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const sendTestWebhook = async () => {
    setLoading(true)
    try {
      // Create test webhook data
      const webhookData: WebhookCallData = {
        call_id: callId,
        status: status as any,
        transcript: 'This is a test transcript from a simulated call',
        call_details: {
          duration: 120,
          customer_phone: '+1234567890',
          sentiment: 'positive'
        }
      }

      // Send to webhook endpoint
      const response = await fetch('/api/bland-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookData)
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error sending test webhook:', error)
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-md max-w-md bg-gray-50">
      <h2 className="text-lg font-semibold mb-4">Webhook Test Tool</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Call ID</label>
          <input
            type="text"
            value={callId}
            onChange={(e) => setCallId(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="initiated">initiated</option>
            <option value="in_progress">in_progress</option>
            <option value="completed">completed</option>
            <option value="failed">failed</option>
          </select>
        </div>
        
        <button
          onClick={sendTestWebhook}
          disabled={loading}
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Sending...' : 'Send Test Webhook'}
        </button>
        
        {result && (
          <div className="mt-4">
            <h3 className="text-md font-medium mb-2">Response:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
} 