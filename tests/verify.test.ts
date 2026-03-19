import { describe, it, expect } from 'vitest';
import { store } from '../src/index';
import { defineSchema } from '../src/schema';
import { z } from 'zod';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';

describe('Core Library Verification', () => {
  it('should define schema, init store, and perform CRUD', async () => {
    const TodoSchema = z.object({
      id: z.string(),
      title: z.string(),
      done: z.boolean(),
    });

    const TodoDef = defineSchema('todos', TodoSchema, 'id');
    store.register(TodoDef);

    const db = await store.init('test_db', getRxStorageMemory());
    expect(db).toBeDefined();
    expect(db.collections.todos).toBeDefined();

    await db.collections.todos.insert({
      id: 't1',
      title: 'Verify Core',
      done: false,
    });

    const doc = await db.collections.todos.findOne('t1').exec();
    expect(doc).toBeDefined();
    expect(doc.title).toBe('Verify Core');
    expect(doc.done).toBe(false);

    await doc.patch({ done: true });
    const updatedDoc = await db.collections.todos.findOne('t1').exec();
    expect(updatedDoc.done).toBe(true);

    console.log('✅ Core Library Verification Passed!');
  });
});
