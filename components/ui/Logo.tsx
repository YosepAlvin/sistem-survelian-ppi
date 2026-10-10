import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
  textSize?: 'sm' | 'md' | 'lg'
}

const SIZE_PX: Record<string, number> = {
  xs: 16,
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
}

export function Logo({ 
  size = 'md', 
  className, 
  showText = false,
  textSize = 'md' 
}: LogoProps) {
  const sizeClasses = {
    xs: 'h-4 w-4',
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12',
    xl: 'h-16 w-16 sm:h-24 sm:w-24'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const px = SIZE_PX[size] ?? 32
  
  if (showText) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <Image
          src="/logo.png"
          alt="RS Budi Rahayu"
          width={px}
          height={px}
          className={cn('object-contain', sizeClasses[size])}
        />
        <div className="flex flex-col">
          <span className={cn('font-bold text-slate-900', textSizeClasses[textSize])}>
            RS Budi Rahayu
          </span>
          <span className={cn('text-slate-600', textSizeClasses[textSize === 'lg' ? 'md' : 'sm'])}>
            Sistem PPI
          </span>
        </div>
      </div>
    )
  }

  return (
    <Image
      src="/logo.png"
      alt="RS Budi Rahayu"
      width={px}
      height={px}
      className={cn('object-contain', sizeClasses[size], className)}
    />
  )
}