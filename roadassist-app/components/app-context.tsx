"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"

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
  language?: string // Default language will be 'de' for German
  brandId?: string // To associate user with specific brand (bmw, formelD)
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
  getCurrentCallId: () => string | null
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Sample data
const sampleCustomer: Customer = {
  id: "C98765",
  name: "Emma Martinez", 
  phone: "+49(7) 89456 1234",
  language: "de",
  brandId: "formelD",
  vehicle: {
    model: "Mercedes-Benz E-Class",
    year: "2023",
    licensePlate: "B-MZ 2023",
    fuelStatus: "85%",
  },
}

// Additional users to populate the system
const additionalUsers: Customer[] = [
  {
    id: "C23456",
    name: "Michael Chen",
    phone: "+49(2) 34567 8901",
    language: "de",
    brandId: "bmw",
    vehicle: {
      model: "BMW X5",
      year: "2022",
      licensePlate: "M-CH 5678",
      fuelStatus: "65%",
    },
  },
  {
    id: "C34567",
    name: "Sofia Rodriguez",
    phone: "+49(3) 45678 9012",
    language: "de",
    brandId: "bmw",
    vehicle: {
      model: "BMW X7",
      year: "2021",
      licensePlate: "K-SR 6789",
      fuelStatus: "45%",
    },
  },
  {
    id: "C45678",
    name: "David Patel",
    phone: "+49(4) 56789 0123",
    language: "en",
    brandId: "bmw",
    vehicle: {
      model: "BMW iX",
      year: "2023",
      licensePlate: "F-DP 7890",
      fuelStatus: "90%",
    },
  },
  {
    id: "C56789",
    name: "Olivia Johnson",
    phone: "+49(5) 67890 1234",
    language: "de",
    brandId: "bmw",
    vehicle: {
      model: "BMW i4",
      year: "2022",
      licensePlate: "S-OJ 8901",
      fuelStatus: "75%",
    },
  },
  {
    id: "C67890",
    name: "James Williams",
    phone: "+49(6) 78901 2345",
    language: "en",
    brandId: "bmw",
    vehicle: {
      model: "BMW 5 Series",
      year: "2021",
      licensePlate: "B-JW 9012",
      fuelStatus: "60%",
    },
  },
  // FormelD customers with diverse car brands
  {
    id: "C78901",
    name: "Anna Müller",
    phone: "+49(7) 89012 3456",
    language: "de",
    brandId: "formelD",
    vehicle: {
      model: "Mercedes-Benz C-Class",
      year: "2022",
      licensePlate: "M-AM 1234",
      fuelStatus: "70%",
    },
  },
  {
    id: "C89012",
    name: "Thomas Schmidt",
    phone: "+49(8) 90123 4567",
    language: "de",
    brandId: "formelD",
    vehicle: {
      model: "Volkswagen Golf",
      year: "2021",
      licensePlate: "B-TS 4567",
      fuelStatus: "55%",
    },
  },
  {
    id: "C90123",
    name: "Laura Wagner",
    phone: "+49(9) 01234 5678",
    language: "de",
    brandId: "formelD",
    vehicle: {
      model: "Audi A4",
      year: "2023",
      licensePlate: "K-LW 5678",
      fuelStatus: "80%",
    },
  },
  {
    id: "C01234",
    name: "Felix Becker",
    phone: "+49(0) 12345 6789",
    language: "en",
    brandId: "formelD",
    vehicle: {
      model: "Porsche Taycan",
      year: "2022",
      licensePlate: "S-FB 6789",
      fuelStatus: "65%",
    },
  },
  {
    id: "C12349",
    name: "Sophia Müller",
    phone: "+49(1) 23987 6543",
    language: "de",
    brandId: "formelD",
    vehicle: {
      model: "Renault Clio",
      year: "2021",
      licensePlate: "B-SM 1234",
      fuelStatus: "60%",
    },
  },
  {
    id: "C12350",
    name: "Maximilian Schneider",
    phone: "+49(2) 34098 7654",
    language: "de",
    brandId: "formelD",
    vehicle: {
      model: "Toyota Yaris",
      year: "2022",
      licensePlate: "M-MS 2345",
      fuelStatus: "75%",
    },
  },
  {
    id: "C12351",
    name: "Charlotte Fischer",
    phone: "+49(3) 45109 8765",
    language: "de",
    brandId: "formelD",
    vehicle: {
      model: "Hyundai i30",
      year: "2023",
      licensePlate: "K-CF 3456",
      fuelStatus: "85%",
    },
  },
  {
    id: "C12352",
    name: "Elias Weber",
    phone: "+49(4) 56210 9876",
    language: "en",
    brandId: "formelD",
    vehicle: {
      model: "Skoda Octavia",
      year: "2021",
      licensePlate: "F-EW 4567",
      fuelStatus: "50%",
    },
  }
]

