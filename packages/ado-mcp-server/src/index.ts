import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { AdoClient } from './ado-client.js';
import { registerWorkItemTools } from './tools/work-items.js';
import { registerGitTools } from './tools/git.js';
import { registerPipelineTools } from './tools/pipelines.js';
import { registerBoardTools } from './tools/boards.js';

const ADO_BASE_URL = process.env.ADO_BASE_URL;
const ADO_COLLECTION = process.env.ADO_COLLECTION || 'DefaultCollection';
const ADO_PAT = process.env.ADO_PAT;
const ADO_PROJECT = process.env.ADO_PROJECT;
const ADO_API_VERSION = process.env.ADO_API_VERSION || '7.0';

if (!ADO_BASE_URL) {
  console.error('Error: ADO_BASE_URL environment variable is required');
  process.exit(1);
}
if (!ADO_PAT) {
  console.error('Error: ADO_PAT environment variable is required');
  process.exit(1);
}
if (!ADO_PROJECT) {
  console.error('Error: ADO_PROJECT environment variable is required');
  process.exit(1);
}

const client = new AdoClient({
  baseUrl: ADO_BASE_URL,
  collection: ADO_COLLECTION,
  pat: ADO_PAT,
  project: ADO_PROJECT,
  apiVersion: ADO_API_VERSION,
});

const server = new McpServer({
  name: 'azure-devops',
  version: '1.0.0',
});

registerWorkItemTools(server, client);
registerGitTools(server, client);
registerPipelineTools(server, client);
registerBoardTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
