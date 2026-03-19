import React from 'react';
import { PageSpec, ComponentInstance, BindingSourceSchema } from '../schema/app_spec';
import { BaseComponent } from './BaseComponent';
import { z } from 'zod';

// Context for resolving dynamic bindings
export interface RendererContext {
  routeParams: Record<string, string>;
  global: Record<string, any>;
  state: Record<string, any>;
  navigate: (path: string) => void;
  // context: Record<string, any>; // For nested lists (future)
}

export interface RendererProps {
  page: PageSpec;
  components: Record<string, React.ComponentType<any>>;
  context: RendererContext;
}

// Helper: Resolve dynamic ID
function resolveId(bindingId: z.infer<typeof BindingSourceSchema> | undefined, context: RendererContext): string | undefined {
  if (!bindingId) return undefined;
  
  if (typeof bindingId === 'string') {
    return bindingId;
  }

  switch (bindingId.source) {
    case 'route':
      return context.routeParams[bindingId.key];
    case 'global':
      return context.global[bindingId.key];
    case 'state':
      return context.state[bindingId.key];
    case 'context':
      // TODO: Handle nested context
      return undefined;
    default:
      return undefined;
  }
}

export const Renderer: React.FC<RendererProps> = ({ page, components, context }) => {
  return (
    <div className="agent-k-page" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {page.components.map((instance: ComponentInstance) => {
        const Component = components[instance.type];
        
        if (!Component) {
          console.warn(`[Renderer] Component type "${instance.type}" not found in registry.`);
          return null;
        }

        // 1. Resolve Data Binding
        let dataProps = {};
        if (instance.data) {
          const resolvedId = resolveId(instance.data.id, context);
          dataProps = {
            collection: instance.data.collection,
            id: resolvedId,
            query: instance.data.query
          };
        }

        // 2. Combine Props (Exclude key from spread)
        const { key: _canvasKey, ...canvasProps } = instance.canvas as any;
        const { key: _propsKey, ...staticProps } = instance.props || {};

        const finalProps = {
          ...canvasProps,     // x, y, scale, etc.
          ...dataProps,       // collection, id
          ...staticProps,     // static props
          navigate: context.navigate // Pass navigation capability
        };

        // 3. Render BaseComponent
        return (
          <BaseComponent key={instance.id} {...(finalProps as any)}>
            {(childProps) => (
              <Component {...childProps} {...instance.props} />
            )}
          </BaseComponent>
        );
      })}
    </div>
  );
};
