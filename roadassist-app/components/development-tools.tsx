"use client"

import { useState } from 'react'
import WebhookTest from './webhook-test'
import Link from 'next/link'

/**
 * Development tools that are only shown when development features are enabled
 */
export default function DevelopmentTools() {
  const [isOpen, setIsOpen] = useState(false)
  
  // Only enable testing tools if the feature flag is set
  const enableTestingTools = process.env.NEXT_PUBLIC_ENABLE_TESTING_TOOLS === 'true'
  
  if (!enableTestingTools) {
    return null
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white shadow-lg rounded-lg p-4 w-[420px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Development Tools</h2>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Test Tools */}
            <div>
              <h3 className="font-medium mb-2">Testing Tools</h3>
              <div className="space-y-2">
                <div>
                  <Link 
                    href="/transcript-test" 
                    className="block w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
                  >
                    Live Transcript Test
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Webhook Test */}
            <div>
              <h3 className="font-medium mb-2">Webhook Testing</h3>
              <WebhookTest />
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            <p>Version: {process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}</p>
            <p>Environment: {process.env.NODE_ENV}</p>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700"
        >
          <span className="text-xs">DEV</span>
        </button>
      )}
    </div>
  )
} 