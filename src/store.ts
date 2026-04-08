import { createRxDatabase, type RxDatabase, addRxPlugin, removeRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { type SchemaDefinition, toRxSchema } from './schema';
import type { ZodTypeAny } from 'zod';

// Add plugins
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
addRxPlugin(RxDBDevModePlugin);

export class Store {
  db: RxDatabase | null = null;
  private schemas: SchemaDefinition<any>[] = [];

  constructor() {}

  async register<T extends ZodTypeAny>(schema: SchemaDefinition<T>) {
    // 1. Update local registry (avoid duplicates)
    const existing = this.schemas.find(s => s.name === schema.name);
    if (!existing) {
      this.schemas.push(schema);
    }

    // 2. Add to DB if initialized
    if (this.db) {
      if (this.db.collections[schema.name]) {
        // Already exists in DB, skip to prevent RxError (DB3)
        return;
      }

      // If DB is already running, add the collection dynamically
      const collections: Record<string, any> = {};
      collections[schema.name] = {
        schema: toRxSchema(schema),
      };
      await this.db.addCollections(collections);
    }
  }

  async init(name: string = 'agent_k_db', storage?: any) {
    if (this.db) return this.db;

    this.db = await createRxDatabase({
      name,
      storage: storage || getRxStorageDexie(),
      ignoreDuplicate: true,
    });

    const collections: Record<string, any> = {};
    for (const s of this.schemas) {
      collections[s.name] = {
        schema: toRxSchema(s),
      };
    }

    await this.db.addCollections(collections);
    return this.db;
  }

  /**
   * Resets the entire local database. 
   * Extremely useful for debugging, handling schema collisions, or wiping user data during tests.
   */
  async reset(name: string = 'agent_k_db', storage?: any) {
    // 1. Destroy running instance from memory
    if (this.db) {
      await this.db.destroy();
      this.db = null;
    }
    
    // 2. Erase the physical local storage completely
    await removeRxDatabase(name, storage || getRxStorageDexie());
    console.warn(`[Agent K DB] Physical database storage for '${name}' has been wiped.`);
    
    // 3. (Optional) Could clear schemas here, but typically we want to preserve 
    // the registered schemas so that an immediate re-init brings them back.
    // this.schemas = []; 
  }
}

// Global singleton pattern to survive HMR
const globalScope = typeof window !== 'undefined' ? window : globalThis;
const SYMBOL_KEY = Symbol.for('agent-k.store');

if (!(globalScope as any)[SYMBOL_KEY]) {
  (globalScope as any)[SYMBOL_KEY] = new Store();
}

// Expose for interceptors/debugging
(globalScope as any).__AGENT_K_STORE__ = (globalScope as any)[SYMBOL_KEY];

export const store = (globalScope as any)[SYMBOL_KEY] as Store;
