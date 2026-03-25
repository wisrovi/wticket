import { Redis } from "https://esm.sh/@upstash/redis";

const REDIS = new Redis({
  url: 'https://new-warthog-36731.upstash.io',
  token: 'Ao97AAIgcDGdC0Sh4vNuaFwb97FpvVSketbZfyj-fsxQcV0h34e92w',
});

const ADMIN_EMAIL = 'wisrovi@wticket.com';
const ADMIN_PASSWORD = 'wisrovi_wticket';
const SESSION_DURATION = 24 * 60 * 60 * 1000;

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

async function ensureAdminExists() {
  const adminExists = await REDIS.exists(`user:${ADMIN_EMAIL}`);
  if (!adminExists) {
    const hashedPassword = await hashPassword(ADMIN_PASSWORD);
    await REDIS.hset(`user:${ADMIN_EMAIL}`, {
      email: ADMIN_EMAIL,
      passwordHash: hashedPassword,
      name: 'Administrador',
      role: 'admin',
      createdAt: Date.now()
    });
  }
}

async function register(email, password, name) {
  const exists = await REDIS.exists(`user:${email}`);
  if (exists) {
    throw new Error('El usuario ya existe');
  }
  const hashedPassword = await hashPassword(password);
  await REDIS.hset(`user:${email}`, {
    email,
    passwordHash: hashedPassword,
    name: name || email.split('@')[0],
    role: 'user',
    createdAt: Date.now()
  });
  return login(email, password);
}

async function login(email, password) {
  const user = await REDIS.hgetall(`user:${email}`);
  if (!user || !user.email) {
    throw new Error('Usuario no encontrado');
  }
  const hashedPassword = await hashPassword(password);
  if (user.passwordHash !== hashedPassword) {
    throw new Error('Contraseña incorrecta');
  }
  const token = generateToken();
  const expiresAt = Date.now() + SESSION_DURATION;
  await REDIS.hset(`session:${token}`, {
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: Date.now(),
    expiresAt
  });
  await REDIS.expire(`session:${token}`, SESSION_DURATION / 1000);
  return { token, user: { email: user.email, name: user.name, role: user.role } };
}

async function validateSession() {
  const token = localStorage.getItem('wticket_token');
  if (!token) return null;
  const session = await REDIS.hgetall(`session:${token}`);
  if (!session || !session.email) {
    localStorage.removeItem('wticket_token');
    return null;
  }
  if (Date.now() > parseInt(session.expiresAt)) {
    await REDIS.del(`session:${token}`);
    localStorage.removeItem('wticket_token');
    return null;
  }
  return { email: session.email, name: session.name, role: session.role };
}

async function logout() {
  const token = localStorage.getItem('wticket_token');
  if (token) {
    await REDIS.del(`session:${token}`);
    localStorage.removeItem('wticket_token');
  }
}

async function getNextTicketId() {
  const id = await REDIS.incr('ticket:counter');
  return id;
}

async function createTicket(title, description, userEmail) {
  const id = await getNextTicketId();
  const timestamp = Date.now();
  await REDIS.hset(`ticket:${id}`, {
    id,
    title: escapeHtml(title),
    description: escapeHtml(description || ''),
    userEmail,
    status: 'open',
    createdAt: timestamp,
    response: '',
    responseAt: 0
  });
  await REDIS.zadd('tickets:open', { score: timestamp, member: id });
  await REDIS.sadd(`tickets:user:${userEmail}:open`, id);
  return id;
}

async function getTicket(id) {
  const ticket = await REDIS.hgetall(`ticket:${id}`);
  if (!ticket || !ticket.id) return null;
  return {
    ...ticket,
    id: parseInt(ticket.id),
    createdAt: parseInt(ticket.createdAt),
    responseAt: parseInt(ticket.responseAt) || 0
  };
}

async function getOpenTickets() {
  const ids = await REDIS.zrange('tickets:open', 0, -1);
  const tickets = [];
  for (const id of ids) {
    const ticket = await getTicket(id);
    if (ticket) tickets.push(ticket);
  }
  return tickets;
}

async function getClosedTickets() {
  const ids = await REDIS.zrange('tickets:closed', 0, -1);
  const tickets = [];
  for (const id of ids) {
    const ticket = await getTicket(id);
    if (ticket) tickets.push(ticket);
  }
  return tickets.reverse();
}

async function getUserOpenTickets(email) {
  const ids = await REDIS.smembers(`tickets:user:${email}:open`);
  const tickets = [];
  for (const id of ids) {
    const ticket = await getTicket(parseInt(id));
    if (ticket) tickets.push(ticket);
  }
  return tickets.sort((a, b) => a.createdAt - b.createdAt);
}

async function getUserClosedTickets(email) {
  const ids = await REDIS.smembers(`tickets:user:${email}:closed`);
  const tickets = [];
  for (const id of ids) {
    const ticket = await getTicket(parseInt(id));
    if (ticket) tickets.push(ticket);
  }
  return tickets.sort((a, b) => b.createdAt - a.createdAt);
}

async function closeTicket(id, response) {
  const ticket = await getTicket(id);
  if (!ticket) throw new Error('Ticket no encontrado');
  const timestamp = Date.now();
  await REDIS.hset(`ticket:${id}`, {
    status: 'closed',
    response: escapeHtml(response || ''),
    responseAt: timestamp
  });
  await REDIS.zrem('tickets:open', id);
  await REDIS.zadd('tickets:closed', { score: timestamp, member: id });
  await REDIS.srem(`tickets:user:${ticket.userEmail}:open`, id);
  await REDIS.sadd(`tickets:user:${ticket.userEmail}:closed`, id);
}

async function getStats() {
  const openCount = await REDIS.zcard('tickets:open');
  const closedCount = await REDIS.zcard('tickets:closed');
  const totalCount = openCount + closedCount;
  const users = await REDIS.keys('user:*');
  const userCount = users.filter(k => !k.includes('session:') && !k.includes('tickets:')).length;
  return { openCount, closedCount, totalCount, userCount };
}

function searchTickets(tickets, query) {
  if (!query) return tickets;
  const q = query.toLowerCase();
  return tickets.filter(t => {
    const titleMatch = t.title.toLowerCase().includes(q);
    const idMatch = t.id.toString().includes(q);
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
    await ensureAdminExists();
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
