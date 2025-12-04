import { useState, useEffect } from 'react';
import { store } from './store';
import { RxDocument } from 'rxdb';

export function useQuery<T>(collectionName: string, queryObj: any = {}) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const sub = async () => {
      if (!store.db) {
        await store.init();
      }
      
      // Wait for collection to be available (handle async registration race)
      let collection = store.db!.collections[collectionName];
      if (!collection) {
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 100));
          collection = store.db!.collections[collectionName];
          if (collection) break;
        }
      }

      if (!collection) {
        console.error(`[Core] Collection ${collectionName} not found after waiting.`);
        setError(new Error(`Collection ${collectionName} not found`));
        setLoading(false);
        return;
      }

      // Simple query subscription
      const observable = collection.find(queryObj).$;
      const subscription = observable.subscribe((docs: RxDocument<T>[]) => {
        console.log(`[Core] useQuery ${collectionName} update:`, docs.length);
        setData(docs.map(d => d.toJSON()) as T[]);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    };

    const cleanupPromise = sub();
    
    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, [collectionName, JSON.stringify(queryObj)]);

  return { data, loading, error };
}

export function useMutation<T>(collectionName: string) {
  const add = async (doc: T) => {
    console.log(`[Core] useMutation add to ${collectionName}:`, doc);
    if (!store.db) await store.init();
    try {
      const result = await store.db!.collections[collectionName].insert(doc);
      console.log(`[Core] insert success:`, result);
      return result;
    } catch (err) {
      console.error(`[Core] insert failed:`, err);
      throw err;
    }
  };

  const update = async (id: string, patch: Partial<T>) => {
    if (!store.db) await store.init();
    const doc = await store.db!.collections[collectionName].findOne(id).exec();
    if (doc) {
      return doc.patch(patch);
    }
  };

  const remove = async (id: string) => {
    if (!store.db) await store.init();
    const doc = await store.db!.collections[collectionName].findOne(id).exec();
    if (doc) {
      return doc.remove();
    }
  };

  return { add, update, remove };
}
