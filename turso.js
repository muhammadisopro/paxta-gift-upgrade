// Turso Cloud Database (LibSQL) Integration for Paxta Gifts
// Seamlessly persists inventory, users, settings, payments, activity, and promocodes
import fs from 'fs';
import path from 'path';

const TURSO_URL = process.env.TURSO_DATABASE_URL || 'libsql://antigrvty-umarbe.aws-ap-northeast-1.turso.io';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE4MDE2NjU5ODcsImlhdCI6MTc5Mzg4OTk4NywiaWQiOiIwMWExYWMyYy05NzAxLTdiMjUtYjNhNS1jMWZmZWNiMTU1YjMiLCJraWQiOiJPbi1BME5RanhSWEZOSVdFeGRucUQ0SVBJZDRPMEdfbWM3bTZ6VDcyX01BIiwicmlkIjoiYjY5NGEwNjYtNzEwNi00ZmMyLThjNWEtYjM4ZGQ2OWIyNDNmIn0.3FAho1-aZZmAzxd3HKWLuRocdTDTZF-DheGd6T-5ceHaJiPv8kEtlwR8SvrYgsCCUp6z51-XwNuFVtC_uDB4Ag';

const TURSO_HOST = TURSO_URL.replace('libsql://', '').replace(/\/$/, '');
const TURSO_PIPELINE = `https://${TURSO_HOST}/v2/pipeline`;

let isInitialized = false;
const debounceTimers = new Map();
const latestDebouncedData = new Map();
const inFlightSaves = new Map();
const pendingSaves = new Map();
const DEFAULT_DEBOUNCE_MS = 400;
const KEY_DEBOUNCE_MS = {
  hold_state: 1500
};

/**
 * Executes a single SQL statement on Turso
 */
export async function tursoExecute(sql, args = []) {
  try {
    const formattedArgs = args.map(a => {
      if (typeof a === 'number') return { type: Number.isInteger(a) ? 'integer' : 'real', value: String(a) };
      return { type: 'text', value: String(a) };
    });

    const res = await fetch(TURSO_PIPELINE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TURSO_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            type: 'execute',
            stmt: {
              sql,
              args: formattedArgs
            }
          }
        ]
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error('[Turso HTTP Error]', res.status, txt);
      return null;
    }

    const json = await res.json();
    const result = json.results?.[0];
    if (result?.type === 'error') {
      console.error('[Turso Query Error]', result.error?.message);
      return null;
    }

    return result?.response?.result || null;
  } catch (err) {
    console.error('[Turso Network Error]', err.message);
    return null;
  }
}

/**
 * Initialize database table and sync local data with Turso
 */
export async function initTursoSync(dataDir) {
  console.log('[Turso] Connecting to database:', TURSO_HOST);

  // 1. Create table if not exists
  await tursoExecute(`
    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      val TEXT,
      updated_at INTEGER
    );
  `);

  // 2. Fetch all stored keys from Turso
  const res = await tursoExecute('SELECT key, val, updated_at FROM kv_store;');
  const remoteMap = new Map();

  if (res && res.rows) {
    for (const row of res.rows) {
      const k = row[0]?.value;
      const v = row[1]?.value;
      const u = parseInt(row[2]?.value || '0', 10);
      if (k) remoteMap.set(k, { val: v, updatedAt: u });
    }
  }

  console.log(`[Turso] Found ${remoteMap.size} remote keys stored in Turso.`);

  const keys = ['inventory', 'users', 'settings', 'payments', 'activity', 'promocodes', 'hold_state', 'channel_calendars', 'channel_medals'];

  await Promise.all(keys.map(async (k) => {
    const localFile = path.join(dataDir, `${k}.json`);
    const remoteEntry = remoteMap.get(k);

    if (remoteEntry && remoteEntry.val) {
      try {
        JSON.parse(remoteEntry.val);
        await fs.promises.writeFile(localFile, remoteEntry.val, 'utf8');
        console.log(`[Turso] Synced ${k} from Turso to local disk.`);
        return;
      } catch (err) {
        console.error(`[Turso] Error applying remote data for ${k}:`, err.message);
      }
    }

    try {
      const rawLocal = await fs.promises.readFile(localFile, 'utf8');
      const localData = JSON.parse(rawLocal);
      if (localData !== null) {
        console.log(`[Turso] Seeding remote database with local ${k}...`);
        await saveToTurso(k, localData, false);
      }
    } catch (e) {
      if (e.code !== 'ENOENT') {
        console.error(`[Turso] Error reading local ${k}.json:`, e.message);
      }
    }
  }));

  isInitialized = true;
  console.log('[Turso] Database synchronization complete and active!');
}

/**
 * Save data to Turso database (debounced and serialized per key to prevent excessive HTTP calls and races during bursts)
 */
export async function saveToTurso(key, data, debounce = true) {
  if (debounce) {
    if (debounceTimers.has(key)) {
      clearTimeout(debounceTimers.get(key));
    }
    latestDebouncedData.set(key, data);
    const delayMs = KEY_DEBOUNCE_MS[key] || DEFAULT_DEBOUNCE_MS;
    const timer = setTimeout(() => {
      debounceTimers.delete(key);
      const latest = latestDebouncedData.get(key);
      latestDebouncedData.delete(key);
      enqueueSave(key, latest !== undefined ? latest : data);
    }, delayMs);
    debounceTimers.set(key, timer);
    return;
  }

  if (debounceTimers.has(key)) {
    clearTimeout(debounceTimers.get(key));
    debounceTimers.delete(key);
  }
  latestDebouncedData.delete(key);
  await enqueueSave(key, data);
}

/**
 * Flush all pending debounced or in-flight Turso saves (for graceful shutdown)
 */
export async function flushTursoSaves() {
  const keysToFlush = Array.from(debounceTimers.keys());
  for (const key of keysToFlush) {
    clearTimeout(debounceTimers.get(key));
    debounceTimers.delete(key);
    if (latestDebouncedData.has(key)) {
      const data = latestDebouncedData.get(key);
      latestDebouncedData.delete(key);
      enqueueSave(key, data);
    }
  }
  await Promise.all(Array.from(inFlightSaves.values()));
}

function enqueueSave(key, data) {
  pendingSaves.set(key, data);
  if (inFlightSaves.has(key)) {
    return inFlightSaves.get(key);
  }

  const run = (async () => {
    try {
      while (pendingSaves.has(key)) {
        const latest = pendingSaves.get(key);
        pendingSaves.delete(key);
        await executeSave(key, latest);
      }
    } finally {
      inFlightSaves.delete(key);
    }
  })();

  inFlightSaves.set(key, run);
  return run;
}

async function executeSave(key, data) {
  try {
    const jsonStr = JSON.stringify(data);
    const now = Date.now();
    await tursoExecute(
      `INSERT INTO kv_store (key, val, updated_at) 
       VALUES (?, ?, ?) 
       ON CONFLICT(key) DO UPDATE SET val = excluded.val, updated_at = excluded.updated_at;`,
      [key, jsonStr, now]
    );
  } catch (err) {
    console.error(`[Turso] Failed to persist ${key}:`, err.message);
  }
}
