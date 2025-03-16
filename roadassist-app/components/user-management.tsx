"use client"

import { useState, useEffect } from "react"
import { useAppContext, type Customer, type Vehicle } from "./app-context"
import { X, Plus, Edit, Trash, UserRound, Phone, Car, Check, X as Close } from "lucide-react"

interface UserManagementProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserManagement({ isOpen, onClose }: UserManagementProps) {
  const { tickets, updateCustomer, setCurrentCustomer } = useAppContext()
  const [users, setUsers] = useState<Customer[]>([])
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [editingRows, setEditingRows] = useState<{[key: string]: boolean}>({})
  const [editData, setEditData] = useState<{[key: string]: any}>({})
  
  // Form state
  const [formData, setFormData] = useState<{
    id: string
    name: string
    phone: string
    vehicle: Vehicle
  }>({
    id: "",
    name: "",
    phone: "",
    vehicle: {
      model: "",
      year: "",
      licensePlate: "",
      fuelStatus: "75%"
    }
  })
  
  // Initialize users from tickets
  useEffect(() => {
    // Extract unique users from tickets
    const uniqueUsers = tickets.reduce<Customer[]>((acc, ticket) => {
      const exists = acc.some(user => user.id === ticket.customer.id)
      if (!exists) {
        acc.push(ticket.customer)
      }
      return acc
    }, [])
    
    // Ensure our users list has at least the current additional users
    // (This is a workaround since we don't have a separate users table in this demo)
    const additionalUsers = [
      {
        id: "C23456",
        name: "Michael Chen",
        phone: "+1 (555) 234-5678",
        vehicle: {
          model: "BMW X5",
          year: "2022",
          licensePlate: "CHN-5678",
          fuelStatus: "65%",
        },
      },
      {
        id: "C34567",
        name: "Sofia Rodriguez",
        phone: "+1 (555) 345-6789",
        vehicle: {
          model: "BMW X7",
          year: "2021",
          licensePlate: "RDZ-6789",
          fuelStatus: "45%",
        },
      },
      {
        id: "C45678",
        name: "David Patel",
        phone: "+1 (555) 456-7890",
        vehicle: {
          model: "BMW iX",
          year: "2023",
          licensePlate: "PTL-7890",
          fuelStatus: "90%",
        },
      },
      {
        id: "C56789",
        name: "Olivia Johnson",
        phone: "+1 (555) 567-8901",
        vehicle: {
          model: "BMW i4",
          year: "2022",
          licensePlate: "JSN-8901",
          fuelStatus: "75%",
        },
      },
      {
        id: "C67890",
        name: "James Williams",
        phone: "+1 (555) 678-9012",
        vehicle: {
          model: "BMW 5 Series",
          year: "2021",
          licensePlate: "WLM-9012",
          fuelStatus: "60%",
        },
      },
      {
        id: "C98765",
        name: "Emma Martinez", 
        phone: "+1 (555) 789-4561",
        vehicle: {
          model: "BMW X3",
          year: "2023",
          licensePlate: "MRZ-2023",
          fuelStatus: "85%",
        },
      }
    ]
    
    // Merge unique users from tickets with additional users, avoiding duplicates
    const allUsers = [...uniqueUsers]
    additionalUsers.forEach(additionalUser => {
      if (!allUsers.some(user => user.id === additionalUser.id)) {
        allUsers.push(additionalUser)
      }
    })
    
    setUsers(allUsers)
  }, [tickets])
  
  // Reset form data
  const resetForm = () => {
    setFormData({
      id: `C${Math.floor(Math.random() * 100000)}`,
      name: "",
      phone: "",
      vehicle: {
        model: "",
        year: "",
        licensePlate: "",
        fuelStatus: "75%"
      }
    })
  }
  
  // Start adding a new user
  const handleAddUser = () => {
    resetForm()
    setIsAddingUser(true)
  }
  
  // Start editing a user inline
  const handleEditUser = (user: Customer) => {
    setEditingRows(prev => ({ ...prev, [user.id]: true }))
    setEditData(prev => ({ 
      ...prev, 
      [user.id]: {
        name: user.name,
        phone: user.phone,
        vehicleModel: user.vehicle.model,
        vehicleYear: user.vehicle.year,
        vehicleLicensePlate: user.vehicle.licensePlate,
      }
    }))
  }
  
  // Save inline edits
  const handleSaveInlineEdit = (userId: string) => {
    const userData = editData[userId]
    if (!userData) return
    
    // Find the user
    const user = users.find(u => u.id === userId)
    if (!user) return
    
    // Simple validation
    if (!userData.name || !userData.phone || !userData.vehicleModel) {
      alert("Please fill in all required fields")
      return
    }
    
    // Create updated user
    const updatedUser: Customer = {
      ...user,
      name: userData.name,
      phone: userData.phone,
      vehicle: {
        ...user.vehicle,
        model: userData.vehicleModel,
        year: userData.vehicleYear,
        licensePlate: userData.vehicleLicensePlate,
      }
    }
    
    // Update in users list
    setUsers(prevUsers => 
      prevUsers.map(u => u.id === userId ? updatedUser : u)
    )
    
    // Update user in all tickets
    tickets.forEach(ticket => {
      if (ticket.customer.id === userId) {
        updateCustomer(ticket.id, updatedUser)
      }
    })
    
    // Exit edit mode
    setEditingRows(prev => ({ ...prev, [userId]: false }))
  }
  
