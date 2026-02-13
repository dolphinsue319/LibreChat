import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AdoClient } from '../ado-client.js';
import type { Pipeline, PipelineRun, AdoListResponse } from '../types.js';

export function registerPipelineTools(server: McpServer, client: AdoClient): void {
  server.tool(
    'ado_list_pipelines',
    'List pipelines in the project',
    {},
    async () => {
      const result =
        await client.request<AdoListResponse<Pipeline>>('pipelines');
      return {
        content: [
          { type: 'text', text: JSON.stringify(result.value, null, 2) },
        ],
      };
    },
  );

  server.tool(
    'ado_run_pipeline',
    'Trigger a pipeline run',
    {
      pipelineId: z.number().describe('Pipeline ID'),
      branch: z
        .string()
        .optional()
        .describe('Branch to run the pipeline on (e.g. "refs/heads/main")'),
      variables: z
        .record(z.string(), z.object({ value: z.string() }))
        .optional()
        .describe('Pipeline variables as key-value pairs'),
    },
    async ({ pipelineId, branch, variables }) => {
      const body: Record<string, unknown> = {};
      if (branch) {
        body.resources = {
          repositories: { self: { refName: branch } },
        };
      }
      if (variables) {
        body.variables = variables;
      }

      const result = await client.request<PipelineRun>(
        `pipelines/${pipelineId}/runs`,
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'ado_get_pipeline_run',
    'Get the status and details of a specific pipeline run',
    {
      pipelineId: z.number().describe('Pipeline ID'),
      runId: z.number().describe('Pipeline run ID'),
    },
    async ({ pipelineId, runId }) => {
      const result = await client.request<PipelineRun>(
        `pipelines/${pipelineId}/runs/${runId}`,
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'ado_list_pipeline_runs',
    'List recent runs for a pipeline',
    {
      pipelineId: z.number().describe('Pipeline ID'),
      top: z.number().optional().describe('Max number of runs to return'),
    },
    async ({ pipelineId, top }) => {
      const params = top ? `?$top=${top}` : '';
      const result = await client.request<AdoListResponse<PipelineRun>>(
        `pipelines/${pipelineId}/runs${params}`,
      );
      return {
        content: [
          { type: 'text', text: JSON.stringify(result.value, null, 2) },
        ],
      };
    },
  );
}
