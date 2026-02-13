import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AdoClient } from '../ado-client.js';
import type { WiqlResult, WorkItem, AdoListResponse } from '../types.js';

export function registerWorkItemTools(server: McpServer, client: AdoClient): void {
  server.tool(
    'ado_query_work_items',
    'Query work items using WIQL (Work Item Query Language). Example: "SELECT [System.Id], [System.Title], [System.State] FROM WorkItems WHERE [System.AssignedTo] = @Me AND [System.State] <> \'Closed\'"',
    {
      query: z.string().describe('WIQL query string'),
    },
    async ({ query }) => {
      const wiqlResult = await client.request<WiqlResult>('wit/wiql', {
        method: 'POST',
        body: JSON.stringify({ query }),
      });

      if (!wiqlResult.workItems || wiqlResult.workItems.length === 0) {
        return { content: [{ type: 'text', text: 'No work items found.' }] };
      }

      const ids = wiqlResult.workItems.map((wi) => wi.id).slice(0, 200);
      const details = await client.request<AdoListResponse<WorkItem>>(
        `wit/workitems?ids=${ids.join(',')}&$expand=all`,
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(details.value, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    'ado_get_work_item',
    'Get a single work item by ID with all fields',
    {
      id: z.number().describe('Work item ID'),
    },
    async ({ id }) => {
      const item = await client.request<WorkItem>(
        `wit/workitems/${id}?$expand=all`,
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(item, null, 2) }],
      };
    },
  );

  server.tool(
    'ado_create_work_item',
    'Create a new work item (Bug, Task, User Story, etc.)',
    {
      type: z
        .string()
        .describe('Work item type, e.g. "Task", "Bug", "User Story"'),
      title: z.string().describe('Title of the work item'),
      description: z
        .string()
        .optional()
        .describe('HTML description of the work item'),
      assignedTo: z
        .string()
        .optional()
        .describe('Display name or email of the person to assign'),
      areaPath: z.string().optional().describe('Area path'),
      iterationPath: z.string().optional().describe('Iteration/sprint path'),
      additionalFields: z
        .record(z.string(), z.unknown())
        .optional()
        .describe(
          'Additional fields as key-value pairs, where key is the field reference name (e.g. "System.Tags")',
        ),
    },
    async ({ type, title, description, assignedTo, areaPath, iterationPath, additionalFields }) => {
      const operations: Array<{ op: 'add'; path: string; value: unknown }> = [
        { op: 'add', path: '/fields/System.Title', value: title },
      ];

      if (description) {
        operations.push({
          op: 'add',
          path: '/fields/System.Description',
          value: description,
        });
      }
      if (assignedTo) {
        operations.push({
          op: 'add',
          path: '/fields/System.AssignedTo',
          value: assignedTo,
        });
      }
      if (areaPath) {
        operations.push({
          op: 'add',
          path: '/fields/System.AreaPath',
          value: areaPath,
        });
      }
      if (iterationPath) {
        operations.push({
          op: 'add',
          path: '/fields/System.IterationPath',
          value: iterationPath,
        });
      }
      if (additionalFields) {
        for (const [key, value] of Object.entries(additionalFields)) {
          operations.push({ op: 'add', path: `/fields/${key}`, value });
        }
      }

      const item = await client.requestPatch<WorkItem>(
        `wit/workitems/$${type}`,
        operations,
      );

      return {
        content: [{ type: 'text', text: JSON.stringify(item, null, 2) }],
      };
    },
  );

  server.tool(
    'ado_update_work_item',
    'Update fields on an existing work item',
    {
      id: z.number().describe('Work item ID'),
      fields: z
        .record(z.string(), z.unknown())
        .describe(
          'Fields to update as key-value pairs (e.g. {"System.State": "Active", "System.AssignedTo": "user@example.com"})',
        ),
    },
    async ({ id, fields }) => {
      const operations = Object.entries(fields).map(([key, value]) => ({
        op: 'replace' as const,
        path: `/fields/${key}`,
        value,
      }));

      const item = await client.requestPatch<WorkItem>(
        `wit/workitems/${id}`,
        operations,
      );

      return {
        content: [{ type: 'text', text: JSON.stringify(item, null, 2) }],
      };
    },
  );

  server.tool(
    'ado_list_work_item_types',
    'List available work item types for the project',
    {},
    async () => {
      const result = await client.request<AdoListResponse<{ name: string; description: string }>>(
        'wit/workitemtypes',
      );
      return {
        content: [
          { type: 'text', text: JSON.stringify(result.value, null, 2) },
        ],
      };
    },
  );

  server.tool(
    'ado_add_work_item_comment',
    'Add a comment to a work item',
    {
      id: z.number().describe('Work item ID'),
      text: z.string().describe('Comment text (supports HTML)'),
    },
    async ({ id, text }) => {
      const result = await client.request(
        `wit/workitems/${id}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({ text }),
        },
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