  // Cancel inline editing
  const handleCancelInlineEdit = (userId: string) => {
    setEditingRows(prev => ({ ...prev, [userId]: false }))
  }
  
  // Handle edit field changes
  const handleEditFieldChange = (userId: string, field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value
      }
    }))
  }
  
  // Delete a user
  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId))
      // In a real app, you would also call an API to delete the user
    }
  }
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name.startsWith("vehicle.")) {
      const vehicleProp = name.split(".")[1]
      setFormData(prev => ({
        ...prev,
        vehicle: {
          ...prev.vehicle,
          [vehicleProp]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }
  
  // Save user (add or update)
  const handleSaveUser = () => {
    // Simple validation
    if (!formData.name || !formData.phone || !formData.vehicle.model) {
      alert("Please fill in all required fields")
      return
    }
    
    const newUser: Customer = {
      id: formData.id,
      name: formData.name,
      phone: formData.phone,
      vehicle: formData.vehicle
    }
    
    // Add new user
    setUsers(prevUsers => [...prevUsers, newUser])
    // In a real app, you would also call an API to add the user
    
    setIsAddingUser(false)
    resetForm()
  }
  
  // Render edit field
  const renderEditField = (userId: string, field: string, value: string, placeholder: string) => {
    return (
      <input
        type="text"
        value={editData[userId]?.[field] || ""}
        onChange={(e) => handleEditFieldChange(userId, field, e.target.value)}
        className="w-full p-1 border border-gray-300 rounded-md text-sm"
        placeholder={placeholder}
      />
    )
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">User Management</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isAddingUser ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                Add New User
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Full Name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="+1 (123) 456-7890"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model</label>
                  <input
                    type="text"
                    name="vehicle.model"
                    value={formData.vehicle.model}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Make and Model"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="text"
                    name="vehicle.year"
                    value={formData.vehicle.year}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="2023"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
                  <input
                    type="text"
                    name="vehicle.licensePlate"
                    value={formData.vehicle.licensePlate}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="ABC-1234"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Status</label>
                  <input
                    type="text"
                    name="vehicle.fuelStatus"
                    value={formData.vehicle.fuelStatus || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="75%"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setIsAddingUser(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUser}
                  className="px-4 py-2 bg-bmw-blue text-white rounded-md hover:bg-bmw-blue-dark"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">User List</h3>
                <button
                  onClick={handleAddUser}
                  className="px-4 py-2 bg-bmw-blue text-white rounded-md flex items-center"
                >
                  <Plus size={16} className="mr-1" />
                  Add User
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr>
                      <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone Number
                      </th>
                      <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        License Plate
                      </th>
                      <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="py-3 px-4 border-b border-gray-200 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 px-4 text-center text-gray-500">
                          No users found. Add one to get started.
                        </td>
                      </tr>
                    ) : (
                      users.map(user => (
                        <tr 
                          key={user.id} 
                          className="hover:bg-gray-50"
                        >
                          <td className="py-4 px-4 border-b border-gray-200">
                            {editingRows[user.id] ? (
                              renderEditField(user.id, "name", user.name, "Full Name")
                            ) : (
                              <div className="flex items-center">
                                <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                                  <UserRound size={18} className="text-gray-600" />
                                </div>
                                <span className="font-medium">{user.name}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 border-b border-gray-200">
                            {editingRows[user.id] ? (
                              renderEditField(user.id, "phone", user.phone, "Phone Number")
                            ) : (
                              <div className="flex items-center">
                                <Phone size={16} className="text-gray-400 mr-2" />
                                {user.phone}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 border-b border-gray-200">
                            {editingRows[user.id] ? (
                              renderEditField(user.id, "vehicleModel", user.vehicle.model, "Vehicle Model")
                            ) : (
                              <div className="flex items-center">
                                <Car size={16} className="text-gray-400 mr-2" />
                                {user.vehicle.model}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 border-b border-gray-200">
                            {editingRows[user.id] ? (
                              renderEditField(user.id, "vehicleLicensePlate", user.vehicle.licensePlate, "License Plate")
                            ) : (
                              user.vehicle.licensePlate
                            )}
                          </td>
                          <td className="py-4 px-4 border-b border-gray-200">
                            {editingRows[user.id] ? (
                              renderEditField(user.id, "vehicleYear", user.vehicle.year, "Year")
                            ) : (
                              user.vehicle.year
                            )}
                          </td>
                          <td className="py-4 px-4 border-b border-gray-200 text-right">
                            {editingRows[user.id] ? (
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => handleSaveInlineEdit(user.id)}
                                  className="text-green-600 hover:text-green-800"
                                  title="Save"
                                >
                                  <Check size={18} />
                                </button>
                                <button
                                  onClick={() => handleCancelInlineEdit(user.id)}
                                  className="text-gray-600 hover:text-gray-800"
                                  title="Cancel"
                                >
                                  <Close size={18} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Edit User"
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete User"
                                >
                                  <Trash size={18} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-500">
            Total users: {users.length}
          </p>
        </div>
      </div>
    </div>
  )
} 