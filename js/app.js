import { initDB, cacheUsers, getCachedUsers, cacheTickets, getCachedTickets, cacheCounter, getCachedCounter } from './db.js';

const ACCOUNT_ID = "e3a420c454b6c6ca891b31aea00ac53f";
const DATABASE_ID = "d39fa1b3-2c4c-45cd-9e72-b896703bc48d";
const API_TOKEN = "cfut_DBFrs2S30XVy3FULBHx5xyvgRvesOuwZK3zrhkQk8e986334";

const ADMIN_EMAIL = 'wisrovi@wticket.com';
const ADMIN_PASSWORD = 'wisrovi_wticket';
const SESSION_DURATION = 24 * 60 * 60 * 1000;

let cache = {
  users: {},
  tickets: {},
  counter: 0,
  initialized: false
};

async function query(sql, params = []) {
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sql, params }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error('D1 Query HTTP error:', res.status, errorText);
      throw new Error(`D1 HTTP error ${res.status}`);
    }
    const data = await res.json();
    if (!data.success) {
      console.error('D1 Query success=false:', data.errors);
      throw new Error(data.errors[0]?.message || 'D1 Query error');
    }
    // D1 returns result as an array of objects, each containing results array
    return data.result[0].results;
  } catch (e) {
    console.error('Query error:', e);
    throw e;
  }
}

