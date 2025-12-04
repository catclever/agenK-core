import { z } from 'zod';

export const LogSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  type: z.enum(['RUNTIME_ERROR', 'BUILD_ERROR', 'INFO']),
  message: z.string(),
  stack: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export type LogEntry = z.infer<typeof LogSchema>;
