export function BMWLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="/images/BMW.png" 
        alt="BMW Logo" 
        className={`h-8 ${className}`}
      />
    </div>
  )
}

