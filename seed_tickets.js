/**
 * script de semillado para crear 180 tickets resueltos en Cloudflare D1
 * requiere Node.js 18+ para usar fetch nativo
 */

const ACCOUNT_ID = "e3a420c454b6c6ca891b31aea00ac53f";
const DATABASE_ID = "d39fa1b3-2c4c-45cd-9e72-b896703bc48d";
const API_TOKEN = "cfut_YIiWmCsPWWwkpyooN4fTfcOyBHDSTOtsxefRaOO517820db9"; // <--- REEMPLAZA ESTO CON TU TOKEN REAL

async function query(sql, params = []) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    }
  );
  const data = await res.json();
  if (!data.success) {
    throw new Error(JSON.stringify(data.errors));
  }
  return data.result[0].results;
}

const categories = ['general', 'technical', 'billing', 'suggestion', 'bug', 'other'];
const priorities = ['urgent', 'high', 'normal', 'low'];
const users = ['usuario1@ejemplo.com', 'usuario2@ejemplo.com', 'test@wticket.com'];
const admins = ['wisrovi@wticket.com'];

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

async function seed() {
  console.log('Iniciando el proceso de creación de 180 tickets resueltos...');
  
  try {
    await setupDatabase();
    console.log('Tablas verificadas/creadas correctamente.');
  } catch (e) {
    console.error('Error al configurar las tablas:', e.message);
    return;
  }
  
  for (let i = 1; i <= 180; i++) {
    const createdAt = Date.now() - Math.floor(Math.random() * 10000000000); // Fecha en el pasado
    const responseAt = createdAt + Math.floor(Math.random() * 1000000000); // Resuelto poco después
    
    const ticketData = {
      title: `Ticket de Soporte Automático #${i}`,
      description: `Esta es una descripción generada automáticamente para el ticket de prueba número ${i}. Se creó para simular carga en la base de datos SQL.`,
      userEmail: users[Math.floor(Math.random() * users.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      status: 'closed',
      createdAt: createdAt,
      response: `Se ha resuelto satisfactoriamente el incidente número ${i}. Se aplicó la solución estándar del protocolo de pruebas.`,
      responseAt: responseAt,
      assignedTo: admins[0],
      assignedAt: createdAt + 500000,
      comments: JSON.stringify([
        {
          id: Date.now() + i,
          text: "Iniciando investigación del problema.",
          authorEmail: admins[0],
          authorName: "Administrador",
          createdAt: createdAt + 100000
        }
      ])
    };

    try {
      await query(`
        INSERT INTO tickets (title, description, userEmail, priority, category, status, createdAt, response, responseAt, assignedTo, assignedAt, comments)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        ticketData.assignedTo,
        ticketData.assignedAt,
        ticketData.comments
      ]);
      
      if (i % 20 === 0) {
        console.log(`Progreso: ${i}/180 tickets creados.`);
      }
    } catch (e) {
      console.error(`Error en el ticket #${i}:`, e.message);
      if (e.message.includes("401") || e.message.includes("Unauthorized")) {
        console.error("TOKEN INVÁLIDO: Por favor, asegúrate de haber puesto tu API_TOKEN real en el archivo.");
        return;
      }
    }
  }
  
  console.log('Finalizado. Se han intentado crear 180 tickets.');
}

seed();
