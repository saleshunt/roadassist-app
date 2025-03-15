"use client"

import { useState } from "react"
import CustomerApp from "@/components/customer-app"
import AgentDashboard from "@/components/agent-dashboard"
import { AppProvider } from "@/components/app-context"
import { Maximize2, Minimize2 } from "lucide-react"

export default function Home() {
  const [expandedSide, setExpandedSide] = useState<"none" | "customer" | "agent">("none")

  const toggleExpand = (side: "customer" | "agent") => {
    if (expandedSide === side) {
      setExpandedSide("none")
    } else {
      setExpandedSide(side)
    }
  }

  return (
    <AppProvider>
      <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden">
        {(expandedSide === "none" || expandedSide === "customer") && (
          <div
            className={`${expandedSide === "customer" ? "w-full" : "w-full md:w-1/2"} h-full border-r-4 border-gray-300 overflow-hidden bg-white shadow-lg relative`}
          >
            <button
              onClick={() => toggleExpand("customer")}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
            >
              {expandedSide === "customer" ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <CustomerApp />
          </div>
        )}

        {(expandedSide === "none" || expandedSide === "agent") && (
          <div
            className={`${expandedSide === "agent" ? "w-full" : "w-full md:w-1/2"} h-full overflow-hidden bg-gray-50 shadow-lg relative`}
          >
            <button
              onClick={() => toggleExpand("agent")}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
            >
              {expandedSide === "agent" ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <AgentDashboard />
          </div>
        )}
      </div>
    </AppProvider>
  )
}

