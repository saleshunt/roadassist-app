"use client"

import { useState, useEffect } from "react"
import { Settings, X, Plus, Edit, Trash, UserRound, Phone, Car, Check, Globe, Save } from "lucide-react"
import { useAppContext, type Customer, type Vehicle } from "./app-context"
import { useBranding, brands } from "./branding-context"
import { BrandLogo } from "./brand-logo"

// Languages supported by the app
const SUPPORTED_LANGUAGES = [
  { code: 'de', name: 'German' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' }
]

// Vehicle model suggestions based on brand
const getVehicleModelSuggestions = (brandId: string) => {
  if (brandId === 'bmw') {
    return [
      'BMW 1 Series',
      'BMW 3 Series',
      'BMW 5 Series',
      'BMW 7 Series',
      'BMW X1',
      'BMW X3',
      'BMW X5',
      'BMW X7',
      'BMW iX',
      'BMW i4',
      'BMW i7'
    ]
  } else {
    // FormelD or other brands get diverse options
    return [
      'Mercedes-Benz C-Class',
      'Mercedes-Benz E-Class',
      'Mercedes-Benz GLC',
      'Audi A4',
      'Audi Q5',
      'Volkswagen Golf',
      'Volkswagen Passat',
      'Volkswagen ID.4',
      'Porsche 911',
      'Porsche Taycan',
      'Toyota Corolla',
      'Toyota RAV4',
      'Hyundai Tucson',
      'Hyundai i30',
      'Renault Clio',
      'Renault Captur',
      'Skoda Octavia',
      'Skoda Kodiaq',
      'Ford Focus',
      'Opel Astra',
      'Peugeot 308',
      'Fiat 500',
      'Kia Sportage',
      'Volvo XC40'
    ]
  }
}

// Function to convert a phone number to German format
const convertToGermanPhoneFormat = (phone: string) => {
  // Remove all non-digit characters except the plus sign at beginning
  let digits = phone.replace(/[^\d+]/g, '').replace(/^\+/, '')
  
  // If the phone starts with international prefix, handle differently
  if (phone.startsWith('+')) {
    // If it's already a German number (+49), format it with brackets
    if (phone.startsWith('+49')) {
      // Format as +49(X) XXXXX XXXX
      const areaCode = digits.substring(2, 3)
      const firstPart = digits.substring(3, 8)
      const secondPart = digits.substring(8)
      return `+49(${areaCode}) ${firstPart} ${secondPart}`
    }
    
    // For other international numbers, convert to German format
    // Remove the international prefix and add German prefix
    return `+49(${digits.substring(0, 1)}) ${digits.substring(1, 6)} ${digits.substring(6)}`
  }
  
  // For local numbers without international prefix
  if (digits.length <= 10) {
    // Format as +49(X) XXXXX XXXX
    return `+49(${digits.substring(0, 1)}) ${digits.substring(1, 6)} ${digits.substring(6)}`
  }
  
  return phone // Return original if we can't format it
}

// Add a BrandSelector component
const BrandSelector = () => {
  const { currentBrand, setCurrentBrandById } = useBranding()
  
  return (
    <div className="mt-6 border rounded-lg p-4">
      <h3 className="text-lg font-medium mb-4">Demo Brand Options</h3>
      <p className="text-sm text-gray-500 mb-4">
        Select the brand you'd like to demo. This will change the appearance of the application.
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        {Object.values(brands).map((brand) => (
          <div 
            key={brand.id}
            onClick={() => setCurrentBrandById(brand.id)}
            className={`
              flex flex-col items-center p-4 rounded-lg cursor-pointer
              ${currentBrand.id === brand.id ? 'bg-brand/10 border-2 border-brand' : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'}
            `}
          >
            <div className="w-20 h-20 flex items-center justify-center mb-2">
              <img src={brand.logo} alt={`${brand.name} logo`} className="max-w-full max-h-full object-contain" />
            </div>
            <h4 className="font-medium">{brand.name}</h4>
            <p className="text-xs text-gray-500">{brand.tagline}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SettingsButton() {
  const { tickets, setCurrentCustomer } = useAppContext()
  const { currentBrand } = useBranding()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("user")
  
  // User management state
  const [users, setUsers] = useState<Customer[]>([])
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [editingRows, setEditingRows] = useState<{[key: string]: boolean}>({})
  const [editData, setEditData] = useState<{[key: string]: any}>({})
  
  // Form state
  const [formData, setFormData] = useState<{
    id: string
    name: string
    phone: string
    language: string
    vehicle: Vehicle
  }>({
    id: "",
    name: "",
    phone: "",
    language: "de", // Default to German
    vehicle: {
      model: "",
      year: "",
      licensePlate: "",
      fuelStatus: "75%"
    }
  })
  
  // Initialize users from tickets and convert phone numbers
  useEffect(() => {
    // Extract unique users from tickets
    const uniqueUsers = tickets.reduce<Customer[]>((acc, ticket) => {
      const exists = acc.some(user => user.id === ticket.customer.id)
      if (!exists) {
        // Convert phone to German format and ensure language is set
        const convertedCustomer = {
          ...ticket.customer,
          phone: convertToGermanPhoneFormat(ticket.customer.phone),
          language: ticket.customer.language || 'de', // Default to German if not set
          brandId: ticket.customer.brandId || currentBrand.id // Assign current brand if not specified
        }
        acc.push(convertedCustomer)
      }
      return acc
    }, [])
    
    // Filter users based on the current brand
    // For BMW: show only BMW vehicles
    // For FormelD: show all vehicles (diverse)
    const filteredUsers = currentBrand.id === 'bmw'
      ? uniqueUsers.filter(user => user.brandId === 'bmw')
      : uniqueUsers // FormelD shows all vehicles
    
    // Ensure our users list has the appropriate filtered users
    setUsers(filteredUsers)
  }, [tickets, currentBrand.id])
  
  // Function to update a customer in all tickets
  const updateCustomerInAllTickets = (updatedCustomer: Customer) => {
    // Find all tickets that contain this customer and update them directly in context
    tickets.forEach(ticket => {
      if (ticket.customer.id === updatedCustomer.id) {
        // We need to update this customer in the current active app state
        setCurrentCustomer(updatedCustomer)
      }
    })
  }
  
  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      phone: "",
      language: "de", // Default to German
      vehicle: {
        model: "",
        year: "",
        licensePlate: "",
        fuelStatus: "75%"
      }
    })
  }
  
  const handleAddUser = () => {
    resetForm()
    setIsAddingUser(true)
  }
  
  const handleEditUser = (user: Customer) => {
    // Set up edit data
    setEditData({
      [user.id]: {
        name: user.name,
        phone: user.phone,
        language: user.language || 'de',
        vehicleModel: user.vehicle.model,
        vehicleYear: user.vehicle.year,
        vehicleLicensePlate: user.vehicle.licensePlate,
        vehicleFuelStatus: user.vehicle.fuelStatus
      }
    })
    
    // Set this row to editing mode
    setEditingRows({...editingRows, [user.id]: true})
  }
  
  const handleSaveInlineEdit = (userId: string) => {
    const editedData = editData[userId]
    
    // Find the user
    const userToUpdate = users.find(u => u.id === userId)
    if (!userToUpdate) return
    
    // Create updated user
    const updatedUser: Customer = {
      ...userToUpdate,
      name: editedData.name,
      phone: convertToGermanPhoneFormat(editedData.phone), // Ensure German format
      language: editedData.language,
      vehicle: {
        ...userToUpdate.vehicle,
        model: editedData.vehicleModel,
        year: editedData.vehicleYear,
        licensePlate: editedData.vehicleLicensePlate,
        fuelStatus: editedData.vehicleFuelStatus
      }
    }
    
    // Update user in context
    updateCustomerInAllTickets(updatedUser)
    
    // Update local list
    const updatedUsers = users.map(u => 
      u.id === userId ? updatedUser : u
    )
    setUsers(updatedUsers)
    
    // Exit edit mode
    const newEditingRows = {...editingRows}
    delete newEditingRows[userId]
    setEditingRows(newEditingRows)
  }
  
  const handleCancelInlineEdit = (userId: string) => {
    const newEditingRows = {...editingRows}
    delete newEditingRows[userId]
    setEditingRows(newEditingRows)
  }
  
  const handleEditFieldChange = (userId: string, field: string, value: string) => {
    setEditData({
      ...editData,
      [userId]: {
        ...editData[userId],
        [field]: value
      }
    })
  }
  
  const handleDeleteUser = (userId: string) => {
    // Filter out the deleted user
    const updatedUsers = users.filter(user => user.id !== userId)
    setUsers(updatedUsers)
    
    // In a real app, we would also remove from the backend
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // Handle nested vehicle properties
    if (name.startsWith('vehicle.')) {
      const vehicleProperty = name.split('.')[1]
      setFormData({
        ...formData,
        vehicle: {
          ...formData.vehicle,
          [vehicleProperty]: value
        }
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }
  
  const handleSaveUser = () => {
    // Generate a unique ID for the new user
    const newId = `user-${Date.now()}`
    
    // Create new user object with German phone format
    const newUser: Customer = {
      id: newId,
      name: formData.name,
      phone: convertToGermanPhoneFormat(formData.phone),
      language: formData.language,
      brandId: currentBrand.id, // Associate with current brand
      vehicle: formData.vehicle
    }
    
    // Update current customer to reflect this new user
    setCurrentCustomer(newUser)
    
    // Add to users list
    const updatedUsers = [...users, newUser]
    setUsers(updatedUsers)
    
    // Reset form and exit add mode
    resetForm()
    setIsAddingUser(false)
    
    // In a real app, we would also save to the backend
  }
  
  const renderEditField = (userId: string, field: string, value: string, placeholder: string) => {
    if (field === "language") {
      return (
        <select
          className="w-full p-1 border border-gray-300 rounded-sm text-sm"
          value={editData[userId]?.language || 'de'}
          onChange={(e) => handleEditFieldChange(userId, 'language', e.target.value)}
        >
          {SUPPORTED_LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      )
    }
    
    return (
      <input
        type="text"
        className="w-full p-1 border border-gray-300 rounded-sm text-sm"
        value={editData[userId]?.[field] || value}
        onChange={(e) => handleEditFieldChange(userId, field, e.target.value)}
        placeholder={placeholder}
      />
    )
  }
  
  const toggleSettings = () => {
    setIsOpen(!isOpen)
  }
  
  // Define tabs with icons
  const tabs = [
    {
      id: "branding",
      label: "Branding",
      icon: <Globe size={18} className="inline" />,
    },
    {
      id: "user",
      label: "Users",
      icon: <UserRound size={18} className="inline" />,
    },
    {
      id: "language",
      label: "Language",
      icon: <Globe size={18} className="inline" />,
    },
  ]
  
  if (!isOpen) {
  return (
      <button
        onClick={toggleSettings}
        className="flex items-center justify-center p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
      >
        <Settings size={20} />
      </button>
    )
  }
  
  // Helper to get language name from code
  const getLanguageName = (code: string) => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code)?.name || code
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Application Settings</h2>
          <button onClick={toggleSettings} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-4 border-b">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 ${
                    activeTab === tab.id
                      ? `border-b-2 border-brand text-brand font-medium`
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.icon} <span className="ml-2">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="py-4">
            {activeTab === "branding" && (
              <BrandSelector />
            )}
            
            {activeTab === "user" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium">User Management</h3>
                  <button
                    onClick={handleAddUser}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center"
                  >
                    <Plus size={16} className="mr-1" />
                    Add User
                  </button>
                </div>
                
                {isAddingUser && (
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-md font-medium mb-4">Add New {currentBrand.name} User</h4>
                    <div className="grid grid-cols-2 gap-4">
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          placeholder="+49 123 456 7890"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                        <select
                          name="language"
                          value={formData.language}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          {SUPPORTED_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>
                              {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model</label>
                        <select
                          name="vehicle.model"
                          value={formData.vehicle.model}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Select a model</option>
                          {getVehicleModelSuggestions(currentBrand.id).map(model => (
                            <option key={model} value={model}>
                              {model}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
                        <input
                          type="text"
                          name="vehicle.licensePlate"
                          value={formData.vehicle.licensePlate}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          placeholder="B-XX 1234"
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
                    </div>
                    <div className="mt-4 flex justify-end space-x-3">
                      <button
                        onClick={() => setIsAddingUser(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveUser}
                        className="px-4 py-2 bg-brand text-white rounded-md hover:bg-brand-dark"
                        disabled={!formData.name || !formData.phone || !formData.vehicle.model}
                      >
                        Save User
                      </button>
                    </div>
                  </div>
                )}
                
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
                          Language
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
                          <td colSpan={7} className="py-4 px-4 text-center text-gray-500">
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
                                renderEditField(user.id, "language", user.language || 'de', "Language")
                              ) : (
                                <div className="flex items-center">
                                  <Globe size={16} className="text-gray-400 mr-2" />
                                  {getLanguageName(user.language || 'de')}
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
                                    <X size={18} />
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
                
                <div className="mt-4 text-sm text-gray-500">
                  Total users: {users.length}
                </div>
              </div>
            )}
            
            {activeTab === "language" && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Environment</h3>
                  <div className="text-sm bg-gray-100 p-2 rounded">
                    <p>API URL: {process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button 
            onClick={toggleSettings} 
            className="px-4 py-2 bg-brand text-white rounded-md hover:bg-brand-dark flex items-center"
          >
            <Save size={18} className="mr-2" /> Close Settings
          </button>
        </div>
      </div>
    </div>
  )
} 