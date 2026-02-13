import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AdoClient } from '../ado-client.js';
import type {
  GitRepository,
  PullRequest,
  AdoListResponse,
} from '../types.js';

export function registerGitTools(server: McpServer, client: AdoClient): void {
  server.tool(
    'ado_list_repositories',
    'List Git repositories in the project',
    {},
    async () => {
      const result = await client.request<AdoListResponse<GitRepository>>(
        'git/repositories',
      );
      return {
        content: [
          { type: 'text', text: JSON.stringify(result.value, null, 2) },
        ],
      };
    },
  );

  server.tool(
    'ado_list_pull_requests',
    'List pull requests for a repository, optionally filtered by status',
    {
      repositoryId: z.string().describe('Repository ID or name'),
      status: z
        .enum(['active', 'abandoned', 'completed', 'all'])
        .optional()
        .describe('PR status filter (default: active)'),
      creatorId: z.string().optional().describe('Filter by creator ID'),
      top: z.number().optional().describe('Max number of PRs to return'),
    },
    async ({ repositoryId, status, creatorId, top }) => {
      const params = new URLSearchParams();
      if (status) params.set('searchCriteria.status', status);
      if (creatorId) params.set('searchCriteria.creatorId', creatorId);
      if (top) params.set('$top', top.toString());

      const query = params.toString();
      const path = `git/repositories/${repositoryId}/pullrequests${query ? `?${query}` : ''}`;
      const result = await client.request<AdoListResponse<PullRequest>>(path);

      return {
        content: [
          { type: 'text', text: JSON.stringify(result.value, null, 2) },
        ],
      };
    },
  );

  server.tool(
    'ado_get_pull_request',
    'Get details of a specific pull request',
    {
      repositoryId: z.string().describe('Repository ID or name'),
      pullRequestId: z.number().describe('Pull request ID'),
    },
    async ({ repositoryId, pullRequestId }) => {
      const result = await client.request<PullRequest>(
        `git/repositories/${repositoryId}/pullrequests/${pullRequestId}`,
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'ado_create_pull_request',
    'Create a new pull request',
    {
      repositoryId: z.string().describe('Repository ID or name'),
      title: z.string().describe('PR title'),
      description: z.string().optional().describe('PR description'),
      sourceRefName: z
        .string()
        .describe('Source branch ref (e.g. refs/heads/feature-branch)'),
      targetRefName: z
        .string()
        .describe('Target branch ref (e.g. refs/heads/main)'),
      reviewers: z
        .array(z.object({ id: z.string() }))
        .optional()
        .describe('Array of reviewer objects with id field'),
    },
    async ({ repositoryId, title, description, sourceRefName, targetRefName, reviewers }) => {
      const result = await client.request<PullRequest>(
        `git/repositories/${repositoryId}/pullrequests`,
        {
          method: 'POST',
          body: JSON.stringify({
            title,
            description: description ?? '',
            sourceRefName,
            targetRefName,
            reviewers: reviewers ?? [],
          }),
        },
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'ado_update_pull_request',
    'Update a pull request (e.g. change status to completed/abandoned, update title/description)',
    {
      repositoryId: z.string().describe('Repository ID or name'),
      pullRequestId: z.number().describe('Pull request ID'),
      status: z
        .enum(['active', 'abandoned', 'completed'])
        .optional()
        .describe('New PR status'),
      title: z.string().optional().describe('New title'),
      description: z.string().optional().describe('New description'),
      lastMergeSourceCommitId: z
        .string()
        .optional()
        .describe('Required when completing a PR: the last merge source commit ID'),
    },
    async ({ repositoryId, pullRequestId, status, title, description, lastMergeSourceCommitId }) => {
      const body: Record<string, unknown> = {};
      if (status) body.status = status;
      if (title) body.title = title;
      if (description) body.description = description;
      if (lastMergeSourceCommitId) {
        body.lastMergeSourceCommit = { commitId: lastMergeSourceCommitId };
      }

      const result = await client.request<PullRequest>(
        `git/repositories/${repositoryId}/pullrequests/${pullRequestId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(body),
        },
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'ado_list_branches',
    'List branches (refs) for a repository',
    {
      repositoryId: z.string().describe('Repository ID or name'),
      filter: z
        .string()
        .optional()
        .describe('Filter by ref name prefix (e.g. "heads/main")'),
    },
    async ({ repositoryId, filter }) => {
      const params = filter ? `?filter=${encodeURIComponent(filter)}` : '';
      const result = await client.request<
        AdoListResponse<{ name: string; objectId: string }>
      >(`git/repositories/${repositoryId}/refs${params}`);

      return {
        content: [
          { type: 'text', text: JSON.stringify(result.value, null, 2) },
        ],
      };
    },
  );
}
