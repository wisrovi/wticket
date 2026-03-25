const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3';
const JSONBIN_API_KEY = '$2a$10$4quMC2Ol6Cj0uD.YkIkvHeAqraYBiwxSkBj0mv5HTRL1xFadJTh7G';

const ADMIN_EMAIL = 'wisrovi@wticket.com';
const ADMIN_PASSWORD = 'wisrovi_wticket';
const SESSION_DURATION = 24 * 60 * 60 * 1000;

const BIN_IDS = {
  users: '69c45577c3097a1dd55da693',
  tickets: '69c4558bc3097a1dd55da6e8',
  counter: '69c4559baa77b81da91cad22'
};

let cache = {
  users: {},
  tickets: {},
  counter: 0,
  initialized: false
};

function sha256(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  return crypto.subtle.digest('SHA-256', data).then(buffer => {
    const hashArray = Array.from(new Uint8Array(buffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  });
}

async function hashPassword(password) {
  return await sha256(password + 'wticket_salt');
}

function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function jsonbinGet(binId) {
  try {
    const res = await fetch(`${JSONBIN_BASE_URL}/b/${binId}/latest`, {
      headers: { 'X-Access-Key': JSONBIN_API_KEY }
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.record;
  } catch (e) {
    console.error('JSONBin GET error:', e);
    return null;
  }
}

async function jsonbinPut(binId, data) {
  try {
    const res = await fetch(`${JSONBIN_BASE_URL}/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': JSONBIN_API_KEY
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return await res.json();
  } catch (e) {
    console.error('JSONBin PUT error:', e);
    throw e;
  }
}

async function initCache() {
  if (cache.initialized) return;
  
  console.log('Initializing cache from JSONBin...');
  
  try {
    const [users, tickets, counterData] = await Promise.all([
      jsonbinGet(BIN_IDS.users),
      jsonbinGet(BIN_IDS.tickets),
      jsonbinGet(BIN_IDS.counter)
    ]);

    cache.users = users || {};
    cache.tickets = tickets || {};
    cache.counter = (counterData && counterData.counter) || 0;
    cache.initialized = true;

    console.log('Cache initialized:', { 
      users: Object.keys(cache.users).length, 
      tickets: Object.keys(cache.tickets).length,
      counter: cache.counter 
    });

    await ensureAdminExists();
  } catch (e) {
    console.error('Error initializing cache:', e);
    cache.initialized = true;
  }
}

async function ensureAdminExists() {
  if (!cache.users[ADMIN_EMAIL]) {
    console.log('Creating admin user...');
    const hashedPassword = await hashPassword(ADMIN_PASSWORD);
    cache.users[ADMIN_EMAIL] = {
      email: ADMIN_EMAIL,
      passwordHash: hashedPassword,
      name: 'Administrador',
      role: 'admin',
      createdAt: Date.now()
    };
    try {
      await jsonbinPut(BIN_IDS.users, cache.users);
      console.log('Admin user saved to JSONBin');
    } catch (e) {
      console.error('Failed to save admin:', e);
    }
  }
}

async function saveUsers() {
  console.log('Saving users to JSONBin:', cache.users);
  await jsonbinPut(BIN_IDS.users, cache.users);
}

async function saveTickets() {
  await jsonbinPut(BIN_IDS.tickets, cache.tickets);
}

async function saveCounter() {
  await jsonbinPut(BIN_IDS.counter, { counter: cache.counter });
}

async function register(email, password, name) {
  console.log('Registering user:', email);
  
  if (cache.users[email]) {
    throw new Error('El usuario ya existe');
  }
  
  const hashedPassword = await hashPassword(password);
  const userData = {
    email,
    passwordHash: hashedPassword,
    name: name || email.split('@')[0],
    role: 'user',
    createdAt: Date.now()
  };
  
  cache.users[email] = userData;
  console.log('User added to cache, saving...');
  
  try {
    await saveUsers();
    console.log('User saved successfully');
  } catch (e) {
    console.error('Failed to save user:', e);
    delete cache.users[email];
    throw new Error('Error al guardar usuario. Intenta de nuevo.');
  }
  
  return login(email, password);
}

async function login(email, password) {
  console.log('Login attempt:', email);
  
  const user = cache.users[email];
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  
  const hashedPassword = await hashPassword(password);
  if (user.passwordHash !== hashedPassword) {
    throw new Error('Contraseña incorrecta');
  }
  
  const token = generateToken();
  const sessionData = {
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION
  };
  
  localStorage.setItem('wticket_token', token);
  localStorage.setItem('wticket_session', JSON.stringify(sessionData));
  
  console.log('Login successful for:', user.name);
  return { token, user: { email: user.email, name: user.name, role: user.role } };
}

async function validateSession() {
  const token = localStorage.getItem('wticket_token');
  const sessionStr = localStorage.getItem('wticket_session');
  if (!token || !sessionStr) return null;
  
  try {
    const session = JSON.parse(sessionStr);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem('wticket_token');
      localStorage.removeItem('wticket_session');
      return null;
    }
    return { email: session.email, name: session.name, role: session.role };
  } catch (e) {
    localStorage.removeItem('wticket_token');
    localStorage.removeItem('wticket_session');
    return null;
  }
}

async function logout() {
  localStorage.removeItem('wticket_token');
  localStorage.removeItem('wticket_session');
}

async function createTicket(title, description, userEmail) {
  cache.counter++;
  const id = cache.counter;
  await saveCounter();
  
  cache.tickets[id] = {
    id,
    title: escapeHtml(title),
    description: escapeHtml(description || ''),
    userEmail,
    status: 'open',
    createdAt: Date.now(),
    response: '',
    responseAt: 0
  };
  await saveTickets();
  return id;
}

function getTicket(id) {
  const ticket = cache.tickets[id];
  if (!ticket) return null;
  return {
    ...ticket,
    id: parseInt(ticket.id),
    createdAt: parseInt(ticket.createdAt),
    responseAt: parseInt(ticket.responseAt) || 0
  };
}

function getOpenTickets() {
  return Object.values(cache.tickets)
    .filter(t => t.status === 'open')
    .sort((a, b) => a.createdAt - b.createdAt);
}

function getClosedTickets() {
  return Object.values(cache.tickets)
    .filter(t => t.status === 'closed')
    .sort((a, b) => b.createdAt - a.createdAt);
}

function getUserOpenTickets(email) {
  return Object.values(cache.tickets)
    .filter(t => t.userEmail === email && t.status === 'open')
    .sort((a, b) => a.createdAt - b.createdAt);
}

function getUserClosedTickets(email) {
  return Object.values(cache.tickets)
    .filter(t => t.userEmail === email && t.status === 'closed')
    .sort((a, b) => b.createdAt - a.createdAt);
}

async function closeTicket(id, response) {
  const ticket = cache.tickets[id];
  if (!ticket) throw new Error('Ticket no encontrado');
  
  ticket.status = 'closed';
  ticket.response = escapeHtml(response || '');
  ticket.responseAt = Date.now();
  
  await saveTickets();
}

function getStats() {
  const tickets = Object.values(cache.tickets);
  const openCount = tickets.filter(t => t.status === 'open').length;
  const closedCount = tickets.filter(t => t.status === 'closed').length;
  const userCount = Object.keys(cache.users).length;
  
  return { openCount, closedCount, totalCount: openCount + closedCount, userCount };
}

function searchTickets(tickets, query) {
  if (!query) return tickets;
  const q = query.toLowerCase();
  return tickets.filter(t => {
    const titleMatch = t.title && t.title.toLowerCase().includes(q);
    const idMatch = t.id && t.id.toString().includes(q);
    return titleMatch || idMatch;
  });
}

function requireAuth(allowedRoles = ['user', 'admin']) {
  return async () => {
    const session = await validateSession();
    if (!session) {
      window.location.href = 'login.html';
      return null;
    }
    if (!allowedRoles.includes(session.role)) {
      window.location.href = session.role === 'admin' ? 'admin.html' : 'dashboard.html';
      return null;
    }
    return session;
  };
}

const API = {
  init: async () => {
    await initCache();
  },
  sha256,
  hashPassword,
  escapeHtml,
  formatDate,
  register,
  login,
  logout,
  validateSession,
  createTicket,
  getTicket,
  getOpenTickets,
  getClosedTickets,
  getUserOpenTickets,
  getUserClosedTickets,
  closeTicket,
  getStats,
  searchTickets,
  requireAuth
};

export default API;
