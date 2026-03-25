const translations = {
  es: {
    theme: 'Tema',
    light: 'Claro',
    dark: 'Oscuro',
    openTickets: 'Tickets Abiertos',
    closedTickets: 'Tickets Atendidos',
    total: 'Total',
    priority: 'Prioridad',
    low: 'Baja',
    normal: 'Normal',
    high: 'Alta',
    urgent: 'Urgente',
    search: 'Buscar...',
    createTicket: 'Crear Ticket',
    title: 'Título',
    description: 'Descripción',
    submit: 'Enviar',
    cancel: 'Cancelar',
    close: 'Cerrar',
    logout: 'Cerrar Sesión',
    login: 'Iniciar Sesión',
    register: 'Registrarse',
    email: 'Correo',
    password: 'Contraseña',
    name: 'Nombre',
    confirmed: 'Confirmado',
    resolvedRequests: 'peticiones resueltas',
    globalStats: 'stats globales',
    createdAt: 'Creado',
    respondedAt: 'Respondido',
    response: 'Respuesta'
  },
  en: {
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    openTickets: 'Open Tickets',
    closedTickets: 'Closed Tickets',
    total: 'Total',
    priority: 'Priority',
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',
    search: 'Search...',
    createTicket: 'Create Ticket',
    title: 'Title',
    description: 'Description',
    submit: 'Submit',
    cancel: 'Cancel',
    close: 'Close',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    confirmed: 'Confirmed',
    resolvedRequests: 'requests resolved',
    globalStats: 'global stats',
    createdAt: 'Created',
    respondedAt: 'Responded',
    response: 'Response'
  }
};

let currentLang = localStorage.getItem('lang') || 'es';

export function t(key) {
  return translations[currentLang][key] || translations.es[key] || key;
}

export function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
}

export function getLang() {
  return currentLang;
}

export function toggleLang() {
  setLang(currentLang === 'es' ? 'en' : 'es');
  return currentLang;
}
