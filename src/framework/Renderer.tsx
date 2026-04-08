import React from 'react';
import type { PageSpec, ComponentInstance, BindingSourceSchema } from '../schema/app_spec';
import { BaseComponent } from './BaseComponent';
import { evaluateCondition, bindProps } from './evaluator';
import { z } from 'zod';

export interface RendererContext {
  routeParams: Record<string, string>;
  global: Record<string, any>;
  state: Record<string, any>;
  navigate: (path: string) => void;
}

export interface RendererProps {
  page: PageSpec;
  components: Record<string, React.ComponentType<any> | string>;
  context: RendererContext;
}

function resolveId(bindingId: z.infer<typeof BindingSourceSchema> | undefined, context: RendererContext): string | undefined {
  if (!bindingId) return undefined;
  if (typeof bindingId === 'string') return bindingId;
  switch (bindingId.source) {
    case 'route': return context.routeParams[bindingId.key];
    case 'global': return context.global[bindingId.key];
    case 'state': return context.state[bindingId.key];
    case 'context': return undefined;
    default: return undefined;
  }
}

const RenderNode: React.FC<{
  instance: ComponentInstance;
  components: Record<string, React.ComponentType<any> | string>;
  context: RendererContext;
}> = ({ instance, components, context }) => {

  if (instance.condition && !evaluateCondition(instance.condition, context)) {
     return null;
  }

  const Component = components[instance.type];
  
  if (!Component) {
    console.warn(`[Renderer] Component type "${instance.type}" not found in registry.`);
    return null;
  }

  let dataProps = {};
  if (instance.data) {
    const resolvedId = resolveId(instance.data.id, context);
    dataProps = {
      collection: instance.data.collection,
      id: resolvedId,
      query: instance.data.query
    };
  }

  const { key: _canvasKey, ...canvasProps } = (instance.canvas || {}) as any;
  const rawProps = instance.props || {};
  const dynamicProps = bindProps(rawProps, context);

  const finalProps = {
    ...canvasProps,
    ...dataProps,
    navigate: context.navigate
  };

  return (
    <BaseComponent key={instance.id} {...(finalProps as any)}>
      {(childProps) => {
        const ElementProps = typeof Component === 'string' 
          ? { ...dynamicProps }
          : { ...childProps, ...dynamicProps };

        return (
          <Component {...ElementProps}>
            {instance.children && instance.children.length > 0 && (
              instance.children.map(child => (
                <RenderNode 
                  key={child.id}                 
                  instance={child} 
                  components={components} 
                  context={context} 
                />
              ))
            )}
            {/* If it's a text node implicitly via props.children binding or static text */}
            {dynamicProps.text && typeof dynamicProps.text === 'string' && dynamicProps.text}
          </Component>
        );
      }}
    </BaseComponent>
  );
};

export const Renderer: React.FC<RendererProps> = ({ page, components, context }) => {
  return (
    <div className="agent-k-page" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {page?.components?.map((instance: ComponentInstance) => (
        <RenderNode 
          key={instance.id} 
          instance={instance} 
          components={components} 
          context={context} 
        />
      ))}
    </div>
  );
};
