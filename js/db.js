const DB_NAME = 'wticket_db';
const DB_VERSION = 1;
const STORE_USERS = 'users';
const STORE_TICKETS = 'tickets';
const STORE_COUNTER = 'counter';
const STORE_SYNC = 'sync';

let db = null;

export async function initDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      
      if (!database.objectStoreNames.contains(STORE_USERS)) {
        database.createObjectStore(STORE_USERS, { keyPath: 'email' });
      }
      if (!database.objectStoreNames.contains(STORE_TICKETS)) {
        database.createObjectStore(STORE_TICKETS, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(STORE_COUNTER)) {
        database.createObjectStore(STORE_COUNTER, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(STORE_SYNC)) {
        database.createObjectStore(STORE_SYNC, { keyPath: 'id' });
      }
    };
  });
}

async function getStore(storeName, mode = 'readonly') {
  const database = await initDB();
  const transaction = database.transaction(storeName, mode);
  return transaction.objectStore(storeName);
}

export async function getFromDB(storeName, key) {
  try {
    const store = await getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error getting ${key} from ${storeName}:`, error);
    return null;
  }
}

export async function getAllFromDB(storeName) {
  try {
    const store = await getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error getting all from ${storeName}:`, error);
    return [];
  }
}

export async function saveToDB(storeName, data) {
  try {
    const store = await getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error saving to ${storeName}:`, error);
    return false;
  }
}

export async function saveAllToDB(storeName, items) {
  try {
    const database = await initDB();
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      items.forEach(item => store.put(item));
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error(`Error saving all to ${storeName}:`, error);
    return false;
  }
}

export async function clearDB(storeName) {
  try {
    const store = await getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error clearing ${storeName}:`, error);
    return false;
  }
}

export async function getLastSync(storeName) {
  const sync = await getFromDB(STORE_SYNC, storeName);
  return sync ? sync.timestamp : 0;
}

export async function setLastSync(storeName, timestamp) {
  return saveToDB(STORE_SYNC, { id: storeName, timestamp });
}

export async function cacheUsers(users) {
  const usersArray = Object.values(users);
  await clearDB(STORE_USERS);
  return saveAllToDB(STORE_USERS, usersArray);
}

export async function getCachedUsers() {
  const users = await getAllFromDB(STORE_USERS);
  const usersObj = {};
  users.forEach(u => usersObj[u.email] = u);
  return usersObj;
}

export async function cacheTickets(tickets) {
  const ticketsArray = Object.values(tickets);
  await clearDB(STORE_TICKETS);
  return saveAllToDB(STORE_TICKETS, ticketsArray);
}

export async function getCachedTickets() {
  const tickets = await getAllFromDB(STORE_TICKETS);
  const ticketsObj = {};
  tickets.forEach(t => ticketsObj[t.id] = t);
  return ticketsObj;
}

export async function cacheCounter(counter) {
  return saveToDB(STORE_COUNTER, { id: 'counter', value: counter });
}

export async function getCachedCounter() {
  const data = await getFromDB(STORE_COUNTER, 'counter');
  return data ? data.value : 0;
}
