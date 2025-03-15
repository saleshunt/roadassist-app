export function FormeldLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="/images/formeldlogo.png" 
        alt="FormelD Logo" 
        className={`h-8 ${className}`}
      />
    </div>
  )
}

