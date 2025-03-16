"use client"

import { useState, useEffect } from "react"
import { useAppContext, type Customer } from "./app-context"
import { UserRound, ChevronDown, CheckCircle2 } from "lucide-react"
import LanguageFlag from "./language-flag"
import { useBranding } from "./branding-context"

export default function CustomerSwitcher() {
  const { currentCustomer, setCurrentCustomer, tickets } = useAppContext()
  const { currentBrand } = useBranding()
  const [isOpen, setIsOpen] = useState(false)

  // Get unique customers from tickets and filter by current brand
  const availableCustomers = tickets.reduce<Customer[]>((acc, ticket) => {
    // Check if we already have this customer in our accumulator
    const exists = acc.some(c => c.id === ticket.customer.id)
    
    // Only include customers that match the current brand
    const matchesBrand = ticket.customer.brandId === currentBrand.id
    
    if (!exists && matchesBrand) {
      acc.push(ticket.customer)
    }
    return acc
  }, [])

  // Switch to first user of the brand when brand changes
  useEffect(() => {
    // If there are available customers for this brand
    if (availableCustomers.length > 0) {
      // Check if current customer matches current brand
      const currentCustomerMatchesBrand = currentCustomer.brandId === currentBrand.id
      
      // If current customer doesn't match the brand, switch to first available customer
      if (!currentCustomerMatchesBrand) {
        setCurrentCustomer(availableCustomers[0])
      }
    }
  }, [currentBrand.id, availableCustomers, currentCustomer.brandId, setCurrentCustomer])

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
        className="flex items-center justify-between w-full py-2.5 px-3.5 bg-white rounded-lg shadow-sm border border-gray-200 text-sm hover:border-gray-300 transition-colors"
      >
        <div className="flex items-center">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center mr-3">
            <UserRound size={20} className="text-gray-600" />
          </div>
          <div className="text-left">
            <div className="flex items-center">
              <p className="font-medium mr-1.5">{currentCustomer.name}</p>
              <LanguageFlag language={currentCustomer.language || 'de'} size="sm" />
            </div>
            <p className="text-xs text-brand/80 font-medium">{currentCustomer.vehicle.model}</p>
          </div>
        </div>
        <ChevronDown size={18} className={`text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-md border border-gray-200 z-10">
          <div className="p-2">
            <p className="text-xs font-medium text-gray-500 mb-2 px-2">Switch User</p>
            {availableCustomers.length > 0 ? (
              availableCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => selectCustomer(customer)}
                  className="flex items-center w-full p-2.5 hover:bg-gray-50 rounded transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                    <UserRound size={16} className="text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="font-medium text-sm mr-1.5">{customer.name}</p>
                      <LanguageFlag language={customer.language || 'de'} size="sm" />
                      {customer.id === currentCustomer.id && (
                        <CheckCircle2 size={16} className="text-brand ml-2" />
                      )}
                    </div>
                    <p className="text-xs text-brand/80 font-medium">{customer.vehicle.model}</p>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-gray-500 p-2">No {currentBrand.name} customers available</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 