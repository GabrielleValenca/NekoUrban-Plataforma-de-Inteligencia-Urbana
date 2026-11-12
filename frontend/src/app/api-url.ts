
const local = typeof window !== 'undefined' &&
  window.location.hostname === 'localhost';

export const API_URL = local
  ? 'http://localhost:3000/api'
  : 'https://nekourban-plataforma-de-inteligencia-0vdy.onrender.com/api';
