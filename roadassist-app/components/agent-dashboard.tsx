"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { useAppContext, type TicketStatus, type Customer } from "./app-context"
import {
  Search,
  Filter,
  User,
  Car,
  Clock,
  Phone,
  AlertTriangle,
  CheckCircle,
  BarChart,
  FileText,
  Zap,
  ChevronDown,
  ChevronUp,
  Users,
  GripVertical,
  Edit,
} from "lucide-react"
import CustomerEditModal from "./customer-edit-modal"

export default function AgentDashboard() {
  const { 
    tickets, 
    selectedTicketId, 
    selectTicket, 
    addMessage, 
    updateTicketStatus, 
    updateCustomer, 
    currentCustomer,
    setCurrentCustomer 
  } = useAppContext()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "All">("All")
  const [showConversation, setShowConversation] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(400) // Default width in pixels
  const isResizing = useRef(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault()
    isResizing.current = true

    const onMouseMove = (mouseMoveEvent: MouseEvent) => {
      // Ensure minimum and maximum widths
      const newWidth = Math.min(Math.max(mouseMoveEvent.clientX, 300), window.innerWidth * 0.6)
      setSidebarWidth(newWidth)
    }

    const onMouseUp = () => {
      isResizing.current = false
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }

    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }, [])

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "All" || ticket.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const selectedTicket = selectedTicketId ? tickets.find((t) => t.id === selectedTicketId) : null

  const handleTakeOver = () => {
    if (selectedTicketId) {
      updateTicketStatus(selectedTicketId, "In Progress")
    }
  }

  const handleCustomerUpdate = (updatedCustomer: Customer) => {
    if (selectedTicketId) {
      updateCustomer(selectedTicketId, updatedCustomer)
      
      // Also update global currentCustomer if IDs match or if this is current user's ticket
      if (updatedCustomer.id === currentCustomer.id) {
        setCurrentCustomer(updatedCustomer)
      }
    }
  }

  return (
    <div className="flex h-full bg-gray-100">
      {/* Ticket List Sidebar with dynamic width */}
      <div className="border-r border-gray-300 bg-white overflow-y-auto" style={{ width: sidebarWidth }}>
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold mb-4">FormelD</h2>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-bmw-blue focus:border-bmw-blue"
            />
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-600">Filter by:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter("All")}
              className={`px-3 py-1 text-xs rounded-full ${
                statusFilter === "All" ? "bg-bmw-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("AI Agent Support")}
              className={`px-3 py-1 text-xs rounded-full ${
                statusFilter === "AI Agent Support"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              AI Agent Support
            </button>
            <button
              onClick={() => setStatusFilter("Requires Human")}
              className={`px-3 py-1 text-xs rounded-full ${
                statusFilter === "Requires Human"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Requires Human
            </button>
            <button
              onClick={() => setStatusFilter("In Progress")}
              className={`px-3 py-1 text-xs rounded-full ${
                statusFilter === "In Progress"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setStatusFilter("Resolved")}
              className={`px-3 py-1 text-xs rounded-full ${
                statusFilter === "Resolved" ? "bg-gray-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Resolved
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => selectTicket(ticket.id)}
              className={`p-4 cursor-pointer hover:bg-gray-50 ${
                selectedTicketId === ticket.id ? "bg-blue-50 border-l-4 border-bmw-blue" : ""
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">{ticket.customer.name}</h3>
                  <p className="text-sm text-gray-500">{ticket.customer.vehicle.model}</p>
                </div>
                <div className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusBadgeClass(ticket.status)}`}>
                  {ticket.status}
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-2 line-clamp-2">{ticket.issue}</p>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <div className="flex items-center">
                  <Clock size={14} className="mr-1" />
                  <span suppressHydrationWarning>{formatTimeAgo(ticket.createdAt)}</span>
                </div>
                <div className="flex items-center">
                  <BarChart size={14} className="mr-1" />
                  AI: {ticket.aiConfidence}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resizer handle */}
      <div
        className="w-1 hover:w-2 bg-transparent hover:bg-gray-200 cursor-col-resize transition-all flex items-center justify-center group relative"
        onMouseDown={startResizing}
      >
        <div className="absolute inset-y-0 -left-2 -right-2 group-hover:bg-gray-200/50" />
        <GripVertical size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Ticket Detail View - takes remaining space */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedTicket ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">{selectedTicket.customer.name}</h2>
                  <div className="flex items-center text-sm text-gray-600">
                    <Car size={16} className="mr-1" />
                    {selectedTicket.customer.vehicle.model} • {selectedTicket.customer.vehicle.licensePlate}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                    onClick={() => setIsEditModalOpen(true)}
                    title="Edit customer details"
                  >
                    <Edit size={18} className="text-gray-700" />
                  </button>
                  <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                    <Phone size={18} className="text-gray-700" />
                  </button>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value as TicketStatus)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-bmw-blue focus:border-bmw-blue"
                  >
                    <option value="AI Agent Support">AI Agent Support</option>
                    <option value="Requires Human">Requires Human</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Main Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-blue-50 rounded-lg shadow-sm p-4 mb-4 border border-blue-100">
                  <h3 className="font-medium text-bmw-blue mb-3">Issue Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Problem Summary</p>
                      <p className="text-gray-800">{selectedTicket.issue}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Category</p>
                      <p className="text-gray-800">{selectedTicket.category}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Customer</p>
                      <p className="text-gray-800">
                        {selectedTicket.customer.name} • {selectedTicket.customer.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Location</p>
                      <p className="text-gray-800">{selectedTicket.location.address}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Information Section */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-gray-800">Customer Information</h3>
                    <button 
                      onClick={() => setIsEditModalOpen(true)}
                      className="flex items-center text-sm text-bmw-blue hover:text-bmw-blue-dark"
                    >
                      <Edit size={14} className="mr-1" />
                      Edit Details
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Full Name</p>
                      <p className="text-sm text-gray-800">{selectedTicket.customer.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Customer ID</p>
                      <p className="text-sm text-gray-800">{selectedTicket.customer.id}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Phone Number</p>
                      <p className="text-sm text-gray-800 font-medium">{selectedTicket.customer.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Vehicle</p>
                      <p className="text-sm text-gray-800">
                        {selectedTicket.customer.vehicle.model} ({selectedTicket.customer.vehicle.year})
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">License Plate</p>
                      <p className="text-sm text-gray-800">{selectedTicket.customer.vehicle.licensePlate}</p>
                    </div>
                    {selectedTicket.customer.vehicle.fuelStatus && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Fuel Status</p>
                        <p className="text-sm text-gray-800">{selectedTicket.customer.vehicle.fuelStatus}</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setShowConversation(!showConversation)}
                  className="w-full bg-white rounded-lg shadow-sm p-3 mb-4 flex justify-between items-center hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-800">Conversation History</span>
                  {showConversation ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {showConversation && (
                  <div className="space-y-4 mb-4">
                    {selectedTicket.messages.map((message) => (
                      <div key={message.id} className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center mb-2">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                              message.sender === "customer"
                                ? "bg-gray-200"
                                : message.sender === "agent"
                                  ? "bg-green-100"
                                  : "bg-blue-100"
                            }`}
                          >
                            {message.sender === "customer" ? (
                              <User size={16} />
                            ) : message.sender === "agent" ? (
                              <User size={16} />
                            ) : (
                              <Zap size={16} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {message.sender === "customer"
                                ? selectedTicket.customer.name
                                : message.sender === "agent"
                                  ? "Agent"
                                  : "FormelD AI Assistant"}
                            </p>
                            <p className="text-xs text-gray-500"><span suppressHydrationWarning>{formatTime(message.timestamp)}</span></p>
                          </div>
                        </div>
                        {message.imageUrl && (
                          <img
                            src={message.imageUrl || "/placeholder.svg"}
                            alt="Uploaded"
                            className="w-full max-h-60 object-contain rounded mb-2"
                          />
                        )}
                        <p className="text-gray-700">{message.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTicket.status === "AI Agent Support" && (
                  <button
                    onClick={handleTakeOver}
                    className="w-full py-4 bg-bmw-blue text-white font-bold text-lg rounded-lg hover:bg-bmw-blue-dark transition-colors shadow-md"
                  >
                    Take Over From AI Agent
                  </button>
                )}
              </div>

              {/* AI Agent Summary Panel */}
              <div className="w-1/3 border-l border-gray-200 bg-white p-4 overflow-y-auto">
                <h3 className="font-bold text-lg mb-4">AI Agent Summary</h3>

                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-bmw-blue flex items-center mb-2">
                    <BarChart size={16} className="mr-1" /> Analysis
                  </h4>
                  <p className="text-sm text-gray-700 mb-2">
                    Problem identified as: <strong>{selectedTicket.category}</strong>
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div
                      className="bg-bmw-blue h-2 rounded-full"
                      style={{ width: `${selectedTicket.aiConfidence}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600">AI confidence: {selectedTicket.aiConfidence}%</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium flex items-center mb-2">
                    <AlertTriangle size={16} className="mr-1" /> Problem Identified
                  </h4>
                  <p className="text-sm text-gray-700">
                    {selectedTicket.category === "Vehicle won't start"
                      ? "Battery issue likely based on customer description of clicking sound. Vehicle requires jump start or battery replacement."
                      : selectedTicket.category === "Flat tire"
                        ? "Flat tire on passenger side front wheel. Requires tire change or inflation."
                        : "Customer requires roadside assistance. Further diagnosis needed."}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium flex items-center mb-2">
                    <FileText size={16} className="mr-1" /> Suggested Actions
                  </h4>
                  <ul className="text-sm text-gray-700 list-disc pl-5 space-y-2">
                    <li>Dispatch service vehicle with jump start equipment</li>
                    <li>Provide estimated arrival time to customer</li>
                    <li>Offer troubleshooting steps while customer waits</li>
                    <li>Check vehicle service history for recurring issues</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium flex items-center mb-2">
                    <Users size={16} className="mr-1" /> Suggested Routing
                  </h4>
                  <div className="p-2 bg-green-50 rounded border border-green-100 text-sm">
                    <p className="font-medium text-green-800">Recommended Team: Technical Support</p>
                    <p className="text-green-700 mt-1">
                      Issue requires technical expertise for vehicle diagnostics and potential battery replacement.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium flex items-center mb-2">
                    <Car size={16} className="mr-1" /> Vehicle Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Model:</span>
                      <span className="font-medium">{selectedTicket.customer.vehicle.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year:</span>
                      <span className="font-medium">{selectedTicket.customer.vehicle.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">License:</span>
                      <span className="font-medium">{selectedTicket.customer.vehicle.licensePlate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Service:</span>
                      <span className="font-medium">3 months ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <CheckCircle size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">No ticket selected</h3>
              <p className="text-gray-500">Select a ticket from the list to view details</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Customer Edit Modal */}
      {selectedTicket && (
        <CustomerEditModal
          customer={selectedTicket.customer}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleCustomerUpdate}
        />
      )}
    </div>
  )
}

function getStatusBadgeClass(status: TicketStatus): string {
  switch (status) {
    case "AI Agent Support":
      return "bg-blue-100 text-blue-800"
    case "Requires Human":
      return "bg-yellow-100 text-yellow-800"
    case "In Progress":
      return "bg-green-100 text-green-800"
    case "Resolved":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return "Just now"
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`

  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d ago`
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date)
}

