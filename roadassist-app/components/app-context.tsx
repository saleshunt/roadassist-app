"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

// Define types
export type Vehicle = {
  model: string
  year: string
  licensePlate: string
  fuelStatus?: string
}

export type Customer = {
  id: string
  name: string
  phone: string
  vehicle: Vehicle
}

export type MessageType = "ai" | "customer" | "agent" | "system"

export type Message = {
  id: string
  content: string
  sender: MessageType
  timestamp: Date
  imageUrl?: string
  isProcessing?: boolean
}

export type TicketStatus = "AI Agent Support" | "Requires Human" | "In Progress" | "Resolved"

export type Ticket = {
  id: string
  customer: Customer
  issue: string
  category: string
  status: TicketStatus
  priority: "low" | "medium" | "high"
  createdAt: Date
  aiConfidence: number
  location: {
    address: string
    coordinates: {
      lat: number
      lng: number
    }
  }
  messages: Message[]
  callId?: string // Add callId to track associated Bland AI calls
}

export type CustomerAppScreen = "home" | "call" | "support" | "request" | "photo" | "status"

export type AnalysisResult = {
  userId: string;
  analysis: string;
  images: string[]; // URLs of the analyzed images
  timestamp: Date;
}

export type WebhookCallData = {
  call_id: string;
  status: 'initiated' | 'in_progress' | 'completed' | 'failed';
  transcript?: string;
  call_details?: Record<string, unknown>;
}

