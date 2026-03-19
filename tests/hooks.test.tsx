import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { store, useList, useDispatch, defineSchema } from '../src/index';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { z } from 'zod';

describe('Data Hooks (Local-First CQRS Flow)', () => {
  beforeEach(async () => {
    // Isolated DB init for each test run using Memory Storage
    const TaskSchema = z.object({
      id: z.string(),
      title: z.string(),
      status: z.string()
    });
    store.db = null; // force clear
    (store as any).schemas = [];
    store.register(defineSchema('tasks', TaskSchema, 'id'));
    await store.init('hook_test_db_' + Date.now(), getRxStorageMemory());
  });

  it('should optimistically perform dispatch(create) and reflect in useList', async () => {
    const { result: listResult } = renderHook(() => useList('tasks'));
    const { result: dispatchResult } = renderHook(() => useDispatch('tasks'));

    expect(listResult.current.loading).toBe(true);
    await new Promise(r => setTimeout(r, 50)); 
    expect(listResult.current.data.length).toBe(0);

    await act(async () => {
      await dispatchResult.current.dispatch('create', null, {
        id: 'task_1',
        title: 'Fix React Hooks',
        status: 'pending'
      });
    });

    await new Promise(r => setTimeout(r, 100)); 
    expect(listResult.current.data.length).toBe(1);
    expect(listResult.current.data[0].title).toBe('Fix React Hooks');
  });

  it('should capture dispatch intents in console (CQRS verification)', async () => {
    const { result } = renderHook(() => useDispatch('tasks'));
    const consoleSpy = vi.spyOn(console, 'info');

    await act(async () => {
      await result.current.dispatch('update', 'task_99', { status: 'done' });
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      '[Sync Engine] -> Queued Command for Ruby Backend:',
      expect.objectContaining({
        action: 'update',
        collection: 'tasks',
        targetId: 'task_99',
        payload: { status: 'done' },
        status: 'pending'
      })
    );
  });
});
