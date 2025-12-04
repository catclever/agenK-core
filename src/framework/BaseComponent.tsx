import React from 'react';
import { useQuery, useMutation } from '../hooks';
import { CanvasContainer } from './CanvasContainer';
import { BaseComponentProps } from './types';

export function BaseComponent<T = any>({
  collection,
  id,
  query,
  children,
  ...canvasProps
}: BaseComponentProps & { children: (props: { data: T | T[], actions: any }) => React.ReactNode }) {
  
  // 1. Data Binding
  // TODO: Optimize this. Currently useQuery fetches all and we filter.
  // Ideally useQuery should support RxDB queries directly.
  const { data: allData, loading, error } = useQuery<T>(collection);
  const { add, update, remove } = useMutation<T>(collection);

  let finalData: T | T[] | null = null;

  if (loading) return null; // Or a skeleton?
  if (error) return <div>Error: {error.message}</div>;

  if (id) {
    // Single Entity Mode
    finalData = (allData as any[]).find((d: any) => d.id === id) || null;
    
    if (!finalData) {
      // Data missing in Local DB. 
      // In a real app, this triggers a fetch to the backend.
      // For now, we show a loading state.
      console.log(`[BaseComponent] Data ${collection}:${id} missing. Waiting for sync...`);
      return <div className="agent-f-loading">Loading {collection}:{id}...</div>;
    }
  } else {
    // List Mode
    // TODO: Implement actual query filtering here if needed
    finalData = allData;
  }

  // 2. Action System (Restricted)
  const actions = {
    add,
    update,
    remove,
    navigate: canvasProps.navigate || (() => console.warn('Navigate not implemented')),
    refresh: () => {
      console.log(`[Agent F] Refreshing data for ${collection}:${id || JSON.stringify(query)}`);
      // In a real app, this would trigger the Sync Engine to fetch latest data from backend
      // syncEngine.pull(collection, id);
    }
  };

  // 3. Canvas Positioning
  return (
    <CanvasContainer {...canvasProps}>
      {children({ data: finalData, actions })}
    </CanvasContainer>
  );
}
