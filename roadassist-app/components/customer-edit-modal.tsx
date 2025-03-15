"use client"

import { useState } from "react"
import { X } from "lucide-react"
import type { Customer, Vehicle } from "./app-context"

interface CustomerEditModalProps {
  customer: Customer
  isOpen: boolean
  onClose: () => void
  onSave: (updatedCustomer: Customer) => void
}

export default function CustomerEditModal({ customer, isOpen, onClose, onSave }: CustomerEditModalProps) {
  const [editedCustomer, setEditedCustomer] = useState<Customer>({ ...customer })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(editedCustomer)
    onClose()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Customer | keyof Vehicle) => {
    const { value } = e.target
    
    if (field === 'name' || field === 'phone' || field === 'id') {
      setEditedCustomer(prev => ({
        ...prev,
        [field]: value
      }))
    } else {
      // Handle vehicle fields
      setEditedCustomer(prev => ({
        ...prev,
        vehicle: {
          ...prev.vehicle,
          [field]: value
        }
      }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Edit Customer Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID</label>
              <input
                type="text"
                value={editedCustomer.id}
                onChange={(e) => handleChange(e, 'id')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-bmw-blue focus:border-bmw-blue"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={editedCustomer.name}
                onChange={(e) => handleChange(e, 'name')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-bmw-blue focus:border-bmw-blue"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={editedCustomer.phone}
                onChange={(e) => handleChange(e, 'phone')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-bmw-blue focus:border-bmw-blue"
              />
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <h3 className="font-medium text-gray-800 mb-2">Vehicle Information</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input
                    type="text"
                    value={editedCustomer.vehicle.model}
                    onChange={(e) => handleChange(e, 'model')}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-bmw-blue focus:border-bmw-blue"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="text"
                    value={editedCustomer.vehicle.year}
                    onChange={(e) => handleChange(e, 'year')}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-bmw-blue focus:border-bmw-blue"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
                  <input
                    type="text"
                    value={editedCustomer.vehicle.licensePlate}
                    onChange={(e) => handleChange(e, 'licensePlate')}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-bmw-blue focus:border-bmw-blue"
                  />
                </div>
                
                {editedCustomer.vehicle.fuelStatus && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Status</label>
                    <input
                      type="text"
                      value={editedCustomer.vehicle.fuelStatus}
                      onChange={(e) => handleChange(e, 'fuelStatus')}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-bmw-blue focus:border-bmw-blue"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-bmw-blue text-white rounded-md hover:bg-bmw-blue-dark"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 