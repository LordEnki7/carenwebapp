const translations = {
  en: {
    welcome: "Welcome to C.A.R.E.N.™",
    dashboard: "Dashboard",
    incidents: "My Incidents",
    record: "Record Incident",
    rights: "Legal Rights",
    attorneys: "Find Attorney",
    messages: "Message",
    "ai-assistant": "AI Assistant",
    documents: "Documents",
    pricing: "Pricing",
    security: "Security",
    settings: "Settings",
    support: "Support",
    upgrade: "Upgrade to Pro",
    logout: "Sign Out",
    totalIncidents: "Total Incidents",
    cloudBackups: "Cloud Backups",
    protectionLevel: "Protection Level",
    attorneyConnects: "Attorney Connects",
    recentIncidents: "Recent Incidents",
    viewAll: "View all",
    emergencyRecord: "Emergency Record",
    startRecording: "Start recording immediately",
    findAttorney: "Find Attorney",
    connectLegal: "Connect with legal help",
    exportReport: "Export Report",
    generateDocs: "Generate legal documentation",
    upgradePrompt: "Upgrade to C.A.R.E.N.™ Pro",
    upgradeDescription: "Get cloud backup, emergency alerts, and advanced legal resources.",
    upgradeNow: "Upgrade Now",
    yourRights: "Your Rights by State",
    rightsDescription: "Know your legal protections during traffic stops",
    currentState: "Current State",
    rightToSilence: "Right to Remain Silent",
    recordingRights: "Recording Rights",
    searchSeizure: "Search & Seizure",
    viewCompleteGuide: "View Complete Legal Guide",
    quickActions: "Quick Actions",
    // Recording page
    recordingTitle: "Record Incident",
    recordingDescription: "Document traffic stops and interactions with audio/video",
    audioRecording: "Audio Recording",
    videoRecording: "Video Recording",
    recordAudio: "Record Audio",
    recordVideo: "Record Video",
    stopRecording: "Stop Recording",
    recordingInProgress: "Recording in progress",
    playRecording: "Play Recording",
    downloadRecording: "Download Recording",
    deleteRecording: "Delete Recording",
    noRecordings: "No recordings yet",
    recordingsHistory: "Recording History",
    // Support page
    supportCenter: "Support Center",
    supportDescription: "Get help, find answers, and contact our support team",
    emergencySupport: "Emergency Support",
    phoneSupport: "Phone Support",
    liveChat: "Live Chat",
    emailSupport: "Email Support",
    submitRequest: "Submit Support Request",
    supportResources: "Support Resources",
    faq: "Frequently Asked Questions",
    contactSupport: "Contact Support",
    technicalIssue: "Technical Issue",
    legalQuestion: "Legal Question",
    billingSubscription: "Billing & Subscription",
    generalInquiry: "General Inquiry",
  },
  es: {
    welcome: "Bienvenido a C.A.R.E.N.™",
    dashboard: "Panel de Control",
    incidents: "Mis Incidentes",
    record: "Grabar Incidente",
    rights: "Derechos Legales",
    attorneys: "Encontrar Abogado",
    messages: "Mensaje",
    documents: "Documentos",
    pricing: "Precios",
    settings: "Configuración",
    support: "Soporte",
    upgrade: "Actualizar a Pro",
    logout: "Cerrar Sesión",
    totalIncidents: "Incidentes Totales",
    cloudBackups: "Respaldos en la Nube",
    protectionLevel: "Nivel de Protección",
    attorneyConnects: "Conexiones de Abogados",
    recentIncidents: "Incidentes Recientes",
    viewAll: "Ver todos",
    emergencyRecord: "Grabación de Emergencia",
    startRecording: "Comenzar grabación inmediatamente",
    findAttorney: "Encontrar Abogado",
    connectLegal: "Conectar con ayuda legal",
    exportReport: "Exportar Informe",
    generateDocs: "Generar documentación legal",
    upgradePrompt: "Actualizar a C.A.R.E.N.™ Pro",
    upgradeDescription: "Obtén respaldo en la nube, alertas de emergencia y recursos legales avanzados.",
    upgradeNow: "Actualizar Ahora",
    yourRights: "Tus Derechos por Estado",
    rightsDescription: "Conoce tus protecciones legales durante paradas de tráfico",
    currentState: "Estado Actual",
    rightToSilence: "Derecho a Permanecer en Silencio",
    recordingRights: "Derechos de Grabación",
    searchSeizure: "Búsqueda y Confiscación",
    viewCompleteGuide: "Ver Guía Legal Completa",
    quickActions: "Acciones Rápidas",
    // Recording page
    recordingTitle: "Grabar Incidente",
    recordingDescription: "Documentar paradas de tráfico e interacciones con audio/video",
    audioRecording: "Grabación de Audio",
    videoRecording: "Grabación de Video",
    recordAudio: "Grabar Audio",
    recordVideo: "Grabar Video",
    stopRecording: "Parar Grabación",
    recordingInProgress: "Grabación en progreso",
    playRecording: "Reproducir Grabación",
    downloadRecording: "Descargar Grabación",
    deleteRecording: "Eliminar Grabación",
    noRecordings: "Aún no hay grabaciones",
    recordingsHistory: "Historial de Grabaciones",
    // Support page
    supportCenter: "Centro de Soporte",
    supportDescription: "Obtén ayuda, encuentra respuestas y contacta a nuestro equipo de soporte",
    emergencySupport: "Soporte de Emergencia",
    phoneSupport: "Soporte Telefónico",
    liveChat: "Chat en Vivo",
    emailSupport: "Soporte por Email",
    submitRequest: "Enviar Solicitud de Soporte",
    supportResources: "Recursos de Soporte",
    faq: "Preguntas Frecuentes",
    contactSupport: "Contactar Soporte",
    technicalIssue: "Problema Técnico",
    legalQuestion: "Pregunta Legal",
    billingSubscription: "Facturación y Suscripción",
    generalInquiry: "Consulta General",
  },
};

let currentLanguage = 'en';
let listeners: (() => void)[] = [];

export function setLanguage(lang: string) {
  if (lang in translations) {
    currentLanguage = lang;
    localStorage.setItem('caren-language', lang);
    // Trigger re-renders in components that use translations
    listeners.forEach(listener => listener());
  }
}

export function t(key: string): string {
  const translation = translations[currentLanguage as keyof typeof translations];
  return translation?.[key as keyof typeof translation] || key;
}

export function getCurrentLanguage(): string {
  return currentLanguage;
}

export function initializeLanguage(): void {
  const savedLanguage = localStorage.getItem('caren-language');
  if (savedLanguage && savedLanguage in translations) {
    currentLanguage = savedLanguage;
  }
}

export function subscribeToLanguageChange(callback: () => void): () => void {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(listener => listener !== callback);
  };
}
