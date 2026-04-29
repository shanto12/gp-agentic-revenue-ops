type IconName =
  | 'signals'
  | 'runs'
  | 'campaigns'
  | 'knowledge'
  | 'arch'
  | 'audit'
  | 'search'
  | 'filter'
  | 'play'
  | 'pause'
  | 'check'
  | 'x'
  | 'edit'
  | 'alert'
  | 'info'
  | 'external'
  | 'chevron'
  | 'download'
  | 'clock'
  | 'globe'
  | 'user'
  | 'more'
  | 'sparkle'
  | 'shield'
  | 'arrow-right'
  | 'arrow-down'
  | 'plus'
  | 'minus'
  | 'branch'

interface IconProps {
  name: IconName
  size?: number
  className?: string
  strokeWidth?: number
}

export function Icon({ name, size = 14, className = '', strokeWidth = 1.6 }: IconProps) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  }
  switch (name) {
    case 'signals':
      return (
        <svg {...props}>
          <path d="M3 12h3l2-6 4 12 2-6h2" />
          <path d="M16 12h5" />
        </svg>
      )
    case 'runs':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9 8l6 4-6 4z" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'campaigns':
      return (
        <svg {...props}>
          <path d="M3 11l13-6v14L3 13z" />
          <path d="M16 7v10" />
          <path d="M7 13v4l3 1" />
        </svg>
      )
    case 'knowledge':
      return (
        <svg {...props}>
          <path d="M4 5a2 2 0 0 1 2-2h11v15H6a2 2 0 0 0-2 2z" />
          <path d="M4 17v3h13" />
          <path d="M8 7h6M8 10h4" />
        </svg>
      )
    case 'arch':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="6" height="6" rx="1" />
          <rect x="15" y="3" width="6" height="6" rx="1" />
          <rect x="9" y="15" width="6" height="6" rx="1" />
          <path d="M9 6h6M6 9v3a3 3 0 0 0 3 3M18 9v3a3 3 0 0 1-3 3" />
        </svg>
      )
    case 'audit':
      return (
        <svg {...props}>
          <rect x="4" y="3" width="16" height="18" rx="1.5" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      )
    case 'search':
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="6" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      )
    case 'filter':
      return (
        <svg {...props}>
          <path d="M4 5h16l-6 8v6l-4-2v-4z" />
        </svg>
      )
    case 'play':
      return (
        <svg {...props}>
          <path d="M7 5l11 7-11 7z" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'pause':
      return (
        <svg {...props}>
          <rect x="7" y="5" width="3" height="14" fill="currentColor" stroke="none" />
          <rect x="14" y="5" width="3" height="14" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'check':
      return (
        <svg {...props}>
          <path d="m5 12 4 4 10-10" />
        </svg>
      )
    case 'x':
      return (
        <svg {...props}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      )
    case 'edit':
      return (
        <svg {...props}>
          <path d="M4 17l9-9 3 3-9 9H4z" />
          <path d="m13 6 2-2 3 3-2 2" />
        </svg>
      )
    case 'alert':
      return (
        <svg {...props}>
          <path d="M12 3 2 21h20z" />
          <path d="M12 10v5M12 18v.01" />
        </svg>
      )
    case 'info':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v.01M11 12h1v5h1" />
        </svg>
      )
    case 'external':
      return (
        <svg {...props}>
          <path d="M14 4h6v6" />
          <path d="M20 4l-9 9" />
          <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
        </svg>
      )
    case 'chevron':
      return (
        <svg {...props}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      )
    case 'download':
      return (
        <svg {...props}>
          <path d="M12 4v11" />
          <path d="m7 11 5 5 5-5" />
          <path d="M5 20h14" />
        </svg>
      )
    case 'clock':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )
    case 'globe':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
      )
    case 'user':
      return (
        <svg {...props}>
          <circle cx="12" cy="9" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      )
    case 'more':
      return (
        <svg {...props}>
          <circle cx="5" cy="12" r="1.4" fill="currentColor" />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" />
          <circle cx="19" cy="12" r="1.4" fill="currentColor" />
        </svg>
      )
    case 'sparkle':
      return (
        <svg {...props}>
          <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
        </svg>
      )
    case 'shield':
      return (
        <svg {...props}>
          <path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )
    case 'arrow-right':
      return (
        <svg {...props}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      )
    case 'arrow-down':
      return (
        <svg {...props}>
          <path d="M12 5v14M6 13l6 6 6-6" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...props}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      )
    case 'minus':
      return (
        <svg {...props}>
          <path d="M5 12h14" />
        </svg>
      )
    case 'branch':
      return (
        <svg {...props}>
          <circle cx="6" cy="5" r="2" />
          <circle cx="6" cy="19" r="2" />
          <circle cx="18" cy="9" r="2" />
          <path d="M6 7v10M6 11a6 6 0 0 0 6 6h0a6 6 0 0 0 6-6" />
        </svg>
      )
    default:
      return null
  }
}
