import { z } from 'zod';
import { RxJsonSchema } from 'rxdb';

export interface SchemaDefinition<T extends z.ZodTypeAny> {
  name: string;
  schema: T;
  key?: string; // Primary key
}

export function defineSchema<T extends z.ZodTypeAny>(
  name: string,
  zodSchema: T,
  primaryKey: string = 'id'
): SchemaDefinition<T> {
  return {
    name,
    schema: zodSchema,
    key: primaryKey,
  };
}

export function toRxSchema(definition: SchemaDefinition<any>): RxJsonSchema<any> {
  // Simplified Zod to RxJsonSchema converter for PoC
  // In a real app, we would use a library or a more robust converter
  const properties: Record<string, any> = {};
  const required: string[] = [];

  const shape = (definition.schema as any).shape;
  if (shape) {
    for (const key in shape) {
      const field = shape[key];
      // Basic type mapping
      if (field instanceof z.ZodString) {
        properties[key] = { type: 'string', maxLength: 100 };
      } else if (field instanceof z.ZodNumber) {
        properties[key] = { type: 'number' };
      } else if (field instanceof z.ZodBoolean) {
        properties[key] = { type: 'boolean' };
      }
      // Add more types as needed

      if (!field.isOptional()) {
        required.push(key);
      }
    }
  }

  return {
    version: 0,
    primaryKey: definition.key || 'id',
    type: 'object',
    properties,
    required,
  };
}
