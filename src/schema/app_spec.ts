import { z } from 'zod';

export const BindingSourceSchema = z.union([
  z.string(),
  z.object({
    source: z.enum(['route', 'context', 'global', 'state']),
    key: z.string() 
  })
]);

export const DataBindingSchema = z.object({
  collection: z.string(),
  id: BindingSourceSchema.optional(),
  query: z.record(z.any()).optional()
});

export const CanvasPropsSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  scale: z.number().optional(),
  rotation: z.number().optional(),
  opacity: z.number().optional(),
  zIndex: z.number().optional(),
  width: z.union([z.number(), z.string()]).optional(),
  height: z.union([z.number(), z.string()]).optional(),
  layout: z.enum(['absolute', 'flex', 'grid']).optional(),
  className: z.string().optional()
});

export type ComponentInstance = {
  id: string;
  type: string;
  condition?: string; // New: simple boolean eval string like "$state.isSettingsOpen" or "!$state.isConnected"
  canvas?: z.infer<typeof CanvasPropsSchema>;
  data?: z.infer<typeof DataBindingSchema>;
  props?: Record<string, any>;
  children?: ComponentInstance[];
};

export const ComponentInstanceSchema: z.ZodType<ComponentInstance> = z.lazy(() => z.object({
  id: z.string(),
  type: z.string(),
  condition: z.string().optional(),
  canvas: CanvasPropsSchema.optional(),
  data: DataBindingSchema.optional(),
  props: z.record(z.any()).optional(),
  children: z.array(ComponentInstanceSchema).optional()
}));

export const PageSchema = z.object({
  id: z.string(),
  name: z.string(),
  route: z.string(),
  components: z.array(ComponentInstanceSchema)
});

export const AppSpecSchema = z.object({
  name: z.string(),
  version: z.string(),
  pages: z.array(PageSchema)
});

export type AppSpec = z.infer<typeof AppSpecSchema>;
export type PageSpec = z.infer<typeof PageSchema>;
