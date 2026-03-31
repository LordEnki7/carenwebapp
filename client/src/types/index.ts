export interface DashboardStats {
  totalIncidents: number;
  cloudBackups: number;
  emergencyContacts: number;
  attorneyConnects: number;
}

export interface IncidentStatus {
  id: number;
  title: string;
  date: string;
  status: 'secured' | 'local' | 'priority';
  description: string;
}

export interface LegalRight {
  id: number;
  category: string;
  title: string;
  description: string;
  details?: string;
  icon: string;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  variant: 'danger' | 'primary' | 'secondary';
  onClick: () => void;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
];

export const US_STATES = [
  { code: 'CA', name: 'California' },
  { code: 'NY', name: 'New York' },
  { code: 'TX', name: 'Texas' },
  { code: 'FL', name: 'Florida' },
  { code: 'IL', name: 'Illinois' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'OH', name: 'Ohio' },
  { code: 'GA', name: 'Georgia' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'MI', name: 'Michigan' },
];
