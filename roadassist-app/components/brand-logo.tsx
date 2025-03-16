"use client"

import { useBranding } from "./branding-context"

type BrandLogoProps = {
  className?: string
  width?: number
  height?: number
}

export function BrandLogo({ className, width, height }: BrandLogoProps) {
  const { currentBrand } = useBranding()
  
  return (
    <div className={`flex items-center ${className || ''}`}>
      <img 
        src={currentBrand.logo} 
        alt={`${currentBrand.name} Logo`} 
        className={`h-8 ${className || ''}`}
        width={width}
        height={height}
      />
    </div>
  )
} 