async function setupDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      passwordHash TEXT,
      name TEXT,
      role TEXT,
      createdAt INTEGER
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      userEmail TEXT,
      priority TEXT,
      category TEXT,
      status TEXT,
      createdAt INTEGER,
      response TEXT,
      responseAt INTEGER,
      assignedTo TEXT,
      assignedAt INTEGER,
      comments TEXT
    )
  `);
}

async function initCache(force = false) {
  if (cache.initialized && !force) return;
  
  try {
    await initDB();
    await setupDatabase();
    
    console.log('Loading data from D1...');
    
    const [usersList, ticketsList] = await Promise.all([
      query("SELECT * FROM users"),
      query("SELECT * FROM tickets")
    ]);

    cache.users = {};
    usersList.forEach(u => {
      cache.users[u.email] = u;
    });

    cache.tickets = {};
    ticketsList.forEach(t => {
      // Parse comments if they exist
      try {
        t.comments = t.comments ? JSON.parse(t.comments) : [];
      } catch (e) {
        t.comments = [];
      }
      cache.tickets[t.id] = t;
    });

    // Update counter from max ID
    const maxIdResult = await query("SELECT MAX(id) as maxId FROM tickets");
    cache.counter = maxIdResult[0]?.maxId || 0;

    await Promise.all([
      cacheUsers(cache.users),
      cacheTickets(cache.tickets),
      cacheCounter(cache.counter)
    ]);

    cache.initialized = true;

    console.log('Loaded:', { 
      users: Object.keys(cache.users).length, 
      tickets: Object.keys(cache.tickets).length,
      counter: cache.counter 
    });
  } catch (error) {
    console.error('Error loading data, using local cache:', error);
    cache.users = await getCachedUsers() || {};
    cache.tickets = await getCachedTickets() || {};
    cache.counter = await getCachedCounter() || 0;
    cache.initialized = true;
  }

  await ensureAdminExists();
}

async function ensureAdminExists() {
  if (!cache.users[ADMIN_EMAIL]) {
    const hashedPassword = await hashPassword(ADMIN_PASSWORD);
    const user = {
      email: ADMIN_EMAIL,
      passwordHash: hashedPassword,
      name: 'Administrador',
      role: 'admin',
      createdAt: Date.now()
    };
    await query("INSERT OR IGNORE INTO users (email, passwordHash, name, role, createdAt) VALUES (?, ?, ?, ?, ?)",
      [user.email, user.passwordHash, user.name, user.role, user.createdAt]);
    cache.users[ADMIN_EMAIL] = user;
    await cacheUsers(cache.users);
  }
}

async function register(email, password, name) {
  if (cache.users[email]) {
    throw new Error('El usuario ya existe');
  }
  
  const hashedPassword = await hashPassword(password);
  const user = {
    email,
    passwordHash: hashedPassword,
    name: name || email.split('@')[0],
    role: 'user',
    createdAt: Date.now()
  };
  
  await query("INSERT INTO users (email, passwordHash, name, role, createdAt) VALUES (?, ?, ?, ?, ?)", 
    [user.email, user.passwordHash, user.name, user.role, user.createdAt]);
    
  cache.users[email] = user;
  await cacheUsers(cache.users);
  
  return login(email, password);
}

async function updateUserName(email, newName) {
  if (!cache.users[email]) {
    throw new Error('Usuario no encontrado');
  }
  
  await query("UPDATE users SET name = ? WHERE email = ?", [newName, email]);
  
  cache.users[email].name = newName;
  await cacheUsers(cache.users);
  
  const session = JSON.parse(localStorage.getItem('wticket_session'));
  if (session && session.email === email) {
    session.name = newName;
    localStorage.setItem('wticket_session', JSON.stringify(session));
  }
  
  return true;
}

async function updateUserPassword(email, currentPassword, newPassword) {
  const user = cache.users[email];
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  
  const hashedCurrent = await hashPassword(currentPassword);
  if (user.passwordHash !== hashedCurrent) {
    throw new Error('Contraseña actual incorrecta');
  }
  
  const hashedNew = await hashPassword(newPassword);
  await query("UPDATE users SET passwordHash = ? WHERE email = ?", [hashedNew, email]);
  
  user.passwordHash = hashedNew;
  await cacheUsers(cache.users);
  
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
  const ticketData = {
    title: escapeHtml(title),
    description: escapeHtml(description || ''),
    userEmail,
    priority,
    category,
    status: 'open',
    createdAt: Date.now(),
    response: '',
    responseAt: 0,
    comments: '[]'
  };

  const results = await query(`
    INSERT INTO tickets (title, description, userEmail, priority, category, status, createdAt, response, responseAt, comments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING id
  `, [
    ticketData.title,
    ticketData.description,
    ticketData.userEmail,
    ticketData.priority,
    ticketData.category,
    ticketData.status,
    ticketData.createdAt,
    ticketData.response,
    ticketData.responseAt,
    ticketData.comments
  ]);
  
  const id = results[0].id;
  
  cache.tickets[id] = {
    ...ticketData,
    id,
    comments: []
  };
  
  cache.counter = Math.max(cache.counter, id);
  
  await Promise.all([
    cacheTickets(cache.tickets),
    cacheCounter(cache.counter)
  ]);
  
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
  const ticket = cache.tickets[ticketId];
  if (!ticket) throw new Error('Ticket no encontrado');
  
  const comment = {
    id: Date.now(),
    text: escapeHtml(text),
    authorEmail,
    authorName,
    createdAt: Date.now()
  };
  
  if (!ticket.comments) ticket.comments = [];
  ticket.comments.push(comment);
  
  await query("UPDATE tickets SET comments = ? WHERE id = ?", [JSON.stringify(ticket.comments), ticketId]);
  
  await cacheTickets(cache.tickets);
  return true;
}

async function assignTicket(ticketId, adminEmail) {
  const ticket = cache.tickets[ticketId];
  if (!ticket) throw new Error('Ticket no encontrado');
  
  const assignedAt = Date.now();
  await query("UPDATE tickets SET assignedTo = ?, assignedAt = ? WHERE id = ?", [adminEmail, assignedAt, ticketId]);
  
  ticket.assignedTo = adminEmail;
  ticket.assignedAt = assignedAt;
  
  await cacheTickets(cache.tickets);
  return true;
}

async function refreshData() {
  try {
    const [usersList, ticketsList] = await Promise.all([
      query("SELECT * FROM users"),
      query("SELECT * FROM tickets")
    ]);

    const newUsers = {};
    usersList.forEach(u => {
      newUsers[u.email] = u;
    });

    const newTickets = {};
    ticketsList.forEach(t => {
      try {
        t.comments = t.comments ? JSON.parse(t.comments) : [];
      } catch (e) {
        t.comments = [];
      }
      newTickets[t.id] = t;
    });

    cache.users = newUsers;
    cache.tickets = newTickets;
    
    const maxIdResult = await query("SELECT MAX(id) as maxId FROM tickets");
    cache.counter = maxIdResult[0]?.maxId || 0;

    await Promise.all([
      cacheUsers(cache.users),
      cacheTickets(cache.tickets),
      cacheCounter(cache.counter)
    ]);
  } catch (e) {
    console.error('Refresh data error:', e);
  }
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

function getAdmins() {
  return Object.values(cache.users)
    .filter(u => u.role === 'admin')
    .map(u => ({ email: u.email, name: u.name }));
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
  
  const responseText = escapeHtml(response || '');
  const responseAt = Date.now();
  
  await query("UPDATE tickets SET status = 'closed', response = ?, responseAt = ? WHERE id = ?", 
    [responseText, responseAt, id]);
  
  ticket.status = 'closed';
  ticket.response = responseText;
  ticket.responseAt = responseAt;
  
  await cacheTickets(cache.tickets);
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
  assignTicket,
  getAdmins,
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
