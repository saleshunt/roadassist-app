"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Define the structure of a brand configuration
export type BrandConfig = {
  id: string
  name: string
  logo: string
  primaryColor: string
  primaryColorDark: string
  secondaryColor?: string
  tagline?: string
}

// Available brands
export const brands: Record<string, BrandConfig> = {
  formelD: {
    id: 'formelD',
    name: 'FormelD',
    logo: '/images/formeldlogo.png',
    primaryColor: '#00A19C', // FormelD teal
    primaryColorDark: '#008783', // Darker FormelD teal
    tagline: 'Road Assistance'
  },
  bmw: {
    id: 'bmw',
    name: 'BMW',
    logo: '/images/BMW.png',
    primaryColor: '#0066B1', // BMW blue
    primaryColorDark: '#00518C', // Darker BMW blue 
    tagline: 'Roadside Assistance'
  }
}

// Default brand
export const DEFAULT_BRAND = 'formelD'

// Branding context type
type BrandingContextType = {
  currentBrand: BrandConfig
  setCurrentBrandById: (brandId: string) => void
  getBrandById: (brandId: string) => BrandConfig
  isLoaded: boolean
}

// Create the context
const BrandingContext = createContext<BrandingContextType | undefined>(undefined)

// Provider component
export function BrandingProvider({ children }: { children: ReactNode }) {
  const [currentBrandId, setCurrentBrandId] = useState<string>(DEFAULT_BRAND)
  const [isLoaded, setIsLoaded] = useState<boolean>(false)

  // Load saved brand preference from localStorage on initial render
  useEffect(() => {
    const savedBrand = localStorage.getItem('preferredBrand')
    if (savedBrand && brands[savedBrand]) {
      setCurrentBrandId(savedBrand)
    }
    setIsLoaded(true)

    // Update CSS variables for the brand colors
    document.documentElement.style.setProperty('--brand-primary', brands[savedBrand || DEFAULT_BRAND].primaryColor)
    document.documentElement.style.setProperty('--brand-primary-dark', brands[savedBrand || DEFAULT_BRAND].primaryColorDark)
  }, [])

  // Update localStorage and CSS variables when brand changes
  useEffect(() => {
    if (!isLoaded) return

    localStorage.setItem('preferredBrand', currentBrandId)
    
    // Update CSS variables
    document.documentElement.style.setProperty('--brand-primary', currentBrand.primaryColor)
    document.documentElement.style.setProperty('--brand-primary-dark', currentBrand.primaryColorDark)
  }, [currentBrandId, isLoaded])

  // Get current brand object
  const currentBrand = brands[currentBrandId] || brands[DEFAULT_BRAND]

  // Function to set current brand by ID
  const setCurrentBrandById = (brandId: string) => {
    if (brands[brandId]) {
      setCurrentBrandId(brandId)
    }
  }

  // Function to get a brand by ID
  const getBrandById = (brandId: string): BrandConfig => {
    return brands[brandId] || brands[DEFAULT_BRAND]
  }

  return (
    <BrandingContext.Provider value={{ 
      currentBrand,
      setCurrentBrandById,
      getBrandById,
      isLoaded
    }}>
      {children}
    </BrandingContext.Provider>
  )
}

// Custom hook for using the branding context
export function useBranding() {
  const context = useContext(BrandingContext)
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider')
  }
  return context
} 