const initialTickets: Ticket[] = [
  {
    id: "T1000",
    customer: {
      id: "C12345",
      name: "Alex Johnson",
      phone: "+49(1) 23456 7890",
      language: "de",
      brandId: "bmw",
      vehicle: {
        model: "BMW X6",
        year: "2022",
        licensePlate: "B-AJ 2022",
        fuelStatus: "75%",
      },
    },
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
      id: "C12349",
      name: "Sophia Müller",
      phone: "+49(1) 23987 6543",
      language: "de",
      brandId: "formelD",
      vehicle: {
        model: "Renault Clio",
        year: "2021",
        licensePlate: "B-SM 1234",
        fuelStatus: "60%",
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
          "Hi Sophia, I'm Agent Mike. I'll be helping you with your Renault Clio. I've dispatched a service vehicle to your location with an estimated arrival time of 15 minutes.",
        sender: "agent",
        timestamp: new Date(Date.now() - 30 * 60000),
      },
    ],
  },
  {
    id: "T1002",
    customer: {
      id: "C12350",
      name: "Maximilian Schneider",
      phone: "+49(2) 34098 7654",
      language: "de",
      brandId: "formelD",
      vehicle: {
        model: "Toyota Yaris",
        year: "2022",
        licensePlate: "M-MS 2345",
        fuelStatus: "75%",
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
  // FormelD tickets with diverse car brands
  {
    id: "T1003",
    customer: {
      id: "C78901",
      name: "Anna Müller",
      phone: "+49(7) 89012 3456",
      language: "de",
      brandId: "formelD",
      vehicle: {
        model: "Mercedes-Benz C-Class",
        year: "2022",
        licensePlate: "M-AM 1234",
        fuelStatus: "70%",
      },
    },
    issue: "Air conditioning not working",
    category: "Climate Control",
    status: "AI Agent Support",
    priority: "low",
    createdAt: new Date(Date.now() - 45 * 60000), // 45 minutes ago
    aiConfidence: 80,
    location: {
      address: "Münchner Str. 45, Berlin",
      coordinates: {
        lat: 52.5200,
        lng: 13.4050,
      },
    },
    messages: [
      {
        id: "m1",
        content: "My air conditioning isn't blowing cold air anymore.",
        sender: "customer",
        timestamp: new Date(Date.now() - 45 * 60000),
      },
      {
        id: "m2",
        content: "I'm sorry to hear that. When did you first notice the issue with your air conditioning?",
        sender: "ai",
        timestamp: new Date(Date.now() - 44 * 60000),
      },
      {
        id: "m3",
        content: "It started yesterday. It was working fine before that.",
        sender: "customer",
        timestamp: new Date(Date.now() - 43 * 60000),
      },
    ],
  },
  {
    id: "T1004",
    customer: {
      id: "C89012",
      name: "Thomas Schmidt",
      phone: "+49(8) 90123 4567",
      language: "de",
      brandId: "formelD",
      vehicle: {
        model: "Volkswagen Golf",
        year: "2021",
        licensePlate: "B-TS 4567",
        fuelStatus: "55%",
      },
    },
    issue: "Strange noise when braking",
    category: "Brakes",
    status: "Requires Human",
    priority: "high",
    createdAt: new Date(Date.now() - 25 * 60000), // 25 minutes ago
    aiConfidence: 75,
    location: {
      address: "Frankfurter Allee 110, Berlin",
      coordinates: {
        lat: 52.5113,
        lng: 13.4542,
      },
    },
    messages: [
      {
        id: "m1",
        content: "There's a squealing noise whenever I apply the brakes.",
        sender: "customer",
        timestamp: new Date(Date.now() - 25 * 60000),
      },
      {
        id: "m2",
        content: "Thank you for reporting this issue. Brake noises can indicate several different problems. Is the noise more of a high-pitched squeal or a grinding sound?",
        sender: "ai",
        timestamp: new Date(Date.now() - 24 * 60000),
      },
      {
        id: "m3",
        content: "It's definitely a high-pitched squeal.",
        sender: "customer",
        timestamp: new Date(Date.now() - 23 * 60000),
      },
    ],
  },
  {
    id: "T1005",
    customer: {
      id: "C12351",
      name: "Charlotte Fischer",
      phone: "+49(3) 45109 8765",
      language: "de",
      brandId: "formelD",
      vehicle: {
        model: "Hyundai i30",
        year: "2023",
        licensePlate: "K-CF 3456",
        fuelStatus: "85%",
      },
    },
    issue: "Navigation system not working correctly",
    category: "Navigation/Entertainment",
    status: "AI Agent Support",
    priority: "low",
    createdAt: new Date(Date.now() - 60 * 60000), // 60 minutes ago
    aiConfidence: 88,
    location: {
      address: "Kurfürstendamm 23, Berlin",
      coordinates: {
        lat: 52.5033,
        lng: 13.3267,
      },
    },
    messages: [
      {
        id: "m1",
        content: "My navigation system keeps sending me in circles. It seems to think I'm on a different road than I am.",
        sender: "customer",
        timestamp: new Date(Date.now() - 60 * 60000),
      },
      {
        id: "m2",
        content: "I understand how frustrating that can be. Have you tried rebooting the navigation system?",
        sender: "ai",
        timestamp: new Date(Date.now() - 59 * 60000),
      },
      {
        id: "m3",
        content: "Yes, I've tried turning it off and on again, but it still has the same problem.",
        sender: "customer",
        timestamp: new Date(Date.now() - 58 * 60000),
      },
    ],
  },
  {
    id: "T1006",
    customer: {
      id: "C12352",
      name: "Elias Weber",
      phone: "+49(4) 56210 9876",
      language: "en",
      brandId: "formelD",
      vehicle: {
        model: "Skoda Octavia",
        year: "2021",
        licensePlate: "F-EW 4567",
        fuelStatus: "50%",
      },
    },
    issue: "Battery warning light illuminated",
    category: "Warning Lights",
    status: "In Progress",
    priority: "medium",
    createdAt: new Date(Date.now() - 40 * 60000), // 40 minutes ago
    aiConfidence: 92,
    location: {
      address: "Hauptstraße 78, Frankfurt",
      coordinates: {
        lat: 50.1109,
        lng: 8.6821,
      },
    },
    messages: [
      {
        id: "m1",
        content: "The battery warning light just came on. Should I be concerned?",
        sender: "customer",
        timestamp: new Date(Date.now() - 40 * 60000),
      },
      {
        id: "m2",
        content: "Yes, a battery warning light indicates an issue with your charging system. How far are you from your destination?",
        sender: "ai",
        timestamp: new Date(Date.now() - 39 * 60000),
      },
      {
        id: "m3",
        content: "I'm about 15 kilometers from home.",
        sender: "customer",
        timestamp: new Date(Date.now() - 38 * 60000),
      },
      {
        id: "m4",
        content: "I recommend you have your vehicle checked as soon as possible. I'll connect you with an agent who can assist further.",
        sender: "ai",
        timestamp: new Date(Date.now() - 37 * 60000),
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

  // Initialize with additional users
  useEffect(() => {
    // Create a dummy ticket for each additional user to ensure they appear in the system
    const dummyTickets = additionalUsers.map((user, index) => ({
      id: `T${2000 + index}`,
      customer: user,
      issue: "Account initialization",
      category: "System",
      status: "Resolved" as TicketStatus,
      priority: "low" as const,
      createdAt: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)), // 30 days ago
      aiConfidence: 100,
      location: {
        address: "BMW Headquarters",
        coordinates: {
          lat: 42.3601,
          lng: -71.0589,
        },
      },
      messages: [
        {
          id: `m${index}`,
          content: "User account created successfully",
          sender: "system" as MessageType,
          timestamp: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)),
        },
      ],
    }));
    
    // Add these tickets to our state
    setTickets(prev => {
      // Check if we already have these users in the system
      const existingUserIds = prev.map(ticket => ticket.customer.id);
      const newTickets = dummyTickets.filter(ticket => 
        !existingUserIds.includes(ticket.customer.id)
      );
      
      if (newTickets.length === 0) return prev;
      return [...prev, ...newTickets] as Ticket[];
    });
  }, []);

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
        // Get your actual Pathway ID from Bland AI Portal
        // This ID should be stored in environment variables for production use
        const pathwayId = process.env.NEXT_PUBLIC_BLAND_PATHWAY_ID || "cea8c2c4-e543-4dd8-b450-7a8c1e418858";
        
        // Get the user's latest image analysis if any
        const userAnalysis = userAnalysisResults[currentCustomer.id]?.analysis;
        
        // Get the user's ticket history
        const userTickets = tickets.filter(ticket => 
          ticket.customer.id === currentCustomer.id && 
          ticket.id !== selectedTicketId // Exclude current ticket
        );
        
        // Extract previous issues from tickets
        const previousIssues = userTickets.map(ticket => ({
          id: ticket.id,
          issue: ticket.issue,
          category: ticket.category,
          status: ticket.status,
          createdAt: ticket.createdAt.toISOString(),
          priority: ticket.priority
        }));
        
        // Get the selected ticket if one exists
        const selectedTicket = selectedTicketId ? 
          tickets.find(ticket => ticket.id === selectedTicketId) : null;
        
        // Prepare call data with customer info
        const callData: {
          phone_number: string;
          customer_name: string;
          location: string;
          vehicle: string;
          issue: string;
          membership: string;
          vehicle_year: string;
          license_plate: string;
          image_summary?: string;
          previous_issues?: any[];
          last_service_date?: string;
          pathway_id?: string;
          language?: string;
          variables?: Record<string, any>;
        } = {
          phone_number: currentCustomer.phone.replace(/[^\d+]/g, ''), // Remove all non-digits and keep + sign
          customer_name: currentCustomer.name,
          location: selectedTicket?.location.address || "Current Location, Cambridge, MA",
          vehicle: currentCustomer.vehicle.model,
          issue: selectedTicket?.issue || "Vehicle won't start",
          // Include membership if available
          membership: "Premium Roadside Assistance",
          // Include vehicle details
          vehicle_year: currentCustomer.vehicle.year,
          license_plate: currentCustomer.vehicle.licensePlate,
          // Include image analysis if available
          image_summary: userAnalysis,
          // Include previous issues if available
          previous_issues: previousIssues.length > 0 ? previousIssues : undefined,
          // Mock a last service date (in a real app, this would come from the user's data)
          last_service_date: "2023-12-15",
          // Add the customer's language preference
          language: currentCustomer.language || 'de' // Default to German if not set
        };
        
        // If we have a pathway ID, add it and prepare variables
        if (pathwayId) {
          callData.pathway_id = pathwayId;
          
          // Prepare variables for the pathway
          // This includes all customer and vehicle data that might be needed
          callData.variables = {
            // Customer information
            customer_id: currentCustomer.id,
            customer_name: currentCustomer.name,
            phone_number: currentCustomer.phone.replace(/[^\d+]/g, ''), // Remove all non-digits and keep + sign
            preferred_language: currentCustomer.language || 'de', // Add language preference as a variable
            
            // Vehicle information
            vehicle_model: currentCustomer.vehicle.model,
            vehicle_year: currentCustomer.vehicle.year,
            license_plate: currentCustomer.vehicle.licensePlate,
            fuel_status: currentCustomer.vehicle.fuelStatus || 'unknown',
            
            // Location and issue information
            current_location: selectedTicket?.location.address || "Current Location, Cambridge, MA",
            issue_type: selectedTicket?.category || "Vehicle won't start",
            issue_details: selectedTicket?.issue || "Customer needs immediate roadside assistance",
            
            // Current ticket information if available
            ticket_id: selectedTicketId || undefined,
            ticket_priority: selectedTicket?.priority || "medium",
            ticket_status: selectedTicket?.status || "AI Agent Support",
            ticket_created_at: selectedTicket?.createdAt.toISOString() || new Date().toISOString(),
            
            // Membership and account details
            membership_level: "Premium Roadside Assistance",
            
            // Image analysis if available
            image_analysis: userAnalysis || "No image analysis available",
            has_image_analysis: !!userAnalysis,
            
            // Previous tickets/issues
            previous_issues: previousIssues,
            has_previous_issues: previousIssues.length > 0,
            previous_issues_count: previousIssues.length,
            
            // Last service date
            last_service_date: "2023-12-15",
            
            // Conversation history from the current ticket
            conversation_history: selectedTicket?.messages.map(m => ({
              sender: m.sender,
              content: m.content,
              timestamp: m.timestamp.toISOString()
            })) || [],
            
            // App context
            is_emergency: true,
            app_version: "1.0.0",
            call_source: "mobile_app",
            call_reason: selectedTicket?.category || "Emergency"
          };
        }

        console.log('Attempting to call Bland.ai API with data:', {
          ...callData, 
          phone_number: '****', // Mask the phone number in logs
          pathway: pathwayId ? `Using Pathway ID: ${pathwayId}` : 'Using standard prompt'
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
      // Generate a more descriptive ticket title based on customer data
      const issueTitle = currentCustomer.vehicle 
        ? `Emergency roadside assistance for ${currentCustomer.vehicle.model}` 
        : "Emergency roadside assistance";
        
      const newTicket: Ticket = {
        id: `T${1000 + tickets.length + 1}`,
        customer: currentCustomer, // This already uses the current customer
        issue: issueTitle, // Remove Call ID from title
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
            content: `I need emergency roadside assistance for my ${currentCustomer.vehicle ? currentCustomer.vehicle.model : 'vehicle'}. It won't start.`,
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

  // Add getCurrentCallId method
  const getCurrentCallId = () => {
    if (!selectedTicketId) return null;
    
    // Find the selected ticket
    const selectedTicket = tickets.find(ticket => ticket.id === selectedTicketId);
    if (!selectedTicket) return null;
    
    // Return the callId, if it exists
    return selectedTicket.callId || null;
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
        getCurrentCallId,
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

