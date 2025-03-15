import Image from 'next/image'

export function FormeldLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <Image 
        src="/images/formeldlogo.png" 
        alt="FormelD Logo" 
        width={32}
        height={32}
        className={`h-8 ${className}`}
      />
    </div>
  )
}

