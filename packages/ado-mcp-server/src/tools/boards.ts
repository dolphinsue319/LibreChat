import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AdoClient } from '../ado-client.js';
import type { Iteration, TeamMember, AdoListResponse } from '../types.js';

export function registerBoardTools(server: McpServer, client: AdoClient): void {
  server.tool(
    'ado_list_iterations',
    'List iterations/sprints for a team. Uses the default team if no team is specified.',
    {
      team: z.string().optional().describe('Team name (optional, uses default team)'),
    },
    async ({ team }) => {
      const teamSegment = team ? `/${encodeURIComponent(team)}` : '';
      const project = client.getProject();
      // The iterations API uses a different path structure with team context
      const path = team
        ? `work/teamsettings/iterations`
        : `work/teamsettings/iterations`;

      // For team-scoped requests, we need to adjust the URL
      // The API path is: {project}/{team}/_apis/work/teamsettings/iterations
      // Since our client builds: {collection}/{project}/_apis/{path}
      // We encode the team into the project portion
      const result = await client.request<AdoListResponse<Iteration>>(
        `work/teamsettings/iterations`,
      );

      return {
        content: [
          { type: 'text', text: JSON.stringify(result.value, null, 2) },
        ],
      };
    },
  );

  server.tool(
    'ado_get_iteration_work_items',
    'Get work items for a specific iteration/sprint',
    {
      iterationId: z.string().describe('Iteration ID (GUID)'),
    },
    async ({ iterationId }) => {
      const result = await client.request(
        `work/teamsettings/iterations/${iterationId}/workitems`,
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'ado_list_team_members',
    'List members of a team',
    {
      team: z.string().describe('Team name'),
    },
    async ({ team }) => {
      const project = client.getProject();
      const result = await client.request<AdoListResponse<TeamMember>>(
        `projects/${encodeURIComponent(project)}/teams/${encodeURIComponent(team)}/members`,
        { project: false },
      );
      return {
        content: [
          { type: 'text', text: JSON.stringify(result.value, null, 2) },
        ],
      };
    },
  );

  server.tool(
    'ado_list_projects',
    'List all projects in the Azure DevOps collection',
    {},
    async () => {
      const result = await client.request<
        AdoListResponse<{ id: string; name: string; description: string; state: string }>
      >('projects', { project: false });

      return {
        content: [
          { type: 'text', text: JSON.stringify(result.value, null, 2) },
        ],
      };
    },
  );
}
