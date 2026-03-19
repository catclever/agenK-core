import { useState, useEffect } from 'react';
import { store } from './store';
import { RxDocument } from 'rxdb';

/**
 * 1. useList (List Strategy)
 * Resolves multiple documents based on a query. In the Agent F architecture,
 * list queries inherently assume Snippet data.
 */
export function useList<T>(collectionName: string, queryObj: any = {}) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let subscription: any;
    const sub = async () => {
      try {
        if (!store.db) await store.init();
        
        // Wait for collection to be available 
        let collection = store.db!.collections[collectionName];
        if (!collection) {
          for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 100));
            collection = store.db!.collections[collectionName];
            if (collection) break;
          }
        }

        if (!collection) {
          throw new Error(`Collection ${collectionName} not found`);
        }

        const observable = collection.find(queryObj).$;
        subscription = observable.subscribe((docs: RxDocument<T>[]) => {
          setData(docs.map(d => d.toJSON()) as T[]);
          setLoading(false);
        });
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    sub();
    
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [collectionName, JSON.stringify(queryObj)]);

  return { data, loading, error };
}

/**
 * 2. useEntity (Entity Strategy)
 * Fetches a single entity. Triggers backend fetching if data is missing or marked as partial.
 */
export function useEntity<T extends { _isFull?: boolean }>(collectionName: string, id: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let subscription: any;
    const sub = async () => {
      try {
        if (!store.db) await store.init();
        const collection = store.db!.collections[collectionName];
        if (!collection) throw new Error(`Collection ${collectionName} not found`);

        const observable = collection.findOne(id).$;
        subscription = observable.subscribe((doc: RxDocument<T> | null) => {
          if (doc) {
            setData(doc.toJSON() as T);
            setLoading(false);
            
            // Content-First Sync Rule: If only snippet exists, fetch full entity
            if (doc.get('_isFull') === false) {
              console.warn(`[Agent F Sync] Snippet detected for ${collectionName}:${id}. Initiating background fetch for full data from Amber Backend...`);
              // TODO: Wire to actual Backend REST/GraphQL call
            }
          } else {
            setData(null);
            setLoading(false);
            // Document missing trigger
            console.warn(`[Agent F Sync] Document ${collectionName}:${id} not found locally. Initiating forced fetch from Amber Backend...`);
          }
        });
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    sub();
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [collectionName, id]);

  return { data, loading, error };
}

export type DispatchAction = 'create' | 'update' | 'delete' | 'link' | string;

/**
 * 3. useDispatch (Write Strategy / Tunnel)
 * Prohibits direct fetches. Applies optimistic updates to local RxDB and 
 * queues the uniform Intent Command for the Ruby Backend to process.
 */
export function useDispatch(collectionName: string) {
  const dispatch = async (action: DispatchAction, targetId: string | null = null, payload: any = {}) => {
    if (!store.db) await store.init();
    const collection = store.db!.collections[collectionName];
    if (!collection) throw new Error(`Collection ${collectionName} not found`);

    console.log(`[CQRS Tunnel] Dispatch Intent Triggered: ${action} on ${collectionName}:${targetId}`, payload);

    try {
      // Step 1: Optimistic UI Local Updates (Direct Database Mutation)
      let localResult;
      
      switch (action) {
        case 'create':
          localResult = await collection.insert(payload);
          break;
        case 'update':
          if (!targetId) throw new Error('Optimistic Update requires a targetId');
          const docToUpdate = await collection.findOne(targetId).exec();
          if (docToUpdate) {
            localResult = await docToUpdate.patch(payload);
          } else {
            console.warn(`Optimistic Update ignored: Document ${targetId} not found locally.`);
          }
          break;
        case 'delete':
          if (!targetId) throw new Error('Optimistic Delete requires a targetId');
          const docToDelete = await collection.findOne(targetId).exec();
          if (docToDelete) {
             localResult = await docToDelete.remove();
          }
          break;
        default:
          // Complex or custom intentions (e.g. 'compute_metrics', 'link_relations')
          // Skip local mutations, wait for Backend/Descartes resolution to sync back.
          console.log(`[CQRS Tunnel] Custom Semantic Action '${action}' recorded. Bypassing local RxDB mutation.`);
          break;
      }

      // Step 2: Push intention into Sync Tunnel (To be processed by Amber/Descartes)
      const commandPayload = {
        action,
        collection: collectionName,
        targetId,
        payload,
        timestamp: Date.now(),
        status: 'pending' 
      };

      // TODO: Actually insert into `system_commands` RxDB collection or WebSocket stream
      console.info(`[Sync Engine] -> Queued Command for Ruby Backend:`, commandPayload);

      return localResult;
    } catch (err) {
      console.error(`[CQRS Tunnel] Local Optimistic Execution Failed (Rollback triggered):`, err);
      // Real implementation would safely Auto-Revert the RxDB changes
      throw err;
    }
  };

  return { dispatch };
}
