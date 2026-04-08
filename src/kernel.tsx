import React, { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react';

// Lightweight Pub/Sub for cross-plugin events
export type KernelEventCallback = (payload: any) => void;

// Define specific API capabilities provided by components
export interface TerminalApi {
  executeCommand: (cmd: string) => void;
  write: (text: string) => void;
}

export interface KernelApiMap {
  'gladius'?: TerminalApi;
  [pluginId: string]: any;
}

export interface IShoggothKernel {
  // Bus
  on: (event: string, callback: KernelEventCallback) => () => void;
  emit: (event: string, payload?: any) => void;
  
  // API Registry
  registerApi: <K extends keyof KernelApiMap>(pluginId: K, api: KernelApiMap[K]) => void;
  getApi: <K extends keyof KernelApiMap>(pluginId: K) => KernelApiMap[K] | undefined;

  // Track dynamic API changes so consumers re-render when a capability appears
  subscribeToApi: (pluginId: keyof KernelApiMap, callback: () => void) => () => void;
}

export const KernelContext = createContext<IShoggothKernel | null>(null);

export const ShoggothKernelProvider = ({ children }: { children: ReactNode }) => {
  const events = useRef<Record<string, Set<KernelEventCallback>>>({});
  const apis = useRef<Partial<KernelApiMap>>({});
  const apiListeners = useRef<Record<string, Set<() => void>>>({});

  const on = useCallback((event: string, callback: KernelEventCallback) => {
    if (!events.current[event]) events.current[event] = new Set();
    events.current[event].add(callback);
    return () => {
      events.current[event]?.delete(callback);
    };
  }, []);

  const emit = useCallback((event: string, payload?: any) => {
    events.current[event]?.forEach(cb => {
      try { cb(payload); } catch (e) { console.error(`Kernel Emit Error [${event}]:`, e); }
    });
  }, []);

  const registerApi = useCallback(<K extends keyof KernelApiMap>(pluginId: K, api: KernelApiMap[K]) => {
    apis.current[pluginId] = api;
    // Notify consumers waiting for this API
    apiListeners.current[pluginId as string]?.forEach(cb => cb());
  }, []);

  const getApi = useCallback(<K extends keyof KernelApiMap>(pluginId: K) => {
    return apis.current[pluginId];
  }, []);

  const subscribeToApi = useCallback((pluginId: keyof KernelApiMap, callback: () => void) => {
    const id = pluginId as string;
    if (!apiListeners.current[id]) apiListeners.current[id] = new Set();
    apiListeners.current[id].add(callback);
    return () => {
      apiListeners.current[id]?.delete(callback);
    };
  }, []);

  const kernel: IShoggothKernel = { on, emit, registerApi, getApi, subscribeToApi };

  return <KernelContext.Provider value={kernel}>{children}</KernelContext.Provider>;
};

// -- Consumer Hooks --

export function useKernel(): IShoggothKernel {
  const kernel = useContext(KernelContext);
  if (!kernel) {
    throw new Error('useKernel must be used within a ShoggothKernelProvider');
  }
  return kernel;
}

/** Subscribe directly to the Event Bus */
export function useKernelEvent(eventName: string, callback: KernelEventCallback) {
  const kernel = useKernel();
  React.useEffect(() => {
    return kernel.on(eventName, callback);
  }, [kernel, eventName, callback]);
}

/** 
 * Safely fetches a capability API. Automatically re-renders the component
 * if the capability is mounted dynamically over time (lazy-loaded).
 */
export function useKernelApi<K extends keyof KernelApiMap>(pluginId: K): KernelApiMap[K] | undefined {
  const kernel = useKernel();
  const [api, setApi] = useState<KernelApiMap[K] | undefined>(kernel.getApi(pluginId));

  React.useEffect(() => {
    // Attempt fetch initially
    setApi(kernel.getApi(pluginId));
    
    // Subscribe to mount mutations
    return kernel.subscribeToApi(pluginId, () => {
      setApi(kernel.getApi(pluginId));
    });
  }, [kernel, pluginId]);

  return api;
}

/** Exposes this component's API to the Kernel Bus */
export function useKernelRegister<K extends keyof KernelApiMap>(pluginId: K, api: KernelApiMap[K]) {
  const kernel = useKernel();
  React.useEffect(() => {
    kernel.registerApi(pluginId, api);
    return () => {
      kernel.registerApi(pluginId, undefined as any);
    };
  }, [kernel, pluginId, api]); // Warning: API should be stable/memoized
}
