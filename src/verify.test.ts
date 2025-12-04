import { describe, it, expect } from 'vitest';
import { store } from './index';
import { defineSchema } from './schema';
import { z } from 'zod';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';

describe('Core Library Verification', () => {
  it('should define schema, init store, and perform CRUD', async () => {
    // 1. Define Schema
    const TodoSchema = z.object({
      id: z.string(),
      title: z.string(),
      done: z.boolean(),
    });

    const TodoDef = defineSchema('todos', TodoSchema, 'id');
    store.register(TodoDef);

    // 2. Init Store with Memory Storage (for Node.js testing)
    const db = await store.init('test_db', getRxStorageMemory());
    expect(db).toBeDefined();
    expect(db.collections.todos).toBeDefined();

    // 3. Insert
    await db.collections.todos.insert({
      id: 't1',
      title: 'Verify Core',
      done: false,
    });

    // 4. Query
    const doc = await db.collections.todos.findOne('t1').exec();
    expect(doc).toBeDefined();
    expect(doc.title).toBe('Verify Core');
    expect(doc.done).toBe(false);

    // 5. Update
    await doc.patch({ done: true });
    const updatedDoc = await db.collections.todos.findOne('t1').exec();
    expect(updatedDoc.done).toBe(true);

    console.log('✅ Core Library Verification Passed!');
  });
});
