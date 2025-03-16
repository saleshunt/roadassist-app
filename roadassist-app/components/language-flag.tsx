"use client"

import React from 'react'

type LanguageFlagProps = {
  language: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const FLAG_CODES: Record<string, { emoji: string, name: string }> = {
  'de': { emoji: '🇩🇪', name: 'German' },
  'en': { emoji: '🇬🇧', name: 'English' },
  'fr': { emoji: '🇫🇷', name: 'French' },
  'es': { emoji: '🇪🇸', name: 'Spanish' },
  'it': { emoji: '🇮🇹', name: 'Italian' }
}

export default function LanguageFlag({ language, className = '', size = 'md' }: LanguageFlagProps) {
  const flag = FLAG_CODES[language] || { emoji: '🏳️', name: 'Unknown' }
  
  const sizeClasses = {
    'sm': 'text-sm',
    'md': 'text-base',
    'lg': 'text-xl'
  }
  
  return (
    <span 
      className={`inline-flex items-center ${sizeClasses[size]} ${className}`}
      title={flag.name}
      aria-label={`Language: ${flag.name}`}
    >
      {flag.emoji}
    </span>
  )
} 