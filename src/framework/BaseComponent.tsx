import React from 'react';
import { useList, useEntity, useDispatch } from '../hooks';
import { CanvasContainer } from './CanvasContainer';
import { BaseComponentProps } from './types';

// Internal wrapper to fetch entity using hooks cleanly without breaking hook rules
function EntityDataFetcher<T extends { _isFull?: boolean }>({ collection, id, children }: { collection: string, id: string, children: (data: T | null, loading: boolean, error: any) => React.ReactNode }) {
  const { data, loading, error } = useEntity<T>(collection, id);
  return <>{children(data, loading, error)}</>;
}

// Internal wrapper to fetch list using hooks cleanly
function ListDataFetcher<T>({ collection, query, children }: { collection: string, query: any, children: (data: T[], loading: boolean, error: any) => React.ReactNode }) {
  const { data, loading, error } = useList<T>(collection, query);
  return <>{children(data, loading, error)}</>;
}

export function BaseComponent<T = any>({
  collection,
  id,
  query,
  children,
  ...canvasProps
}: BaseComponentProps & { children: (props: { data: any, actions: any }) => React.ReactNode }) {
  
  const { dispatch } = useDispatch(collection);

  // Map legacy actions to the new CQRS intent tunnel
  const actions = {
    add: (payload: any) => dispatch('create', null, payload),
    update: (targetId: string, payload: any) => dispatch('update', targetId, payload),
    remove: (targetId: string) => dispatch('delete', targetId),
    navigate: canvasProps.navigate || (() => console.warn('Navigate not implemented')),
    refresh: () => {
      console.log(`[Agent K] Refreshing data for ${collection}:${id || JSON.stringify(query)}`);
      // syncEngine.pull(collection, id);
    }
  };

  const renderContent = (data: any, loading: boolean, error: any) => {
    if (loading) return null; // Or a skeleton?
    if (error) return <div>Error: {error.message}</div>;

    if (id && !data) {
      console.log(`[BaseComponent] Data ${collection}:${id} missing. Waiting for sync...`);
      return <div className="agent-k-loading">Loading {collection}:{id}...</div>;
    }

    return (
      <CanvasContainer {...canvasProps}>
        {children({ data, actions })}
      </CanvasContainer>
    );
  };

  if (id) {
    return (
      <EntityDataFetcher<any> collection={collection} id={id}>
        {renderContent}
      </EntityDataFetcher>
    );
  } else {
    return (
      <ListDataFetcher<T> collection={collection} query={query}>
        {renderContent}
      </ListDataFetcher>
    );
  }
}
