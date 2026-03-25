import { initDB, cacheUsers, getCachedUsers, cacheTickets, getCachedTickets, cacheCounter, getCachedCounter } from './db.js';

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
    if (!res.ok) return null;
    const data = await res.json();
    return data.record;
  } catch (e) {
    console.error('GET error:', e);
    return null;
  }
}

async function jsonbinPut(binId, data) {
  const res = await fetch(`${JSONBIN_BASE_URL}/b/${binId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_API_KEY
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

async function syncAndSaveUsers() {
  const latest = await jsonbinGet(BIN_IDS.users);
  if (latest) {
    cache.users = { ...latest, ...cache.users };
  }
  await jsonbinPut(BIN_IDS.users, cache.users);
  await cacheUsers(cache.users);
}

async function syncAndSaveTickets() {
  const latest = await jsonbinGet(BIN_IDS.tickets);
  if (latest) {
    cache.tickets = { ...latest, ...cache.tickets };
  }
  await jsonbinPut(BIN_IDS.tickets, cache.tickets);
  await cacheTickets(cache.tickets);
}

async function syncAndSaveCounter() {
  const latest = await jsonbinGet(BIN_IDS.counter);
  if (latest && typeof latest.counter === 'number') {
    cache.counter = latest.counter;
  }
  await jsonbinPut(BIN_IDS.counter, { counter: cache.counter });
  await cacheCounter(cache.counter);
}

async function initCache(force = false) {
  if (cache.initialized && !force) return;
  
  try {
    await initDB();
    
    console.log('Loading data...');
    
    const [users, tickets, counterData] = await Promise.all([
      jsonbinGet(BIN_IDS.users),
      jsonbinGet(BIN_IDS.tickets),
      jsonbinGet(BIN_IDS.counter)
    ]);

    if (users) {
      cache.users = users;
      await cacheUsers(users);
    } else {
      cache.users = await getCachedUsers();
    }

    if (tickets) {
      cache.tickets = tickets;
      await cacheTickets(tickets);
    } else {
      cache.tickets = await getCachedTickets();
    }

    if (counterData && typeof counterData.counter === 'number') {
      cache.counter = counterData.counter;
    } else {
      cache.counter = await getCachedCounter();
    }

    cache.initialized = true;

    console.log('Loaded:', { 
      users: Object.keys(cache.users).length, 
      tickets: Object.keys(cache.tickets).length,
      counter: cache.counter 
    });
  } catch (error) {
    console.error('Error loading from IndexedDB, using JSONBin only:', error);
    const [users, tickets, counterData] = await Promise.all([
      jsonbinGet(BIN_IDS.users),
      jsonbinGet(BIN_IDS.tickets),
      jsonbinGet(BIN_IDS.counter)
    ]);
    cache.users = users || {};
    cache.tickets = tickets || {};
    cache.counter = (counterData && typeof counterData.counter === 'number') ? counterData.counter : 0;
    cache.initialized = true;
  }

  await ensureAdminExists();
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
    await syncAndSaveUsers();
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
  
  await syncAndSaveUsers();
  return login(email, password);
}

async function updateUserName(email, newName) {
  await syncAndSaveUsers();
  
  if (!cache.users[email]) {
    throw new Error('Usuario no encontrado');
  }
  
  cache.users[email].name = newName;
  await syncAndSaveUsers();
  
  const session = JSON.parse(localStorage.getItem('wticket_session'));
  if (session && session.email === email) {
    session.name = newName;
    localStorage.setItem('wticket_session', JSON.stringify(session));
  }
  
  return true;
}

async function updateUserPassword(email, currentPassword, newPassword) {
  await syncAndSaveUsers();
  
  const user = cache.users[email];
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  
  const hashedCurrent = await hashPassword(currentPassword);
  if (user.passwordHash !== hashedCurrent) {
    throw new Error('Contraseña actual incorrecta');
  }
  
  const hashedNew = await hashPassword(newPassword);
  cache.users[email].passwordHash = hashedNew;
  await syncAndSaveUsers();
  
  return true;
}

async function login(email, password) {
  await refreshData();
  
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
  
  return { token, user: { email: user.email, name: user.name, role: user.role } };
}

async function validateSession() {
  await refreshData();
  
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

async function createTicket(title, description, userEmail, priority = 'normal', category = 'general') {
  await syncAndSaveCounter();
  await syncAndSaveTickets();
  
  cache.counter++;
  const id = cache.counter;
  
  await jsonbinPut(BIN_IDS.counter, { counter: cache.counter });
  
  cache.tickets[id] = {
    id,
    title: escapeHtml(title),
    description: escapeHtml(description || ''),
    userEmail,
    priority,
    category,
    status: 'open',
    createdAt: Date.now(),
    response: '',
    responseAt: 0,
    comments: []
  };
  
  await syncAndSaveTickets();
  return id;
}

function getTicket(id) {
  const ticket = cache.tickets[id];
  if (!ticket) return null;
  return {
    ...ticket,
    id: parseInt(ticket.id),
    createdAt: parseInt(ticket.createdAt),
    responseAt: parseInt(ticket.responseAt) || 0,
    comments: ticket.comments || []
  };
}

async function addComment(ticketId, text, authorEmail, authorName) {
  await syncAndSaveTickets();
  
  const ticket = cache.tickets[ticketId];
  if (!ticket) throw new Error('Ticket no encontrado');
  
  if (!ticket.comments) ticket.comments = [];
  
  ticket.comments.push({
    id: Date.now(),
    text: escapeHtml(text),
    authorEmail,
    authorName,
    createdAt: Date.now()
  });
  
  await syncAndSaveTickets();
  return true;
}

async function refreshData() {
  const [users, tickets, counterData] = await Promise.all([
    jsonbinGet(BIN_IDS.users),
    jsonbinGet(BIN_IDS.tickets),
    jsonbinGet(BIN_IDS.counter)
  ]);
  
  cache.users = users || cache.users;
  cache.tickets = tickets || cache.tickets;
  cache.counter = (counterData && typeof counterData.counter === 'number') 
    ? counterData.counter 
    : cache.counter;
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
  await syncAndSaveTickets();
  
  const ticket = cache.tickets[id];
  if (!ticket) throw new Error('Ticket no encontrado');
  
  ticket.status = 'closed';
  ticket.response = escapeHtml(response || '');
  ticket.responseAt = Date.now();
  
  await syncAndSaveTickets();
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
    await refreshData();
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
  updateUserName,
  updateUserPassword,
  createTicket,
  getTicket,
  addComment,
  getOpenTickets,
  getClosedTickets,
  getUserOpenTickets,
  getUserClosedTickets,
  closeTicket,
  getStats,
  searchTickets,
  requireAuth,
  refreshData
};

export default API;
