"use client"

import { useBranding } from "./branding-context"

// Helper function to get class names with brand color
export function getBrandColorClass(type: 'text' | 'bg' | 'border', variant: 'default' | 'dark' = 'default'): string {
  if (type === 'text') {
    return variant === 'default' ? 'text-brand' : 'text-brand-dark'
  } else if (type === 'bg') {
    return variant === 'default' ? 'bg-brand' : 'bg-brand-dark'
  } else {
    return variant === 'default' ? 'border-brand' : 'border-brand-dark'
  }
}

// Component for brand name display
export function BrandName({ className = '' }: { className?: string }) {
  const { currentBrand } = useBranding()
  
  return (
    <span className={`font-medium ${className}`}>{currentBrand.name}</span>
  )
}

// Component for brand tagline display
export function BrandTagline({ className = '' }: { className?: string }) {
  const { currentBrand } = useBranding()
  
  return (
    <span className={className}>{currentBrand.tagline}</span>
  )
}

// Component for brand display with optional tagline
export function BrandDisplay({ className = '', showTagline = false }: { className?: string, showTagline?: boolean }) {
  const { currentBrand } = useBranding()
  
  return (
    <span className={`font-medium ${className}`}>
      {currentBrand.name}
      {showTagline && currentBrand.tagline && ` ${currentBrand.tagline}`}
    </span>
  )
} 