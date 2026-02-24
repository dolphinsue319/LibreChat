import { z } from 'zod/v4';
import { PaginatedResultSchema } from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

const RelaxedToolInputSchema = z
  .object({
    type: z.string().default('object'),
    properties: z.record(z.string(), z.object({}).catchall(z.unknown())).optional(),
    required: z.array(z.string()).optional(),
  })
  .catchall(z.unknown());

const RelaxedToolSchema = z.object({
  name: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  inputSchema: RelaxedToolInputSchema,
  outputSchema: z
    .object({
      type: z.string(),
    })
    .catchall(z.unknown())
    .optional(),
  annotations: z.object({}).catchall(z.unknown()).optional(),
  _meta: z.record(z.string(), z.unknown()).optional(),
});

export const RelaxedListToolsResultSchema = PaginatedResultSchema.extend({
  tools: z.array(RelaxedToolSchema),
});

interface RelaxedTool {
  name: string;
  title?: string;
  description?: string;
  inputSchema: Record<string, unknown> & { type: string };
  outputSchema?: Record<string, unknown> & { type: string };
  annotations?: Record<string, unknown>;
  _meta?: Record<string, unknown>;
}

export function normalizeToolInputSchemas(tools: RelaxedTool[]): Tool[] {
  return tools.map(
    (tool) =>
      ({
        ...tool,
        inputSchema: {
          ...tool.inputSchema,
          type: 'object' as const,
        },
      }) as unknown as Tool,
  );
}