type AppContextType = {
  tickets: Ticket[]
  selectedTicketId: string | null
  selectTicket: (id: string | null) => void
  customerScreen: CustomerAppScreen
  setCustomerScreen: (screen: CustomerAppScreen) => void
  goBack: () => void
  addMessage: (ticketId: string, message: Omit<Message, "id" | "timestamp">) => void
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void
  createNewTicket: (category: string, details: string) => void
  uploadPhoto: (imageUrl: string) => void
  currentCustomer: Customer
  setCurrentCustomer: (customer: Customer) => void
  simulateCall: () => void
  updateCustomer: (ticketId: string, updatedCustomer: Customer) => void
  userAnalysisResults: Record<string, AnalysisResult>
  addAnalysisResult: (userId: string, analysis: string, images: string[]) => void
  updateTicketFromWebhook: (callId: string, data: WebhookCallData) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Sample data
const sampleCustomer: Customer = {
  id: "C12345",
  name: "Alex Johnson",
  phone: "+1 (555) 123-4567",
  vehicle: {
    model: "Porsche Cayenne",
    year: "2022",
    licensePlate: "BMW-2022",
    fuelStatus: "75%",
  },
}

const initialTickets: Ticket[] = [
  {
    id: "T1000",
    customer: sampleCustomer,
    issue: "Engine warning light is on",
    category: "Warning Lights",
    status: "Requires Human",
    priority: "medium",
    createdAt: new Date(Date.now() - 15 * 60000),
    aiConfidence: 92,
    location: {
      address: "425 Main St, Cambridge, MA",
      coordinates: {
        lat: 42.3621,
        lng: -71.0842,
      },
    },
    messages: [
      {
        id: "m1",
        content: "The engine warning light came on while driving. The car is still running fine but I'm concerned.",
        sender: "customer",
        timestamp: new Date(Date.now() - 15 * 60000),
      },
      {
        id: "m2",
        content: "I understand your concern about the warning light. Based on your description, this could indicate several issues. Could you tell me if any other dashboard lights are on?",
        sender: "ai",
        timestamp: new Date(Date.now() - 14 * 60000),
      },
      {
        id: "m3",
        content: "No, just the engine light. It's an orange light, not red.",
        sender: "customer",
        timestamp: new Date(Date.now() - 13 * 60000),
      },
    ],
  },
  {
    id: "T1001",
    customer: {
      id: "C54321",
      name: "Sam Wilson",
      phone: "+1 (555) 987-6543",
      vehicle: {
        model: "Audi A4",
        year: "2021",
        licensePlate: "BMW-3421",
      },
    },
    issue: "Car won't start after parking overnight",
    category: "Vehicle won't start",
    status: "In Progress",
    priority: "high",
    createdAt: new Date(Date.now() - 35 * 60000), // 35 minutes ago
    aiConfidence: 87,
    location: {
      address: "123 Main St, Boston, MA",
      coordinates: {
        lat: 42.3601,
        lng: -71.0589,
      },
    },
    messages: [
      {
        id: "m1",
        content: "Hello, my car won't start. I'm stuck at work.",
        sender: "customer",
        timestamp: new Date(Date.now() - 35 * 60000),
      },
      {
        id: "m2",
        content: "I'm sorry to hear that. Can you describe what happens when you try to start the car?",
        sender: "ai",
        timestamp: new Date(Date.now() - 34 * 60000),
      },
      {
        id: "m3",
        content: "It makes a clicking sound but doesn't turn over.",
        sender: "customer",
        timestamp: new Date(Date.now() - 33 * 60000),
      },
      {
        id: "m4",
        content:
          "Based on your description, this sounds like a battery issue. I'm going to connect you with a human agent who can arrange for assistance.",
        sender: "ai",
        timestamp: new Date(Date.now() - 32 * 60000),
      },
      {
        id: "m5",
        content:
          "Hi Sam, I'm Agent Mike. I'll be helping you with your BMW 3 Series. I've dispatched a service vehicle to your location with an estimated arrival time of 15 minutes.",
        sender: "agent",
        timestamp: new Date(Date.now() - 30 * 60000),
      },
    ],
  },
  {
    id: "T1002",
    customer: {
      id: "C98765",
      name: "Taylor Reed",
      phone: "+1 (555) 456-7890",
      vehicle: {
        model: "BMW 7 Series",
        year: "2023",
        licensePlate: "BMW-5789",
      },
    },
    issue: "Flat tire on highway",
    category: "Flat tire",
    status: "AI Agent Support",
    priority: "medium",
    createdAt: new Date(Date.now() - 10 * 60000), // 10 minutes ago
    aiConfidence: 95,
    location: {
      address: "I-95 North, Mile Marker 42, Providence, RI",
      coordinates: {
        lat: 41.824,
        lng: -71.4128,
      },
    },
    messages: [
      {
        id: "m1",
        content: "I have a flat tire on the highway. Need help!",
        sender: "customer",
        timestamp: new Date(Date.now() - 10 * 60000),
      },
      {
        id: "m2",
        content: "I'm sorry to hear about your flat tire. Are you in a safe location away from traffic?",
        sender: "ai",
        timestamp: new Date(Date.now() - 9 * 60000),
      },
      {
        id: "m3",
        content: "Yes, I'm on the shoulder with hazard lights on.",
        sender: "customer",
        timestamp: new Date(Date.now() - 8 * 60000),
      },
    ],
  },
]

export function AppProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [customerScreen, setCustomerScreen] = useState<CustomerAppScreen>("home")
  const [screenHistory, setScreenHistory] = useState<CustomerAppScreen[]>([])
  const [currentCustomer, setCurrentCustomer] = useState<Customer>(sampleCustomer)
  const [userAnalysisResults, setUserAnalysisResults] = useState<Record<string, AnalysisResult>>({});

  const selectTicket = (id: string | null) => {
    setSelectedTicketId(id)
  }

  const handleScreenChange = (screen: CustomerAppScreen) => {
    if (customerScreen !== "home") {
      setScreenHistory(prev => [...prev, customerScreen])
    }
    setCustomerScreen(screen)
  }

  const goBack = () => {
    if (screenHistory.length > 0) {
      const prevScreen = screenHistory[screenHistory.length - 1]
      setScreenHistory(prev => prev.slice(0, -1))
      setCustomerScreen(prevScreen)
    } else {
      setCustomerScreen("home")
    }
  }

  const addMessage = (ticketId: string, message: Omit<Message, "id" | "timestamp">) => {
    setTickets((prevTickets) =>
      prevTickets.map((ticket) => {
        if (ticket.id === ticketId) {
          return {
            ...ticket,
            messages: [
              ...ticket.messages,
              {
                ...message,
                id: `m${ticket.messages.length + 1}`,
                timestamp: new Date(),
              },
            ],
          }
        }
        return ticket
      }),
    )
  }

  const updateTicketStatus = (ticketId: string, status: TicketStatus) => {
    setTickets((prevTickets) =>
      prevTickets.map((ticket) => {
        if (ticket.id === ticketId) {
          return {
            ...ticket,
            status,
          }
        }
        return ticket
      }),
    )
  }

  const createNewTicket = (category: string, details: string) => {
    const newTicket: Ticket = {
      id: `T${1000 + tickets.length + 1}`,
      customer: currentCustomer,
      issue: details,
      category,
      status: "AI Agent Support",
      priority: "medium",
      createdAt: new Date(),
      aiConfidence: 90,
      location: {
        address: "Current Location, Cambridge, MA",
        coordinates: {
          lat: 42.3736,
          lng: -71.1097,
        },
      },
      messages: [
        {
          id: "m1",
          content: details,
          sender: "customer",
          timestamp: new Date(),
        },
      ],
    }

    setTickets((prev) => [...prev, newTicket])
    setSelectedTicketId(newTicket.id)
    handleScreenChange("support")

    // Simulate AI response after 2 seconds
    setTimeout(() => {
      addMessage(newTicket.id, {
        content: `Thank you for reporting your ${category.toLowerCase()} issue. I'm analyzing the details now. Can you provide any additional information about the problem?`,
        sender: "ai",
      })
    }, 2000)
  }

  const uploadPhoto = (imageUrl: string) => {
    if (selectedTicketId) {
      addMessage(selectedTicketId, {
        content: "I've uploaded a photo of the issue.",
        sender: "customer",
        imageUrl,
      })

      // Simulate AI analyzing the image
      addMessage(selectedTicketId, {
        content: "Analyzing image...",
        sender: "ai",
        isProcessing: true,
      })

      // Simulate AI response after analysis
      setTimeout(() => {
        setTickets((prevTickets) =>
          prevTickets.map((ticket) => {
            if (ticket.id === selectedTicketId) {
              const updatedMessages = ticket.messages.map((msg) => {
                if (msg.isProcessing) {
                  return {
                    ...msg,
                    content:
                      "Based on the image, I can see this is a flat tire on the front passenger side. I'll dispatch a service vehicle to your location. The estimated arrival time is 25 minutes.",
                    isProcessing: false,
                  }
                }
                return msg
              })
              return {
                ...ticket,
                messages: updatedMessages,
              }
            }
            return ticket
          }),
        )
      }, 3000)

      handleScreenChange("support")
    }
  }

  const simulateCall = () => {
    // First set to call screen
    handleScreenChange("call")

    // Call Bland.ai API for voice call
    const callBlandApi = async () => {
      try {
        // Prepare call data with customer info and webhook URL
        const callData = {
          phone_number: currentCustomer.phone.replace(/\D/g, ''), // Strip non-digits from phone number
          location: "Current Location, Cambridge, MA",
          vehicle: currentCustomer.vehicle.model,
          issue: "Vehicle won't start",
        };

        console.log('Attempting to call Bland.ai API with data:', {
          ...callData, 
          phone_number: '****' // Mask the phone number in logs
        });

        // Call our API endpoint
        const response = await fetch('/api/bland-call', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(callData)
        });
        
        // First try to get the raw response
        const responseText = await response.text();
        console.log('Raw API response:', responseText);
        
        // Try to parse the response as JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', parseError);
          throw new Error(`Invalid response format from server: ${responseText.substring(0, 100)}`);
        }
        
        if (!response.ok) {
          const errorMessage = data.error || data.details || `Failed with status ${response.status}`;
          console.error('API error response:', errorMessage);
          throw new Error(errorMessage);
        }

        console.log('Bland.ai call initiated successfully:', data);
        
        // Create new ticket after call is initiated
        createCallTicket(data.callId);
      } catch (error: unknown) {
        console.error('Error initiating Bland.ai call:', error);
        
        // Display an error notification temporarily (for testing)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        alert(`Error: ${errorMessage}`);
        
        // Fallback to creating a ticket even if call fails
        createCallTicket();
      }
    };

    // Function to create a ticket after call is initiated or attempted
    const createCallTicket = (callId: string | null = null) => {
      const newTicket: Ticket = {
        id: `T${1000 + tickets.length + 1}`,
        customer: currentCustomer,
        issue: "Emergency roadside assistance" + (callId ? ` (Call ID: ${callId})` : ''),
        category: "Vehicle won't start",
        status: "AI Agent Support",
        priority: "high",
        createdAt: new Date(),
        aiConfidence: 90,
        location: {
          address: "Current Location, Cambridge, MA",
          coordinates: {
            lat: 42.3736,
            lng: -71.1097,
          },
        },
        messages: [
          {
            id: "m1",
            content: "I need emergency roadside assistance. My vehicle won't start.",
            sender: "customer",
            timestamp: new Date(),
          },
        ],
        callId: callId || undefined
      };

      // Update ticket state
      setTickets((prev) => [...prev, newTicket]);
      setSelectedTicketId(newTicket.id);
      
      // Move to support screen after creating ticket
      handleScreenChange("support");

      // Add AI response message
      setTimeout(() => {
        addMessage(newTicket.id, {
          content: callId 
            ? "I've initiated a call to assist you with your vehicle issue. Our AI agent is connecting with you now. Can you confirm if you're able to receive the call?"
            : "I understand you're experiencing an issue with your vehicle not starting. I'm here to help. Can you tell me if you hear any sounds when you try to start the car?",
          sender: "ai",
        });
      }, 1000);
    };

    // Start the call process after a short delay
    setTimeout(() => {
      callBlandApi();
    }, 2000);
  }

  // New method to update ticket based on webhook data
  const updateTicketFromWebhook = (callId: string, data: WebhookCallData) => {
    // Find the ticket with the matching callId
    const ticketIndex = tickets.findIndex(ticket => ticket.callId === callId);
    
    if (ticketIndex === -1) {
      console.warn(`No ticket found with callId: ${callId}`);
      return;
    }
    
    // Update ticket based on webhook data
    setTickets(prevTickets => {
      const updatedTickets = [...prevTickets];
      const ticket = {...updatedTickets[ticketIndex]};
      
      // Update ticket based on call status
      if (data.status === 'completed') {
        ticket.status = 'Resolved';
        
        // Add transcript to messages if available
        if (data.transcript) {
          addMessage(ticket.id, {
            content: `Call completed. Transcript: ${data.transcript}`,
            sender: 'system',
          });
        }
      } else if (data.status === 'in_progress') {
        ticket.status = 'In Progress';
        
        // Add in-progress message
        addMessage(ticket.id, {
          content: 'AI agent is currently on a call with the customer...',
          sender: 'system',
        });
      }
      
      updatedTickets[ticketIndex] = ticket;
      return updatedTickets;
    });
  };

  const updateCustomer = (ticketId: string, updatedCustomer: Customer) => {
    // Update the ticket's customer
    setTickets((prevTickets) =>
      prevTickets.map((ticket) => {
        if (ticket.id === ticketId) {
          return {
            ...ticket,
            customer: updatedCustomer,
          }
        }
        return ticket
      }),
    )
    
    // For demo purpose: always update the current customer
    // In a real app, you might want to check if this is the logged-in user's data
    setCurrentCustomer(updatedCustomer)
  }

  const addAnalysisResult = (userId: string, analysis: string, images: string[]) => {
    setUserAnalysisResults(prev => ({
      ...prev,
      [userId]: {
        userId,
        analysis,
        images,
        timestamp: new Date()
      }
    }));
  }

  return (
    <AppContext.Provider
      value={{
        tickets,
        selectedTicketId,
        selectTicket,
        customerScreen,
        setCustomerScreen: handleScreenChange,
        goBack,
        addMessage,
        updateTicketStatus,
        createNewTicket,
        uploadPhoto,
        currentCustomer,
        setCurrentCustomer,
        simulateCall,
        updateCustomer,
        userAnalysisResults,
        addAnalysisResult,
        updateTicketFromWebhook,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider")
  }
  return context
}

