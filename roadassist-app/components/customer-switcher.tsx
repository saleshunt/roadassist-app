"use client"

import { useState } from "react"
import { useAppContext, type Customer } from "./app-context"
import { UserRound, ChevronDown, CheckCircle2 } from "lucide-react"

export default function CustomerSwitcher() {
  const { currentCustomer, setCurrentCustomer, tickets } = useAppContext()
  const [isOpen, setIsOpen] = useState(false)

  // Get unique customers from tickets
  const availableCustomers = tickets.reduce<Customer[]>((acc, ticket) => {
    // Check if we already have this customer in our accumulator
    const exists = acc.some(c => c.id === ticket.customer.id)
    if (!exists) {
      acc.push(ticket.customer)
    }
    return acc
  }, [])

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const selectCustomer = (customer: Customer) => {
    setCurrentCustomer(customer)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button 
        onClick={toggleDropdown}
        className="flex items-center justify-between w-full py-2 px-3 bg-white rounded-lg shadow-sm border border-gray-200 text-sm"
      >
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-2">
            <UserRound size={18} className="text-gray-600" />
          </div>
          <div className="text-left">
            <p className="font-medium">{currentCustomer.name}</p>
            <p className="text-xs text-gray-500">{currentCustomer.phone}</p>
          </div>
        </div>
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-md border border-gray-200 z-10">
          <div className="p-2">
            <p className="text-xs font-medium text-gray-500 mb-2 px-2">Switch User</p>
            {availableCustomers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => selectCustomer(customer)}
                className="flex items-center w-full p-2 hover:bg-gray-50 rounded transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                  <UserRound size={16} className="text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{customer.name}</p>
                  <p className="text-xs text-gray-500">{customer.vehicle.model}</p>
                </div>
                {customer.id === currentCustomer.id && (
                  <CheckCircle2 size={16} className="text-bmw-blue ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 