const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3';
const JSONBIN_API_KEY = '$2a$10$placeholder_key_replace_with_yours';

const ADMIN_EMAIL = 'wisrovi@wticket.com';
const ADMIN_PASSWORD = 'wisrovi_wticket';
const SESSION_DURATION = 24 * 60 * 60 * 1000;

const BIN_IDS = {
  users: 'users_bin_id',
  tickets: 'tickets_bin_id',
  counter: 'counter_bin_id',
  sessions: 'sessions_bin_id'
};

let cache = {
  users: {},
  tickets: {},
  counter: 0,
  sessions: {},
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

async function initCache() {
  if (cache.initialized) return;
  
  try {
    const [usersRes, ticketsRes, counterRes] = await Promise.all([
      fetch(`${JSONBIN_BASE_URL}/b/${BIN_IDS.users}/latest`, {
        headers: { 'X-Access-Key': JSONBIN_API_KEY }
      }),
      fetch(`${JSONBIN_BASE_URL}/b/${BIN_IDS.tickets}/latest`, {
        headers: { 'X-Access-Key': JSONBIN_API_KEY }
      }),
      fetch(`${JSONBIN_BASE_URL}/b/${BIN_IDS.counter}/latest`, {
        headers: { 'X-Access-Key': JSONBIN_API_KEY }
      })
    ]);

    const usersData = await usersRes.json();
    const ticketsData = await ticketsRes.json();
    const counterData = await counterRes.json();

    cache.users = usersData.record || {};
    cache.tickets = ticketsData.record || {};
    cache.counter = counterData.record?.counter || 0;
    cache.sessions = {};
    cache.initialized = true;

    await ensureAdminExists();
  } catch (e) {
    console.error('Error initializing cache:', e);
    cache.initialized = true;
  }
}

async function saveUsers() {
  try {
    await fetch(`${JSONBIN_BASE_URL}/b/${BIN_IDS.users}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': JSONBIN_API_KEY
      },
      body: JSON.stringify(cache.users)
    });
  } catch (e) {
    console.error('Error saving users:', e);
  }
}

async function saveTickets() {
  try {
    await fetch(`${JSONBIN_BASE_URL}/b/${BIN_IDS.tickets}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': JSONBIN_API_KEY
      },
      body: JSON.stringify(cache.tickets)
    });
  } catch (e) {
    console.error('Error saving tickets:', e);
  }
}

async function saveCounter() {
  try {
    await fetch(`${JSONBIN_BASE_URL}/b/${BIN_IDS.counter}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': JSONBIN_API_KEY
      },
      body: JSON.stringify({ counter: cache.counter })
    });
  } catch (e) {
    console.error('Error saving counter:', e);
  }
}

async function ensureAdminExists() {
  if (!cache.users[ADMIN_EMAIL]) {
    const hashedPassword = await hashPassword(ADMIN_PASSWORD);
    cache.users[ADMIN_EMAIL] = {
      email: ADMIN_EMAIL,
      passwordHash: hashedPassword,
      name: 'Administrador',
      role: 'admin',
      createdAt: Date.now()
    };
    await saveUsers();
  }
}

async function register(email, password, name) {
  if (cache.users[email]) {
    throw new Error('El usuario ya existe');
  }
  const hashedPassword = await hashPassword(password);
  cache.users[email] = {
    email,
    passwordHash: hashedPassword,
    name: name || email.split('@')[0],
    role: 'user',
    createdAt: Date.now()
  };
  await saveUsers();
  return login(email, password);
}

async function login(email, password) {
  const user = cache.users[email];
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  const hashedPassword = await hashPassword(password);
  if (user.passwordHash !== hashedPassword) {
    throw new Error('Contraseña incorrecta');
  }
  const token = generateToken();
  const expiresAt = Date.now() + SESSION_DURATION;
  cache.sessions[token] = {
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: Date.now(),
    expiresAt
  };
  return { token, user: { email: user.email, name: user.name, role: user.role } };
}

async function validateSession() {
  const token = localStorage.getItem('wticket_token');
  if (!token) return null;
  const session = cache.sessions[token];
  if (!session || !session.email) {
    localStorage.removeItem('wticket_token');
    return null;
  }
  if (Date.now() > session.expiresAt) {
    delete cache.sessions[token];
    localStorage.removeItem('wticket_token');
    return null;
  }
  return { email: session.email, name: session.name, role: session.role };
}

async function logout() {
  const token = localStorage.getItem('wticket_token');
  if (token) {
    delete cache.sessions[token];
    localStorage.removeItem('wticket_token');
  }
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
  
  return {
    openCount,
    closedCount,
    totalCount: openCount + closedCount,
    userCount
  };
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
