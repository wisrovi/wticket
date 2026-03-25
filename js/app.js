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
      headers: { 'X-Master-Key': JSONBIN_API_KEY }
    });
    if (!res.ok) {
      console.log('GET failed for', binId, 'status:', res.status);
      return null;
    }
    const data = await res.json();
    return data.record;
  } catch (e) {
    console.error('GET error for', binId, e);
    return null;
  }
}

async function jsonbinPut(binId, data) {
  try {
    const res = await fetch(`${JSONBIN_BASE_URL}/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_API_KEY
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('PUT failed for', binId, 'status:', res.status, 'response:', text);
      throw new Error(`Error guardando datos: ${res.status}`);
    }
    const result = await res.json();
    console.log('PUT success for', binId, result);
    return result;
  } catch (e) {
    console.error('PUT error for', binId, e);
    throw e;
  }
}

async function initCache() {
  if (cache.initialized) return;
  
  console.log('Loading data from JSONBin...');
  
  let users = await jsonbinGet(BIN_IDS.users);
  let tickets = await jsonbinGet(BIN_IDS.tickets);
  let counterData = await jsonbinGet(BIN_IDS.counter);

  cache.users = users || {};
  cache.tickets = tickets || {};
  cache.counter = (counterData && typeof counterData.counter === 'number') ? counterData.counter : 0;
  cache.initialized = true;

  console.log('Loaded from JSONBin:', { 
    users: Object.keys(cache.users).length, 
    tickets: Object.keys(cache.tickets).length,
    counter: cache.counter 
  });

  await ensureAdminExists();
}

async function ensureAdminExists() {
  if (!cache.users[ADMIN_EMAIL]) {
    console.log('Creating admin...');
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
      console.log('Admin saved!');
    } catch (e) {
      console.error('Failed to save admin:', e);
    }
  } else {
    console.log('Admin exists');
  }
}

async function register(email, password, name) {
  console.log('Registering:', email);
  
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
  console.log('Saving user to JSONBin...');
  
  try {
    await jsonbinPut(BIN_IDS.users, cache.users);
    console.log('User saved successfully!');
  } catch (e) {
    delete cache.users[email];
    throw new Error('Error al guardar. Verifica tu conexión e intenta de nuevo.');
  }
  
  return login(email, password);
}

async function updateUser(email, updates) {
  if (!cache.users[email]) {
    throw new Error('Usuario no encontrado');
  }
  
  cache.users[email] = { ...cache.users[email], ...updates };
  await jsonbinPut(BIN_IDS.users, cache.users);
  return cache.users[email];
}

async function login(email, password) {
  console.log('Login attempt:', email);
  console.log('Available users:', Object.keys(cache.users));
  
  const user = cache.users[email];
  if (!user) {
    throw new Error('Usuario no encontrado. Verifica el email o regístrate.');
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
  
  console.log('Login success!');
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
  await jsonbinPut(BIN_IDS.counter, { counter: cache.counter });
  
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
  await jsonbinPut(BIN_IDS.tickets, cache.tickets);
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
  
  await jsonbinPut(BIN_IDS.tickets, cache.tickets);
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
  requireAuth,
  updateUser
};

export default API;
