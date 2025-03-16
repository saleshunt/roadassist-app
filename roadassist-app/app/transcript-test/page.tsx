'use client';

import { useState } from 'react';

export default function TranscriptTestPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('John Doe');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callInfo, setCallInfo] = useState<any>(null);
  
  // Function to initiate a real call via Bland AI
  const initiateRealCall = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a valid phone number');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare call data
      const callData = {
        phone_number: phoneNumber,
        customer_name: customerName,
        location: "Test Location, Cambridge, MA",
        vehicle: "Test Vehicle (BMW)",
        issue: "Test issue - calling from transcript test page",
      };
      
      // Call our API endpoint
      const response = await fetch('/api/bland-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(callData)
      });
      
      // Get the response data
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || `Failed with status ${response.status}`);
      }
      
      console.log('Call initiated:', data);
      setCallInfo(data);
      
      // Toast notification
      alert(`Call initiated! Call ID: ${data.callId}`);
    } catch (err) {
      console.error('Error initiating call:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate call');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <main className="container mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold mb-6">Bland AI Call Testing</h1>
      
      <div className="mb-8">
        <p className="mb-4">
          This page allows you to test making a call with Bland AI.
        </p>
      </div>
      
      {/* Real Call Section */}
      <div className="mb-8 border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Make a Call</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number (with country code)
            </label>
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name
            </label>
            <input
              id="customerName"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md border border-red-100">
              {error}
            </div>
          )}
          
          <button
            onClick={initiateRealCall}
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {isLoading ? 'Initiating Call...' : 'Make Phone Call'}
          </button>
          
          {callInfo && (
            <div className="p-3 bg-green-50 text-green-700 rounded-md border border-green-100">
              <p><strong>Call ID:</strong> {callInfo.callId}</p>
              <p><strong>Status:</strong> {callInfo.status}</p>
              <p className="text-sm mt-1">Call in progress with Bland AI</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800">How It Works</h3>
        <p className="text-yellow-700">
          1. Enter a phone number and customer name<br />
          2. Click "Make Phone Call" to initiate a Bland AI call<br />
          3. When the person answers, Bland AI will talk to them<br />
          4. The call will be handled entirely by Bland AI<br />
        </p>
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Technical Details</h2>
        <p className="text-gray-700">
          This page connects to the backend endpoint that initiates a Bland AI call. The call is processed by Bland AI's service directly without any additional streaming or webhooks.
        </p>
      </div>
    </main>
  );
} 