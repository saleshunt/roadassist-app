'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppContext } from './app-context';

// Define the transcript segment type
interface TranscriptSegment {
  speaker: 'ai' | 'user';
  text: string;
  timestamp: string;
}

interface TranscriptUpdate {
  call_id: string;
  transcript_segment: TranscriptSegment;
}

export default function LiveTranscript({ callId }: { callId?: string }) {
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [testCallId, setTestCallId] = useState(callId || 'initializing'); // Use a stable initial value
  const [testMessage, setTestMessage] = useState('');
  const [activeSpeaker, setActiveSpeaker] = useState<'ai' | 'user'>('ai');
  const socketRef = useRef<Socket | null>(null);
  const { addMessage } = useAppContext();
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Generate a random test ID only on the client side
  useEffect(() => {
    if (testCallId === 'initializing' && !callId) {
      setTestCallId(`test-${Math.random().toString(36).substring(2, 11)}`);
    }
  }, [callId, testCallId]);

  // Create socket connection
  useEffect(() => {
    // Get the backend URL (assuming it's the same host but on port 3002)
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const backendUrl = `${protocol}//${host}:3002`;

    // Connect to Socket.io server
    socketRef.current = io(backendUrl);

    // Set up event listeners
    socketRef.current.on('connect', () => {
      console.log('Connected to transcript socket');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from transcript socket');
      setIsConnected(false);
    });

    socketRef.current.on('transcript_update', (data: TranscriptUpdate) => {
      console.log('Received transcript update:', data);
      
      // Only process updates for our call ID if one is specified
      if (callId && data.call_id !== callId) {
        return;
      }
      
      setTranscript(prev => [...prev, data.transcript_segment]);
      
      // If this update is for a real ticket, add it to the messages
      if (callId) {
        addMessage(callId, {
          content: `${data.transcript_segment.speaker}: ${data.transcript_segment.text}`,
          sender: data.transcript_segment.speaker === 'ai' ? 'agent' : 'customer'
        });
      }
    });

    // Cleanup on unmount
    return () => {
      socketRef.current?.disconnect();
    };
  }, [callId, addMessage]);

  // Auto-scroll to the bottom when transcript updates
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Function to send a test message
  const sendTestMessage = useCallback(() => {
    if (!testMessage.trim()) return;

    fetch('/api/test-transcript-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        call_id: testCallId,
        text: testMessage,
        speaker: activeSpeaker
      })
    })
      .then(res => res.json())
      .then(data => {
        console.log('Sent test message:', data);
        setTestMessage('');
      })
      .catch(err => {
        console.error('Error sending test message:', err);
      });
  }, [testCallId, testMessage, activeSpeaker]);

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-100 p-4 rounded-t-lg">
        <h2 className="text-lg font-semibold mb-1">Live Call Transcript</h2>
        <div className="text-sm text-gray-500">
          Status: {isConnected ? 
            <span className="text-green-600">Connected</span> : 
            <span className="text-red-600">Disconnected</span>}
        </div>
        {callId ? (
          <div className="text-sm text-gray-600">Call ID: {callId}</div>
        ) : (
          <div className="text-sm text-gray-600">
            Test Mode - Call ID: {testCallId === 'initializing' ? 'Generating...' : testCallId}
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-white border border-gray-200 h-64">
        {transcript.length === 0 ? (
          <div className="text-gray-400 text-center py-4">
            Waiting for transcript data...
          </div>
        ) : (
          transcript.map((segment, index) => (
            <div key={index} className={`py-2 ${segment.speaker === 'ai' ? 'pl-4' : 'pr-4'}`}>
              <div className={`flex ${segment.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-3 py-2 rounded-lg max-w-[80%] ${
                  segment.speaker === 'ai' ? 'bg-blue-100 text-blue-900' : 'bg-gray-200 text-gray-900'
                }`}>
                  <div className="font-medium mb-1">
                    {segment.speaker === 'ai' ? 'AI Agent' : 'Customer'}
                  </div>
                  <div className="text-sm">{segment.text}</div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={transcriptEndRef} />
      </div>

      {!callId && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setActiveSpeaker('ai')}
              className={`px-3 py-1 rounded ${
                activeSpeaker === 'ai' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              AI
            </button>
            <button
              onClick={() => setActiveSpeaker('user')}
              className={`px-3 py-1 rounded ${
                activeSpeaker === 'user' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Customer
            </button>
          </div>
          
          <div className="flex">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
              placeholder="Type a test message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendTestMessage}
              className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 