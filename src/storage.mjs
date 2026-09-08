const DB_NAME = "asset-valuation-automation-local-v1";
const DB_VERSION = 1;
const MEMORY = { databases: new Map(), workspace: null };

function indexedDbAvailable() { return typeof indexedDB !== "undefined"; }

function openDatabase() {
  if (!indexedDbAvailable()) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("databases")) database.createObjectStore("databases", { keyPath: "id" });
      if (!database.objectStoreNames.contains("workspace")) database.createObjectStore("workspace", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open local database"));
  });
}

async function run(storeName, mode, operation) {
  const database = await openDatabase();
  if (!database) return operation(null);
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = operation(store);
    transaction.oncomplete = () => resolve(request?.result);
    transaction.onerror = () => reject(transaction.error || request?.error || new Error("Local storage operation failed"));
  });
}

export async function listDatabases() {
  const database = await openDatabase();
  if (!database) return [...MEMORY.databases.values()];
  return new Promise((resolve, reject) => {
    const request = database.transaction("databases", "readonly").objectStore("databases").getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDatabase(value) {
  const clean = structuredClone(value);
  MEMORY.databases.set(clean.id, clean);
  return run("databases", "readwrite", (store) => store?.put(clean));
}

export async function deleteDatabase(id) {
  MEMORY.databases.delete(id);
  return run("databases", "readwrite", (store) => store?.delete(id));
}

export async function clearDatabases() {
  MEMORY.databases.clear();
  return run("databases", "readwrite", (store) => store?.clear());
}

export async function loadWorkspace() {
  const database = await openDatabase();
  if (!database) return MEMORY.workspace;
  return new Promise((resolve, reject) => {
    const request = database.transaction("workspace", "readonly").objectStore("workspace").get("current");
    request.onsuccess = () => resolve(request.result?.value || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveWorkspace(value) {
  const clean = structuredClone(value);
  MEMORY.workspace = clean;
  return run("workspace", "readwrite", (store) => store?.put({ id: "current", value: clean, savedAt: new Date().toISOString() }));
}

export function storageDescription() {
  return indexedDbAvailable() ? "IndexedDB · browser-local · no upload" : "Session memory fallback · no upload";
}

