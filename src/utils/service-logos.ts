/**
 * Service logo detection and color coding
 * Maps service names to logos, colors, and metadata
 */

export interface ServiceInfo {
  name: string
  logo: string // emoji or URL
  color: string // hex color
  category: string
}

const SERVICE_CATALOG: Record<string, ServiceInfo> = {
  netflix: {
    name: 'Netflix',
    logo: '🎬',
    color: '#E50914',
    category: 'streaming',
  },
  spotify: {
    name: 'Spotify',
    logo: '🎵',
    color: '#1DB954',
    category: 'streaming',
  },
  'amazon-prime': {
    name: 'Amazon Prime Video',
    logo: '📺',
    color: '#FF9900',
    category: 'streaming',
  },
  apple: {
    name: 'Apple TV+',
    logo: '🍎',
    color: '#000000',
    category: 'streaming',
  },
  disney: {
    name: 'Disney+',
    logo: '✨',
    color: '#113CCF',
    category: 'streaming',
  },
  github: {
    name: 'GitHub Pro',
    logo: '🐙',
    color: '#1f6feb',
    category: 'productivity',
  },
  chatgpt: {
    name: 'ChatGPT Plus',
    logo: '🤖',
    color: '#10a37f',
    category: 'productivity',
  },
  claude: {
    name: 'Claude Pro',
    logo: '🧠',
    color: '#9c7e3d',
    category: 'productivity',
  },
  google: {
    name: 'Google One',
    logo: '☁️',
    color: '#4285F4',
    category: 'cloud-storage',
  },
  dropbox: {
    name: 'Dropbox Plus',
    logo: '📦',
    color: '#0061FF',
    category: 'cloud-storage',
  },
  notion: {
    name: 'Notion',
    logo: '📝',
    color: '#000000',
    category: 'productivity',
  },
  figma: {
    name: 'Figma',
    logo: '🎨',
    color: '#F24E1E',
    category: 'productivity',
  },
  canva: {
    name: 'Canva Pro',
    logo: '🖼️',
    color: '#00C4CC',
    category: 'productivity',
  },
  adobe: {
    name: 'Adobe Creative Cloud',
    logo: '🔴',
    color: '#FF0000',
    category: 'productivity',
  },
  duolingo: {
    name: 'Duolingo Plus',
    logo: '🦉',
    color: '#58CC02',
    category: 'education',
  },
  masterclass: {
    name: 'MasterClass',
    logo: '🎓',
    color: '#000000',
    category: 'education',
  },
  skillshare: {
    name: 'Skillshare',
    logo: '🎬',
    color: '#01C8A0',
    category: 'education',
  },
  peloton: {
    name: 'Peloton',
    logo: '🏋️',
    color: '#FF00A0',
    category: 'fitness',
  },
  myfitnesspal: {
    name: 'MyFitnessPal',
    logo: '💪',
    color: '#5A9FD4',
    category: 'fitness',
  },
  'new-york-times': {
    name: 'New York Times',
    logo: '📰',
    color: '#111111',
    category: 'entertainment',
  },
  hbo: {
    name: 'HBO Max',
    logo: '📺',
    color: '#6C40C7',
    category: 'streaming',
  },
}

export function getServiceInfo(serviceName: string): ServiceInfo {
  const key = serviceName.toLowerCase().replace(/[^a-z0-9]/g, '')
  return (
    SERVICE_CATALOG[key] || {
      name: serviceName,
      logo: '📱',
      color: '#6B7280',
      category: 'other',
    }
  )
}

export function getLogoEmoji(serviceName: string): string {
  return getServiceInfo(serviceName).logo
}

export function getServiceColor(serviceName: string): string {
  return getServiceInfo(serviceName).color
}

export function getCategoryColor(category: string): string {
  const categoryColors: Record<string, string> = {
    streaming: '#E50914',
    productivity: '#3B82F6',
    'cloud-storage': '#4285F4',
    entertainment: '#111111',
    fitness: '#FF00A0',
    education: '#58CC02',
    finance: '#059669',
    other: '#6B7280',
  }
  return categoryColors[category] || '#6B7280'
}
