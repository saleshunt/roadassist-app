"use client"

import { useState } from "react"
import { Settings } from "lucide-react"
import UserManagement from "./user-management"

export default function SettingsButton() {
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false)
  
  return (
    <>
      <button
        onClick={() => setIsUserManagementOpen(true)}
        className="fixed bottom-4 right-20 z-50 bg-gray-800 text-white rounded-full p-2 shadow-lg hover:bg-gray-700"
        aria-label="User Settings"
      >
        <span className="text-xs">CONFIG</span>
      </button>
      
      <UserManagement 
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
      />
    </>
  )
} 