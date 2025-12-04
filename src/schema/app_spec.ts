import { z } from 'zod';

// 1. Data Binding Schema
export const BindingSourceSchema = z.union([
  z.string(), // Static value (e.g., "user_123")
  z.object({
    source: z.enum(['route', 'context', 'global', 'state']), // Dynamic sources
    key: z.string() 
    // route: "userId" from /users/:userId
    // context: "itemId" from parent list iteration
    // global: "currentUser" from global app state
    // state: "selectedTab" from local UI state variables
  })
]);

export const DataBindingSchema = z.object({
  collection: z.string(),
  id: BindingSourceSchema.optional(), // Dynamic ID binding
  query: z.record(z.any()).optional() // For list binding
});

// 2. Visual/Canvas Props Schema
export const CanvasPropsSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
  scale: z.number().default(1),
  rotation: z.number().default(0),
  opacity: z.number().default(1),
  zIndex: z.number().default(0),
  width: z.union([z.number(), z.string()]).optional(),
  height: z.union([z.number(), z.string()]).optional()
});

// 3. Component Instance Schema (The "Atom" on the Canvas)
export const ComponentInstanceSchema = z.object({
  id: z.string(), // Unique instance ID
  type: z.string(), // Component Type Name (e.g., 'UserCard')
  
  // Mixin the props
  canvas: CanvasPropsSchema,
  data: DataBindingSchema.optional(),
  
  // Any other static props (e.g., title="Hello")
  props: z.record(z.any()).optional()
});

// 4. Page Schema (The "Canvas")
export const PageSchema = z.object({
  id: z.string(),
  name: z.string(),
  route: z.string(), // e.g., '/home'
  components: z.array(ComponentInstanceSchema)
});

// 5. App Spec Schema (The "World")
export const AppSpecSchema = z.object({
  name: z.string(),
  version: z.string(),
  pages: z.array(PageSchema)
});

export type AppSpec = z.infer<typeof AppSpecSchema>;
export type PageSpec = z.infer<typeof PageSchema>;
export type ComponentInstance = z.infer<typeof ComponentInstanceSchema>;
